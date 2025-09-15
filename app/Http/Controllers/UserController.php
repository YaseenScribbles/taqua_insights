<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{

    public function showPage()
    {
        return inertia('Users');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::all(['id', 'name', 'email', 'role']);
        return response()->json(compact('users'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|confirmed|min:5',
            'role' => 'required|string|in:admin,user'
        ]);
        User::create($data);
        return response()->json(['message' => 'User added successfully']);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return response()->json(compact('user'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|confirmed|min:5',
            'role' => 'required|string|in:admin,user'
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);
        return response()->json(['message' => 'User updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
}
