import axios from "axios";
import api from '../lib/api';
import { AxiosResponse } from 'axios';
import { saveActivity } from './activity';

// Interface for Exam model matching your database schema
export interface Exam {
  exam_id: number;
  classroom_id: number;
  title: string;
  description?: string | null;
  total_points: number;
  question_count: number;
  variant_count: number;
  available_from?: string | null; // ISO date string
  available_to?: string | null; // ISO date string
  is_published: boolean;
  is_graded: boolean;
  created_at: string; // ISO date string
  updated_at?: string | null; // ISO date string
}

// Type for creating a new exam (omits auto-generated fields)
export type CreateExamDto = Omit<Exam, 'exam_id' | 'created_at' | 'updated_at'>;

// Type for updating an exam (makes all fields optional)
export type UpdateExamDto = Partial<CreateExamDto>;

// Response types
interface ExamsResponse {
  data: Exam[];
}

interface ExamResponse {
  data: Exam;
}

interface MessageResponse {
  message: string;
}

// API service methods
export const ExamService = {
  // Get all exams
  getAllExams: async (): Promise<Exam[]> => {
    const response: AxiosResponse<ExamsResponse> = await api.get('/exams');
    return response.data.data;
  },

  // Get exams with specific columns
  getExamsWithColumns: async (columns: string[]): Promise<Partial<Exam>[]> => {
    const response: AxiosResponse<ExamsResponse> = await api.get(
      `/exams-columns/${columns.join(',')}`
    );
    return response.data.data;
  },

  // Get single exam by ID
  getExamById: async (examId: number): Promise<Exam> => {
    const response: AxiosResponse<ExamResponse> = await api.get(`/exams/${examId}`);
    return response.data.data;
  },

  // Get specific columns of an exam
  getExamColumns: async (
    examId: number,
    columns: string[]
  ): Promise<Partial<Exam>> => {
    const response: AxiosResponse<ExamResponse> = await api.get(
      `/exams/${examId}/columns/${columns.join(',')}`
    );
    return response.data.data;
  },

  // Create a new exam
  createExam: async (examData: CreateExamDto): Promise<Exam> => {
    const response: AxiosResponse<ExamResponse> = await api.post('/exams', examData);
    await saveActivity({
      route: '/exams',
      method: 'POST',
      status_code: response.status,
      payload: examData,
      action: 'Create',
      entity: 'Exam',
      classroom_id: examData.classroom_id,
      description: `CREATE-EXAM-${examData.title}`
    });
    return response.data.data;
  },

  // Update an existing exam
  updateExam: async (
    examId: number,
    examData: UpdateExamDto
  ): Promise<Exam> => {
    const response: AxiosResponse<ExamResponse> = await api.put(
      `/exams/${examId}`,
      examData
    );
    await saveActivity({
      route: `/exams/${examId}`,
      method: 'PUT',
      status_code: response.status,
      payload: { ...examData, exam_id: examId },
      action: 'Update',
      entity: 'Exam',
      exam_id: examId,
      description: `UPDATE-EXAM-${examData.title || `ID-${examId}`}`
    });
    return response.data.data;
  },

  // Delete an exam
  deleteExam: async (examId: number): Promise<string> => {
    const response: AxiosResponse<MessageResponse> = await api.delete(
      `/exams/${examId}`
    );
    await saveActivity({
      route: `/exams/${examId}`,
      method: 'DELETE',
      status_code: response.status,
      action: 'Delete',
      entity: 'Exam',
      payload: { exam_id: examId },
      exam_id: examId,
      description: `DELETE-EXAM-ID-${examId}`
    });
    return response.data.message;
  },

  // Get all exams for a specific classroom (all columns)
  getExamsByClassroom: async (classroomId: number): Promise<Exam[]> => {
    const response = await api.get(`/exams/classroom/${classroomId}`);
    return response.data.data;
  },

  // Get specific columns of exams for a specific classroom
  getExamsByClassroomWithColumns: async (
    classroomId: number,
    columns: string[]
  ): Promise<Partial<Exam>[]> => {
    const response = await api.get(
      `/exams/classroom/${classroomId}/columns/${columns.join(',')}`
    );
    return response.data; // Directly return the array
  },
};

export default ExamService;