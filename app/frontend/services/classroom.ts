/**
 * @file Classroom Management Service
 * @description Handles all classroom-related operations including creation, retrieval, updates, and archiving
 */

import api from '../lib/api';
import { AxiosResponse } from 'axios';
import { saveActivity } from './activity';

// ==================== TYPE DEFINITIONS ====================

/**
 * Interface representing a classroom entity
 * @interface Classroom
 * @property {number} classroom_id - Unique identifier for the classroom
 * @property {string} name - Name of the classroom
 * @property {string} code - Unique code identifier for the classroom
 * @property {number} section - Section number for the classroom
 * @property {string} [description] - Optional description of the classroom
 * @property {number} user_id - ID of the user who owns the classroom
 * @property {boolean} is_archived - Whether the classroom is archived
 * @property {string} start_date - Date when the classroom starts (ISO format)
 * @property {string} end_date - Date when the classroom ends (ISO format)
 * @property {string} term - Term identifier (e.g., "Fall - Term 1")
 * @property {number} student_count - Count of enrolled students
 * @property {string} class_colour - Color code for the classroom
 */
export interface Classroom {
    classroom_id: number;
    name: string;
    code: string;
    section: string;
    description?: string;
    user_id: number;
    is_archived: boolean;
    start_date: string;
    end_date: string;
    term: string;
    student_count: number;
    class_colour: string;
}

/**
 * Interface for creating a new classroom
 * @interface CreateClassroomParams
 * @property {string} name - Name of the new classroom
 * @property {string} code - Unique code for the classroom
 * @property {number} section - Section number for the classroom
 * @property {string} [description] - Optional classroom description
 * @property {string} start_date - Start date for the classroom (ISO format)
 * @property {string} end_date - End date for the classroom (ISO format)
 * @property {string} term - Term identifier (e.g., "Fall - Term 1")
 * @property {string} class_colour - Color code for the classroom
 */
export interface CreateClassroomParams {
    name: string;
    code: string;
    section: string;
    description?: string;
    start_date: string;
    end_date: string;
    term: string;
    class_colour: string;
    student_count: number;
}

// ==================== SERVICE FUNCTIONS ====================

/**
 * Retrieves all active classrooms for the current professor
 * @returns {Promise<{status: number, data: Classroom[]}>} - Object containing HTTP status and array of classrooms
 * @throws {Error} - If the request fails
 * @example
 * const { status, data: classrooms } = await getClassrooms();
 */
export async function getClassrooms(): Promise<{ status: number; data: Classroom[] }> {
    const res = await api.get('/classrooms?status=active');
    return {
        status: res.status,
        data: res.data
    };
}

/**
 * Retrieves all archived classrooms for the current professor
 * @returns {Promise<{status: number, data: Classroom[]}>} - Object containing HTTP status and array of archived classrooms
 * @throws {Error} - If the request fails
 * @example
 * const { status, data: archivedClassrooms } = await getArchivedClassrooms();
 */
export async function getArchivedClassrooms(): Promise<{ status: number; data: Classroom[] }> {
    const res = await api.get('/classrooms?status=archived');
    return {
        status: res.status,
        data: res.data
    };
}

/**
 * Retrieves a classroom by its ID
 * @param {number} id - Classroom ID
 * @returns {Promise<{status: number, data: Classroom}>} - Object containing HTTP status and classroom data
 * @throws {Error} - If the request fails
 * @example
 * const { status, data: classroom } = await getClassroomById(123);
 */
export async function getClassroomById(id: number): Promise<{ status: number; data: Classroom }> {
    const res = await api.get(`/classrooms/${id}`);
    return {
        status: res.status,
        data: res.data
    };
}

/**
 * Creates a new classroom
 * @param {CreateClassroomParams} data - Classroom creation parameters
 * @returns {Promise<AxiosResponse>} - Axios response object
 * @throws {Error} - If creation fails
 * @example
 * const newClassroom = {
 *   name: "Math 101",
 *   code: "MATH101",
 *   section: 1,
 *   start_date: "2023-09-01",
 *   end_date: "2023-12-15",
 *   term: "Fall - Term 1",
 *   class_colour: "#3b82f6"
 * };
 * await createClassroom(newClassroom);
 */
