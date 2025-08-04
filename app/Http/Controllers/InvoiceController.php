<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function show()
    {
        $suppliersSql = DB::connection('pgsql')->table('supplier', 's')
            ->select('s.id', 's.name')
            ->orderBy('s.name');

        return inertia('PSR', [
            'suppliers' => fn() => $suppliersSql->get(),
        ]);
    }

    public function invoices(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|integer'
        ]);

        $supplierId = $request->supplier_id;

        $invoices = DB::connection('pgsql')->table('lrentry', 'lr')
            ->join('lrinvoice as li', function ($join) use ($supplierId) {
                $join->on('li.lrid', '=', 'lr.id')
                    ->where('li.isactive', true)
                    ->where('lr.isactive', true)
                    ->where('lr.lrcompanyid', 1)
                    ->where('lr.supplierid', $supplierId);
            })->join('supplier as s', 's.id', '=', 'lr.supplierid')
            ->select(['li.id', DB::raw('lr.lrentryno as grn')])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $invoices
        ]);
    }

    public function invoiceProducts(Request $request)
    {
        $request->validate([
            'invoices' => 'nullable|string',
            'supplier_id' => 'required|integer'
        ]);

        $supplierId = $request->supplier_id;
        $invoiceIds = $request->invoices;
        $invoiceSql = '';

        if ($invoiceIds) {
            $invoiceSql = "and li.id in ({$invoiceIds})";
        }

        $productStatusReport = DB::connection('pgsql')->select("
            WITH ProductStatusReport AS
            (select p.name product,sum(s.purchaseqty) purchase, 0 l2sales, 0 l2stock, 0 l4sales, 0 l4stock, sum(s.returnqty) partyreturn, sum(s.purchaseqty - s.transfered - s.returnqty - s.journalqty) whstock
            from lrinvoice li
            inner join lrinvoiceitems lii on lii.lrinvoiceid = li.id and li.isactive = true and lii.isactive = true {$invoiceSql}
            inner join lrentry le on le.id  = li.lrid and le.isactive = true and le.lrcompanyid = 1
            inner join stock s on s.invoiceitemid = lii.id and s.supplierid = :supplier
            inner join products p on p.id = s.productid
            group by p.name
            union all
            select p.name product, 0 purchase, coalesce(sum(sg.oqty),0) l2sales, coalesce(sum(sg.iqty - sg.oqty - sg.jqty),0) l2stock, 0 l4sales, 0 l4stock, 0 partyreturn, 0 whstock
            from lrinvoice li
            inner join lrinvoiceitems lii on lii.lrinvoiceid = li.id and li.isactive = true and lii.isactive = true {$invoiceSql}
            inner join lrentry le on le.id  = li.lrid and le.isactive = true and le.lrcompanyid = 1
            inner join stock s on s.invoiceitemid = lii.id and s.supplierid = :supplier
            inner join products p on p.id = s.productid
            inner join salablegoods sg on sg.stockid = s.id and sg.locationid = 1
            inner join referencelist r on r.id = sg.locationid
            group by p.name
            union all
            select p.name product, 0 purchase, 0 l2sales,0 l2stock, coalesce(sum(sg.oqty),0) l4sales, coalesce(sum(sg.iqty - sg.oqty - sg.jqty),0) l4stock, 0 partyreturn, 0 whstock
            from lrinvoice li
            inner join lrinvoiceitems lii on lii.lrinvoiceid = li.id and li.isactive = true and lii.isactive = true {$invoiceSql}
            inner join lrentry le on le.id  = li.lrid and le.isactive = true and le.lrcompanyid = 1
            inner join stock s on s.invoiceitemid = lii.id and s.supplierid = :supplier
            inner join products p on p.id = s.productid
            inner join salablegoods sg on sg.stockid = s.id and sg.locationid = 54
            inner join referencelist r on r.id = sg.locationid
            group by p.name)
            select product, sum(purchase) purchase, sum(l2sales) l2sales, sum(l2stock) l2stock, sum(l4sales) l4sales, sum(l4stock) l4stock, sum(partyreturn) partyreturn, sum(whstock) whstock
            from ProductStatusReport
            group by product
        ", ['supplier' => $supplierId]);

        $data = collect($productStatusReport)->map(function($item){
            $item->purchase = (float) $item->purchase;
            $item->l2sales = (float) $item->l2sales;
            $item->l2stock = (float) $item->l2stock;
            $item->l4sales = (float) $item->l4sales;
            $item->l4stock = (float) $item->l4stock;
            $item->partyreturn = (float) $item->partyreturn;
            $item->whstock = (float) $item->whstock;
            return $item;
        });

        return response()->json([
            'data' => $data
        ]);
    }
}
