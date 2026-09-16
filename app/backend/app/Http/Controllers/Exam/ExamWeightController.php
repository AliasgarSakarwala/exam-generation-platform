<?php

namespace App\Http\Controllers\Exam;

use App\Http\Controllers\Controller;
use App\Models\ExamWeight;
use Illuminate\Http\Request;

class ExamWeightController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $examWeights = ExamWeight::with(['classroom', 'exam'])->get();
        return response()->json($examWeights);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'classroom_id' => 'required|exists:classroom,id',
            'exam_id' => 'required|exists:exam,id',
            'weight' => 'required|integer|min:1'
        ]);

        // Check if this combination already exists
        $exists = ExamWeight::where('classroom_id', $validated['classroom_id'])
                           ->where('exam_id', $validated['exam_id'])
                           ->exists();
        
        if ($exists) {
            return response()->json(['message' => 'This exam weight already exists for this classroom'], 409);
        }

        $examWeight = ExamWeight::create($validated);
        return response()->json($examWeight, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ExamWeight $examWeight)
    {
        return response()->json($examWeight->load(['classroom', 'exam']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ExamWeight $examWeight)
    {
        $validated = $request->validate([
            'weight' => 'required|integer|min:1'
        ]);

        $examWeight->update($validated);
        return response()->json($examWeight);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ExamWeight $examWeight)
    {
        $examWeight->delete();
        return response()->json(null, 204);
    }
}