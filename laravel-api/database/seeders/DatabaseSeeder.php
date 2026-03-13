<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'williamsjullin@gmail.com'],
            [
                'name'     => 'Williams Jullin',
                'password' => Hash::make('MJJsblanc19522008/*%$'),
            ]
        );
    }
}
