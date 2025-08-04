<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function show()
    {
        $productsSql = DB::connection('pgsql')->table('products', 'p')
            ->select('p.id', 'p.name')
            ->orderBy('p.name');

        return inertia('Product', [
            'products' => fn() => $productsSql->get(),
        ]);
    }

    public function productsuppliers(Request $request)
    {
        $request->validate([
            'product_id' => 'required|string'
        ]);

        $productId = $request->product_id;
        $productIds = array_filter(explode(",", $productId));

        $warehouse = DB::connection('pgsql')->table('stock as st')
            ->selectRaw("
                sup.name as supplier,
                SUM(st.qty) as purchase,
                0 as sales,
                SUM(st.qty - st.transfered - st.returnqty - st.journalqty) as stock")
            ->join('supplier as sup', function ($join) use ($productIds) {
                $join->on('sup.id', '=', 'st.supplierid')
                    ->where('st.companyid', 1)
                    ->whereIn('st.productid', $productIds);
            })
            ->join('products as p', 'p.id', '=', 'st.productid')
            ->groupBy('sup.name');

        $shop = DB::connection('pgsql')->table('stock as st')
            ->selectRaw("
                sup.name as supplier,
                0 as purchase,
                SUM(sg.oqty) as sales,
                SUM(sg.iqty - sg.oqty - sg.jqty) as stock")
            ->join('salablegoods as sg', function ($join) use ($productIds) {
                $join->on('sg.stockid', '=', 'st.id')
                    ->where('st.companyid', 1)
                    ->whereIn('st.productid', $productIds);
            })
            ->join('supplier as sup', 'sup.id', '=', 'st.supplierid')
            ->join('products as p', 'p.id', '=', 'st.productid')
            ->groupBy('sup.name');

        $union = $warehouse->unionAll($shop);

        $combined = DB::connection('pgsql')->table(DB::raw("({$union->toSql()}) as combined"))
            ->mergeBindings($union)
            ->selectRaw("
                supplier,
                SUM(purchase) as purchase,
                SUM(sales) as sales,
                SUM(stock) as stock")
            ->groupBy('supplier')
            ->orderBy('supplier')
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
