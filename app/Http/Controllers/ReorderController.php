<?php

namespace App\Http\Controllers;

use App\Models\ReorderLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReorderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $productId = $request->input('product_id');
        $brandId = $request->input('brand_id');

        $products = DB::connection('pgsql')
            ->table('products')
            ->select('id', 'name')
            ->where('isactive', true)
            ->distinct()
            ->orderBy('name')
            ->get();

        $brands = DB::connection('pgsql')
            ->table('brand')
            ->select('id', 'name')
            ->where('isactive', true)
            ->where('name', '!=', '')
            ->distinct()
            ->orderBy('name')
            ->get();

        $reorderLevel = ReorderLevel::select(['id', 'product_id', 'product_name', 'brand_id', 'brand_name', 'size_id', 'size_name', 'reorder_level'])
            ->orderBy('product_name')
            ->orderBy('brand_name')
            ->orderBy('size_name');

        if ($productId) {
            $reorderLevel->where('product_id', $productId);
        }
        if ($brandId) {
            $reorderLevel->where('brand_id', $brandId);
        }

        return inertia('ReorderLevel/List', [
            'reorderLevels' => fn() => $reorderLevel->get(),
            'products' => $products,
            'brands' => $brands,
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
            DB::beginTransaction();
            DB::connection('pgsql')
                ->table('items as i')
                ->join('products as p', 'p.id', '=', 'i.productid')
                ->join('brand as b', 'b.id', '=', 'i.brandid')
                ->join('referencelist as r', function ($join) {
                    $join->on('r.id', '=', 'i.sizeid')
                        ->where('r.type', 'SIZE');
                })->select([
                    'i.productid as product_id',
                    'p.name as product_name',
                    'i.brandid as brand_id',
                    'b.name as brand_name',
                    'i.sizeid as size_id',
                    'r.name as size_name'
                ])
                ->where('b.name', '!=', '')
                ->where('b.name', '!=', 'UNSPECIFIED')
                ->where('b.name', '!=', 'NONE')
                ->where('r.name', '!=', '')
                ->distinct()
                ->orderBy('i.productid') // ensure deterministic chunking
                ->chunk(1000, function ($items) {
                    $insertData = [];
                    foreach ($items as $item) {
                        $insertData[] = [
                            'product_id'    => $item->product_id,
                            'brand_id'      => $item->brand_id,
                            'size_id'       => $item->size_id,
                            'product_name'  => $item->product_name,
                            'brand_name'    => $item->brand_name,
                            'size_name'     => $item->size_name,
                            'created_by'    => request()->user()->id,
                            'created_at'    => now(),
                            'updated_at'    => now(),
                        ];
                    }

                    // Bulk insert or upsert in SQLite
                    DB::connection('sqlite')
                        ->table('reorder_level')
                        ->upsert(
                            $insertData,
                            ['product_id', 'brand_id', 'size_id'], // unique keys
                            ['product_name', 'brand_name', 'size_name', 'updated_at']
                        );
                });

            DB::commit();
        } catch (\Throwable $th) {
            //throw $th;
            DB::rollBack();
            return response()->json([
                'message' => 'Error syncing reorder levels: ' . $th->getMessage(),
            ], 500);
        }

        return redirect()->route('reorder-level')->with('message', 'Reorder levels synced successfully.');
    }

    public function reorderLevelStatus(Request $request)
    {
        $productId = $request->input('product_id');
        $brandId = $request->input('brand_id');

        // --- Products & Brands (fetch only needed columns) ---
        $products = DB::connection('pgsql')
            ->table('products')
            ->select('id', 'name')
            ->where('isactive', true)
            ->orderBy('name')
            ->get();

        $brands = DB::connection('pgsql')
            ->table('brand')
            ->select('id', 'name')
            ->where('isactive', true)
            ->where('name', '!=', '')
            ->orderBy('name')
            ->get();

        // --- Pre-aggregate L4 stock per stock row ---
        $sgByStock = DB::connection('pgsql')->table('salablegoods as sg')
            ->select('stockid', DB::raw('SUM(iqty - oqty - jqty) as l4stock'))
            ->where('locationid', 54);

        if ($productId || $brandId) {
            $sgByStock->whereIn('stockid', function ($q) use ($productId, $brandId) {
                $q->select('s.id')
                    ->from('stock as s')
                    ->join('items as i', 'i.id', '=', 's.itemid')
                    ->when($productId, fn($q) => $q->where('i.productid', $productId))
                    ->when($brandId, fn($q) => $q->where('i.brandid', $brandId));
            });
        }

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
            ->whereNotIn('b.name', ['', 'UNSPECIFIED', 'NONE'])
            ->where('r.name', '!=', '')
            ->when($productId, fn($q) => $q->where('p.id', $productId))
            ->when($brandId, fn($q) => $q->where('b.id', $brandId))
            ->groupBy('p.id', 'p.name', 'b.id', 'b.name', 'r.id', 'r.name')
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
                DB::raw('COALESCE(SUM(sg.l4stock), 0) as l4stock'),
                DB::raw('SUM(s.qty - s.transfered - s.returnqty - s.journalqty) as whstock'),
            ]);

        $l4whStock = $l4whStockSql->get();

        // --- get reorder levels from SQLite ---
        $reorderLevels = DB::connection('sqlite')
            ->table('reorder_level')
            ->select('product_id', 'brand_id', 'size_id', 'reorder_level')
            ->when($productId, fn($q) => $q->where('product_id', $productId))
            ->when($brandId, fn($q) => $q->where('brand_id', $brandId))
            ->get()
            ->keyBy(fn($r) => "{$r->product_id}-{$r->brand_id}-{$r->size_id}");

        // --- Combine and compute status ---
        $combined = collect($l4whStock)
            ->map(function ($row) use ($reorderLevels) {
                $key = "{$row->product_id}-{$row->brand_id}-{$row->size_id}";
                $reorderLevel = $reorderLevels[$key]->reorder_level ?? 0;

                $totalStock = $row->l4stock + $row->whstock;

                if ($reorderLevel > 0 && $totalStock >= ($reorderLevel * 3)) {
                    $status = 'over-stock';
                } elseif ($row->l4stock >= $reorderLevel) {
                    $status = 'sufficient';
                } elseif ($totalStock >= $reorderLevel) {
                    $status = 'low-stock';
                } else {
                    $status = 'critical';
                }

                return [
                    'product_id'    => $row->product_id,
                    'product_name'  => $row->product_name,
                    'brand_id'      => $row->brand_id,
                    'brand_name'    => $row->brand_name,
                    'size_id'       => $row->size_id,
                    'size_name'     => $row->size_name,
                    'l4stock'       => (float) $row->l4stock,
                    'whstock'       => (float) $row->whstock,
                    'reorder_level' => $reorderLevel,
                    'status'        => $status,
                ];
            });

        return inertia('ReorderLevel/Status', [
            'status'   => $combined,
            'products' => $products,
            'brands'   => $brands,
        ]);
    }
}
