import api from '../lib/api';

interface ActivityLogPayload {
    action?: string;
    entity?: string;
    entity_id?: number;
    classroom_id?: number;
    exam_id?: number;
    description?: string;
    route?: string;
    method?: string;
    status_code?: number;
    payload?: any;
}

export async function saveActivity(payload: ActivityLogPayload) {
    const response = await api.post("/activity-logs", payload);
    return { status: response.status, data: response.data };
}

interface ActivityLogFilters {
    user_id?: number;
    classroom_id?: number;
    exam_id?: number;
    action?: string;
    entity?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
}

export async function getActivityLogs(filters?: ActivityLogFilters) {
    const params = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value.toString());
            }
        });
    }
    
    const response = await api.get(`/activity-logs?${params.toString()}`);
    return { status: response.status, data: response.data };
}

export async function getActivityStats(dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    const response = await api.get(`/activity-logs/stats?${params.toString()}`);
    return { status: response.status, data: response.data };
}

export async function getKPIStats() {
    const response = await api.get('/activity-logs/kpi-stats');
    return { status: response.status, data: response.data };
}

export async function getClassroomActivities(classroomId: number) {
    const response = await api.get(`/activity-logs/classroom/${classroomId}/activities`);
    return { status: response.status, data: response.data };
}

export async function getUserActivities(userId: number) {
    const response = await api.get(`/activity-logs/user/${userId}/activities`);
    return { status: response.status, data: response.data };
}

interface GraphDataParams {
    type: 'logins' | 'exams' | 'questions';
    granularity: 'day' | 'week' | 'month';
    date_from?: string;
    date_to?: string;
}

export async function getGraphData(params: GraphDataParams) {
    const queryParams = new URLSearchParams();
    queryParams.append('type', params.type);
    queryParams.append('granularity', params.granularity);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    
    const response = await api.get(`/activity-logs/graph-data?${queryParams.toString()}`);
    return { status: response.status, data: response.data };
}

interface SystemActivityFilters {
    dateRange?: 'all' | 'week' | 'month' | 'custom';
    activityType?: 'all' | 'create' | 'update' | 'delete' | 'view';
    userType?: 'all' | 'professor' | 'student' | 'admin' | 'ta';
    date_from?: string;
    date_to?: string;
    per_page?: number;
}

export async function getAllSystemActivities(filters?: SystemActivityFilters) {
    const params = new URLSearchParams();
    
    // Apply date range filter
    if (filters?.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        switch (filters.dateRange) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                params.append('date_from', weekAgo.toISOString().split('T')[0]);
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                params.append('date_from', monthAgo.toISOString().split('T')[0]);
                break;
            case 'custom':
                if (filters.date_from) params.append('date_from', filters.date_from);
                if (filters.date_to) params.append('date_to', filters.date_to);
                break;
        }
    }
    
    // Apply activity type filter
    if (filters?.activityType && filters.activityType !== 'all') {
        const activityMap = {
            'create': 'Create',
            'update': 'Update',
            'delete': 'Delete',
            'view': 'View'
        };
        params.append('action', activityMap[filters.activityType]);
    }
    
    // Apply user type filter
    if (filters?.userType && filters.userType !== 'all') {
        const userRoleMap = {
            'professor': 'Professor',
            'student': 'Student',
            'admin': 'Admin',
            'ta': 'TA'
        };
        params.append('user_role', userRoleMap[filters.userType]);
    }
    
    // Set pagination - use larger page size for reports
    params.append('per_page', (filters?.per_page || 1000).toString());
    
    const response = await api.get(`/activity-logs?${params.toString()}`);
    return { status: response.status, data: response.data };
}