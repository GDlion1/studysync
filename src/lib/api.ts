
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


export const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};


export const apiFetch = async (endpoint: string, options: any = {}) => {
    const url = `${API_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers,
    };

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Request failed');
    }

    return res.json();
};

export const api = {
    get: (endpoint: string) => apiFetch(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body: any) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (endpoint: string, body: any) => apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' }),
    upload: async (endpoint: string, formData: FormData) => {
        const url = `${API_URL}${endpoint}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
            },
            body: formData,
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || 'Upload failed');
        }
        return res.json();
    }
};
