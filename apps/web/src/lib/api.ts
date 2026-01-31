import type { MachineInfo, UserInfo } from '@hermit/protocol/types.js';

// Use relative URLs - Next.js rewrites will proxy to relay in dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type LoginResponse = {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
};

type RegisterResponse = {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
};

type ApiError = {
  error: string;
};

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const data = (await res.json()) as ApiError;
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const api = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<LoginResponse>(res);
  },

  async register(email: string, password: string): Promise<RegisterResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<RegisterResponse>(res);
  },

  async getMachines(token: string): Promise<MachineInfo[]> {
    const res = await fetch(`${API_URL}/api/machines`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<MachineInfo[]>(res);
  },
};
