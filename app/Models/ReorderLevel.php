<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReorderLevel extends Model
{
    protected $table = 'reorder_level';

    protected $fillable = [
        'product_id',
        'product_name',
        'brand_id',
        'brand_name',
        'size_id',
        'size_name',
        'reorder_level',
        'status',
        'created_by',
        'updated_by',
    ];
}
