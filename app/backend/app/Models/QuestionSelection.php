<?php

namespace App\Models;

class QuestionSelection {

    private $allQuestions;
    private $mandatoryQuestionIds;
    private $pools = [
        'E' => ['mandatory' => [], 'optional' => []],
        'M' => ['mandatory' => [], 'optional' => []],
        'H' => ['mandatory' => [], 'optional' => []]
    ];
    private $usageCount = [];

    public function __construct(array $questions, array $mandatoryQuestionIds) {
        $this->allQuestions = $questions;
        $this->mandatoryQuestionIds = $mandatoryQuestionIds;
        $this->initializePools();
    }

    private function initializePools(): void {
        foreach ($this->allQuestions as $question) {
            $difficulty = $question['difficulty'];
            $isMandatory = in_array($question['id'], $this->mandatoryQuestionIds);

            if ($isMandatory) {
                $this->pools[$difficulty]['mandatory'][] = $question;
            } else {
                $this->pools[$difficulty]['optional'][] = $question;
                $this->usageCount[$question['id']] = 0;
            }
        }
    }

    public function generateExamVariants(int $numVariants, int $questionsPerVariant, array $difficultyDistribution): array {
        // Step 1: Preprocessing - compute required question counts
        $requiredCounts = [
            'E' => ceil($difficultyDistribution['E'] * $questionsPerVariant),
            'M' => ceil($difficultyDistribution['M'] * $questionsPerVariant),
            'H' => ceil($difficultyDistribution['H'] * $questionsPerVariant)
        ];

        // Subtract mandatory questions from required counts
        $optionalNeeded = [];
        foreach (['E', 'M', 'H'] as $difficulty) {
            $mandatoryCount = count($this->pools[$difficulty]['mandatory']);
            $optionalNeeded[$difficulty] = max(0, $requiredCounts[$difficulty] - $mandatoryCount);
        }

        // Step 2: Compute reuse limits
        $reuseLimits = [];
        foreach (['E', 'M', 'H'] as $difficulty) {
            $poolSize = count($this->pools[$difficulty]['optional']);
            if ($poolSize > 0) {
                $reuseLimits[$difficulty] = ceil(($numVariants * $optionalNeeded[$difficulty]) / $poolSize);
            } else {
                $reuseLimits[$difficulty] = 0;
            }
        }

        // Step 3: Generate variants
        $variants = [];
        for ($i = 0; $i < $numVariants; $i++) {
            $variant = $this->generateVariant($optionalNeeded, $reuseLimits, $questionsPerVariant);
            $variants[] = $variant;
        }

        return $variants;
    }

    private function generateVariant(array $optionalNeeded, array $reuseLimits, int $maxQuestions): array {
        $variant = [];
        
        // First pass: Add mandatory questions respecting distribution
        foreach (['E', 'M', 'H'] as $difficulty) {
            $target = floor($optionalNeeded[$difficulty] + count($this->pools[$difficulty]['mandatory']));
            $toAdd = min(count($this->pools[$difficulty]['mandatory']), $target);
            
            for ($i = 0; $i < $toAdd && count($variant) < $maxQuestions; $i++) {
                $variant[] = $this->pools[$difficulty]['mandatory'][$i];
            }
        }
        
        // Second pass: Add optional questions to fulfill distribution
        foreach (['E', 'M', 'H'] as $difficulty) {
            $needed = $optionalNeeded[$difficulty];
            $pool = $this->pools[$difficulty]['optional'];
            $limit = $reuseLimits[$difficulty];
            
            $added = 0;
            while ($added < $needed && count($pool) > 0 && count($variant) < $maxQuestions) {
                // Find question with lowest usage count under the limit
                $selected = null;
                $lowestUsage = PHP_INT_MAX;
                
                foreach ($pool as $question) {
                    $usage = $this->usageCount[$question['id']] ?? 0;
                    if ($usage < $limit && $usage < $lowestUsage) {
                        $selected = $question;
                        $lowestUsage = $usage;
                    }
                }
                
                if ($selected === null) {
                    $selected = $pool[array_rand($pool)];
                }
                
                $variant[] = $selected;
                $this->usageCount[$selected['id']] = ($this->usageCount[$selected['id']] ?? 0) + 1;
                $added++;
            }
        }
        
        return $variant;
    }
}

// Create dummy data for 50 questions
function createDummyQuestions(): array {
    $questions = [];
    $id = 1;

    // Add 20 Easy questions
    for ($i = 0; $i < 20; $i++) {
        $questions[] = [
            'id' => $id++,
            'difficulty' => 'E',
            'text' => "Question $id (E)"
        ];
    }

    // Add 15 Medium questions
    for ($i = 0; $i < 15; $i++) {
        $questions[] = [
            'id' => $id++,
            'difficulty' => 'M',
            'text' => "Question $id (M)"
        ];
    }

    // Add 15 Hard questions
    for ($i = 0; $i < 15; $i++) {
        $questions[] = [
            'id' => $id++,
            'difficulty' => 'H',
            'text' => "Question $id (H)"
        ];
    }

    return $questions;
}


// Create dummy mandatory questions (2 random questions)
function createDummyMandatoryQuestions(array &$allQuestions, int $count = 2): array {
    $mandatory = [];
    $randomKeys = array_rand($allQuestions, $count);
    if (!is_array($randomKeys)) {
        $randomKeys = [$randomKeys];
    }

    foreach ($randomKeys as $key) {
        $allQuestions[$key]['text'] = "Question " . $allQuestions[$key]['id'] . " (Man)";
        $mandatory[] = $allQuestions[$key]['id'];
    }

    return $mandatory;
}

// Example usage
$allQuestions = createDummyQuestions();
$mandatoryQuestionIds = createDummyMandatoryQuestions($allQuestions);

$generator = new QuestionSelection($allQuestions, $mandatoryQuestionIds);

// Generate 10 exam variants with 10 questions each, with 40% Easy, 30% Medium, 30% Hard distribution
$variants = $generator->generateExamVariants(10, 10, ['E' => 0.4, 'M' => 0.3, 'H' => 0.3]);

// Output the results with difficulty check for mandatory questions
foreach ($variants as $i => $variant) {
    echo "Variant " . ($i + 1) . ":\n";
    foreach ($variant as $question) {
        $label = $question['text'];
        $difficulty = $question['difficulty'];
        if (str_contains($label, '(Man)')) {
            echo "  - $label | Original Difficulty: $difficulty\n";
        } else {
            echo "  - $label\n";
        }
    }
    echo "\n";
}

?>

