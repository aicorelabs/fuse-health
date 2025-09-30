export const DEFAULT_BACKEND_URL = "http://localhost:8002";

export function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_FUSE_HOME_BACKEND_URL?.replace(/\/$/, "") ?? DEFAULT_BACKEND_URL;
}
