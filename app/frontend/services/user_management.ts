import api from '@/lib/api';
import { saveActivity } from './activity';

export interface UserManagement {
  UM_ID: number;
  classroom_id: number;
  user_id: number;
  responsibility: string | null;
  status: 'archived' | 'active' | 'invited';
  full_name?: string;
  view_grades?: boolean;
  manage_assignments?: boolean;
  classroom?: {
    classroom_id: number;
    name: string;
    code: string;
    description: string;
  };
  user?: {
    user_id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface CreateUserManagementRequest {
  classroom_id: number;
  user_id: number;
  responsibility: string | null;
  status: 'archived' | 'active' | 'invited';
  full_name: string;
  view_grades?: boolean;
  manage_assignments?: boolean;
}

export interface UpdateUserManagementRequest {
  classroom_id?: number;
  user_id?: number;
  responsibility?: string | null;
  status?: 'archived' | 'active' | 'invited';
  full_name?: string;
  view_grades?: boolean;
  manage_assignments?: boolean;
}

export const userManagementService = {
  // Get all user management records
  async getAll(): Promise<UserManagement[]> {
    const response = await api.get('/user-management');
    return response.data.data;
  },

  // Get a specific user management record
  async getById(id: number): Promise<UserManagement> {
    const response = await api.get(`/user-management/${id}`);
    return response.data.data;
  },

  // Create a new user management record
  async create(data: CreateUserManagementRequest): Promise<UserManagement> {
    const response = await api.post('/user-management', data);
    await saveActivity({
      route: '/user-management',
      method: 'POST',
      status_code: response.status,
      payload: { ...data, classroom_id: data.classroom_id },
      action: 'Create',
      entity: 'UserManagement',
      classroom_id: data.classroom_id,
      description: `CREATE-USER-MANAGEMENT-${data.full_name}-CLASSROOM-${data.classroom_id}-STATUS-${data.status}`
    });
    return response.data.data;
  },

  // Update a user management record
  async update(id: number, data: UpdateUserManagementRequest): Promise<UserManagement> {
    const response = await api.patch(`/user-management/${id}`, data);
    
    // Build description with status if provided
    let description = `UPDATE-USER-MANAGEMENT-ID-${id}`;
    if (data.status) {
      description += `-STATUS-${data.status}`;
    }
    
    await saveActivity({
      route: `/user-management/${id}`,
      method: 'PATCH',
      status_code: response.status,
      payload: { ...data, classroom_id: data.classroom_id },
      action: 'Update',
      entity: 'UserManagement',
      classroom_id: data.classroom_id,
      description: description
    });
    return response.data.data;
  },

  // Delete a user management record
  async delete(id: number): Promise<void> {
    await api.delete(`/user-management/${id}`);
    await saveActivity({
      route: `/user-management/${id}`,
      method: 'DELETE',
      status_code: 200,
      action: 'Delete',
      entity: 'UserManagement',
      payload: { id },
      description: `DELETE-USER-MANAGEMENT-ID-${id}`
    });
  },

  // Get available classrooms
  async getAvailableClassrooms(): Promise<any[]> {
    const response = await api.get('/user-management/available/classrooms');
    return response.data.data;
  },

  // Get available users
  async getAvailableUsers(): Promise<any[]> {
    const response = await api.get('/user-management/available/users');
    return response.data.data;
  },

  // Search for TAs
  async searchTAs(query: string): Promise<any[]> {
    const response = await api.get(`/user-management/search/tas?query=${encodeURIComponent(query)}`);
    return response.data.data;
  }
};