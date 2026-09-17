const API_URL = 'http://localhost:4001/api';

// Fonction d'aide pour faire des requêtes avec le token JWT
async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      // Déconnexion automatique si le token est expiré ou invalide
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
    const data = await res.json();
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
