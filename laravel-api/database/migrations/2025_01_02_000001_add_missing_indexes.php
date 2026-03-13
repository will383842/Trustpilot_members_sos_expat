<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->index('message_status');
            $table->index('primary_language');
            $table->index('primary_country');
            $table->index('first_seen_at');
            $table->index(['message_status', 'primary_language']);
        });

        Schema::table('member_groups', function (Blueprint $table) {
            $table->index(['group_id', 'left_at']);
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropIndex(['message_status']);
            $table->dropIndex(['primary_language']);
            $table->dropIndex(['primary_country']);
            $table->dropIndex(['first_seen_at']);
            $table->dropIndex(['message_status', 'primary_language']);
        });

        Schema::table('member_groups', function (Blueprint $table) {
            $table->dropIndex(['group_id', 'left_at']);
        });
    }
};
