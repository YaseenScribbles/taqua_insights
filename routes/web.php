<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LegacyController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('Loading');
});


Route::middleware('guest')->group(function () {

    Route::get('/login', function () {
        return inertia('Login');
    })->name('login');

    Route::post('/login', [AuthController::class, 'login']);
});


Route::middleware(['auth', 'auth.session'])->group(function () {
    //dashboard
    Route::get('/dashboard', [DashboardController::class, 'show'])->name('dashboard');
    //dashboard api calls
    Route::get('/top10suppliers', [DashboardController::class, 'top10Suppliers'])->name('top10Suppliers');
    Route::get('/top10products', [DashboardController::class, 'top10Products'])->name('top10Products');

    //supplier
    Route::get("/supplier", [SupplierController::class, 'show'])->name('supplier');
    //supplier api calls
    Route::get("/supplierproducts", [SupplierController::class, 'supplierproducts'])->name('SupplierProducts');

    //product
    Route::get("/product", [ProductController::class, 'show'])->name('product');
    //product api calls
    Route::get("/productsuppliers", [ProductController::class, 'productsuppliers'])->name('ProductSuppliers');

    //Product Status Report
    Route::get("/psr", [InvoiceController::class, 'show'])->name('psr');
    //Api calls
    Route::get('/invoices', [InvoiceController::class, 'invoices'])->name('invoices');
    Route::get('/invoiceproducts', [InvoiceController::class, 'invoiceProducts'])->name('InvoiceProducts');

    //Users
    Route::get('/user', [UserController::class, 'showPage'])->name('UserPage');
    Route::apiResource('users', UserController::class);

    //Legacy
    Route::get('/legacy', [LegacyController::class, 'show'])->name('legacy');
    //Api calls
    Route::get('/legacy/report', [LegacyController::class, 'report'])->name('legacy.report');

    //auth
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});
