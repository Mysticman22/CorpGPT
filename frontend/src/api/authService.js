import api from './axios';

export const authService = {
    login: async (email, password, department, position) => {
        const response = await api.post('/auth/login', { email, password, department, position });
        return response.data;
    },

    register: async (email, password, fullName, contactNumber, department, position) => {
        const response = await api.post('/auth/register', {
            email,
            password,
            full_name: fullName,
            contact_number: contactNumber,
            department,
            position
        });
        return response.data;
    },

    // OTP Authentication
    requestOTP: async (email) => {
        const response = await api.post('/auth/request-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, otpCode) => {
        const response = await api.post('/auth/verify-otp', {
            email,
            otp_code: otpCode
        });
        return response.data;
    },

    // Admin endpoints
    getPendingUsers: async () => {
        const response = await api.get('/admin/pending-users');
        return response.data;
    },

    approveUser: async (userId) => {
        const response = await api.post(`/admin/users/${userId}/approve`);
        return response.data;
    },

    rejectUser: async (userId, reason = '') => {
        const response = await api.post(`/admin/users/${userId}/reject`, { reason });
        return response.data;
    },

    suspendUser: async (userId) => {
        const response = await api.post(`/admin/users/${userId}/suspend`);
        return response.data;
    },

    activateUser: async (userId) => {
        const response = await api.post(`/admin/users/${userId}/activate`);
        return response.data;
    },

    forceLogout: async (userId) => {
        const response = await api.post(`/admin/users/${userId}/force-logout`);
        return response.data;
    },

    updateUserRole: async (userId, role) => {
        const response = await api.patch(`/admin/users/${userId}/role`, { role });
        return response.data;
    },

    getAdminMetrics: async () => {
        const response = await api.get('/admin/metrics');
        return response.data;
    },

    getAdminUsers: async (params = {}) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    getAuditLogs: async (params = {}) => {
        const response = await api.get('/admin/audit-logs', { params });
        return response.data;
    },

    getAllUsers: async () => {
        const response = await api.get('/admin/users/all');
        return response.data;
    },

    getDashboardMetrics: async () => {
        const response = await api.get('/admin/metrics');
        return response.data;
    },

    getDepartmentChatLogs: async () => {
        const response = await api.get('/admin/department-chat-logs');
        return response.data;
    },

    // Metadata
    getDepartments: async () => {
        const response = await api.get('/departments');
        return response.data;
    },

    getPositions: async () => {
        const response = await api.get('/meta/positions');
        return response.data;
    }
};

