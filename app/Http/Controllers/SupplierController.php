<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    public function show()
    {
        $suppliersSql = DB::connection('pgsql')->table('supplier', 's')
            ->select('s.id', 's.name')
            ->orderBy('s.name');

        return inertia('Supplier', [
            'suppliers' => fn() => $suppliersSql->get(),
        ]);
    }

    public function supplierproducts(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|integer'
        ]);

        $supplierId = $request->supplier_id;

        $warehouse = DB::connection('pgsql')->table('stock as st')
            ->selectRaw("
                COALESCE(r.name, 'WAREHOUSE') as location,
                p.name as product,
                SUM(st.qty) as purchase,
                0 as sales,
                SUM(st.qty - st.transfered - st.returnqty - st.journalqty) as stock")
            ->join('supplier as sup', function ($join) use ($supplierId) {
                $join->on('sup.id', '=', 'st.supplierid')
                    ->where('st.companyid', 1)
                    ->where('st.supplierid', $supplierId);
            })
            ->join('products as p', 'p.id', '=', 'st.productid')
            ->leftJoin('referencelist as r', DB::raw('COALESCE(r.id, 0)'), '=', 'st.locationid')
            ->groupBy('r.name', 'p.name');

        $shop = DB::connection('pgsql')->table('stock as st')
            ->selectRaw("
                r.name as location,
                p.name as product,
                0 as purchase,
                SUM(sg.oqty) as sales,
                SUM(sg.iqty - sg.oqty - sg.jqty) as stock")
            ->join('salablegoods as sg', function ($join) use ($supplierId) {
                $join->on('sg.stockid', '=', 'st.id')
                    ->where('st.companyid', 1)
                    ->where('st.supplierid', $supplierId);
            })
            ->join('supplier as sup', 'sup.id', '=', 'st.supplierid')
            ->join('products as p', 'p.id', '=', 'st.productid')
            ->join('referencelist as r', 'r.id', '=', 'sg.locationid')
            ->groupBy('r.name', 'p.name');

        $union = $warehouse->unionAll($shop);

        $combined = DB::connection('pgsql')->table(DB::raw("({$union->toSql()}) as combined"))
            ->mergeBindings($union)
            ->selectRaw("
                location,
                product,
                SUM(purchase) as purchase,
                SUM(sales) as sales,
                SUM(stock) as stock")
            ->groupBy('location', 'product')
            ->orderBy('location')
            ->orderBy('product')
            ->get();

        $data = collect($combined)->map(function ($item) {
            $item->purchase = (float) $item->purchase;
            $item->sales = (float) $item->sales;
            $item->stock = (float) $item->stock;
            return $item;
        });

        return response()->json([
            'data' => $data
        ]);
    }
}
