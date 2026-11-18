'use strict';

function createApiClient({ baseUrl = '', getToken = null, defaultHeaders = {}, fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== 'function') {
        throw new Error('A fetch implementation is required');
    }

    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

    async function request(path, { method = 'GET', body, headers = {}, ...options } = {}) {
        const url = path.startsWith('http') ? path : `${cleanBaseUrl}/${path.replace(/^\/+/, '')}`;

        const finalHeaders = {
            ...defaultHeaders,
            ...headers
        };

        if (typeof getToken === 'function') {
            const token = await getToken();
            if (token) {
                finalHeaders.Authorization = `Bearer ${token}`;
            }
        }

        const fetchOptions = {
            method,
            headers: finalHeaders,
            ...options
        };

        if (body !== undefined) {
            if (typeof body === 'object' && !(body instanceof FormData)) {
                finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
                fetchOptions.body = JSON.stringify(body);
            } else {
                fetchOptions.body = body;
            }
        }

        const res = await fetchImpl(url, fetchOptions);

        // Handle empty responses like 204 No Content
        if (res.status === 204) {
            return null;
        }

        const text = await res.text();
        let payload = null;
        if (text) {
            try {
                payload = JSON.parse(text);
            } catch {
                payload = text;
            }
        }

        if (!res.ok) {
            const message = payload?.error?.message || payload?.message || `HTTP ${res.status}`;
            const err = new Error(message);
            err.statusCode = res.status;
            err.details = payload?.error?.details || null;
            throw err;
        }

        // Unwrap standard api-kit envelope { success: true, data }
        if (payload && typeof payload === 'object' && payload.success === true && 'data' in payload) {
            return payload.data;
        }

        return payload;
    }

    return {
        request,
        get: (path, opts) => request(path, { ...opts, method: 'GET' }),
        post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
        patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
        delete: (path, opts) => request(path, { ...opts, method: 'DELETE' })
    };
}

module.exports = { createApiClient };
