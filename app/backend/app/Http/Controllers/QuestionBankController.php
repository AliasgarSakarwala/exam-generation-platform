<?php

namespace App\Http\Controllers;

use App\Models\QuestionBank;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Tag(
 *     name="Question Banks",
 *     description="Question bank management endpoints"
 * )
 */
class QuestionBankController extends Controller
{
    /**
     * Get all question banks for a classroom
     * 
     * @OA\Get(
     *     path="/classrooms/{classroomId}/question-banks",
     *     operationId="getQuestionBanks",
     *     tags={"Question Banks"},
     *     summary="Get question banks for classroom",
     *     description="Retrieve all question banks for a specific classroom",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of question banks",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="question_bank_id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Midterm Questions"),
     *                 @OA\Property(property="description", type="string", example="Questions for midterm exam"),
     *                 @OA\Property(property="user_id", type="integer", example=1),
     *                 @OA\Property(property="classroom_id", type="integer", example=1),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time"),
     *                 @OA\Property(property="questions_count", type="integer", example=25),
     *                 @OA\Property(property="questions", type="array", @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="question_id", type="integer", example=1),
     *                     @OA\Property(property="question_bank_id", type="integer", example=1),
     *                     @OA\Property(property="question_text", type="string", example="What is the capital of France?"),
     *                     @OA\Property(property="question_type", type="string", example="MultipleChoice"),
     *                     @OA\Property(property="difficulty_level", type="integer", example=2)
     *                 ))
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Something went wrong")
     *         )
     *     )
     * )
     */
    public function index($classroomId)
    {
        $user = auth()->user();

        // start with classroom scope
        $query = QuestionBank::where('classroom_id', $classroomId);

        // if you're *not* an Admin, filter to only your own banks
        if ($user->role !== 'Admin') {
            $query->where('user_id', $user->user_id);
        }

        $banks = $query
            ->withCount('questions')
            ->with([
                'questions' => function ($q) {
                    $q->orderBy('question_id')
                        ->limit(3)
                        ->select('question_id', 'question_bank_id', 'question_text', 'question_type', 'difficulty_level');
                }
            ])
            ->get();

        return response()->json($banks);
    }

    /**
     * Get a specific question bank with all questions and options
     * 
     * @OA\Get(
     *     path="/classrooms/{classroomId}/question-banks/{id}",
     *     operationId="getQuestionBank",
     *     tags={"Question Banks"},
     *     summary="Get question bank details",
     *     description="Retrieve detailed information about a specific question bank including all questions and options",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Question Bank ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Question bank details",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="question_bank_id", type="integer", example=1),
     *             @OA\Property(property="name", type="string", example="Midterm Questions"),
     *             @OA\Property(property="description", type="string", example="Questions for midterm exam"),
     *             @OA\Property(property="user_id", type="integer", example=1),
     *             @OA\Property(property="classroom_id", type="integer", example=1),
     *             @OA\Property(property="created_at", type="string", format="date-time"),
     *             @OA\Property(property="updated_at", type="string", format="date-time"),
     *             @OA\Property(property="questions", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="question_id", type="integer", example=1),
     *                 @OA\Property(property="question_bank_id", type="integer", example=1),
     *                 @OA\Property(property="question_text", type="string", example="What is the capital of France?"),
     *                 @OA\Property(property="question_type", type="string", example="MultipleChoice"),
     *                 @OA\Property(property="difficulty_level", type="integer", example=2),
     *                 @OA\Property(property="tags", type="array", @OA\Items(type="string"), example={"Geography", "Europe"}),
     *                 @OA\Property(property="options", type="array", @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="option_id", type="integer", example=1),
     *                     @OA\Property(property="question_id", type="integer", example=1),
     *                     @OA\Property(property="option_letter", type="string", example="A"),
     *                     @OA\Property(property="option_text", type="string", example="London"),
     *                     @OA\Property(property="is_correct", type="boolean", example=false)
     *                 ))
     *             ))
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Question bank not found"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Something went wrong")
     *         )
     *     )
     * )
     */
    public function show($classroomId, $id)
    {
        $bank = QuestionBank::with('questions.options')
            ->where('classroom_id', $classroomId)
            ->findOrFail($id);

        $user = auth()->user();
        if ($user->role !== 'Admin' && $bank->user_id !== $user->user_id) {
            return response()->json(['error'=>'Unauthorized'], 403);
        }

        return response()->json($bank);
    }

