/**
 * @file Classroom Student Enrollment Service
 * @description Handles all student enrollment related operations for classrooms
 */

import axios from "axios";
import api from '../lib/api';
import { AxiosResponse } from 'axios';
import { saveActivity } from './activity';

// ==================== TYPE DEFINITIONS ====================

/**
 * Interface representing a student to be enrolled
 * @interface EnrollStudent
 * @property {number} studentId - Unique identifier for the student
 * @property {string} fullname - Full name of the student
 * @property {number} courseId - ID of the course the student is enrolling in
 */
export interface EnrollStudent {
    studentId: number;
    fullname: string;
    courseId: number;
}

/**
 * Interface representing an already enrolled student
 * @interface EnrolledStudent
 * @property {number} studentId - Unique identifier for the student
 * @property {string} fullname - Full name of the student
 * @property {string} enrolledAt - ISO date string when student was enrolled
 * @property {'Active' | 'Dropped' | 'Completed'} status - Current enrollment status
 */
export interface EnrolledStudent {
    studentId: number;
    fullname: string;
    enrolledAt: string;
    status: 'Active' | 'Dropped' | 'Completed';
}

// ==================== SERVICE FUNCTIONS ====================

/**
 * Enrolls multiple students in a classroom
 * @param {EnrollStudent[]} students - Array of students to enroll
 * @returns {Promise<any>} - API response data
 * @throws {Error} - If enrollment fails
 * @example
 * const students = [
 *   { studentId: 1, fullname: "John Doe", courseId: 101 },
 *   { studentId: 2, fullname: "Jane Smith", courseId: 101 }
 * ];
 * await enrollStudents(students);
 */
export async function enrollStudents(students: EnrollStudent[]) {
    const response = await api.post(`/classroom/enroll-students`, {
        students,
    });
    await saveActivity({
        route: `/classroom/enroll-students`,
        method: 'POST',
        status_code: response.status,
        payload: { students },
        action: 'Enroll',
        entity: 'Student',
        description: `ENROLL-STUDENTS-BATCH-COUNT-${students.length}`
    });
    return response.data;
}

/**
 * Retrieves all enrolled students for a specific classroom
 * @param {number} classroomId - ID of the classroom
 * @returns {Promise<EnrolledStudent[]>} - Array of enrolled students with their status
 * @throws {Error} - If retrieval fails
 * @example
 * const students = await getEnrolledStudents(101);
 * console.log(students);
 */
export async function getEnrolledStudents(classroomId: number): Promise<EnrolledStudent[]> {
    const response = await api.get(`/classroom/${classroomId}/students`);
    return response.data;
}

/**
 * Updates enrollment information for multiple students
 * @param {number} classroomId - ID of the classroom
 * @param {EnrollStudent[]} students - Array of students with updated information
 * @returns {Promise<any>} - API response data
 * @throws {Error} - If update fails
 * @example
 * const updatedStudents = [
 *   { studentId: 1, fullname: "John Doe Jr.", courseId: 101 },
 *   { studentId: 2, fullname: "Jane Smith", courseId: 101 }
 * ];
 * await editEnrolledStudents(101, updatedStudents);
 */
export async function editEnrolledStudents(classroomId: number, students: EnrollStudent[]) {
    const response = await api.put(`/classroom/${classroomId}/students`, {
        students,
    });
    await saveActivity({
        route: `/classroom/${classroomId}/students`,
        method: 'PUT',
        status_code: response.status,
        payload: { students },
        action: 'Update',
        entity: 'Enrollment',
        classroom_id: classroomId,
        description: `UPDATE-ENROLLMENT-COUNT-${students.length}-CLASSROOM-ID-${classroomId}`
    });
    return response.data;
}