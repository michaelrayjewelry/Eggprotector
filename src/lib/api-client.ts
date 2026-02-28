const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name?: string) =>
    request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    }),
  me: () => request<{ user: { id: string; email: string; name: string; role: string } }>("/api/auth/me"),
};

// Assets
export const assets = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ assets: unknown[]; total: number }>(`/api/assets${qs}`);
  },
  get: (id: string) => request(`/api/assets/${id}`),
  upload: (formData: FormData) =>
    request("/api/assets", { method: "POST", body: formData }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/api/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateTags: (id: string, tags: string[]) =>
    request(`/api/assets/${id}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    }),
  delete: (id: string) =>
    request(`/api/assets/${id}`, { method: "DELETE" }),
};

// Tags
export const tags = {
  list: () => request<{ tags: { id: string; slug: string; label: string; assetCount: number }[] }>("/api/tags"),
  create: (label: string) =>
    request("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }),
  rename: (id: string, label: string) =>
    request(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }),
  delete: (id: string) =>
    request(`/api/tags/${id}`, { method: "DELETE" }),
};

// Posts
export const posts = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ posts: unknown[]; total: number }>(`/api/posts${qs}`);
  },
  get: (id: string) => request(`/api/posts/${id}`),
  create: (data: { text: string; assetIds?: string[]; scheduledFor?: string }) =>
    request("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  approve: (id: string, execute = true) =>
    request(`/api/posts/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ execute }),
    }),
  delete: (id: string) =>
    request(`/api/posts/${id}`, { method: "DELETE" }),
};

// Agent
export const agent = {
  selectAsset: (data: Record<string, unknown>) =>
    request("/api/agent/select-asset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  run: (slot: string) =>
    request(`/api/agent/run?slot=${slot}`, { method: "POST" }),
};

// Settings
export const settings = {
  get: () => request<{ settings: Record<string, unknown> }>("/api/settings"),
  set: (key: string, value: unknown) =>
    request("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }),
  getPolicy: () => request("/api/settings/policy"),
  setPolicy: (policy: Record<string, unknown>) =>
    request("/api/settings/policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy),
    }),
  getKillSwitch: () => request<{ enabled: boolean }>("/api/settings/kill-switch"),
  setKillSwitch: (enabled: boolean) =>
    request("/api/settings/kill-switch", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    }),
};

export default { auth, assets, tags, posts, agent, settings };
