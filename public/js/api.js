const API_URL = '/api';

function getAuthToken() {
    return localStorage.getItem('organoToken');
}

function saveSession(token, user) {
    localStorage.setItem('organoToken', token);
    localStorage.setItem('organoUser', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem('organoToken');
    localStorage.removeItem('organoUser');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (response.status === 401) {
        clearSession();
        if (!location.pathname.endsWith('/login.html') && location.pathname !== '/') {
            location.href = 'login.html';
        }
    }
    return response;
}
