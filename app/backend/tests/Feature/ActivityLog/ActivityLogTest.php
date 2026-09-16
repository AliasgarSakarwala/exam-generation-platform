<?php

namespace Tests\Feature\ActivityLog;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class ActivityLogTest extends TestCase
{
    private $testUserId;
    private $testClassroomId;
    private $token;
    private $uniqueId;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->uniqueId = substr(uniqid(), -6);
        
        // Insert test user directly into database
        $this->testUserId = 1001;
        DB::table('user')->insert([
            'user_id' => $this->testUserId,
            'role' => 'Professor',
            'username' => 'test_prof_' . $this->uniqueId,
            'email' => 'prof_' . $this->uniqueId . '@test.com',
            'password_hash' => bcrypt('password123'),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);

        // Insert test classroom directly into database
        $this->testClassroomId = 1001;
        DB::table('classroom')->insert([
            'classroom_id' => $this->testClassroomId,
            'name' => 'Test Course',
            'code' => 'TEST' . $this->uniqueId,
            'description' => 'Test course for activity logs',
            'user_id' => $this->testUserId,
            'is_archived' => false,
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
            'student_count' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create authentication token using direct DB user
        $user = \App\Models\User::find($this->testUserId);
        $this->token = $user->createToken('test-token')->plainTextToken;
    }

    protected function tearDown(): void
    {
        // Clean up test data
        DB::table('activity_logs')->where('user_id', $this->testUserId)->delete();
        DB::table('classroom')->where('classroom_id', $this->testClassroomId)->delete();
        DB::table('user')->where('user_id', $this->testUserId)->delete();
        
        parent::tearDown();
    }

    /**
     * Test: Can store activity log
     */
    public function test_can_store_activity_log(): void
    {
        $activityData = [
            'classroom_id' => $this->testClassroomId,
            'route' => '/api/test',
            'method' => 'GET',
            'status_code' => 200,
            'payload' => ['test' => 'data'],
            'action' => 'Login',
            'entity' => 'User',
            'description' => 'User logged in successfully',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/activity-logs', $activityData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'user_id',
                        'classroom_id',
                        'route',
                        'method',
                        'status_code',
                        'action',
                        'entity',
                        'description',
                        'created_at'
                    ]
                ]);

        $this->assertEquals('Activity logged', $response->json('message'));
        
        // Verify the record was created in the database
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->testUserId,
            'classroom_id' => $this->testClassroomId,
            'route' => '/api/test',
            'method' => 'GET',
            'status_code' => 200,
            'action' => 'Login',
            'entity' => 'User',
            'description' => 'User logged in successfully',
        ]);
    }

    /**
     * Test: Can get activity logs with pagination
     */
    public function test_can_retrieve_activity_logs_with_pagination(): void
    {
        // Create test activity logs
        for ($i = 1; $i <= 3; $i++) {
            DB::table('activity_logs')->insert([
                'user_id' => $this->testUserId,
                'classroom_id' => $this->testClassroomId,
                'route' => "/api/test{$i}",
                'method' => 'GET',
                'status_code' => 200,
                'action' => 'View',
                'entity' => 'Test',
                'description' => "Test activity {$i}",
                'created_at' => now()->subMinutes($i),
                'payload' => '{}',
            ]);
        }

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/activity-logs?per_page=2');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'user_id',
                            'classroom_id',
                            'route',
                            'method',
                            'status_code',
                            'action',
                            'entity',
                            'description',
                            'created_at'
                        ]
                    ],
                    'current_page',
                    'last_page',
                    'per_page',
                    'total'
                ]);

        $this->assertEquals(2, count($response->json('data')));
        $this->assertEquals(2, $response->json('per_page'));
        $this->assertEquals(3, $response->json('total'));
    }

    /**
     * Test: Can get KPI statistics
     */
    public function test_can_get_kpi_statistics(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/activity-logs/kpi-stats');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    '*' => [
                        'title',
                        'value',
                        'icon',
                        'accentColor',
                        'textColor',
                        'subtitle'
                    ]
                ]);

        $data = $response->json();
        $this->assertCount(6, $data);
        
        $titles = array_column($data, 'title');
        $this->assertContains('Total Professors', $titles);
        $this->assertContains('Total TAs', $titles);
        $this->assertContains('Total Courses', $titles);
        $this->assertContains('Total Students', $titles);
        $this->assertContains('Total Exams', $titles);
        $this->assertContains('Total Questions', $titles);
    }

    /**
     * Test: Can get graph data for logins
     */
    public function test_can_get_graph_data_for_logins(): void
    {
        // Create login activity log
        DB::table('activity_logs')->insert([
            'user_id' => $this->testUserId,
            'route' => '/api/login',
            'method' => 'POST',
            'status_code' => 200,
            'action' => 'Login',
            'entity' => 'User',
            'description' => 'User login',
            'created_at' => now(),
            'payload' => '{}',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/activity-logs/graph-data?type=logins&granularity=day');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'type',
                    'granularity',
                    'data' => [
                        '*' => [
                            'period',
                            'count'
                        ]
                    ]
                ]);

        $this->assertEquals('logins', $response->json('type'));
        $this->assertEquals('day', $response->json('granularity'));
        
        $data = $response->json('data');
        $this->assertIsArray($data);
    }

    /**
     * Test: Can get classroom activities
     */
    public function test_can_get_classroom_activities(): void
    {
        // Create classroom activity log
        DB::table('activity_logs')->insert([
            'user_id' => $this->testUserId,
            'classroom_id' => $this->testClassroomId,
            'route' => '/api/classroom/test',
            'method' => 'GET',
            'status_code' => 200,
            'action' => 'View',
            'entity' => 'Classroom',
            'description' => 'Viewed classroom',
            'created_at' => now(),
            'payload' => '{}',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/activity-logs/classroom/{$this->testClassroomId}/activities");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    '*' => [
                        'id',
                        'user',
                        'action',
                        'entity',
                        'description',
                        'created_at',
                        'route',
                        'method',
                        'status_code'
                    ]
                ]);

        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('Viewed classroom', $data[0]['description']);
    }

    /**
     * Test: Can get user activities
     */
    public function test_can_get_user_activities(): void
    {
        // Create user activity log
        DB::table('activity_logs')->insert([
            'user_id' => $this->testUserId,
            'classroom_id' => $this->testClassroomId,
            'route' => '/api/user/test',
            'method' => 'GET',
            'status_code' => 200,
            'action' => 'View',
            'entity' => 'User',
            'description' => 'User activity',
            'created_at' => now(),
            'payload' => '{}',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/activity-logs/user/{$this->testUserId}/activities");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    '*' => [
                        'id',
                        'classroom',
                        'action',
                        'entity',
                        'description',
                        'created_at',
                        'route',
                        'method',
                        'status_code'
                    ]
                ]);

        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('User activity', $data[0]['description']);
    }

    /**
     * Test: Validation errors for store method
     */
    public function test_validation_errors_for_store_method(): void
    {
        // Test missing required fields
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/activity-logs', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['route', 'method', 'status_code']);

        // Test invalid status code
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/activity-logs', [
            'route' => '/api/test',
            'method' => 'GET',
            'status_code' => 'invalid',
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['status_code']);
    }

    /**
     * Test: Unauthenticated requests are rejected
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        // Test all endpoints without token
        $response = $this->getJson('/api/activity-logs');
        $response->assertStatus(401);

        $response = $this->postJson('/api/activity-logs', []);
        $response->assertStatus(401);

        $response = $this->getJson('/api/activity-logs/kpi-stats');
        $response->assertStatus(401);

        $response = $this->getJson('/api/activity-logs/graph-data');
        $response->assertStatus(401);
    }
}