    /**
     * Create question banks with questions and options
     * 
     * @OA\Post(
     *     path="/classrooms/{classroomId}/question-banks",
     *     operationId="createQuestionBank",
     *     tags={"Question Banks"},
     *     summary="Create question banks",
     *     description="Create question banks with questions and options from uploaded data",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="Midterm Questions", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="Question", type="string", example="What is the capital of France?"),
     *                 @OA\Property(property="Difficulty", type="string", enum={"Easy", "Medium", "Hard"}, example="Medium"),
     *                 @OA\Property(property="Answer", type="string", example="Paris"),
     *                 @OA\Property(property="Option 1", type="string", example="London"),
     *                 @OA\Property(property="Option 2", type="string", example="Paris"),
     *                 @OA\Property(property="Option 3", type="string", example="Berlin"),
     *                 @OA\Property(property="Option 4", type="string", example="Madrid"),
     *                 @OA\Property(property="Option 5", type="string", example=""),
     *                 @OA\Property(property="Option 6", type="string", example=""),
     *                 @OA\Property(property="Tag 1", type="string", example="Geography"),
     *                 @OA\Property(property="Tag 2", type="string", example="Europe"),
     *                 @OA\Property(property="Tag 3", type="string", example=""),
     *                 @OA\Property(property="Tag 4", type="string", example=""),
     *                 @OA\Property(property="Tag 5", type="string", example="")
     *             ))
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Question banks created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Question bank(s) created successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Creation failed"),
     *             @OA\Property(property="details", type="string", example="Database error details")
     *         )
     *     )
     * )
     */
    public function store(Request $request, $classroomId)
    {
        $data = $request->all();
        DB::beginTransaction();

        try {
            // difficulty → integer
            $levelMap = ['Easy' => 1, 'Medium' => 2, 'Hard' => 3];

            foreach ($data as $bankName => $questions) {
                // create bank with classroom_id
                $questionBank = QuestionBank::create([
                    'name'          => $bankName,
                    'description'   => 'Imported via upload',
                    'user_id'       => auth()->id(),
                    'classroom_id'  => $classroomId,
                ]);

                foreach ($questions as $q) {
                    // Process tags (0-5 tags)
                    $tags = [];
                    for ($i = 1; $i <= 5; $i++) {
                        $tagKey = "Tag {$i}";
                        if (!empty($q[$tagKey])) {
                            $tags[] = $q[$tagKey];
                        }
                    }

                    // question
                    $question = Question::create([
                        'question_bank_id' => $questionBank->question_bank_id,
                        'question_text'    => $q['Question'],
                        'question_type'    => 'MultipleChoice',
                        'difficulty_level' => $levelMap[$q['Difficulty']],
                        'tags'             => $tags, // Store tags as array
                    ]);

                    // options
                    for ($i = 1; $i <= 6; $i++) {
                        $optKey     = "Option {$i}";
                        $optionText = trim($q[$optKey] ?? '');

                        if ($optionText === '' || $optionText === '\" \"') {
                            continue;
                        }

                        QuestionOption::create([
                            'question_id'   => $question->question_id,
                            'option_letter' => chr(64 + $i),
                            'option_text'   => $optionText,
                            'is_correct'    => ($optionText === trim($q['Answer'])),
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json(['message' => 'Question bank(s) created successfully'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Creation failed',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a question bank and its questions
     * 
     * @OA\Patch(
     *     path="/classrooms/{classroomId}/question-banks/{id}",
     *     operationId="updateQuestionBank",
     *     tags={"Question Banks"},
     *     summary="Update question bank",
     *     description="Update question bank metadata and optionally update questions and options",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Question Bank ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="name", type="string", example="Updated Midterm Questions"),
     *             @OA\Property(property="description", type="string", example="Updated description"),
     *             @OA\Property(property="questions", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="Question", type="string", example="What is the capital of France?"),
     *                 @OA\Property(property="Difficulty", type="string", enum={"Easy", "Medium", "Hard"}, example="Medium"),
     *                 @OA\Property(property="Answer", type="string", example="Paris"),
     *                 @OA\Property(property="Option 1", type="string", example="London"),
     *                 @OA\Property(property="Option 2", type="string", example="Paris"),
     *                 @OA\Property(property="Option 3", type="string", example="Berlin"),
     *                 @OA\Property(property="Option 4", type="string", example="Madrid"),
     *                 @OA\Property(property="Option 5", type="string", example=""),
     *                 @OA\Property(property="Option 6", type="string", example=""),
     *                 @OA\Property(property="Tag 1", type="string", example="Geography"),
     *                 @OA\Property(property="Tag 2", type="string", example="Europe"),
     *                 @OA\Property(property="Tag 3", type="string", example=""),
     *                 @OA\Property(property="Tag 4", type="string", example=""),
     *                 @OA\Property(property="Tag 5", type="string", example="")
     *             ))
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Question bank updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Question bank updated successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Question bank not found"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Update failed"),
     *             @OA\Property(property="details", type="string", example="Database error details")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $classroomId, $id)
    {
        // 1) Load & authorize the bank
        $bank = QuestionBank::where('classroom_id', $classroomId)
            ->findOrFail($id);

        $user = auth()->user();
        if ($user->role !== 'Admin' && $bank->user_id !== $user->user_id) {
            return response()->json(['error'=>'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            // 2) Update bank metadata
            $bank->update($request->only(['name', 'description']));

            // 3) If the client sent questions, process them
            if ($request->has('questions')) {
                $levelMap = ['Easy' => 1, 'Medium' => 2, 'Hard' => 3];

                foreach ($request->input('questions') as $qData) {
                    $question = new Question([
                        'question_bank_id' => $bank->question_bank_id,
                        'question_type'    => 'MultipleChoice',
                    ]);

                    $question->question_text = $qData['Question'] ?? $question->question_text;
                    if (!empty($qData['Difficulty']) && isset($levelMap[$qData['Difficulty']])) {
                        $question->difficulty_level = $levelMap[$qData['Difficulty']];
                    }

                    // Process tags (0-5 tags)
                    $tags = [];
                    for ($i = 1; $i <= 5; $i++) {
                        $tagKey = "Tag {$i}";
                        if (!empty($qData[$tagKey])) {
                            $tags[] = $qData[$tagKey];
                        }
                    }
                    $question->tags = $tags;

                    $question->save();

                    // c) update/create options A–F
                    $answerText = trim($qData['Answer'] ?? '');
                    $keepLetters = [];
                    for ($i = 1; $i <= 6; $i++) {
                        $optKey     = "Option {$i}";
                        $text       = trim($qData[$optKey] ?? '');
                        if ($text === '') {
                            continue;
                        }
                        $letter = chr(64 + $i); // A…F
                        $keepLetters[] = $letter;

                        $opt = $question->options()
                            ->firstOrNew(['option_letter' => $letter]);

                        $opt->option_text = $text;
                        $opt->is_correct  = ($text === $answerText);
                        $opt->save();
                    }
                    // d) remove any options not in payload
                    $question->options()
                        ->whereNotIn('option_letter', $keepLetters)
                        ->delete();
                }
            }

            DB::commit();
            return response()->json(['message' => 'Question bank updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Update failed',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a question bank
     * 
     * @OA\Delete(
     *     path="/classrooms/{classroomId}/question-banks/{id}",
     *     operationId="deleteQuestionBank",
     *     tags={"Question Banks"},
     *     summary="Delete question bank",
     *     description="Permanently delete a question bank and all its questions",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="classroomId",
     *         in="path",
     *         description="Classroom ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Question Bank ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Question bank deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Question bank deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Question bank not found"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to delete question bank")
     *         )
     *     )
     * )
     */
    public function destroy($classroomId, $id)
    {
        $user = auth()->user();
        if ($user->role !== 'Admin') {
            $bank = QuestionBank::where('classroom_id', $classroomId)
                ->findOrFail($id);
        } else {
            $bank = QuestionBank::findOrFail($id);
        }
      
        if ($user->role !== 'Admin' && $bank->user_id !== $user->user_id) {
            return response()->json(['error'=>'Unauthorized'], 403);
        }

        $bank->delete();
        return response()->json(['message' => 'Question bank deleted successfully']);
    }

    /**
     * Get question count for professor
     * 
     * @OA\Get(
     *     path="/questions/count",
     *     operationId="getQuestionsCount",
     *     tags={"Question Banks"},
     *     summary="Get question count for professor",
     *     description="Retrieve the total number of questions added by the authenticated professor",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Question count retrieved",
     *         @OA\JsonContent(
     *             @OA\Property(property="questions_added", type="integer", example=150)
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to get question count")
     *         )
     *     )
     * )
     */
    public function questionsCountForProfessor()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        $professorId = $user->user_id;
        $count = \App\Models\Question::whereIn('question_bank_id', function($query) use ($professorId) {
            $query->select('question_bank_id')
                  ->from('question_bank')
                  ->where('user_id', $professorId);
        })->count();
        return response()->json(['questions_added' => $count]);
    }
}
