<?php

namespace App\Http\Controllers;

use App\Jobs\SyncOrderLevels;
use App\Models\ReorderLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReorderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $productId = $request->input('product_id');
        $brandId = $request->input('brand_id');
        $supplierId = $request->input('supplier_id');

        $productsSql = DB::connection('pgsql')
            ->table('products')
            ->select('id', 'name')
            ->where('isactive', true)
            ->distinct()
            ->orderBy('name');

        $brandsSql = DB::connection('pgsql')
            ->table('brand')
            ->select('id', 'name')
            ->where('isactive', true)
            ->where('name', '!=', '')
            ->distinct()
            ->orderBy('name');

        $suppliersSql = DB::connection('pgsql')
            ->table('supplier')
            ->select(['id', 'name'])
            ->where('isactive', true)
            ->distinct()
            ->orderBy('name');

        $reorderLevelSql = ReorderLevel::select(['id', 'supplier_id', 'supplier_name', 'product_id', 'product_name', 'brand_id', 'brand_name', 'size_id', 'size_name', 'reorder_level'])
            ->when($productId, fn($q) => $q->where('product_id', $productId))
            ->when($brandId, fn($q) => $q->where('brand_id', $brandId))
            ->when($supplierId, fn($q) => $q->where('supplier_id', $supplierId))
            ->orderBy('supplier_name')
            ->orderBy('product_name')
            ->orderBy('brand_name')
            ->orderBy('size_name');

        return inertia('ReorderLevel/List', [
            'reorderLevels' => fn() => ($productId || $brandId || $supplierId)
                ? $reorderLevelSql->get()      // load only when filtered
                : collect(),
            'products' => fn() => $productsSql->get(),
            'brands' => fn() => $brandsSql->get(),
            'suppliers' => fn() => $suppliersSql->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(ReorderLevel $reorderLevel)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ReorderLevel $reorderLevel)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ReorderLevel $reorderLevel)
    {
        $request->validate([
            'reorder_level' => 'required|numeric|min:0',
        ]);
        $reorderLevel->reorder_level = $request->input('reorder_level');
        $reorderLevel->updated_by = $request->user()->id;
        $reorderLevel->save();
        return back()->with('message', 'Reorder level updated successfully.');
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'rows' => 'required|array|min:1',
            'rows.*.id' => 'required|integer',
            'rows.*.reorder_level' => 'required|numeric|min:0',
        ]);

        foreach ($request->rows as $row) {
            $reorderLevel = ReorderLevel::find($row['id']);
            if ($reorderLevel) {
                $reorderLevel->reorder_level = $row['reorder_level'];
                $reorderLevel->updated_by = $request->user()->id;
                $reorderLevel->save();
            }
        }

        return back()->with('message', 'Reorder level updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ReorderLevel $reorderLevel)
    {
        //
    }

    public function syncReorderLevels()
    {
        try {
            //code...
            SyncOrderLevels::dispatch(request()->user()->id);
            return response()->json([
                'message' => 'Reorder levels sync started. You will be notified when it is completed.',
            ]);
        } catch (\Throwable $th) {
            //throw $th;
            return response()->json([
                'message' => 'Error syncing reorder levels: ' . $th->getMessage(),
            ], 500);
        }
    }

    public function reorderLevelStatus(Request $request)
    {
        $productId = $request->input('product_id');
        $brandId = $request->input('brand_id');
        $supplierId = $request->input('supplier_id');
        $statusFilter = $request->input('status');

        // --- Products & Brands (fetch only needed columns) ---
        $productsSql = DB::connection('pgsql')
            ->table('products')
            ->select('id', 'name')
            ->where('isactive', true)
            ->orderBy('name');

        $brandsSql = DB::connection('pgsql')
            ->table('brand')
            ->select('id', 'name')
            ->where('isactive', true)
            ->where('name', '!=', '')
            ->orderBy('name');

        $suppliersSql = DB::connection('pgsql')
            ->table('supplier')
            ->select('id', 'name')
            ->where('isactive', true)
            ->where('name', '!=', '')
            ->orderBy('name');

        $combined = collect();

        if ($productId || $brandId || $supplierId) {

            // --- Pre-aggregate L4 stock per stock row ---
            $sgByStock = DB::connection('pgsql')->table('salablegoods as sg')
                ->select('stockid', DB::raw('SUM(iqty - oqty - jqty) as l4stock'))
                ->where('locationid', 54);

            $sgByStock->whereIn('stockid', function ($q) use ($productId, $brandId, $supplierId) {
                $q->select('s.id')
                    ->from('stock as s')
                    ->join('items as i', 'i.id', '=', 's.itemid')
                    ->when($productId, fn($q) => $q->where('i.productid', $productId))
                    ->when($brandId, fn($q) => $q->where('i.brandid', $brandId))
                    ->when($supplierId, fn($q) => $q->where('s.supplierid', $supplierId));
            });

            $sgByStock->groupBy('stockid');

            // --- Main query: stock + L4 aggregation ---
            $l4whStockSql = DB::connection('pgsql')->table('stock as s')
                ->leftJoinSub($sgByStock, 'sg', function ($join) {
                    $join->on('s.id', '=', 'sg.stockid');
                })
                ->join('items as i', 'i.id', '=', 's.itemid')
                ->join('products as p', 'p.id', '=', 'i.productid')
                ->join('brand as b', 'b.id', '=', 'i.brandid')
                ->join('referencelist as r', function ($join) {
                    $join->on('r.id', '=', 'i.sizeid')
                        ->where('r.type', 'SIZE');
                })
                ->join('supplier as sup', 'sup.id', '=', 's.supplierid')
                ->whereNotIn('b.name', ['', 'UNSPECIFIED', 'NONE'])
                ->where('r.name', '!=', '')
                ->when($productId, fn($q) => $q->where('p.id', $productId))
                ->when($brandId, fn($q) => $q->where('b.id', $brandId))
                ->when($supplierId, fn($q) => $q->where('s.supplierid', $supplierId))
                ->groupBy('p.id', 'p.name', 'b.id', 'b.name', 'r.id', 'r.name', 's.supplierid', 'sup.name')
                ->orderBy('sup.name')
                ->orderBy('p.name')
                ->orderBy('b.name')
                ->orderBy('r.name')
                ->select([
                    'p.id as product_id',
                    'p.name as product_name',
                    'b.id as brand_id',
                    'b.name as brand_name',
                    'r.id as size_id',
                    'r.name as size_name',
                    's.supplierid as supplier_id',
                    'sup.name as supplier_name',
                    DB::raw('COALESCE(SUM(sg.l4stock), 0) as l4stock'),
                    DB::raw('SUM(s.qty - s.transfered - s.returnqty - s.journalqty) as whstock'),
                ]);

            $l4whStock = $l4whStockSql->get();

            // --- get reorder levels from SQLite ---
            $reorderLevels = DB::connection('sqlite')
                ->table('reorder_level')
                ->select('product_id', 'brand_id', 'size_id', 'supplier_id', 'reorder_level')
                ->when($productId, fn($q) => $q->where('product_id', $productId))
                ->when($brandId, fn($q) => $q->where('brand_id', $brandId))
                ->when($supplierId, fn($q) => $q->where('supplier_id', $supplierId))
                ->get()
                ->keyBy(fn($r) => "{$r->product_id}-{$r->brand_id}-{$r->size_id}-{$r->supplier_id}");

            // --- Combine and compute status ---
            $combined = collect($l4whStock)
                ->map(function ($row) use ($reorderLevels) {
                    $key = "{$row->product_id}-{$row->brand_id}-{$row->size_id}-{$row->supplier_id}";
                    $reorderLevel = $reorderLevels[$key]->reorder_level ?? 0;

                    $totalStock = $row->l4stock + $row->whstock;
                    if ($reorderLevel > 0 && $row->l4stock >= $reorderLevel && $totalStock >= ($reorderLevel * 3)) {
                        $status = 'over-stock';
                    } elseif ($reorderLevel > 0 && $row->l4stock < $reorderLevel && $row->whstock >= $reorderLevel) {
                        $status = 'transfer-stock';
                    } elseif ($row->l4stock >= $reorderLevel) {
                        $status = 'sufficient';
                    } else {
                        $status = 'reorder';
                    }

                    return [
                        'product_id'    => $row->product_id,
                        'product_name'  => $row->product_name,
                        'brand_id'      => $row->brand_id,
                        'brand_name'    => $row->brand_name,
                        'size_id'       => $row->size_id,
                        'size_name'     => $row->size_name,
                        'supplier_id'   => $row->supplier_id,
                        'supplier_name' => $row->supplier_name,
                        'l4stock'       => (float) $row->l4stock,
                        'whstock'       => (float) $row->whstock,
                        'reorder_level' => $reorderLevel,
                        'status'        => $status,
                    ];
                });
        }

        if ($statusFilter) {
            // dd($statusFilter);
            $combined = $combined->filter(fn($row) => $row['status'] == $statusFilter)->values();
        }

        return inertia('ReorderLevel/Status', [
            'status'   => $combined,
            'products' => fn() => $productsSql->get(),
            'brands'   => fn() => $brandsSql->get(),
            'suppliers' => fn() => $suppliersSql->get()
        ]);
    }

    public function reorderLevelSummary(Request $request)
    {
        $productId = $request->input('product_id');
        $brandId = $request->input('brand_id');
        $supplierId = $request->input('supplier_id');

        // --- Products & Brands (fetch only needed columns) ---
        $productsSql = DB::connection('pgsql')
            ->table('products')
            ->select('id', 'name')
            ->where('isactive', true)
            ->orderBy('name');

        $brandsSql = DB::connection('pgsql')
            ->table('brand')
            ->select('id', 'name')
            ->where('isactive', true)
            ->where('name', '!=', '')
            ->orderBy('name');

        $suppliersSql = DB::connection('pgsql')
            ->table('supplier')
            ->select('id', 'name')
            ->where('isactive', true)
            ->where('name', '!=', '')
            ->orderBy('name');

        $combined = collect();

        if ($productId || $brandId || $supplierId) {

            // --- Pre-aggregate L4 stock per stock row ---
            $sgByStock = DB::connection('pgsql')->table('salablegoods as sg')
                ->select('stockid', DB::raw('SUM(iqty - oqty - jqty) as l4stock'))
                ->where('locationid', 54);

            $sgByStock->whereIn('stockid', function ($q) use ($productId, $brandId, $supplierId) {
                $q->select('s.id')
                    ->from('stock as s')
                    ->join('items as i', 'i.id', '=', 's.itemid')
                    ->when($productId, fn($q) => $q->where('i.productid', $productId))
                    ->when($brandId, fn($q) => $q->where('i.brandid', $brandId))
                    ->when($supplierId, fn($q) => $q->where('s.supplierid', $supplierId));
            });

            $sgByStock->groupBy('stockid');

            // --- Main query: stock + L4 aggregation ---
            $l4whStockSql = DB::connection('pgsql')->table('stock as s')
                ->leftJoinSub($sgByStock, 'sg', function ($join) {
                    $join->on('s.id', '=', 'sg.stockid');
                })
                ->join('items as i', 'i.id', '=', 's.itemid')
                ->join('products as p', 'p.id', '=', 'i.productid')
                ->join('brand as b', 'b.id', '=', 'i.brandid')
                ->join('referencelist as r', function ($join) {
                    $join->on('r.id', '=', 'i.sizeid')
                        ->where('r.type', 'SIZE');
                })
                ->join('supplier as sup', 'sup.id', '=', 's.supplierid')
                ->whereNotIn('b.name', ['', 'UNSPECIFIED', 'NONE'])
                ->where('r.name', '!=', '')
                ->when($productId, fn($q) => $q->where('p.id', $productId))
                ->when($brandId, fn($q) => $q->where('b.id', $brandId))
                ->when($supplierId, fn($q) => $q->where('s.supplierid', $supplierId))
                ->groupBy('p.id', 'p.name', 'b.id', 'b.name', 'r.id', 'r.name', 's.supplierid', 'sup.name')
                ->orderBy('sup.name')
                ->orderBy('p.name')
                ->orderBy('b.name')
                ->orderBy('r.name')
                ->select([
                    'p.id as product_id',
                    'p.name as product_name',
                    'b.id as brand_id',
                    'b.name as brand_name',
                    'r.id as size_id',
                    'r.name as size_name',
                    's.supplierid as supplier_id',
                    'sup.name as supplier_name',
                    DB::raw('COALESCE(SUM(sg.l4stock), 0) as l4stock'),
                    DB::raw('SUM(s.qty - s.transfered - s.returnqty - s.journalqty) as whstock'),
                ]);

            $l4whStock = $l4whStockSql->get();

            // --- get reorder levels from SQLite ---
            $reorderLevels = DB::connection('sqlite')
                ->table('reorder_level')
                ->select('product_id', 'brand_id', 'size_id', 'supplier_id', 'reorder_level')
                ->when($productId, fn($q) => $q->where('product_id', $productId))
                ->when($brandId, fn($q) => $q->where('brand_id', $brandId))
                ->when($supplierId, fn($q) => $q->where('supplier_id', $supplierId))
                ->get()
                ->keyBy(fn($r) => "{$r->product_id}-{$r->brand_id}-{$r->size_id}-{$r->supplier_id}");

            // --- Combine and compute status ---
            $combined = collect($l4whStock)
                ->map(function ($row) use ($reorderLevels) {
                    $key = "{$row->product_id}-{$row->brand_id}-{$row->size_id}-{$row->supplier_id}";
                    $reorderLevel = $reorderLevels[$key]->reorder_level ?? 0;

                    $totalStock = $row->l4stock + $row->whstock;
                    if ($reorderLevel > 0 && $row->l4stock >= $reorderLevel && $totalStock >= ($reorderLevel * 3)) {
                        $status = 'over-stock';
                    } elseif ($reorderLevel > 0 && $row->l4stock < $reorderLevel && $row->whstock >= $reorderLevel) {
                        $status = 'transfer-stock';
                    } elseif ($row->l4stock >= $reorderLevel) {
                        $status = 'sufficient';
                    } else {
                        $status = 'reorder';
                    }

                    return [
                        'product_id'    => $row->product_id,
                        'product_name'  => $row->product_name,
                        'brand_id'      => $row->brand_id,
                        'brand_name'    => $row->brand_name,
                        'size_id'       => $row->size_id,
                        'size_name'     => $row->size_name,
                        'supplier_id'   => $row->supplier_id,
                        'supplier_name' => $row->supplier_name,
                        'l4stock'       => (float) $row->l4stock,
                        'whstock'       => (float) $row->whstock,
                        'reorder_level' => $reorderLevel,
                        'status'        => $status,
                    ];
                });
        }

        // 2️⃣ Group rows by Supplier + Product + Brand
        $summary = $combined
            ->groupBy(fn($r) => "{$r['supplier_id']}-{$r['product_id']}-{$r['brand_id']}")
            ->map(function ($group) {
                $first = $group->first();

                // Initialise counts for all possible statuses
                $counts = [
                    'reorder'        => 0,
                    'transfer-stock' => 0,
                    'over-stock'     => 0,
                    'sufficient'     => 0,
                ];

                // Count how many sizes fall under each status
                foreach ($group as $row) {
                    $status = $row['status'];
                    if (isset($counts[$status])) {
                        $counts[$status]++;
                    }
                }

                return [
                    'supplier_id'   => $first['supplier_id'],
                    'supplier_name' => $first['supplier_name'],
                    'product_id'    => $first['product_id'],
                    'product_name'  => $first['product_name'],
                    'brand_id'      => $first['brand_id'],
                    'brand_name'    => $first['brand_name'],
                    ...$counts,
                ];
            })
            ->values(); // Reset keys for DataGrid

        // 3️⃣ Return summary to a new Inertia page (e.g. ReorderLevel/Summary)
        return inertia('ReorderLevel/Summary', [
            'summary'   => $summary,
            'products'  => fn() => $productsSql->get(),
            'brands'    => fn() => $brandsSql->get(),
            'suppliers' => fn() => $suppliersSql->get(),
        ]);
    }
}
