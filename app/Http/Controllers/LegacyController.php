<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LegacyController extends Controller
{
    public function show()
    {
        $suppliers = DB::connection('sqlsrv')
            ->table('legacy')
            ->distinct()
            ->orderBy('VendorName')
            ->pluck('VendorName')
            ->toArray();

        $products = DB::connection('sqlsrv')
            ->table('legacy')
            ->distinct()
            ->orderBy('Product')
            ->pluck('Product')
            ->toArray();

        return inertia('Legacy', [
            'suppliers' => $suppliers,
            'products' => $products
        ]);
    }

    public function report(Request $request)
    {
        $request->validate([
            'supplier' => 'nullable|string',
            'product' => 'nullable|string',
        ]);

        $supplier = $request->filled('supplier') ? trim($request->supplier) : null;
        $product = $request->filled('product') ? trim($request->product) : null;

        if (!$supplier && !$product) {
            return response()->json(['data' => []]);
        }

        $query = DB::connection('sqlsrv')
            ->table('legacy')
            ->select('vendorname as supplier', 'product', 'purchase', 'sales');

        if ($supplier) {
            $query->where('vendorname', $supplier);
        }

        if ($product) {
            $query->where('product', $product);
        }

        $data = $query->orderBy('vendorname')->orderBy('product')->get();

        collect($data)->map(function($item){
            $item->purchase = (float) $item->purchase;
            $item->sales = (float) $item->sales;

            return $item;
        });

        return response()->json(['data' => $data]);
    }
}
