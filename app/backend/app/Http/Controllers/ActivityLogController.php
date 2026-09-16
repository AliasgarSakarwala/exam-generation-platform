<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActivityLog;
use Carbon\Carbon;

class ActivityLogController extends Controller
{
    /**
     * Get activity logs with optional filters.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with(['user', 'classroom', 'exam']);

        // Apply filters
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('classroom_id')) {
            $query->where('classroom_id', $request->classroom_id);
        }

        if ($request->has('exam_id')) {
            $query->where('exam_id', $request->exam_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('entity')) {
            $query->where('entity', $request->entity);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('user_role')) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('role', $request->user_role);
            });
        }

        // Get results with pagination
        $perPage = $request->get('per_page', 50);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get activity statistics for dashboard.
     */
    public function getStats(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subDays(7));
        $dateTo = $request->get('date_to', Carbon::now());

        $stats = [
            'weekly_active_users' => ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])
                ->distinct('user_id')
                ->with('user')
                ->get()
                ->map(function($log) {
                    return [
                        'user_id' => $log->user_id,
                        'name' => $log->user->username ?? 'Unknown User'
                    ];
                }),
            
            'top_users' => ActivityLog::selectRaw('user_id, COUNT(*) as activity_count')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->groupBy('user_id')
                ->orderBy('activity_count', 'desc')
                ->limit(15)
                ->with('user')
                ->get()
                ->map(function($log) {
                    return [
                        'user_id' => $log->user_id,
                        'name' => $log->user->username ?? 'Unknown User',
                        'activity_count' => $log->activity_count
                    ];
                }),
            
            'top_courses' => ActivityLog::selectRaw('classroom_id, COUNT(*) as activity_count')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->whereNotNull('classroom_id')
                ->whereHas('classroom') // Only include activities where classroom still exists
                ->groupBy('classroom_id')
                ->orderBy('activity_count', 'desc')
                ->limit(15)
                ->with('classroom')
                ->get()
                ->filter(function($log) {
                    return $log->classroom !== null; // Extra safety filter
                })
                ->map(function($log) {
                    return [
                        'classroom_id' => $log->classroom_id,
                        'name' => $log->classroom->name,
                        'activity_count' => $log->activity_count
                    ];
                })
                ->values() // Re-index array after filtering
        ];

        return response()->json($stats);
    }

    /**
     * Get KPI statistics for dashboard.
     */
    public function getKPIStats()
    {
        $totalProfessors = \App\Models\User::where('role', 'Professor')->count();
        $totalTAs = \App\Models\User::where('role', 'TA')->count();
        $totalCourses = \App\Models\Classroom::count();
        $totalStudents = \App\Models\Student::count();
        $totalExams = \App\Models\Exam::count();
        $totalQuestions = \App\Models\Question::count();

        $kpiStats = [
            [
                'title' => 'Total Professors',
                'value' => $totalProfessors,
                'icon' => '/users.svg',
                'accentColor' => 'bg-orange-100',
                'textColor' => 'text-orange-600',
                'subtitle' => 'View all users',
            ],
            [
                'title' => 'Total TAs',
                'value' => $totalTAs,
                'icon' => '/users.svg',
                'accentColor' => 'bg-cyan-100',
                'textColor' => 'text-cyan-600',
                'subtitle' => 'View all users',
            ],
            [
                'title' => 'Total Courses',
                'value' => $totalCourses,
                'icon' => '/cap.svg',
                'accentColor' => 'bg-purple-100',
                'textColor' => 'text-purple-600',
                'subtitle' => 'View all courses',
            ],
            [
                'title' => 'Total Students',
                'value' => $totalStudents,
                'icon' => '/students.svg',
                'accentColor' => 'bg-green-100',
                'textColor' => 'text-green-600',
                'subtitle' => 'View all students',
            ],
            [
                'title' => 'Total Exams',
                'value' => $totalExams,
                'icon' => '/exam.svg',
                'accentColor' => 'bg-yellow-100',
                'textColor' => 'text-yellow-600',
                'subtitle' => 'View all exams',
            ],
            [
                'title' => 'Total Questions',
                'value' => $totalQuestions,
                'icon' => '/questions.svg',
                'accentColor' => 'bg-blue-100',
                'textColor' => 'text-blue-600',
                'subtitle' => 'View all questions',
            ],
        ];

        return response()->json($kpiStats);
    }

    /**
     * Get graph data for analytics charts.
     */
    public function getGraphData(Request $request)
    {
        $type = $request->get('type', 'logins'); // logins, exams, questions
        $granularity = $request->get('granularity', 'day'); // day, week, month, year
        $dateFrom = $request->get('date_from', Carbon::now()->subDays(30));
        $dateTo = $request->get('date_to', Carbon::now());

        // Ensure dates are Carbon instances and set to start/end of day
        if (!$dateFrom instanceof Carbon) {
            $dateFrom = Carbon::parse($dateFrom)->startOfDay();
        }
        if (!$dateTo instanceof Carbon) {
            $dateTo = Carbon::parse($dateTo)->endOfDay();
        }

        // PostgreSQL date format strings
        $dateFormat = match($granularity) {
            'day' => 'YYYY-MM-DD',
            'week' => 'IYYY-IW', // ISO Year-Week
            'month' => 'YYYY-MM',
            default => 'YYYY-MM-DD'
        };

        // Note: Activity logs are stored in Vancouver timezone, no conversion needed
        
        switch($type) {
            case 'logins':
                // Count login actions - data is already stored in Vancouver timezone
                $data = ActivityLog::selectRaw("TO_CHAR(created_at, '{$dateFormat}') as period, COUNT(*) as count")
                    ->where('action', 'Login')
                    ->whereRaw("created_at BETWEEN ? AND ?", [$dateFrom, $dateTo])
                    ->groupBy('period')
                    ->orderBy('period', 'asc')
                    ->get();
                break;
                
            case 'exams':
                // Count actual exam creation - data is already stored in Vancouver timezone
                $data = ActivityLog::selectRaw("TO_CHAR(created_at, '{$dateFormat}') as period, COUNT(*) as count")
                    ->where('action', 'Create')
                    ->where('entity', 'Exam')
                    ->whereRaw("created_at BETWEEN ? AND ?", [$dateFrom, $dateTo])
                    ->groupBy('period')
                    ->orderBy('period', 'asc')
                    ->get();
                break;
                
            case 'questions':
                // Count question creation activities - data is already stored in Vancouver timezone
                $data = ActivityLog::selectRaw("TO_CHAR(created_at, '{$dateFormat}') as period, SUM(CAST(payload->>'count' AS INTEGER)) as count")
                    ->where('action', 'Create')
                    ->where('entity', 'ExamVariantQuestion')
                    ->where('description', 'CREATE-EXAM-VARIANT QUESTIONS')
                    ->whereRaw("created_at BETWEEN ? AND ?", [$dateFrom, $dateTo])
                    ->groupBy('period')
                    ->orderBy('period', 'asc')
                    ->get();
                break;
                
            default:
                $data = collect([]);
        }

        // Format the data for frontend consumption
        $formattedData = $data->map(function($item) use ($granularity) {
            $period = $item->period;
            
            // Convert period to proper date format for frontend
            if ($granularity === 'day') {
                $formattedPeriod = $period;
            } elseif ($granularity === 'week') {
                // Convert PostgreSQL IYYY-IW format (2025-31) to date
                list($year, $week) = explode('-', $period);
                $jan4 = Carbon::create($year, 1, 4);
                $startOfWeek1 = $jan4->startOfWeek();
                $targetWeek = $startOfWeek1->addWeeks($week - 1);
                $formattedPeriod = $targetWeek->format('Y-m-d');
            } elseif ($granularity === 'month') {
                $formattedPeriod = Carbon::createFromFormat('Y-m', $period)->startOfMonth()->format('Y-m-d');
            } else {
                $formattedPeriod = $period;
            }
            
            return [
                'period' => $formattedPeriod,
                'count' => (int) $item->count
            ];
        });

        return response()->json([
            'type' => $type,
            'granularity' => $granularity,
            'data' => $formattedData
        ]);
    }


    /**
     * Get activity descriptions for a specific classroom.
     */
    public function getClassroomActivities(Request $request, $classroomId)
    {
        $activities = ActivityLog::where('classroom_id', $classroomId)
            ->with(['user', 'classroom'])
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function($log) {
                return [
                    'id' => $log->id,
                    'user' => $log->user->username ?? 'Unknown User',
                    'action' => $log->action,
                    'entity' => $log->entity,
                    'description' => $log->description,
                    'created_at' => $log->created_at,
                    'route' => $log->route,
                    'method' => $log->method,
                    'status_code' => $log->status_code
                ];
            });

        return response()->json($activities);
    }

    /**
     * Get activity descriptions for a specific user.
     */
    public function getUserActivities(Request $request, $userId)
    {
        $activities = ActivityLog::where('user_id', $userId)
            ->with(['user', 'classroom'])
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function($log) {
                return [
                    'id' => $log->id,
                    'classroom' => $log->classroom->name ?? 'N/A',
                    'action' => $log->action,
                    'entity' => $log->entity,
                    'description' => $log->description,
                    'created_at' => $log->created_at,
                    'route' => $log->route,
                    'method' => $log->method,
                    'status_code' => $log->status_code
                ];
            });

        return response()->json($activities);
    }

    /**
     * Persist a new activity log.
     */
    public function store(Request $request)
    {
        // 1. Validate incoming payload
        $data = $request->validate([
            'classroom_id' => 'nullable|integer',
            'exam_id'      => 'nullable|integer',
            'route'        => 'required|string',
            'method'       => 'required|string',
            'status_code'  => 'required|integer',
            'payload'      => 'nullable|array',
            'action'       => 'nullable|string',
            'entity'       => 'nullable|string',
            'description'  => 'nullable|string',
        ]);

        // 2. Build full log data
        $log = ActivityLog::create([
            'user_id'      => $request->user()->user_id,
            'classroom_id' => $data['classroom_id'] ?? null,
            'exam_id'      => $data['exam_id'] ?? null,
            'route'        => $data['route'],
            'method'       => $data['method'],
            'status_code'  => $data['status_code'],
            'payload'      => $data['payload'] ?? [],
            'action'       => $data['action'] ?? null,
            'entity'       => $data['entity'] ?? null,
            'description'  => $data['description'] ?? null,
            'created_at'   => Carbon::now('America/Vancouver'),
        ]);

        // 3. Return the created record
        return response()->json([
            'message' => 'Activity logged',
            'data'    => $log,
        ], 201);
    }
}
