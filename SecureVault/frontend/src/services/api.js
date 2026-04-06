const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async register(email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async getPasswords() {
    return this.request('/passwords');
  }

  async createPassword(data) {
    return this.request('/passwords', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePassword(id, data) {
    return this.request(`/passwords/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deletePassword(id) {
    return this.request(`/passwords/${id}`, {
      method: 'DELETE'
    });
  }

  async toggleFavorite(id) {
    return this.request(`/passwords/${id}/favorite`, {
      method: 'POST'
    });
  }

  async getCategories() {
    return this.request('/vault/categories');
  }
}

export const api = new ApiService();
