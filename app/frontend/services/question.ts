import api from '../lib/api';
import { saveActivity } from './activity';

interface Option {
    letter: string;
    text: string;
    is_correct: boolean;
}

export interface Question {
    question_id: number;
    question_text: string;
    difficulty_level: number;
    question_bank_id: number;
    options: Option[];
    tags: string[];
    created_at: string;
    updated_at: string;
}

interface UpdateQuestionResponse {
    status: number;
    message: string;
    question: {
        question_id: number;
        question_text: string;
        difficulty_level: number;
        tags: string[];
    };
}

interface DeleteQuestionResponse {
    status: number;
    data(data: any): unknown;
    deleted: boolean;
    remaining_questions: number;
}

interface SearchQuestionParams {
    question_text: string;
    columns?: string[];
}

export async function deleteQuestion(id: number): Promise<{ status: number; data: any }> {
    const res = await api.delete(`/questions/${id}`);
    await saveActivity({
        action: 'delete',
        entity: 'question',
        entity_id: id,
        description: `DELETE-QUESTION-ID-${id}`
    });
    return { status: res.status, data: res.data };
}

export async function updateQuestion(question_id: number,data: any) {
    const res = await api.patch(`/questions/${question_id}`, data)
    await saveActivity({
        action: 'update',
        entity: 'question',
        entity_id: question_id,
        description: `UPDATE-QUESTION-ID-${question_id}`
    });
    return { status: res.status, data: res.data }
}

export async function getQuestionsCount(): Promise<{ status: number; data: { questions_added: number } }> {
    const res = await api.get('/questions/count');
    return { status: res.status, data: res.data };
}

export async function getQuestionById(
    questionId: number
): Promise<Question> {
    const res = await api.get(`/questions/${questionId}`);
    return res.data;
}

export async function searchQuestions(
    params: SearchQuestionParams
): Promise<Question[]> {
    const res = await api.get('/questions/search', { params });
    return res.data;
}
