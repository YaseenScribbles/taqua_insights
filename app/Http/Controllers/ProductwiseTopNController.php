<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductwiseTopNController extends Controller
{
    public function show()
    {
        return inertia('TopSAndB');
    }

    public function topNSupplierForEachProducts(Request $request)
    {
        $request->validate([
            'n'     => 'nullable|numeric|integer|in:5,10,15,20',
            'from'  => 'required|date',
            'to'    =>  'required|date|after_or_equal:from'
        ]);

        $n = $request->input('n') ?? 5;
        $fromDate = Carbon::parse($request->input('from') ?? Carbon::now()->startOfMonth())->startOfDay();
        $toDate = Carbon::parse($request->input('to') ?? Carbon::now())->endOfDay();

        // Query for top suppliers
        $topSuppliers = DB::connection('pgsql')->select("
                        WITH sale_data AS (
                            SELECT p.name AS product, sup.name AS supplier, SUM(bi.qty) AS sold
                            FROM stock s
                            JOIN billitems bi ON bi.stockid = s.id
                            JOIN bill bm ON bm.id = bi.billid
                            JOIN products P ON p.id = s.productid
                            JOIN supplier sup ON sup.id = s.supplierid
                            WHERE bm.isactive = true AND bm.settled = true AND bm.locationid IN (1,54) AND bm.createdon BETWEEN ? AND ?
                            GROUP BY p.name, sup.name
                        ),
                        ranked_products AS (
                            SELECT product, SUM(sold) AS total_sales, ROW_NUMBER() OVER(ORDER BY SUM(sold) DESC) product_rank
                            FROM sale_data
                            GROUP BY product
                        ),
                        ranked_suppliers AS (
                            SELECT sd.*, rp.total_sales, rp.product_rank, ROW_NUMBER() OVER (PARTITION BY sd.product ORDER BY sd.sold DESC) AS supplier_rank
                            FROM sale_data sd
                            JOIN ranked_products rp ON sd.product = rp.product
                        )
                        SELECT *
                        FROM ranked_suppliers
                        WHERE supplier_rank <= ?
                        ORDER BY product_rank , supplier_rank
        ", [$fromDate, $toDate, $n]);

        return response()->json(['data' => $topSuppliers]);
    }

    public function topNBrandsForEachProducts(Request $request)
    {
        $request->validate([
            'n'     => 'nullable|numeric|integer|in:5,10,15,20',
            'from'  => 'required|date',
            'to'    =>  'required|date|after_or_equal:from'
        ]);

        $n = $request->input('n') ?? 5;
        $fromDate = Carbon::parse($request->input('from') ?? Carbon::now()->startOfMonth())->startOfDay();
        $toDate = Carbon::parse($request->input('to') ?? Carbon::now())->endOfDay();

        // Query for top brands
        $topBrands = DB::connection('pgsql')->select("
                    WITH sale_data AS (
                        SELECT
                            p.name AS product,
                            COALESCE(b.name, 'NOT GIVEN') AS brand,
                            SUM(bi.qty) AS sold
                        FROM stock s
                        JOIN billitems bi ON bi.stockid = s.id
                        JOIN bill bm ON bm.id = bi.billid
                        JOIN items i ON s.itemid = i.id
                        JOIN products p ON i.productid = p.id
                        LEFT JOIN brand b ON i.brandid = b.id
                        WHERE bm.isactive = true AND bm.settled = true AND bm.locationid IN (1,54) AND bm.createdon BETWEEN ? AND ?
                        GROUP BY p.name, b.name
                    ),
                    product_totals_ranked AS (
                        SELECT
                            product,
                            SUM(sold) AS total_sales,
                            ROW_NUMBER() OVER(ORDER BY SUM(sold) DESC) AS product_rank
                        FROM sale_data
                        GROUP BY product
                    ),
                    ranked AS (
                        SELECT
                            sd.*,
                            pt.total_sales,
                            pt.product_rank,
                            ROW_NUMBER() OVER(PARTITION BY sd.product ORDER BY sd.sold DESC) AS brand_rank
                        FROM sale_data sd
                        JOIN product_totals_ranked pt ON sd.product = pt.product
                    )
                    SELECT
                        product,
                        total_sales,
                        product_rank,
                        brand,
                        sold,
                        brand_rank
                    FROM ranked
                    WHERE brand_rank <= ?
                    ORDER BY product_rank, brand_rank;
        ", [$fromDate, $toDate, $n]);

        return response()->json(['data' => $topBrands]);
    }
}
