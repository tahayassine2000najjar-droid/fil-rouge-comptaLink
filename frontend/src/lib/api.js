const API_URL = 'http://localhost:4000/api';

export const authApi = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Échec de la connexion');
    }
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
      // Handle Zod validation errors if any
      if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors[0].message);
      }
      throw new Error(data.message || 'Échec de l\'inscription');
    }
    return data;
  }
};
