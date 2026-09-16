/**
 * @file User Profile Service
 * @description Handles user data retrieval, password changes, and profile updates
 */

import api from "../lib/api";
import { saveActivity } from './activity';

interface UpdateUserPayload {
    username?: string;
    email?: string;
    language?: string;
    mode?: 'light' | 'dark';
    is_active?: boolean;
    comp_tutorial_page?: string;
}

// ==================== SERVICE FUNCTIONS ====================

/**
 * Retrieves the current user's profile data
 * @returns {Promise<AxiosResponse>} Axios response containing user data
 * @throws {Error} If the request fails
 * @example
 * try {
 *   const response = await getUserData();
 *   console.log('User data:', response.data);
 * } catch (error) {
 *   console.error('Failed to fetch user data:', error);
 * }
 */
export async function getUserData() {
    const res = await api.get('/user-data');
    return res;
}

/**
 * Changes the user's password
 * @param {Object} params Password change parameters
 * @param {string} params.oldPassword Current password for verification
 * @param {string} params.newPassword New password to set
 * @returns {Promise<AxiosResponse>} Axios response indicating success or failure
 * @throws {Error} If password change fails
 * @example
 * await changePassword({
 *   oldPassword: 'currentPassword123',
 *   newPassword: 'newSecurePassword456'
 * });
 */
export async function changePassword({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) {
    const res = await api.post('/user/change-password', {
        current_password: oldPassword,
        new_password: newPassword,
        new_password_confirmation: newPassword
    });
    await saveActivity({
      route: '/user/change-password',
      method: 'POST',
      status_code: res.status,
      payload: { action: 'change_password' },
      action: 'ChangePassword',
      entity: 'User',
      description: 'CHANGE-PASSWORD-USER'
    });
    return res;
}

/**
 * Updates the user's profile information
 * @param {Object} params Profile update parameters
 * @param {string} params.username New username to set
 * @param {string} params.email New email to set
 * @returns {Promise<AxiosResponse>} Axios response indicating success or failure
 * @throws {Error} If profile update fails
 * @example
 * await updateProfile({
 *   username: 'newUsername',
 *   email: 'new.email@example.com'
 * });
 */
export async function updateProfile({ username, email }: { username: string, email: string }) {
    const res = await api.patch('/user/update', { username, email });
    await saveActivity({
      route: '/user/update',
      method: 'PATCH',
      status_code: res.status,
      payload: { username, email },
      action: 'Update',
      entity: 'User',
      description: `UPDATE-USER-PROFILE-${username}`
    });
    return res;
}

export async function updateUser({ payload }: { payload: UpdateUserPayload }) {
    const res = await api.patch('/user/update', payload);
    await saveActivity({
      route: '/user/update',
      method: 'PATCH',
      status_code: res.status,
      payload,
      action: 'Update',
      entity: 'User',
      description: 'UPDATE-USER-SETTINGS'
    });
    return res;
}

/**
 * Deletes the current user's account by ID
 * @param {number} userId - The ID of the user to delete
 * @returns {Promise<AxiosResponse>} Axios response indicating success or failure
 */
export async function deleteAccount(userId: number) {
    const res = await api.delete(`/user/${userId}`);
    await saveActivity({
      route: `/user/${userId}`,
      method: 'DELETE',
      status_code: res.status,
      action: 'Delete',
      entity: 'User',
      payload: { userId },
      description: `DELETE-USER-ACCOUNT-ID-${userId}`
    });
    return {data: res.data, status: res.status};
}