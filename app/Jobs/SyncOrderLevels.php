<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class SyncOrderLevels implements ShouldQueue
{
    use Queueable, Dispatchable;

    /**
     * Create a new job instance.
     */

    private int $createdBy;

    public function __construct(int $createdBy)
    {
        $this->createdBy = $createdBy;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {

            DB::beginTransaction();

            DB::connection('pgsql')
                ->table('stock as s')
                ->join('items as i', 'i.id', '=', 's.itemid')
                ->join('products as p', 'p.id', '=', 'i.productid')
                ->join('brand as b', 'b.id', '=', 'i.brandid')
                ->join('referencelist as r', fn($j) => $j->on('r.id', '=', 'i.sizeid')->where('r.type', 'SIZE'))
                ->join('supplier as sup', 'sup.id', '=', 's.supplierid')
                ->whereNotIn('b.name', ['', 'UNSPECIFIED', 'NONE'])
                ->where('r.name', '!=', '')
                ->select(
                    'i.productid as product_id',
                    'p.name as product_name',
                    'i.brandid as brand_id',
                    'b.name as brand_name',
                    'i.sizeid as size_id',
                    'r.name as size_name',
                    's.supplierid as supplier_id',
                    'sup.name as supplier_name'
                )
                ->distinct()
                ->orderBy('product_id')
                ->chunk(1000, function ($items) {
                    $insert = [];
                    foreach ($items as $item) {
                        $insert[] = [
                            'product_id' => $item->product_id,
                            'brand_id' => $item->brand_id,
                            'size_id' => $item->size_id,
                            'supplier_id' => $item->supplier_id,
                            'product_name' => $item->product_name,
                            'brand_name' => $item->brand_name,
                            'size_name' => $item->size_name,
                            'supplier_name' => $item->supplier_name,
                            'created_by' => $this->createdBy ?? 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    DB::connection('sqlite')->table('reorder_level')->upsert(
                        $insert,
                        ['product_id', 'brand_id', 'size_id', 'supplier_id'],
                        ['product_name', 'brand_name', 'size_name', 'supplier_name', 'updated_at']
                    );
                });

            DB::commit();
            broadcast(new \App\Events\ReorderSyncCompleted("Reorder levels synced successfully"))->toOthers();
        } catch (\Throwable $th) {
            DB::rollBack();
            broadcast(new \App\Events\ReorderSyncCompleted("Error syncing reorder levels: " . $th->getMessage()))->toOthers();
        }
    }
}
