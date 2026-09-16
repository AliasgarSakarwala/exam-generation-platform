<?php

namespace App\Console\Commands;

use App\Models\UserManagement;
use Illuminate\Console\Command;

class ResetUserManagementSequence extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user-management:reset-sequence {--to-start : Reset sequence to start from 1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset the user_management sequence to start from the next available ID or 1';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Resetting user_management sequence...');
        
        if ($this->option('to-start')) {
            UserManagement::resetSequenceToStart();
            $this->info("Sequence reset to start from 1!");
        } else {
            $currentMaxId = UserManagement::max('um_id') ?? 0;
            $nextId = $currentMaxId + 1;
            
            UserManagement::resetSequence();
            
            $this->info("Sequence reset successfully!");
            $this->info("Current max ID: {$currentMaxId}");
            $this->info("Next record will have ID: {$nextId}");
        }
        
        return Command::SUCCESS;
    }
}
