<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class DatabaseViewController extends Controller
{
    public function showTables()
    {
        // Get all tables
        $tables = DB::select("
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        ");

        $tableData = [];
        
        foreach ($tables as $tableObj) {
            $table = $tableObj->table_name;
            
            // Skip system tables
            if (in_array($table, ['migrations', 'failed_jobs', 'password_resets', 'personal_access_tokens'])) {
                continue;
            }

            try {
                // Get column information with metadata
                $columns = DB::select("
                    SELECT 
                        column_name,
                        data_type,
                        character_maximum_length,
                        is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = ?
                    ORDER BY ordinal_position
                ", [$table]);

                $headers = array_map(fn($col) => $col->column_name, $columns);
                
                // Get all data for the table
                $data = DB::table($table)->get();
                $total = count($data);

                $tableData[$table] = [
                    'headers' => $headers,
                    'rows' => $data,
                    'total' => $total,
                    'columns_meta' => $columns, // Added column metadata
                ];
            } catch (\Exception $e) {
                $tableData[$table] = [
                    'error' => $e->getMessage(),
                    'headers' => [],
                    'rows' => [],
                    'total' => 0
                ];
            }
        }

        return view('database-view', [
            'tables' => $tableData,
            'total_tables' => count($tableData),
            'timestamp' => now()->toDateTimeString()
        ]);
    }
}