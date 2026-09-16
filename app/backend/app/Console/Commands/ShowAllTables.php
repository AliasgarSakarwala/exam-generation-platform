<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ShowAllTables extends Command
{
    protected $signature = 'breeze';
    protected $description = 'Display all database tables with their content';

    public function handle()
    {
        // Get all tables using PostgreSQL information_schema
        $tables = DB::select("
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        ");

        foreach ($tables as $tableObj) {
            $table = $tableObj->table_name;
            
            // Skip migrations table
            if ($table === 'migrations') {
                continue;
            }

            $this->info("\n=== " . strtoupper($table) . " ===");
            
            try {
                // Get column names
                $columns = DB::select("
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = ?
                    ORDER BY ordinal_position
                ", [$table]);

                $headers = array_map(fn($col) => $col->column_name, $columns);

                // Get table data with a limit (to avoid huge outputs)
                $data = DB::table($table)->limit(10)->get();

                if ($data->isEmpty()) {
                    $this->line("(No records)");
                    continue;
                }

                // Format the data
                $rows = $data->map(function ($item) {
                    return (array)$item;
                });

                $this->table($headers, $rows);

                // Show count if there are more records
                $total = DB::table($table)->count();
                if ($total > 10) {
                    $this->line("\nShowing 10 of $total records...");
                }

            } catch (\Exception $e) {
                $this->error("Error displaying table {$table}: " . $e->getMessage());
                continue;
            }
        }

        $this->info("\nDatabase scan complete!");
        return 0;
    }
}