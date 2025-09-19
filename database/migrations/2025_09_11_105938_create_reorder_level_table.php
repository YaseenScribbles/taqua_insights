<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reorder_level', function (Blueprint $table) {
            $table->id();
            $table->integer('product_id');
            $table->string('product_name');
            $table->integer('brand_id');
            $table->string('brand_name');
            $table->integer('size_id');
            $table->string('size_name');
            $table->integer('supplier_id');
            $table->string('supplier_name');
            $table->decimal('reorder_level', 10, 2)->default(10);
            $table->integer('status')->default(1); // 1 for active, 0 for inactive
            $table->integer('created_by')->nullable();
            $table->integer('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'brand_id', 'size_id', 'supplier_id'], 'unique_product_brand_size_supplier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reorder_level');
    }
};
