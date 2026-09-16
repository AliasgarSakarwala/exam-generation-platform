// services/exam_variant.ts

import api from '@/lib/api';
import { saveActivity } from './activity';

/**
 * Type definitions for Exam Variant
 */
export interface ExamVariant {
  exam_variant_id: number;
  exam_id: number;
  version_number: number;
  instructions?: string | null;
  answer_key?: string | null;
  created_at: string;
}

/**
 * Type for creating a new exam variant (omits auto-generated fields)
 */
export type CreateExamVariantDto = Omit<ExamVariant, 'exam_variant_id' | 'exam_id' | 'created_at'>;

/**
 * Type for updating an exam variant (all fields optional except IDs)
 */
export type UpdateExamVariantDto = Partial<CreateExamVariantDto>;

/**
 * Standard API response format
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Fetches all exam variants for a specific exam
 */
export const getExamVariants = async (examId: number): Promise<ExamVariant[]> => {
  try {
    const response = await api.get<ApiResponse<ExamVariant[]>>(`/exams/${examId}/variants`);
    return handleResponse(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Fetches a specific exam variant by ID
 */
export const getExamVariant = async (
  examId: number,
  variantId: number
): Promise<ExamVariant> => {
  try {
    const response = await api.get<ApiResponse<ExamVariant>>(`/exams/${examId}/variants/${variantId}`);
    return handleResponse(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Fetches an exam variant by version number
 */
export const getExamVariantByVersion = async (
  examId: number,
  versionNumber: number
): Promise<ExamVariant> => {
  try {
    const response = await api.get<ApiResponse<ExamVariant>>(
      `/exams/${examId}/variants/version/${versionNumber}`
    );
    return handleResponse(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Creates a new exam variant
 */
export const createExamVariant = async (
  examId: number,
  variantData: CreateExamVariantDto
): Promise<ExamVariant> => {
  try {
    const response = await api.post<ApiResponse<ExamVariant>>(
      `/exams/${examId}/variants`,
      variantData
    );
    await saveActivity({
      route: `/exams/${examId}/variants`,
      method: 'POST',
      status_code: response.status,
      payload: variantData,
      action: 'Create',
      entity: 'ExamVariant',
      exam_id: examId,
      description: `CREATE-EXAM-VARIANT-EXAM-${examId}`
    });
    return handleResponse(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Updates an existing exam variant
 */
export const updateExamVariant = async (
  examId: number,
  variantId: number,
  variantData: UpdateExamVariantDto
): Promise<ExamVariant> => {
  try {
    const response = await api.put<ApiResponse<ExamVariant>>(
      `/exams/${examId}/variants/${variantId}`,
      variantData
    );
    await saveActivity({
      route: `/exams/${examId}/variants/${variantId}`,
      method: 'PUT',
      status_code: response.status,
      payload: variantData,
      action: 'Update',
      entity: 'ExamVariant',
      exam_id: examId,
      description: `UPDATE-EXAM-VARIANT-ID-${variantId}-EXAM-${examId}`
    });
    return handleResponse(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Deletes an exam variant
 */
export const deleteExamVariant = async (
  examId: number,
  variantId: number
): Promise<void> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/exams/${examId}/variants/${variantId}`);
    await saveActivity({
      route: `/exams/${examId}/variants/${variantId}`,
      method: 'DELETE',
      status_code: response.status,
      action: 'Delete',
      entity: 'ExamVariant',
      payload: { exam_variant_id: variantId },
      exam_id: examId,
      description: `DELETE-EXAM-VARIANT-ID-${variantId}-EXAM-${examId}`
    });
    return handleResponse(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Handles successful API responses
 */
function handleResponse<T>(response: { data: ApiResponse<T>; status: number }): T {
  if (response.data.success && response.data.data !== undefined) {
    return response.data.data;
  }
  throw {
    status: response.status,
    message: response.data.message || 'Request failed',
    errors: response.data.errors,
  };
}

/**
 * Handles and normalizes API errors
 */
function handleError(error: unknown): { status: number; message: string; errors?: Record<string, string[]> } {
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as {
      response?: { status: number; data?: ApiResponse<unknown> };
      message?: string;
    };

    if (axiosError.response) {
      return {
        status: axiosError.response.status,
        message: axiosError.response.data?.message || 'Request failed',
        errors: axiosError.response.data?.errors,
      };
    }
  }

  return {
    status: 500,
    message: 'An unknown error occurred',
  };
}