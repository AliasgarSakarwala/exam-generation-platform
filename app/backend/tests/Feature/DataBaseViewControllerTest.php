<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class DatabaseViewControllerTest extends TestCase
{
    /** @test */
    public function application_returns_successful_response(): void
    {
        // Mock the initial tables query to return an empty list
        DB::shouldReceive('select')
            ->once()
            ->withArgs(fn($query) => str_contains($query, 'FROM information_schema.tables'))
            ->andReturn([]);

        $response = $this->withoutMiddleware()
                         ->get('/');

        $response->assertStatus(200);
    }

    /** @test */
    public function show_tables_catches_exception_and_returns_error_data(): void
    {
        // 1) Mock the tables list to include one user table
        DB::shouldReceive('select')
            ->once()
            ->withArgs(fn($query) => str_contains($query, 'FROM information_schema.tables'))
            ->andReturn([
                (object)['table_name' => 'my_table'],
                (object)['table_name' => 'migrations'], // should be skipped
            ]);

        // 2) Mock columns query for my_table to throw an exception
        DB::shouldReceive('select')
            ->once()
            ->withArgs(fn($query, $bindings) =>
                str_contains($query, 'FROM information_schema.columns')
                && $bindings === ['my_table']
            )
            ->andThrow(new \Exception('fail!'));

        // 3) Call the controller action
        $response = $this->withoutMiddleware()
                         ->get('/');

        $response->assertStatus(200);

        // 4) Extract view data
        $tables = $response->viewData('tables');

        // 5) Verify exception block
        $this->assertArrayHasKey('my_table', $tables);
        $this->assertEquals('fail!',   $tables['my_table']['error']);
        $this->assertEquals([],         $tables['my_table']['headers']);
        $this->assertEquals([],         $tables['my_table']['rows']);
        $this->assertEquals(0,          $tables['my_table']['total']);

        // 6) Only one table should be counted (migrations skipped)
        $this->assertEquals(1, $response->viewData('total_tables'));
    }

    /** @test */
    public function show_tables_returns_data_on_success(): void
    {
        // 1) Mock the list of tables with a single real table
        DB::shouldReceive('select')
            ->once()
            ->withArgs(fn($query) => str_contains($query, 'FROM information_schema.tables'))
            ->andReturn([
                (object)['table_name' => 'my_table'],
            ]);

        // 2) Mock columns metadata for my_table
        $columns = [
            (object)['column_name' => 'id', 'data_type' => 'integer', 'character_maximum_length' => null, 'is_nullable' => 'NO'],
            (object)['column_name' => 'name', 'data_type' => 'varchar', 'character_maximum_length' => 255, 'is_nullable' => 'YES'],
        ];
        DB::shouldReceive('select')
            ->once()
            ->withArgs(fn($query, $bindings) =>
                str_contains($query, 'FROM information_schema.columns') &&
                $bindings === ['my_table']
            )
            ->andReturn($columns);

        // 3) Mock data rows for my_table
        $rows = collect([(object)['id' => 1, 'name' => 'Alice'], (object)['id' => 2, 'name' => 'Bob']]);
        $stub = new class($rows) {
            private $rows;
            public function __construct($rows) { $this->rows = $rows; }
            public function get() { return $this->rows; }
        };
        DB::shouldReceive('table')
            ->once()
            ->with('my_table')
            ->andReturn($stub);

        // 4) Call the route
        $response = $this->withoutMiddleware()
                         ->get('/');

        $response->assertStatus(200);

        // 5) Extract view data
        $tables = $response->viewData('tables');
        $table = $tables['my_table'];

        // 6) Assertions on headers, rows, total, and columns_meta
        $this->assertEquals(['id', 'name'], $table['headers']);
        $this->assertEquals(2, $table['total']);
        $this->assertCount(2, $table['rows']);
        $this->assertSame($columns, $table['columns_meta']);

        
    }
}
