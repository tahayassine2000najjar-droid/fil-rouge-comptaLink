const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

async function publicRequest(endpoint, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.errors && data.errors.length > 0) throw new Error(data.errors[0].message);
    throw new Error(data.message || 'Une erreur est survenue');
  }
  return data;
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    throw new Error(data.message || 'Session expirée');
  }
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  return data.data.accessToken;
}

async function fetchWithAuth(endpoint, options = {}) {
  let token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      token = await refreshPromise;
      headers.Authorization = `Bearer ${token}`;
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw err;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.message || 'Une erreur est survenue');
  }

  return data;
}

export const authApi = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Échec de la connexion');
    return data;
  },

  register: async (payload) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.errors && data.errors.length > 0) throw new Error(data.errors[0].message);
      throw new Error(data.message || 'Échec de l\'inscription');
    }
    return data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getMe: () => fetchWithAuth('/me'),
  updateMe: (data) => fetchWithAuth('/me', { method: 'PATCH', body: JSON.stringify(data) }),

  verifyEmail: (token) => publicRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email) =>
    publicRequest('/auth/resend-verification', { method: 'POST', body: { email } }),
  forgotPassword: (email) =>
    publicRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) =>
    publicRequest('/auth/reset-password', { method: 'POST', body: { token, password } }),
};

export const cabinetApi = {
  getAll: () => fetchWithAuth('/cabinets'),
  getById: (id) => fetchWithAuth(`/cabinets/${id}`),
  getMyCabinet: () => fetchWithAuth('/cabinet/me'),
  updateMyCabinet: (data) => fetchWithAuth('/cabinet/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const entrepriseApi = {
  getMyEntreprise: () => fetchWithAuth('/entreprise/me'),
  updateMyEntreprise: (data) => fetchWithAuth('/entreprise/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const quoteApi = {
  createQuote: (data) => fetchWithAuth('/quotes', { method: 'POST', body: JSON.stringify(data) }),
  getMyQuotes: () => fetchWithAuth('/quotes'),
  getQuoteById: (id) => fetchWithAuth(`/quotes/${id}`),
  updateQuote: (id, data) => fetchWithAuth(`/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteQuote: (id) => fetchWithAuth(`/quotes/${id}`, { method: 'DELETE' }),
  respondToQuote: (id, data) => fetchWithAuth(`/quotes/${id}/respond`, { method: 'POST', body: JSON.stringify(data) }),
  sendMessage: (id, body) => fetchWithAuth(`/quotes/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  acceptTerms: (id) => fetchWithAuth(`/quotes/${id}/accept-terms`, { method: 'POST' }),
  cancelQuote: (id) => fetchWithAuth(`/quotes/${id}/cancel`, { method: 'POST' }),
};