export async function createClassroom(data: CreateClassroomParams): Promise<AxiosResponse> {
    console.log("Creating classroom with data:", data);
    const res = await api.post('/classrooms', data);
    
    // Extract classroom_id from response and log activity
    if (res.status >= 200 && res.status < 300) {
        const classroomId = res.data?.classroom_id || res.data?.id;
        await saveActivity({
            route: '/classrooms',
            method: 'POST',
            status_code: res.status,
            payload: { ...data, classroom_id: classroomId },
            action: 'Create',
            entity: 'Classroom',
            classroom_id: classroomId,
            description: `CREATE-CLASSROOM-${data.name}`
        });
    }
    
    return res;
}

/**
 * Updates an existing classroom's properties
 * @param {number} id - ID of the classroom to update
 * @param {Partial<CreateClassroomParams>} data - Partial classroom data with properties to update
 * @returns {Promise<{status: number, data: Classroom}>} - Object containing HTTP status and updated classroom data
 * @throws {Error} - If update fails
 * @example
 * const updates = {
 *   name: "Advanced Math 101",
 *   end_date: "2023-12-20"
 * };
 * const { status, data: updatedClassroom } = await updateClassroom(123, updates);
 */
export async function updateClassroom(
    id: number,
    data: Partial<CreateClassroomParams>
): Promise<{ status: number; data: Classroom }> {
    console.log("Creating classroom with data:", data);
    const res = await api.patch(`/classrooms/${id}`, data);
    
    
    const description = `UPDATE-CLASSROOM-PROPERTIES`;
    
    await saveActivity({
        route: `/classrooms/${id}`,
        method: 'PATCH',
        status_code: res.status,
        payload: data,
        action: 'Update',
        entity: 'Classroom',
        classroom_id: id,
        description: description
    });
    return res;
}

/**
 * Toggles the archive status of a classroom (active ↔ archived)
 * @param {number} id - ID of the classroom to toggle
 * @returns {Promise<AxiosResponse>} - Axios response object
 * @throws {Error} - If the operation fails
 * @example
 * await toggleClassroomStatus(123); // Archives or unarchives classroom with ID 123
 */
export async function toggleClassroomStatus(id: number): Promise<AxiosResponse> {
    const res = await api.patch(`/classrooms/${id}/status`);
    await saveActivity({
        route: `/classrooms/${id}/status`,
        method: 'PATCH',
        status_code: res.status,
        action: 'ToggleArchive',
        entity: 'Classroom',
        classroom_id: id,
        description: `TOGGLE-ARCHIVE-CLASSROOM-ID-${id}`
    });
    return res;
}

/**
 * Permanently deletes a classroom
 * @param {number} id - ID of the classroom to delete
 * @returns {Promise<AxiosResponse>} - Axios response object
 * @throws {Error} - If deletion fails
 * @example
 * await deleteClassroom(123); // Deletes classroom with ID 123
 */
export async function deleteClassroom(id: number): Promise<AxiosResponse> {
    const res = await api.delete(`/classrooms/${id}`);
    await saveActivity({
        route: `/classrooms/${id}`,
        method: 'DELETE',
        status_code: res.status,
        action: 'Delete',
        entity: 'Classroom',
        classroom_id: id,
        description: `DELETE-CLASSROOM-ID-${id}`
    });
    return res;
}

/**
 * Retrieves the name of a classroom by its ID
 * @param {number} id - ID of the classroom
 * @returns {Promise<{status: number, data: {name: string}}>} - Object containing HTTP status and classroom name
 * @throws {Error} - If the request fails
 * @example
 * const { status, data } = await getClassroomName(123);
 * console.log(data.name); // "Mathematics 101"
 */
export async function getClassroomName(id: number): Promise<{ status: number; data: { name: string } }> {
    const res = await api.get(`/classrooms/${id}/name`);
    return {
        status: res.status,
        data: res.data
    };
}

/**
 * Fetches classroom statistics for the current professor (or all if admin)
 * @returns {Promise<{status: number, data: {courses_created: number, total_students: number}}>} - Object containing HTTP status and stats
 * @throws {Error} - If the request fails
 * @example
 * const { status, data } = await getClassroomStats();
 * console.log(data.courses_created, data.total_students);
 */
export async function getClassroomStats(): Promise<{ status: number; data: { courses_created: number; total_students: number } }> {
    const res = await api.get('/classrooms/stats');
    return {
        status: res.status,
        data: res.data
    };
}