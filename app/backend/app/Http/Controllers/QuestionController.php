<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\QuestionBank;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @OA\Tag(
 *     name="Questions",
 *     description="Individual question management endpoints"
 * )
 */
class QuestionController extends Controller
{

    /**
     * Update a specific question
     * 
     * @OA\Patch(
     *     path="/questions/{id}",
     *     operationId="updateQuestion",
     *     tags={"Questions"},
     *     summary="Update a question",
     *     description="Update question text, difficulty, tags, and options. Only the question owner or admin can update.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Question ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="Question", type="string", example="What is the capital of France?"),
     *             @OA\Property(property="Difficulty", type="string", enum={"Easy", "Medium", "Hard"}, example="Medium"),
     *             @OA\Property(property="Answer", type="string", example="Paris"),
     *             @OA\Property(property="Option 1", type="string", example="London"),
     *             @OA\Property(property="Option 2", type="string", example="Paris"),
     *             @OA\Property(property="Option 3", type="string", example="Berlin"),
     *             @OA\Property(property="Option 4", type="string", example="Madrid"),
     *             @OA\Property(property="Option 5", type="string", example=""),
     *             @OA\Property(property="Option 6", type="string", example=""),
     *             @OA\Property(property="tags", type="array", @OA\Items(type="string"), example={"Geography", "Europe"})
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Question updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Question updated successfully"),
     *             @OA\Property(property="question", type="object",
     *                 @OA\Property(property="question_id", type="integer", example=1),
     *                 @OA\Property(property="question_text", type="string", example="What is the capital of France?"),
     *                 @OA\Property(property="difficulty_level", type="integer", example=2),
     *                 @OA\Property(property="tags", type="array", @OA\Items(type="string"), example={"Geography", "Europe"})
     *             )
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
     *         description="Question not found"
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
    public function update(Request $request, $id)
    {
        $question = Question::with('questionBank', 'options')->findOrFail($id);

        // only the owning user may update
        $user = auth()->user();
        if ($user->role !== 'Admin' && $question->questionBank->user_id !== $user->user_id) {
            return response()->json(['error'=>'Unauthorized'], 403);
        }

        $data = $request->all();

        // map Difficulty string to your stored integer code
        $levelMap = ['Easy'=>1, 'Medium'=>2, 'Hard'=>3];

        DB::beginTransaction();
        try {
            // 1) Update question_text if provided
            if (array_key_exists('Question', $data)) {
                $question->question_text = $data['Question'];
            }

            // 2) Update difficulty_level if provided
            if (array_key_exists('Difficulty', $data) &&
                isset($levelMap[$data['Difficulty']])) {
                $question->difficulty_level = $levelMap[$data['Difficulty']];
            }

            // 3) Handle tags if provided - store as simple array of strings
            if (array_key_exists('tags', $data)) {
                // Ensure we have an array of strings and limit to 5 tags
                $tags = array_map('trim', $data['tags']);
                $tags = array_slice(array_unique($tags), 0, 5);
                $question->tags = $tags;
            }

            $question->save();

            // 4) Handle options: look for keys "Option 1"–"Option 6"
            //    and update or create each corresponding option.
            $answerText = $data['Answer'] ?? null;

            for ($i = 1; $i <= 6; $i++) {
                $optKey = "Option $i";
                if (! array_key_exists($optKey, $data)) {
                    continue; // nothing to change for this letter
                }

                $letter = chr(64 + $i); // A, B, C, D, E, F
                $text   = trim($data[$optKey]);

                // find existing or new
                $opt = $question->options()
                                ->firstOrNew(['option_letter'=>$letter]);

                $opt->option_text = $text;
                // mark correct if it matches the sent Answer text
                $opt->is_correct  = ($answerText !== null && $text === $answerText);
                $opt->save();
            }

            DB::commit();
            // Return the updated question with tags array
            return response()->json([
                'message' => 'Question updated successfully',
                'question' => [
                    'question_id' => $question->question_id,
                    'question_text' => $question->question_text,
                    'difficulty_level' => $question->difficulty_level,
                    'tags' => $question->tags ?? []
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'=>'Update failed',
                'details'=>$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a specific question
     * 
     * @OA\Delete(
     *     path="/questions/{id}",
     *     operationId="deleteQuestion",
     *     tags={"Questions"},
     *     summary="Delete a question",
     *     description="Permanently delete a question. Only the question owner or admin can delete.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Question ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Question deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="deleted", type="boolean", example=true),
     *             @OA\Property(property="remaining_questions", type="integer", example=24)
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
     *         description="Question not found"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to delete question")
     *         )
     *     )
     * )
     */
    public function destroy($id)
    {
        // 1) Load the question plus its bank (for auth & count)
        $question = Question::with('questionBank')->findOrFail($id);

        // 2) Authorization: only the owning user may delete
        $user = auth()->user();
        if ($user->role !== 'Admin' && $question->questionBank->user_id !== $user->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $bankId = $question->question_bank_id;

        // 4) Delete the question itself
        $deleted = (bool) $question->delete();

        // 5) Count remaining in that bank
        $remaining = Question::where('question_bank_id', $bankId)->count();

        // 6) Return result
        return response()->json([
            'deleted'             => $deleted,
            'remaining_questions' => $remaining,
        ]);
    }

    /**
     * Search questions by text
     * 
     * @OA\Get(
     *     path="/questions/search",
     *     operationId="searchQuestions",
     *     tags={"Questions"},
     *     summary="Search questions by text",
     *     description="Search for questions containing specific text with optional column selection",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="question_text",
     *         in="query",
     *         description="Text to search for in question content",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="columns",
     *         in="query",
     *         description="Specific columns to return (comma-separated)",
     *         required=false,
     *         @OA\Schema(type="string", example="question_id,question_text,difficulty_level")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Matching questions",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="question_id", type="integer", example=1),
     *                 @OA\Property(property="question_text", type="string", example="What is the capital of France?"),
     *                 @OA\Property(property="difficulty_level", type="integer", example=2),
     *                 @OA\Property(property="question_bank_id", type="integer", example=1),
     *                 @OA\Property(property="tags", type="array", @OA\Items(type="string"), example={"Geography", "Europe"}),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="The given data was invalid."),
     *             @OA\Property(property="errors", type="object",
     *                 @OA\Property(property="question_text", type="array", @OA\Items(type="string"))
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
     *             @OA\Property(property="error", type="string", example="Search failed")
     *         )
     *     )
     * )
     */
    public function searchByText(Request $request)
    {
        $request->validate([
            'question_text' => 'required|string',
            'columns' => 'sometimes|array'
        ]);

        $query = Question::query();

        // Search by question text (partial match)
        if ($request->has('question_text')) {
            $query->where('question_text', 'like', '%' . $request->input('question_text') . '%');
        }

        // Select specific columns if provided
        if ($request->has('columns')) {
            $query->select($request->input('columns'));
        }

        $questions = $query->get();

        return response()->json($questions);
    }

    /**
     * Get a specific question with options
     * 
     * @OA\Get(
     *     path="/questions/{id}",
     *     operationId="getQuestion",
     *     tags={"Questions"},
     *     summary="Get question details",
     *     description="Retrieve detailed information about a specific question including all options",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Question ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Question details",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="question_id", type="integer", example=1),
     *             @OA\Property(property="question_text", type="string", example="What is the capital of France?"),
     *             @OA\Property(property="difficulty_level", type="integer", example=2),
     *             @OA\Property(property="question_bank_id", type="integer", example=1),
     *             @OA\Property(property="options", type="array", @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="letter", type="string", example="A"),
     *                 @OA\Property(property="text", type="string", example="London"),
     *                 @OA\Property(property="is_correct", type="boolean", example=false)
     *             )),
     *             @OA\Property(property="tags", type="array", @OA\Items(type="string"), example={"Geography", "Europe"}),
     *             @OA\Property(property="created_at", type="string", format="date-time"),
     *             @OA\Property(property="updated_at", type="string", format="date-time")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Question not found"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Failed to fetch question")
     *         )
     *     )
     * )
     */
    public function show($id)
    {
        $question = Question::with(['options', 'questionBank'])->findOrFail($id);

        // Format the response with all necessary data including tags array
        return response()->json([
            'question_id' => $question->question_id,
            'question_text' => $question->question_text,
            'difficulty_level' => $question->difficulty_level,
            'question_bank_id' => $question->question_bank_id,
            'options' => $question->options->map(function ($option) {
                return [
                    'letter' => $option->option_letter,
                    'text' => $option->option_text,
                    'is_correct' => $option->is_correct
                ];
            }),
            'tags' => $question->tags ?? [], // Return the tags array directly
            'created_at' => $question->created_at,
            'updated_at' => $question->updated_at
        ]);
    }
}
