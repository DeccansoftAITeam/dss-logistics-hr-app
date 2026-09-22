export function getBackendUrl(): string {
  // On Render, services in the same region communicate over the private network.
  // The Blueprint wires BACKEND_PRIVATE_HOST / BACKEND_PRIVATE_PORT to the API
  // service automatically, so each participant's frontend talks to THEIR OWN
  // backend without typing any URL.
  const host = process.env.BACKEND_PRIVATE_HOST;
  const port = process.env.BACKEND_PRIVATE_PORT;
  if (host && port) return `http://${host}:${port}`;

  const raw = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  return raw.startsWith("http") ? raw : `https://${raw}`;
}
