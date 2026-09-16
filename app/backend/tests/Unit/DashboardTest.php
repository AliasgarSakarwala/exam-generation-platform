<?php

namespace Tests\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\Test;

use Tests\TestCase;
use App\Models\User;
use App\Models\Classroom;
use Carbon\Carbon;

class DashboardTest extends TestCase
{
    /**
     * Keep track of only the records created during the current test so that
     * we can remove *just* those rows in tearDown().
     */
    protected array $createdUsers       = [];
    protected array $createdClassrooms  = [];

    protected function setUp(): void
    {
        parent::setUp();

        // Reset the trackers for the current test run
        $this->createdUsers       = [];
        $this->createdClassrooms  = [];
    }

    #[Test]
    public function users_only_see_their_own_classrooms()
    {
        // Create two users manually
        $userAId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $userAId,
            'email' => 'userA' . uniqid() . '@example.com',
            'password_hash' => bcrypt('passwordA'),
            'role' => 'Professor',
            'username' => 'userA_' . uniqid(),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $userA = User::find($userAId);
        $this->createdUsers[] = $userA->user_id;

        $userBId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $userBId,
            'email' => 'userB' . uniqid() . '@example.com',
            'password_hash' => bcrypt('passwordB'),
            'role' => 'Professor',
            'username' => 'userB_' . uniqid(),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $userB = User::find($userBId);
        $this->createdUsers[] = $userB->user_id;

        // Create classrooms for each user manually
        $classroomsA = [];
        for ($i = 0; $i < 2; $i++) {
            $classroomId = rand(10000, 99999);
            DB::table('classroom')->insert([
                'classroom_id' => $classroomId,
                'user_id' => $userA->user_id,
                'name' => 'ClassroomA_' . $i,
                'code' => 'CODEA' . $i,
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addDays(7 + $i)->toDateString(),
                'student_count' => 0,
                'class_colour' => '#CCCCFF',
                'is_archived' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $classroomsA[] = Classroom::find($classroomId);
            $this->createdClassrooms[] = $classroomId;
        }
        $classroomsB = [];
        for ($i = 0; $i < 3; $i++) {
            $classroomId = rand(10000, 99999);
            DB::table('classroom')->insert([
                'classroom_id' => $classroomId,
                'user_id' => $userB->user_id,
                'name' => 'ClassroomB_' . $i,
                'code' => 'CODEB' . $i,
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->addDays(10 + $i)->toDateString(),
                'student_count' => 0,
                'class_colour' => '#CCCCFF',
                'is_archived' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $classroomsB[] = Classroom::find($classroomId);
            $this->createdClassrooms[] = $classroomId;
        }

        $response = $this->actingAs($userA, 'sanctum')->getJson('/api/classrooms');

        $response->assertStatus(200);
        $allClassrooms = collect($response->json());
        // Expect exactly 2 classrooms returned, all belonging to userA
        $this->assertCount(2, $allClassrooms, "Expected only 2 classrooms returned");
        $this->assertTrue(
            $allClassrooms->every(fn($c) => $c['user_id'] === $userA->user_id),
            "All returned classrooms must belong to userA"
        );
    }

    #[Test]
    public function classroom_creation_succeeds_with_valid_data()
    {
        // — Arrange: create a Professor user and matching professor record
        $userId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $userId,
            'email' => 'testing_user@gmail.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
            'username' => 'testing_user_' . uniqid(),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $user = User::find($userId);
        $this->createdUsers[] = $user->user_id;
        // Professor::firstOrCreate(['user_id' => $user->user_id]);
        // $this->createdProfessors[] = $user->user_id;

        // — Act #1: log in to get a token
        $loginPayload = [
            'email'    => $user->email,
            'password' => 'password123',
        ];
        $loginResponse = $this->postJson('/api/auth/login', $loginPayload)
                            ->assertStatus(200);
        $token = $loginResponse->json('token');

        // — Arrange payload for classroom creation
        $classPayload = [
            'name'          => 'Physics 101',
            'code'          => 'PH101',
            'section'       => 'A',
            'start_date'    => Carbon::now()->format('Y-m-d'),
            'end_date'      => Carbon::now()->addWeek()->toDateString(),
            'term'          => 'Fall 2025',
            'student_count' => 0,
            'class_colour'  => '#CCCCFF',
        ];

        // — Act #2: call the classroom API with Bearer token
        $createResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/classrooms', $classPayload);

        // — Assert: correct response and database entry
        $createResponse->assertStatus(201)
                    ->assertJsonFragment(['name' => 'Physics 101']);

        $classroomId = $createResponse->json('classroom_id');
        if ($classroomId) {
            $this->createdClassrooms[] = $classroomId;
        }

        $this->assertDatabaseHas('classroom', [
            'name'         => 'Physics 101',
            'user_id' => $user->user_id,
        ]);
    }

    /** @test */
    public function archive_toggle_persists_status()
    {
        $userId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $userId,
            'email' => 'archive_user@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
            'username' => 'prof_' . uniqid(),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $user = User::find($userId);
        $this->createdUsers[] = $user->user_id;
        // Professor::firstOrCreate(['user_id' => $user->user_id]);
        // $this->createdProfessors[] = $user->user_id;
        // Prepare login payload for authentication
        $loginPayload = [
            'email'    => 'archive_user@example.com',
            'password' => 'password123',
        ];

        $loginResponse = $this->postJson('/api/auth/login', $loginPayload)
                            ->assertStatus(200);
        $token = $loginResponse->json('token');

        $classPayload = [
            'name'          => 'Psych 101',
            'code'          => 'PS101',
            'section'       => 'A',
            'start_date'    => Carbon::now()->format('Y-m-d'),
            'end_date'      => Carbon::now()->addWeek()->toDateString(),
            'term'          => 'Fall 2025',
            'student_count' => 10,
            'class_colour'  => '#CCCCFF',
            'classroom_id'  => 4
        ];

        // 1) Create the classroom via the API so it is owned by this professor
        $createResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept'        => 'application/json',
        ])->postJson('/api/classrooms', $classPayload)
           ->assertStatus(201);
        // Dump the full JSON response so we can see what the API returned during the test run
        $createResponse->dump();

        $classroomId = $createResponse->json('classroom_id');   // adjust key if API returns 'classroom_id'
        if ($classroomId) {
            $this->createdClassrooms[] = $classroomId;
        }

        $url = "/api/classrooms/{$classroomId}/status";

        fwrite(STDOUT, "\nURL being hit: {$url}\n");

        // 2) Hit the status-toggle endpoint using that ID
        $response1 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->patchJson($url);

        $response1->assertStatus(200)
                  ->assertJsonFragment(['is_archived' => true]);

        $this->assertDatabaseHas('classroom', [
            'classroom_id'          => $classroomId,
            'is_archived' => true,
        ]);

        // Un-archive
        $response2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->patchJson("/api/classrooms/{$classroomId}/status");
        $response2->assertStatus(200)
                  ->assertJsonFragment(['is_archived' => false]);

        $this->assertDatabaseHas('classroom', [
            'classroom_id'          => $classroomId,
            'is_archived' => false,
        ]);
    }

    /** @test */
    public function deletion_removes_classroom()
    {
        $userId = rand(10000, 99999);
        DB::table('user')->insert([
            'user_id' => $userId,
            'email' => 'archive_user@example.com',
            'password_hash' => bcrypt('password123'),
            'role' => 'Professor',
            'username' => 'prof_' . uniqid(),
            'comp_tutorial_pages' => '[]',
            'created_at' => now(),
            'last_updated_at' => now(),
        ]);
        $user = User::find($userId);
        $this->createdUsers[] = $user->user_id;
        // Professor::firstOrCreate(['user_id' => $user->user_id]);
        // $this->createdProfessors[] = $user->user_id;
        // Prepare login payload for authentication
        $loginPayload = [
            'email'    => 'archive_user@example.com',
            'password' => 'password123',
        ];

        $loginResponse = $this->postJson('/api/auth/login', $loginPayload)
                            ->assertStatus(200);
        $token = $loginResponse->json('token');

        $classPayload = [
            'name'          => 'Psych 101',
            'code'          => 'PS101',
            'section'       => 'A',
            'start_date'    => Carbon::now()->format('Y-m-d'),
            'end_date'      => Carbon::now()->addWeek()->toDateString(),
            'term'          => 'Fall 2025',
            'student_count' => 10,
            'class_colour'  => '#CCCCFF',
            'classroom_id'  => 4
        ];

        // 1) Create the classroom via the API so it is owned by this professor
        $createResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept'        => 'application/json',
        ])->postJson('/api/classrooms', $classPayload)
           ->assertStatus(201);
        // Dump the full JSON response so we can see what the API returned during the test run
        $createResponse->dump();

        $classroomId = $createResponse->json('classroom_id');   // adjust key if API returns 'classroom_id'
        if ($classroomId) {
            $this->createdClassrooms[] = $classroomId;
        }

        $url = "/api/classrooms/{$classroomId}";

        fwrite(STDOUT, "\nURL being hit: {$url}\n");

        $response = $this->actingAs($user)
                         ->deleteJson($url);

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Classroom deleted successfully']);
    }


