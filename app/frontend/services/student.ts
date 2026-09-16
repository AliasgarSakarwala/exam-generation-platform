import api from '../lib/api'
import { saveActivity } from './activity';

interface Student {
    first_name: string;
    last_name: string;
    preferred_name?: string;
    student_id: number;
    is_active: boolean;
}

export const getStudentsByClassroomID = async (classroom_id: number) => {
    const res = await api.get(`/classrooms/${classroom_id}/students?per_page=80`)
    return { data: res.data, status: res.status }
}

export const addStudentsToCourse = async (students: Student[], classroom_id: number) => {
  const res = await api.post(`/classrooms/${classroom_id}/students`, { students })
  await saveActivity({
    route: `/classrooms/${classroom_id}/students`,
    method: 'POST',
    status_code: res.status,
    payload: { students },
    action: 'Enroll',
    entity: 'Student',
    classroom_id: classroom_id,
    description: `ENROLL-STUDENTS-COUNT-${students.length}`
  });
  return { data: res.data, status: res.status }
}

export const updateStudent = async (student_id: number, classroom_id: number, payload: any) => {
  const res = await api.patch(`/classrooms/${classroom_id}/students/${student_id}`, payload)
  await saveActivity({
    route: `/classrooms/${classroom_id}/students/${student_id}`,
    method: 'PATCH',
    status_code: res.status,
    payload,
    action: 'Update',
    entity: 'Student',
    classroom_id: classroom_id,
    description: `UPDATE-STUDENT-ID-${student_id}`
  });
  return { data: res.data, status: res.status }
}

export const deleteStudent = async (student_id: number, classroom_id: number) => {
    const res = await api.delete(`/classrooms/${classroom_id}/students/${student_id}`)
  await saveActivity({
    route: `/classrooms/${classroom_id}/students/${student_id}`,
    method: 'DELETE',
    status_code: res.status,
    action: 'Delete',
    entity: 'Student',
    classroom_id: classroom_id,
    payload: { student_id },
    description: `DELETE-STUDENT-ID-${student_id}`
  });
  return { data: res.data, status: res.status }
}

export const deleteStudentsBulk = async (student_ids: number[], classroom_id: number) => {
    const res = await api.delete(`/classrooms/${classroom_id}/students/bulk`, { 
        data: { student_ids } 
    })
    return { data: res.data, status: res.status }

}