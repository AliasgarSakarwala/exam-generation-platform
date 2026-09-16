import api from "@/lib/api";

export const getTables = async () => {
    try {
        const response = await api.get('/api');
        return { status: response.status, data: response.data };
    } catch (error) {
        console.error('Error fetching tables:', error);
        throw error;
    }
};
