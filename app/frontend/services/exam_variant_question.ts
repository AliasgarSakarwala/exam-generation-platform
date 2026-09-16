import api from '@/lib/api';
import { saveActivity } from './activity';

export interface ExamVariantQuestion {
    exam_variant_question_id: number;
    exam_variant_id: number;
    question_id: number;
    question_text: string;
    question_number: number;
    options: string[];
    correct_options: string[];
    mandatory: boolean;
    created_at?: string;
    updated_at?: string;
}

export const ExamVariantQuestionService = {
    async createQuestion(questionData: Omit<ExamVariantQuestion, 'exam_variant_question_id' | 'created_at' | 'updated_at'>) {
        try {
            const response = await api.post('/exam-variant-questions', questionData);
            await saveActivity({
                route: '/exam-variant-questions',
                method: 'POST',
                status_code: response.status,
                payload: questionData,
                action: 'Create',
                entity: 'ExamVariantQuestion',
                description: `CREATE-EXAM-VARIANT-QUESTION-VARIANT-${questionData.exam_variant_id}`
            });
            return response.data;
        } catch (error) {
            console.error('Error creating question:', error);
            throw error;
        }
    },

    async getQuestionsByVariant(variantId: number) {
        try {
            const response = await api.get(`/exam-variant-questions/variant/${variantId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching questions:', error);
            throw error;
        }
    },

    async updateQuestion(questionId: number, updateData: Partial<ExamVariantQuestion>) {
        try {
            const response = await api.put(`/exam-variant-questions/${questionId}`, updateData);
            await saveActivity({
                route: `/exam-variant-questions/${questionId}`,
                method: 'PUT',
                status_code: response.status,
                payload: { ...updateData, exam_variant_question_id: questionId },
                action: 'Update',
                entity: 'ExamVariantQuestion',
                description: `UPDATE-EXAM-VARIANT-QUESTION-ID-${questionId}`
            });
            return response.data;
        } catch (error) {
            console.error('Error updating question:', error);
            throw error;
        }
    },

    async deleteQuestion(questionId: number) {
        try {
            const response = await api.delete(`/exam-variant-questions/${questionId}`);
            await saveActivity({
                route: `/exam-variant-questions/${questionId}`,
                method: 'DELETE',
                status_code: response.status,
                action: 'Delete',
                entity: 'ExamVariantQuestion',
                payload: { exam_variant_question_id: questionId },
                description: `DELETE-EXAM-VARIANT-QUESTION-ID-${questionId}`
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting question:', error);
            throw error;
        }
    },

    /**
     * Creates multiple questions for an exam variant with a single activity log entry
     * @param questionsData Array of questions to create
     * @returns Array of created questions
     */
    async createBatchQuestions(questionsData: Array<Omit<ExamVariantQuestion, 'exam_variant_question_id' | 'created_at' | 'updated_at'>>) {
        try {
            // Create all questions without individual activity logging
            const promises = questionsData.map(question => 
                api.post('/exam-variant-questions', question)
            );
            const responses = await Promise.all(promises);
            const createdQuestions = responses.map(response => response.data);

            // Log activity only once for the entire batch
            if (questionsData.length > 0) {
                const variantId = questionsData[0].exam_variant_id;
                await saveActivity({
                    route: '/exam-variant-questions/batch',
                    method: 'POST',
                    status_code: 201,
                    payload: { 
                        count: questionsData.length,
                        variant_id: variantId,
                        question_ids: createdQuestions.map(q => q.exam_variant_question_id)
                    },
                    action: 'Create',
                    entity: 'ExamVariantQuestion',
                    description: 'CREATE-EXAM-VARIANT QUESTIONS'
                });
            }

            return createdQuestions;
        } catch (error) {
            console.error('Error creating batch questions:', error);
            throw error;
        }
    },

    /**
     * Creates questions for a specific exam variant with a single activity log entry
     * @param variantId The exam variant ID
     * @param questions Array of questions to create
     * @returns Array of created questions
     */
    async createQuestionsForVariant(variantId: number, questions: Array<Omit<ExamVariantQuestion, 'exam_variant_question_id' | 'created_at' | 'updated_at' | 'exam_variant_id'>>) {
        try {
            const questionsWithVariantId = questions.map(q => ({
                ...q,
                exam_variant_id: variantId
            }));
            return await this.createBatchQuestions(questionsWithVariantId);
        } catch (error) {
            console.error('Error creating questions for variant:', error);
            throw error;
        }
    }
};