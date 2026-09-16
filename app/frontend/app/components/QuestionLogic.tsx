'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExamData, Question } from './ExamCardRoulette';
import { useRouter, useParams } from 'next/navigation';
import { getClassroomName } from '../../services/classroom';

interface QuestionLogicReturn {
    examVariants: Array<{
        exam_variant_id: number;
        version_number: number;
        answer_key: string;
        questions: Array<{
            question_id: number,
            question_text: string;
            question_number: number;
            options: string[];
            correct_options: string[];
            tag: string;
        }>;
    }>;
}

export const useQuestionLogic = (examData: ExamData | null): QuestionLogicReturn => {
    const params = useParams();
    const course_id = params?.course_id ? Number(params.course_id) : null;
    const router = useRouter();
    const [className, setClassName] = useState<string>('');
    const examId = localStorage.getItem("examcreatedid");

    // Enhanced seeded random number generator
    class SeededRandom {
        private seed: number;

        constructor(seed: number) {
            this.seed = seed % 2147483647;
            if (this.seed <= 0) this.seed += 2147483646;
        }

        next(): number {
            this.seed = (this.seed * 48271) % 2147483647;
            return (this.seed / 2147483647);
        }

        // Added method for random integers in range
        nextInt(min: number, max: number): number {
            return Math.floor(this.next() * (max - min + 1)) + min;
        }
    }

    // Function to group questions by tag and shuffle within each tag group
    const shuffleQuestionsByTag = useCallback((questions: Question[], variantIndex: number): Question[] => {
        // Group questions by tag
        const tagGroups: Record<string, Question[]> = {};
        questions.forEach(question => {
            const tag = question.tag;
            if (!tagGroups[tag]) {
                tagGroups[tag] = [];
            }
            tagGroups[tag].push(question);
        });

        // Shuffle the order of tags using variant-specific seed
        const tags = Object.keys(tagGroups);
        const tagRandom = new SeededRandom(variantIndex * 7919 + tags.length);
        for (let i = tags.length - 1; i > 0; i--) {
            const j = tagRandom.nextInt(0, i);
            [tags[i], tags[j]] = [tags[j], tags[i]];
        }

        // Shuffle questions within each tag group
        const result: Question[] = [];
        tags.forEach(tag => {
            const groupQuestions = tagGroups[tag];
            const groupRandom = new SeededRandom(variantIndex * 514229 + tag.charCodeAt(0));
            
            // Fisher-Yates shuffle for questions within tag
            for (let i = groupQuestions.length - 1; i > 0; i--) {
                const j = groupRandom.nextInt(0, i);
                [groupQuestions[i], groupQuestions[j]] = [groupQuestions[j], groupQuestions[i]];
            }
            
            result.push(...groupQuestions);
        });

        return result;
    }, []);

    // Function to select questions for each variant (including mandatory questions)
    const selectQuestionsForVariants = useCallback((
        numVariants: number,
        numQuestions: number,
        allQuestions: Question[]
    ): Question[][] => {
        const mandatoryQuestions = allQuestions.filter(q => q.mandatory);
        const optionalQuestions = allQuestions.filter(q => !q.mandatory);
        const remainingSlots = Math.max(0, numQuestions - mandatoryQuestions.length);

        // Create question sets for each variant with different optional questions
        return Array.from({ length: numVariants }, (_, variantIndex) => {
            // Create seeded random for this variant's question selection
            const selectRandom = new SeededRandom(variantIndex * 65537 + allQuestions.length);
            
            // Shuffle optional questions and select needed amount
            const shuffledOptional = [...optionalQuestions];
            for (let i = shuffledOptional.length - 1; i > 0; i--) {
                const j = selectRandom.nextInt(0, i);
                [shuffledOptional[i], shuffledOptional[j]] = [shuffledOptional[j], shuffledOptional[i]];
            }
            
            const selectedOptional = shuffledOptional.slice(0, remainingSlots);
            const selectedQuestions = [...mandatoryQuestions, ...selectedOptional];
            
            // Shuffle questions by tag for this variant
            return shuffleQuestionsByTag(selectedQuestions, variantIndex);
        });
    }, [shuffleQuestionsByTag]);

    // Function to shuffle question order (now handled in selectQuestionsForVariants)
    const shuffleQuestionOrder = useCallback((
        questionSets: Question[][]
    ): Question[][] => {
        return questionSets;
    }, []);

    // Function to shuffle options and generate maximally dissimilar answer keys
    const generateDissimilarAnswerKeys = useCallback((
        questionSets: Question[][]
    ): { shuffledQuestions: Question[][], answerKeys: string[] } => {
        const numVariants = questionSets.length;
        if (numVariants === 0) return { shuffledQuestions: [], answerKeys: [] };

        const answerKeys: string[][] = Array(numVariants).fill(null).map(() => []);
        const shuffledQuestions: Question[][] = Array(numVariants).fill(null).map(() => []);

        // Enhanced seeding system with multiple entropy sources
        const getSeed = (variantIndex: number, questionIndex: number, questionId: string | number) => {
            const timeFactor = Math.floor(Date.now() / 1000) % 1000000;
            const idStr = typeof questionId === 'number' ? questionId.toString() : questionId;
            const idHash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0) * 31, 0);
            return (variantIndex * 7919 + questionIndex * 514229 + idHash * 65537 + timeFactor) % 2147483647;
        };

        // First pass: Initial shuffle and answer key generation
        questionSets.forEach((questions, variantIndex) => {
            questions.forEach((question, questionIndex) => {
                const numOptions = question.options.length;
                if (numOptions === 0) {
                    shuffledQuestions[variantIndex].push(question);
                    return;
                }

                const seed = getSeed(variantIndex, questionIndex, question.id);
                const rng = new SeededRandom(seed);

                // Fisher-Yates shuffle with deterministic RNG
                const shuffledOptions = [...question.options];
                for (let i = shuffledOptions.length - 1; i > 0; i--) {
                    const j = rng.nextInt(0, i);
                    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
                }

                // Find new correct position
                const newCorrectPos = shuffledOptions.findIndex(opt => opt.isCorrect);
                const correctLetter = String.fromCharCode(65 + newCorrectPos);

                answerKeys[variantIndex][questionIndex] = correctLetter;

                shuffledQuestions[variantIndex].push({
                    ...question,
                    options: shuffledOptions.map((opt, i) => ({
                        ...opt,
                        letter: String.fromCharCode(65 + i),
                        isCorrect: i === newCorrectPos
                    }))
                });
            });
        });

        // Second pass: Maximize dissimilarity between variants
        const minDissimilarity = 0.8; // At least 80% different answers between versions
        const maxIterations = 7; // Increased to allow more thorough optimization

        // Track which questions have been changed to avoid over-optimizing
        const changedQuestions = new Set<string>();

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let improved = false;

            // Compare all pairs of variants in random order
            const variantPairs: [number, number][] = [];
            for (let v1 = 0; v1 < numVariants; v1++) {
                for (let v2 = v1 + 1; v2 < numVariants; v2++) {
                    variantPairs.push([v1, v2]);
                }
            }
            
            // Shuffle the order of variant pairs to avoid bias
            const pairRng = new SeededRandom(iteration * 123456 + numVariants);
            for (let i = variantPairs.length - 1; i > 0; i--) {
                const j = pairRng.nextInt(0, i);
                [variantPairs[i], variantPairs[j]] = [variantPairs[j], variantPairs[i]];
            }

            for (const [v1, v2] of variantPairs) {
                const key1 = answerKeys[v1];
                const key2 = answerKeys[v2];
                const minLength = Math.min(key1.length, key2.length);

                // Calculate current dissimilarity
                let sameCount = 0;
                for (let q = 0; q < minLength; q++) {
                    if (key1[q] === key2[q]) sameCount++;
                }
                const similarity = sameCount / minLength;

                if (similarity > (1 - minDissimilarity)) {
                    // Need to make more different
                    const questionsToChange = [];
                    for (let q = 0; q < minLength; q++) {
                        if (key1[q] === key2[q]) {
                            questionsToChange.push(q);
                        }
                    }

                    // Sort by questions that are most commonly the same across all variants
                    questionsToChange.sort((a, b) => {
                        let countA = 0, countB = 0;
                        for (let v = 0; v < numVariants; v++) {
                            if (answerKeys[v][a] === key1[a]) countA++;
                            if (answerKeys[v][b] === key1[b]) countB++;
                        }
                        return countB - countA; // Sort descending
                    });

                    // Change answers in v2 to increase dissimilarity
                    const numToChange = Math.ceil(questionsToChange.length * (minDissimilarity - (1 - similarity)));
                    for (let i = 0; i < Math.min(numToChange, questionsToChange.length); i++) {
                        const qIndex = questionsToChange[i];
                        const question = questionSets[v2][qIndex];
                        const numOptions = question.options.length;
                        
                        if (numOptions < 2) continue;

                        const currentAns = answerKeys[v2][qIndex];
                        const currentCode = currentAns.charCodeAt(0) - 65;

                        // Find alternative that maximizes dissimilarity
                        let bestAlternatives: {code: number, score: number}[] = [];

                        for (let newCode = 0; newCode < numOptions; newCode++) {
                            if (newCode === currentCode) continue;

                            let score = 0;
                            // Check against all other variants
                            for (let v3 = 0; v3 < numVariants; v3++) {
                                if (v3 !== v2 && answerKeys[v3][qIndex] !== String.fromCharCode(65 + newCode)) {
                                    score++;
                                }
                            }

                            // Add some randomness to the score to break ties randomly
                            score += pairRng.next() * 0.5;

                            if (bestAlternatives.length === 0 || score >= bestAlternatives[0].score) {
                                if (bestAlternatives.length > 0 && score > bestAlternatives[0].score) {
                                    bestAlternatives = [];
                                }
                                bestAlternatives.push({code: newCode, score});
                            }
                        }

                        if (bestAlternatives.length > 0) {
                            // Randomly select among the best alternatives with probability weighted by score
                            const totalScore = bestAlternatives.reduce((sum, alt) => sum + alt.score, 0);
                            let randomPick = pairRng.next() * totalScore;
                            let selectedAlt = bestAlternatives[0].code;
                            
                            for (const alt of bestAlternatives) {
                                randomPick -= alt.score;
                                if (randomPick <= 0) {
                                    selectedAlt = alt.code;
                                    break;
                                }
                            }

                            const newAns = String.fromCharCode(65 + selectedAlt);
                            answerKeys[v2][qIndex] = newAns;

                            // Update the question in the shuffled set
                            const questionInVariant = shuffledQuestions[v2].find(q =>
                                q.id === question.id
                            );
                            if (questionInVariant) {
                                questionInVariant.options.forEach(opt => {
                                    opt.isCorrect = (opt.letter === newAns);
                                });
                            }
                            
                            changedQuestions.add(`${v2}-${qIndex}`);
                            improved = true;
                        }
                    }
                }
            }

            if (!improved) break;
        }

        // Final pass: Introduce controlled randomness to break any remaining patterns
        const finalRng = new SeededRandom(Math.floor(Date.now() / 1000) % 1000000);
        const variantOrder = Array.from({length: numVariants}, (_, i) => i);
        
        // Shuffle variant processing order
        for (let i = variantOrder.length - 1; i > 0; i--) {
            const j = finalRng.nextInt(0, i);
            [variantOrder[i], variantOrder[j]] = [variantOrder[j], variantOrder[i]];
        }

        for (const v of variantOrder) {
            const questionOrder = Array.from({length: answerKeys[v].length}, (_, i) => i);
            
            // Shuffle question processing order
            for (let i = questionOrder.length - 1; i > 0; i--) {
                const j = finalRng.nextInt(0, i);
                [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
            }

            for (const q of questionOrder) {
                // Skip if we already changed this question
                if (changedQuestions.has(`${v}-${q}`)) continue;
                
                const question = questionSets[v][q];
                const numOptions = question.options.length;
                if (numOptions < 2) continue;
                
                // With probability based on number of variants, randomly change the answer
                const changeProbability = 0.3 * (1 - 1/numVariants);
                if (finalRng.next() < changeProbability) {
                    const currentAns = answerKeys[v][q];
                    const currentCode = currentAns.charCodeAt(0) - 65;
                    
                    // Pick a random different option
                    let newCode;
                    do {
                        newCode = finalRng.nextInt(0, numOptions - 1);
                    } while (newCode === currentCode);
                    
                    const newAns = String.fromCharCode(65 + newCode);
                    answerKeys[v][q] = newAns;
                    
                    // Update the question in the shuffled set
                    const questionInVariant = shuffledQuestions[v].find(qv => qv.id === question.id);
                    if (questionInVariant) {
                        questionInVariant.options.forEach(opt => {
                            opt.isCorrect = (opt.letter === newAns);
                        });
                    }
                }
            }
        }

        return {
            shuffledQuestions,
            answerKeys: answerKeys.map(keys => keys.join(', '))
        };
    }, []);

    // Process exam data with all steps
    const examVariants = useMemo(() => {
        if (!examData) return [];

        const numVariants = parseInt(examData.numVariants);
        const numQuestions = parseInt(examData.numQuestions);
        const allQuestions = examData.selectedQuestions;

        // Step 1: Select questions for each variant (includes tag-based shuffling)
        const questionSets = selectQuestionsForVariants(
            numVariants,
            numQuestions,
            allQuestions
        );

        // Step 2: Shuffle question order for each variant (handled in selectQuestionsForVariants)
        const shuffledQuestionSets = shuffleQuestionOrder(questionSets);

        // Step 3: Shuffle options and generate answer keys with maximum dissimilarity
        const { shuffledQuestions, answerKeys } = generateDissimilarAnswerKeys(shuffledQuestionSets);

        // Create final variants in the required format
        return shuffledQuestions.map((questions, i) => ({
            exam_variant_id: i + 1,
            version_number: i + 1,
            answer_key: answerKeys[i],
            questions: questions.map((question, qIndex) => ({
                question_id: question.id,
                question_text: question.text,
                question_number: qIndex + 1,
                options: question.options.map(opt => opt.text),
                correct_options: question.options
                    .filter(opt => opt.isCorrect)
                    .map(opt => opt.letter)
                    .filter((letter): letter is string => letter !== undefined),
                tag: question.tag
            }))
        }));
    }, [examData, className, selectQuestionsForVariants, shuffleQuestionOrder, generateDissimilarAnswerKeys]);

    // Store in localStorage immediately after generation
    useEffect(() => {
        if (examVariants.length > 0) {
            localStorage.setItem('examVariants22', JSON.stringify(examVariants));
            console.log('Exam variants stored in localStorage:', examVariants);
        }
    }, [examVariants]);

    return { examVariants };
};