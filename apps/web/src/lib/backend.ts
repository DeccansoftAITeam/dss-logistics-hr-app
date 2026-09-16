export function getBackendUrl(): string {
  const raw = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  return raw.startsWith("http") ? raw : `https://${raw}`;
}
