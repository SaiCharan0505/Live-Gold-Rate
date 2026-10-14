import { CitiesApiResponse, GoldApiResponse, HistoryResponse } from '../types/gold';

const API_BASE = '/api';

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  public static async getLatestRate(city: string): Promise<GoldApiResponse> {
    return this.request<GoldApiResponse>(`/gold/latest?city=${encodeURIComponent(city)}`);
  }

  public static async getAllCities(): Promise<CitiesApiResponse> {
    return this.request<CitiesApiResponse>('/gold/cities');
  }

  public static async getHistory(city: string, period: string): Promise<HistoryResponse> {
    return this.request<HistoryResponse>(
      `/gold/history?city=${encodeURIComponent(city)}&period=${encodeURIComponent(period)}`
    );
  }

  public static async checkHealth(): Promise<{ ok: boolean; status: string; providerName: string }> {
    return this.request('/health');
  }
}
