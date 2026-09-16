<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class DatabaseApiController extends Controller
{
    public function getDatabaseContent()
    {
        $tables = DB::select("
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        ");

        $response = [];
        
        foreach ($tables as $tableObj) {
            $table = $tableObj->table_name;
            
            // Skip system tables
            if ($table === 'migrations' || $table === 'failed_jobs' || $table === 'password_resets' || $table === 'personal_access_tokens') {
                continue;
            }

            try {
                // Get column information with data types
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

                $columnNames = array_map(fn($col) => $col->column_name, $columns);
                
                // Get all data for the table
                $data = DB::table($table)->get();
                $total = count($data);

                // For very large tables, consider chunking or pagination
                // if ($total > 10000) {
                //     return $this->handleLargeTable($table, $columns);
                // }

                $response[$table] = [
                    'headers' => $columnNames,
                    'rows' => $data,
                    'total' => $total,
                    'columns_meta' => $columns, // Added column metadata
                ];
            } catch (\Exception $e) {
                $response[$table] = [
                    'error' => $e->getMessage()
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $response,
            'timestamp' => now()->toDateTimeString()
        ]);
    }

    /**
     * Handle very large tables with pagination/chunking
     */
    protected function handleLargeTable($tableName, $columns)
    {
        $perPage = request()->input('per_page', 100);
        $page = request()->input('page', 1);
        
        $query = DB::table($tableName);
        $total = $query->count();
        $data = $query->paginate($perPage);

        $columnNames = array_map(fn($col) => $col->column_name, $columns);

        return response()->json([
            'status' => 'success',
            'data' => [
                $tableName => [
                    'headers' => $columnNames,
                    'rows' => $data->items(),
                    'total' => $total,
                    'current_page' => $data->currentPage(),
                    'per_page' => $data->perPage(),
                    'last_page' => $data->lastPage(),
                    'columns_meta' => $columns,
                ]
            ],
            'timestamp' => now()->toDateTimeString()
        ]);
    }
}