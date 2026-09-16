import api from '../lib/api';

export interface GradeSettings {
    grade_settings_id?: number;
    exam_id: number;
    high_grade_threshold: number;
    medium_grade_threshold: number;
    low_grade_threshold: number;
    high_grade_color: string;
    medium_grade_color: string;
    low_grade_color: string;
    anonymous_student_names: boolean;
    created_at?: string;
    updated_at?: string;
}

export const getGradeSettings = async (examId: number) => {
    const res = await api.get(`/exams/${examId}/grade-settings`);
    return res.data;
};

export const updateGradeSettings = async (examId: number, settings: Partial<GradeSettings>) => {
    const res = await api.put(`/exams/${examId}/grade-settings`, settings);
    return res.data;
};

export const resetGradeSettings = async (examId: number) => {
    const res = await api.post(`/exams/${examId}/grade-settings/reset`);
    return res.data;
}; 