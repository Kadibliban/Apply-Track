import type {
  Application,
  ApplicationPayload,
  DashboardStats,
  FollowUp,
  Interview,
  User,
} from "./types";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const TOKEN_KEY = "applytrack.accessToken";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Could not connect to ApplyTrack. Check that the API is running.", 0);
  }

  if (response.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new CustomEvent("applytrack:unauthorized"));
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string | Array<{ msg?: string }> };
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) {
        message = body.detail.map((item) => item.msg).filter(Boolean).join(". ") || message;
      }
    } catch {
      // Keep the status-based message when an error response has no JSON body.
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const json = (method: string, payload: unknown): RequestInit => ({
  method,
  body: JSON.stringify(payload),
});

export const api = {
  async register(payload: { name: string; email: string; password: string }) {
    return request<User>("/auth/register", json("POST", payload));
  },
  async login(payload: { email: string; password: string }) {
    const result = await request<{ access_token: string; token_type: string }>(
      "/auth/login",
      json("POST", payload),
    );
    setToken(result.access_token);
    return request<User>("/auth/me");
  },
  me: () => request<User>("/auth/me"),
  logout: () => clearToken(),
  listApplications(params: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    query.set("limit", String(params.limit ?? 20));
    query.set("offset", String(params.offset ?? 0));
    return request<Application[]>(`/applications?${query.toString()}`);
  },
  getApplication: (id: number) => request<Application>(`/applications/${id}`),
  createApplication: (payload: ApplicationPayload) =>
    request<Application>("/applications", json("POST", payload)),
  updateApplication: (id: number, payload: Partial<ApplicationPayload>) =>
    request<Application>(`/applications/${id}`, json("PATCH", payload)),
  deleteApplication: (id: number) =>
    request<void>(`/applications/${id}`, { method: "DELETE" }),
  stats: () => request<DashboardStats>("/dashboard/stats"),
  upcomingInterviews: () => request<Interview[]>("/interviews/upcoming"),
  listInterviews: (applicationId: number) =>
    request<Interview[]>(`/applications/${applicationId}/interviews`),
  createInterview: (
    applicationId: number,
    payload: { interview_at: string; interview_type: string; meeting_link?: string; notes?: string },
  ) => request<Interview>(`/applications/${applicationId}/interviews`, json("POST", payload)),
  updateInterview: (id: number, payload: Partial<Interview>) =>
    request<Interview>(`/interviews/${id}`, json("PATCH", payload)),
  listFollowUps: (applicationId: number) =>
    request<FollowUp[]>(`/applications/${applicationId}/follow-ups`),
  upcomingFollowUps: () => request<FollowUp[]>("/follow-ups/upcoming"),
  overdueFollowUps: () => request<FollowUp[]>("/follow-ups/overdue"),
  createFollowUp: (applicationId: number, payload: { due_at: string; notes?: string }) =>
    request<FollowUp>(`/applications/${applicationId}/follow-ups`, json("POST", payload)),
  updateFollowUp: (id: number, payload: Partial<FollowUp>) =>
    request<FollowUp>(`/follow-ups/${id}`, json("PATCH", payload)),
};
