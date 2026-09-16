import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api/proxy',
    withCredentials: true,
    validateStatus: () => true,
});

export default api;
