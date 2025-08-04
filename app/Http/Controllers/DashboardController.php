<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function show(Request $request)
    {
        return inertia('Dashboard');
    }

    public function top10Products(Request $request)
    {

        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'order_by' => 'required|in:qty,amount',
        ]);

        $fromDate = Carbon::parse($request->input('from_date') ?? Carbon::now()->startOfMonth())->startOfDay();
        $toDate = Carbon::parse($request->input('to_date') ?? Carbon::now())->endOfDay();
        $orderBy = $request->input('order_by');

        $sql = DB::connection('pgsql')->table('billitems', 'bi')
            ->join('bill as b', 'b.id', '=', 'bi.billid')
            ->join('stock as st', 'st.id', '=', 'bi.stockid')
            ->join('products as p', 'p.id', '=', 'st.productid')
            ->where('b.settled', '=', true)
            ->whereIn('b.locationid', [1, 54])
            ->whereBetween('b.createdon', [$fromDate, $toDate])
            ->select([
                DB::raw('p.name as product'),
                DB::raw('sum(bi.qty) as qty'),
                DB::raw('sum(bi.receivable) as amount'),
            ])
            ->groupBy('p.name')
            ->orderByDesc($orderBy)
            ->limit(10)
            ->get();

        $data = collect($sql)->map(function ($item) {
            $item->qty = (float) $item->qty;
            $item->amount = (float) $item->amount;
            return $item;
        })->shuffle();

        return response()->json([
            'data' => $data
        ]);
    }

    public function top10Suppliers(Request $request)
    {

        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'order_by' => 'required|in:qty,amount',
        ]);

        $fromDate = Carbon::parse($request->input('from_date') ?? Carbon::now()->startOfMonth())->startOfDay();
        $toDate = Carbon::parse($request->input('to_date') ?? Carbon::now())->endOfDay();
        $orderBy = $request->input('order_by');

        $sql = DB::connection('pgsql')->table('billitems', 'bi')
            ->join('bill as b', 'b.id', '=', 'bi.billid')
            ->join('stock as st', 'st.id', '=', 'bi.stockid')
            ->join('supplier as s', 's.id', '=', 'st.supplierid')
            ->where('b.settled', '=', true)
            ->whereIn('b.locationid', [1, 54])
            ->whereBetween('b.createdon', [$fromDate, $toDate])
            ->select([
                DB::raw('s.name as supplier'),
                DB::raw('sum(bi.qty) as qty'),
                DB::raw('sum(bi.receivable) as amount'),
            ])
            ->groupBy('s.name')
            ->orderByDesc($orderBy)
            ->limit(10)
            ->get();

        $data = collect($sql)->map(function ($item) {
            $item->qty = (float) $item->qty;
            $item->amount = (float) $item->amount;
            return $item;
        })->shuffle();

        return response()->json([
            'data' => $data
        ]);
    }
}