    /**
     * Clean up only the rows created during this test run.
     */
    
        /** @test */
        public function get_name_returns_name_on_success(): void
        {
            // 1) Seed a professor + classroom
            $userId = rand(10000, 99999);
            DB::table('user')->insert([
                'user_id' => $userId,
                'email' => 'prof_' . uniqid() . '@example.com',
                'password_hash' => bcrypt('password123'),
                'role' => 'Professor',
                'username' => 'prof_' . uniqid(),
                'comp_tutorial_pages' => '[]',
                'created_at' => now(),
                'last_updated_at' => now(),
            ]);
            $user = User::find($userId);
            $this->createdUsers[] = $user->user_id;
            // Professor::firstOrCreate(['user_id' => $user->user_id]);
            // $this->createdProfessors[] = $user->user_id;
    
            $classroomId = rand(10000, 99999);
            DB::table('classroom')->insert([
                'classroom_id' => $classroomId,
                'user_id' => $user->user_id,
                'name' => 'Biology',
                'code' => 'BIO' . uniqid(),
                'end_date' => now()->addDays(5)->toDateString(),
                'student_count' => 0,
                'class_colour' => '#CCCCFF',
                'is_archived' => false,
                'start_date' => now()->format('Y-m-d'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $class = Classroom::find($classroomId);
            $this->createdClassrooms[] = $class->classroom_id;
    
            // 2) Call GET /api/classrooms/{id}/name
            $response = $this->actingAs($user)
                             ->getJson("/api/classrooms/{$class->classroom_id}/name");
    
            // 3) Assert we got back the JSON { name: 'Biology' }
            $response->assertStatus(200)
                     ->assertJson(['name' => 'Biology']);
        }
    
        /** @test */
        public function get_name_not_found_returns_404(): void
        {
            $userId = rand(10000, 99999);
            DB::table('user')->insert([
                'user_id' => $userId,
                'email' => 'prof_' . uniqid() . '@example.com',
                'password_hash' => bcrypt('password123'),
                'role' => 'Professor',
                'username' => 'prof_' . uniqid(),
                'comp_tutorial_pages' => '[]',
                'created_at' => now(),
                'last_updated_at' => now(),
            ]);
            $user = User::find($userId);
            $this->createdUsers[] = $user->user_id;
            // Professor::firstOrCreate(['user_id' => $user->user_id]);
            // $this->createdProfessors[] = $user->user_id;
    
            $response = $this->actingAs($user)
                             ->getJson('/api/classrooms/9999/name');
    
            $response->assertStatus(404)
                     ->assertJson(['error' => 'Classroom not found']);
        }
    
        /** @test */
        public function destroy_not_found_returns_404(): void
        {
            $userId = rand(10000, 99999);
            DB::table('user')->insert([
                'user_id' => $userId,
                'email' => 'prof_' . uniqid() . '@example.com',
                'password_hash' => bcrypt('password123'),
                'role' => 'Professor',
                'username' => 'prof_' . uniqid(),
                'comp_tutorial_pages' => '[]',
                'created_at' => now(),
                'last_updated_at' => now(),
            ]);
            $user = User::find($userId);
            $this->createdUsers[] = $user->user_id;
            // Professor::firstOrCreate(['user_id' => $user->user_id]);
            // $this->createdProfessors[] = $user->user_id;
    
            $response = $this->actingAs($user)
                             ->deleteJson('/api/classrooms/9999');
    
            $response->assertStatus(404)
                     ->assertJson(['error' => 'Classroom not found']);
        }

/** @test */
    public function store_handles_general_exception_returns_500(): void
{
    $userId = rand(10000, 99999);
    DB::table('user')->insert([
        'user_id' => $userId,
        'email' => 'prof_' . uniqid() . '@example.com',
        'password_hash' => bcrypt('password123'),
        'role' => 'Professor',
        'username' => 'prof_' . uniqid(),
        'comp_tutorial_pages' => '[]',
        'created_at' => now(),
        'last_updated_at' => now(),
    ]);
    $user = User::find($userId);
    $this->createdUsers[] = $user->user_id;
    // Professor::firstOrCreate(['user_id' => $user->user_id]);

    $token = $this->postJson('/api/auth/login', [
        'email'    => $user->email,
        'password' => 'password123',
    ])->json('token');

    // Force an exception when creating a Classroom model
    Classroom::creating(function ($model) {
        throw new \Exception('boom');
    });

    $payload = [
        'name'          => 'topgraphy 101',
        'code'          => 'PS_' . uniqid(),
        'section'       => 'A',
        'start_date'    => Carbon::now()->format('Y-m-d'),
        'end_date'      => Carbon::now()->addDay()->toDateString(),
        'term'          => 'Fall 2025',
        'is_archived'   => false,
        'student_count' => 5,
        'class_colour'  => '#123456',
    ];

    $this->withHeaders(['Authorization' => 'Bearer '.$token])
         ->postJson('/api/classrooms', $payload)
         ->assertStatus(500)
         ->assertJsonFragment(['error' => 'Failed to create classroom']);

    
}

/** @test */
public function toggle_status_handles_exception_returns_500(): void
{
    $userId = rand(10000, 99999);
    DB::table('user')->insert([
        'user_id' => $userId,
        'email' => 'prof_' . uniqid() . '@example.com',
        'password_hash' => bcrypt('password123'),
        'role' => 'Professor',
        'username' => 'prof_' . uniqid(),
        'comp_tutorial_pages' => '[]',
        'created_at' => now(),
        'last_updated_at' => now(),
    ]);
    $user = User::find($userId);
    $this->createdUsers[] = $user->user_id;

    $classroomId = rand(10000, 99999);
    DB::table('classroom')->insert([
        'classroom_id' => $classroomId,
        'user_id' => $user->user_id,
        'name' => 'Classroom_' . uniqid(),
        'code' => 'CODE_' . uniqid(),
        'start_date' => now()->format('Y-m-d'),
        'end_date' => now()->addDays(10)->toDateString(),
        'student_count' => 0,
        'class_colour' => '#CCCCFF',
        'is_archived' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $class = Classroom::find($classroomId);
    $this->createdClassrooms[] = $class->classroom_id;

    $this->actingAs($user);

    // Eloquent save() uses DB::update under the hood
    Classroom::updating(function ($model) {
        throw new \Exception('boom');
    });

    $this->patchJson("/api/classrooms/{$class->classroom_id}/status")
         ->assertStatus(500)
         ->assertJson(['error' => 'Failed to update classroom status']);
}

/** @test */
public function get_name_handles_exception_returns_500(): void
{
    $userId = rand(10000, 99999);
    DB::table('user')->insert([
        'user_id' => $userId,
        'email' => 'prof_' . uniqid() . '@example.com',
        'password_hash' => bcrypt('password123'),
        'role' => 'Professor',
        'username' => 'prof_' . uniqid(),
        'comp_tutorial_pages' => '[]',
        'created_at' => now(),
        'last_updated_at' => now(),
    ]);
    $user = User::find($userId);
    $this->createdUsers[] = $user->user_id;

    $this->actingAs($user);
    $classroomId = rand(10000, 99999);
    DB::table('classroom')->insert([
        'classroom_id' => $classroomId,
        'user_id' => $user->user_id,
        'name' => 'Classroom_' . uniqid(),
        'code' => 'CODE_' . uniqid(),
        'start_date' => now()->format('Y-m-d'),
        'end_date' => now()->addDays(5)->toDateString(),
        'student_count' => 0,
        'class_colour' => '#CCCCFF',
        'is_archived' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $class = Classroom::find($classroomId);
    $this->createdClassrooms[] = $class->classroom_id;

    Classroom::retrieved(function ($model) {
        throw new \Exception('boom');
    });

    $this->getJson('/api/classrooms/{$class->classroom_id}/name')
         ->assertStatus(500)
         ->assertJson(['error' => 'Failed to fetch classroom name']);
}

/** @test */
public function show_handles_exception_returns_500(): void
{
    // 1) Admin + Professor row
    $adminId = rand(10000, 99999);
    DB::table('user')->insert([
        'user_id' => $adminId,
        'email' => 'admin_' . uniqid() . '@example.com',
        'password_hash' => bcrypt('password123'),
        'role' => 'Admin',
        'username' => 'admin_' . uniqid(),
        'comp_tutorial_pages' => '[]',
        'created_at' => now(),
        'last_updated_at' => now(),
    ]);
    $admin = User::find($adminId);
    $this->createdUsers[] = $admin->user_id;
    // $this->createdProfessors[] = $admin->user_id;

    // 2) Create a classroom tied to that professor
    $classroomId = rand(10000, 99999);
    DB::table('classroom')->insert([
        'classroom_id' => $classroomId,
        'user_id' => $admin->user_id,
        'name' => 'Classroom_' . uniqid(),
        'code' => 'CODE_' . uniqid(),
        'start_date' => now()->format('Y-m-d'),
        'end_date' => now()->addDays(5)->toDateString(),
        'student_count' => 0,
        'class_colour' => '#CCCCFF',
        'is_archived' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $class = Classroom::find($classroomId);
    $this->createdClassrooms[] = $class->classroom_id;

    // 3) Authenticate
    $this->actingAs($admin);

    // 4) Stub the *hydration* event so findOrFail() explodes
    Classroom::retrieved(function ($model) {
        throw new \Exception('boom');
    });

    // 5) Hit the real ID (double quotes for interpolation!)
    $this->getJson("/api/classrooms/{$class->classroom_id}")
         ->assertStatus(500)
         ->assertJson([
             'error'   => 'Failed to fetch classroom',
             'message' => 'boom',
         ]);
}

/** @test */
public function destroy_handles_exception_returns_500(): void
{
    // 1) Create an Admin user and its Professor row
    $adminId = rand(10000, 99999);
    DB::table('user')->insert([
        'user_id' => $adminId,
        'email' => 'admin_' . uniqid() . '@example.com',
        'password_hash' => bcrypt('password123'),
        'role' => 'Admin',
        'username' => 'admin_' . uniqid(),
        'comp_tutorial_pages' => '[]',
        'created_at' => now(),
        'last_updated_at' => now(),
    ]);
    $admin = User::find($adminId);
    $this->createdUsers[] = $admin->user_id;
    // $this->createdProfessors[] = $admin->user_id;

    // 2) Authenticate as Admin
    $this->actingAs($admin);

    // 3) Create a classroom owned by that same professor
    $classroomId = rand(10000, 99999);
    DB::table('classroom')->insert([
        'classroom_id' => $classroomId,
        'user_id' => $admin->user_id,
        'name' => 'Classroom_' . uniqid(),
        'code' => 'CODE_' . uniqid(),
        'start_date' => now()->format('Y-m-d'),
        'end_date' => now()->addDays(7)->toDateString(),
        'student_count' => 0,
        'class_colour' => '#CCCCFF',
        'is_archived' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $class = Classroom::find($classroomId);
    $this->createdClassrooms[] = $class->classroom_id;

    // 4) Stub the hydrate event so the controller’s delete blows up
    Classroom::retrieved(function ($model) {
        throw new \Exception('boom');
    });

    // 5) Hit the real endpoint
    $this->deleteJson("/api/classrooms/{$class->classroom_id}")
         ->assertStatus(500)
         ->assertJson([
             'error' => 'Failed to delete classroom'
         ]);
}

/** @test */
public function update_handles_exception_returns_500(): void
{
    $userId = rand(10000, 99999);
    DB::table('user')->insert([
        'user_id' => $userId,
        'email' => 'prof_' . uniqid() . '@example.com',
        'password_hash' => bcrypt('password123'),
        'role' => 'Professor',
        'username' => 'prof_' . uniqid(),
        'comp_tutorial_pages' => '[]',
        'created_at' => now(),
        'last_updated_at' => now(),
    ]);
    $user = User::find($userId);
    $this->createdUsers[] = $user->user_id;

    $classroomId = rand(10000, 99999);
    DB::table('classroom')->insert([
        'classroom_id' => $classroomId,
        'user_id' => $user->user_id,
        'name' => 'Classroom_' . uniqid(),
        'code' => 'CODE_' . uniqid(),
        'start_date' => now()->format('Y-m-d'),
        'end_date' => now()->addDays(8)->toDateString(),
        'student_count' => 0,
        'class_colour' => '#CCCCFF',
        'is_archived' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $class = Classroom::find($classroomId);
    $this->createdClassrooms[] = $class->classroom_id;

    $this->actingAs($user);

    Classroom::updating(function ($model) {
        throw new \Exception('boom');
    });

    $this->patchJson("/api/classrooms/{$class->classroom_id}", ['name'=>'X'])
         ->assertStatus(500)
         ->assertJson(['error' => 'Failed to update classroom']);
}
protected function tearDown(): void
    {
        if (!empty($this->createdClassrooms)) {
            Classroom::whereIn('classroom_id', $this->createdClassrooms)->delete();
        }


        if (!empty($this->createdUsers)) {
            User::whereIn('user_id', $this->createdUsers)->delete();
        }

        parent::tearDown();
    }


    
}