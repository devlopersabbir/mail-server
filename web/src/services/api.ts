import {
  APIResponse,
  ConfigResponse,
  ConfigUpdateRequest,
  EmailMessage,
  Job,
  Metrics,
} from "../types";

const env = (import.meta as any).env || {};
const API_BASE = (
  env.VITE_API_BASE_URL ||
  env.VITE_API_BASE ||
  "https://mail-server-tau.vercel.app"
).replace(/\/$/, "");

export async function fetchHealth(): Promise<APIResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Backend server unreachable");
  return res.json();
}

export async function fetchMetrics(): Promise<APIResponse<Metrics>> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function fetchConfiguration(): Promise<
  APIResponse<ConfigResponse>
> {
  const res = await fetch(`${API_BASE}/configuration`);
  if (!res.ok) throw new Error("Failed to fetch configuration");
  return res.json();
}

export async function updateConfiguration(
  config: ConfigUpdateRequest,
): Promise<APIResponse<ConfigResponse>> {
  const res = await fetch(`${API_BASE}/configuration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to update configuration");
  }
  return res.json();
}

export async function sendEmail(
  payload: EmailMessage,
  isSync: boolean = false,
): Promise<APIResponse> {
  const endpoint = isSync
    ? `${API_BASE}/send-email/sync`
    : `${API_BASE}/send-email`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Email dispatch failed");
  }
  return data;
}

export async function fetchJobStatus(jobId: string): Promise<APIResponse<Job>> {
  const res = await fetch(
    `${API_BASE}/job-status?id=${encodeURIComponent(jobId)}`,
  );
  if (!res.ok) throw new Error("Failed to fetch job status");
  return res.json();
}
