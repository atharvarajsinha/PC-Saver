const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class ApiService {
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    return data;
  }

  async stats() {
    const response = await fetch(`${API_BASE_URL}/stats/`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    return this.handleResponse(response);
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async register(email: string, password: string, full_name: string) {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password, full_name }),
    });
    return this.handleResponse(response);
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/me/`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateProfile(full_name: string) {
    const response = await fetch(`${API_BASE_URL}/update/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ full_name }),
    });
    return this.handleResponse(response);
  }

  async changePassword(old_password: string, new_password: string, confirm_password: string) {
    const response = await fetch(`${API_BASE_URL}/change-password/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ old_password, new_password, confirm_password }),
    });
    return this.handleResponse(response);
  }

  async getDatabases() {
    const response = await fetch(`${API_BASE_URL}/databases/`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getDatabase(id: number) {
    const response = await fetch(`${API_BASE_URL}/databases/${id}/`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createDatabase(data: any) {
    const response = await fetch(`${API_BASE_URL}/databases/create/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async updateDatabase(id: number, data: any) {
    const response = await fetch(`${API_BASE_URL}/databases/${id}/update/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteDatabase(id: number) {
    const response = await fetch(`${API_BASE_URL}/databases/${id}/delete/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async revealPassword(id: number, password: string) {
    const response = await fetch(`${API_BASE_URL}/databases/${id}/reveal-password/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ password }),
    });
    return this.handleResponse(response);
  }

  async testConnection(id: number) {
    const response = await fetch(`${API_BASE_URL}/databases/${id}/test/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    return this.handleResponse(response);
  }

  async testPooler(id: number, num_requests: number) {
    const response = await fetch(`${API_BASE_URL}/test-pooler/${id}/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ num_requests }),
    });
    return this.handleResponse(response);
  }

  async testDirect(id: number, num_requests: number) {
    const response = await fetch(`${API_BASE_URL}/test-direct/${id}/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ num_requests }),
    });
    return this.handleResponse(response);
  }

  async comparePooler(id: number, num_requests: number) {
    const response = await fetch(`${API_BASE_URL}/compare-pooler/${id}/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ num_requests }),
    });
    return this.handleResponse(response);
  }
}

export const api = new ApiService();
