<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\Classroom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tags = Tag::with('classroom')->get();
        return response()->json($tags);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'classroom_id' => 'required|exists:classrooms,classroom_id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Check if tag with same name and classroom_id already exists
        $existingTag = Tag::where('name', $request->name)
                         ->where('classroom_id', $request->classroom_id)
                         ->first();

        if ($existingTag) {
            return response()->json([
                'message' => 'Tag with this name already exists in the specified classroom',
                'tag' => $existingTag
            ], 200);
        }

        $tag = Tag::create($request->all());
        return response()->json($tag, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $tag = Tag::with('classroom', 'questions')->find($id);
        
        if (!$tag) {
            return response()->json(['message' => 'Tag not found'], 404);
        }

        return response()->json($tag);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $tag = Tag::find($id);
        
        if (!$tag) {
            return response()->json(['message' => 'Tag not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'classroom_id' => 'sometimes|required|exists:classrooms,classroom_id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Check if another tag with the same name and classroom_id already exists
        if ($request->has('name') && $request->has('classroom_id')) {
            $existingTag = Tag::where('name', $request->name)
                             ->where('classroom_id', $request->classroom_id)
                             ->where('tag_id', '!=', $id)
                             ->first();

            if ($existingTag) {
                return response()->json([
                    'message' => 'Another tag with this name already exists in the specified classroom'
                ], 422);
            }
        }

        $tag->update($request->all());
        return response()->json($tag);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $tag = Tag::find($id);
        
        if (!$tag) {
            return response()->json(['message' => 'Tag not found'], 404);
        }

        $tag->delete();
        return response()->json(['message' => 'Tag deleted successfully']);
    }

    /**
     * Get tags by classroom ID
     */
    public function getByClassroom($classroomId)
    {
        $tags = Tag::where('classroom_id', $classroomId)->get();
        return response()->json($tags);
    }
}