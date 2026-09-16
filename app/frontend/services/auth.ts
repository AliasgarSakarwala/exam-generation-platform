/**
 * @file Authentication Service Module
 * @description Handles all authentication-related API calls (register, login, password reset, logout)
 */

import api from '../lib/api';
import { saveActivity } from './activity';

// ==================== TYPE DEFINITIONS ====================

/**
 * Parameters required for user registration
 * @typedef {Object} RegisterParams
 * @property {string} name - User's name (typically extracted from email)
 * @property {string} email - User's email address
 * @property {string} password - User's password
 * @property {string} password_confirmation - Password confirmation (must match password)
 * @property {string} role - User's role ("Professor" or "TA")
 */
type RegisterParams = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    status: "Invited" | "Verified" | "Deactivated";
};

/**
 * Parameters required for user login
 * @typedef {Object} LoginParams
 * @property {string} email - User's email address
 * @property {string} password - User's password
 */
type LoginParams = {
    email: string;
    password: string;
};

type InviteUsePayload = {
    email: string;
    name: string;
    temp_password: string;
};

// ==================== AUTHENTICATION SERVICES ====================

/**
 * Registers a new user with the system
 * @param {RegisterParams} params - Registration parameters
 * @returns {Promise<AxiosResponse|null>} - API response or null if role is invalid
 * @throws {Error} - If API request fails
 */
export async function register({ name, email, password, password_confirmation, role, status }: RegisterParams) {
    // Validate role before making API call
    if (role === "Professor" || role === "TA") {
        console.log(`Registration payload: ${JSON.stringify({ name, email, password, password_confirmation, role, status })}`);

        // Make API request to registration endpoint
        const res = await api.post('/auth/register', {
            username: name,  // Using email prefix as username
            email: email,
            password: password,
            password_confirmation: password_confirmation,
            role: role,
            status: status
        });
        
        await saveActivity({
            route: '/auth/register',
            method: 'POST',
            status_code: res.status,
            payload: { username: name, email, role },
            action: 'Create',
            entity: 'User',
            description: `CREATE-USER-${role.toUpperCase()}-${name}`
        });
        return res;
    } else {
        // Return null for invalid roles (handled by calling component)
        return null;
    }
}

/**
 * Authenticates an existing user
 * @param {LoginParams} params - Login credentials
 * @returns {Promise<AxiosResponse>} - API response containing auth tokens
 * @throws {Error} - If API request fails
 */
export async function login({ email, password }: LoginParams) {
    // Make API request to login endpoint
    const res = await api.post('/auth/login', { email, password });
    
    await saveActivity({
        route: '/auth/login',
        method: 'POST',
        status_code: res.status,
        payload: { email },
        action: 'Login',
        entity: 'User',
        description: `LOGIN-USER-${email}`
    });
    // Debug logging (remove in production or use proper logging)
    console.log(`Login response status: ${res.status}`);
    console.log(`Login response data: ${JSON.stringify(res.data)}`);

    return res;
}

/**
 * Initiates password reset process
 * @param {Object} params - Password reset parameters
 * @param {string} params.email - User's email address
 * @returns {Promise<AxiosResponse>} - API response
 * @throws {Error} - If API request fails
 */
export async function resetPassword({ email }: { email: string }) {
    // Make API request to password reset endpoint
    const res = await api.post('/auth/reset-password', { email });
    return res;
}

/**
 * Logs out the current user and invalidates session
 * @returns {Promise<AxiosResponse>} - API response
 * @throws {Error} - If API request fails
 */
export async function logout() {
    // Make API request to logout endpoint
    const res = await api.post('/auth/logout');
    await saveActivity({
        route: '/auth/logout',
        method: 'POST',
        status_code: res.status,
        action: 'Logout',
        entity: 'User',
        description: 'LOGOUT-USER'
    });
    return res;
}

/**
 * Generate a random password.
 * @param {number} length Desired password length (will be at least 8).
 * @returns {string}
 */
export function generateRandomPassword(length = 8) {
    const MIN_LENGTH = 8;
    const ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        'abcdefghijklmnopqrstuvwxyz' +
        '0123456789' +
        '@&*+-._';

    // enforce minimum length
    const finalLength = Math.max(length, MIN_LENGTH);

    let pwd = '';
    for (let i = 0; i < finalLength; i++) {
        const idx = Math.floor(Math.random() * ALLOWED_CHARS.length);
        pwd += ALLOWED_CHARS[idx];
    }
    return pwd;
}

export async function sendInvite(payload: InviteUsePayload) {
    const res = await api.post('/email/send-invite', {
        email: payload.email,
        name: payload.name,
        temp_password: payload.temp_password
    });
    return { data: res.data, status: res.status };
}