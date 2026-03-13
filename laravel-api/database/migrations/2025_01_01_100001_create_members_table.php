<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number', 25)->unique();
            $table->string('display_name')->nullable();
            $table->string('primary_language', 10)->default('fr');
            $table->string('primary_country', 100)->nullable();
            $table->string('primary_continent', 100)->nullable();
            $table->text('whatsapp_message')->nullable()->comment('GPT-4 generated — max 1500 chars');
            $table->timestamp('generated_at')->nullable();
            $table->enum('message_status', ['not_sent', 'sent', 'replied'])->default('not_sent');
            $table->timestamp('message_sent_at')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('first_seen_at')->useCurrent();
            $table->timestamps();

            $table->index('message_status');
            $table->index('primary_language');
            $table->index('first_seen_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
