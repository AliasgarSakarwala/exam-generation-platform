// src/services/exam_weight.ts
import api from '@/lib/api';
import { saveActivity } from './activity';

// Type definitions
export interface ExamWeight {
    weight_id: number;
    classroom_id: number;
    exam_id: number;
    weight: number;
    created_at?: string;
    updated_at?: string;
}

interface CreateExamWeightData {
    classroom_id: number;
    exam_id: number;
    weight: number;
}

interface UpdateExamWeightData {
    weight: number;
}

export const ExamWeightService = {
    /**
     * Get all exam weights
     */
    async getAll(): Promise<ExamWeight[]> {
        try {
            const response = await api.get('/exam-weights');
            return response.data;
        } catch (error) {
            console.error('Error fetching exam weights:', error);
            throw error;
        }
    },

    /**
     * Get a single exam weight by ID
     */
    async getById(weightId: number): Promise<ExamWeight> {
        try {
            const response = await api.get(`/exam-weights/${weightId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching exam weight with ID ${weightId}:`, error);
            throw error;
        }
    },

    /**
     * Create a new exam weight
     */
    async create(data: CreateExamWeightData): Promise<ExamWeight> {
        try {
            const response = await api.post('/exam-weights', data);
            await saveActivity({
              route: '/exam-weights',
              method: 'POST',
              status_code: response.status,
              payload: data,
              action: 'Create',
              entity: 'ExamWeight',
              description: `CREATE-EXAM-WEIGHT-EXAM-${data.exam_id}-CLASSROOM-${data.classroom_id}`
            });
            return response.data;
        } catch (error) {
            console.error('Error creating exam weight:', error);
            throw error;
        }
    },

    /**
     * Update an existing exam weight
     */
    async update(weightId: number, data: UpdateExamWeightData): Promise<ExamWeight> {
        try {
            const response = await api.put(`/exam-weights/${weightId}`, data);
            await saveActivity({
              route: `/exam-weights/${weightId}`,
              method: 'PUT',
              status_code: response.status,
              payload: { ...data, exam_weight_id: weightId },
              action: 'Update',
              entity: 'ExamWeight',
              description: `UPDATE-EXAM-WEIGHT-ID-${weightId}`
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating exam weight with ID ${weightId}:`, error);
            throw error;
        }
    },

    /**
     * Delete an exam weight
     */
    async delete(weightId: number): Promise<void> {
        try {
            const res = await api.delete(`/exam-weights/${weightId}`);
            await saveActivity({
              route: `/exam-weights/${weightId}`,
              method: 'DELETE',
              status_code: res.status,
              action: 'Delete',
              entity: 'ExamWeight',
              payload: { weight_id: weightId },
              description: `DELETE-EXAM-WEIGHT-ID-${weightId}`
            });
        } catch (error) {
            console.error(`Error deleting exam weight with ID ${weightId}:`, error);
            throw error;
        }
    },

    /**
     * Get exam weights by classroom ID
     */
    async getByClassroomId(classroomId: number): Promise<ExamWeight[]> {
        try {
            const response = await api.get('/exam-weights', {
                params: { classroom_id: classroomId }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching exam weights for classroom ${classroomId}:`, error);
            throw error;
        }
    },

    /**
     * Get exam weights by exam ID
     */
    async getByExamId(examId: number): Promise<ExamWeight[]> {
        try {
            const response = await api.get('/exam-weights', {
                params: { exam_id: examId }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching exam weights for exam ${examId}:`, error);
            throw error;
        }
    }
};