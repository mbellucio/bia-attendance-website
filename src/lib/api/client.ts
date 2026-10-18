import { notifyError } from "@/lib/notifications";
import { AppError, errorCodeForStatus, isErrorCode } from "@/lib/errors/catalog";

type RequestOptions = Omit<RequestInit, "method" | "body"> & { notifyOnError?: boolean };

async function request<T>(method: string, endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const { notifyOnError = true, ...init } = options;
  try {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (body !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(endpoint, {
      ...init,
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return undefined as T;
    let result: unknown;
    try { result = await response.json(); } catch {
      throw new AppError(response.ok ? "INVALID_RESPONSE" : errorCodeForStatus(response.status), response.ok ? 502 : response.status);
    }
    if (!response.ok) {
      const error = result && typeof result === "object" && "error" in result ? result.error : null;
      const code = error && typeof error === "object" && "code" in error && isErrorCode(error.code)
        ? error.code : errorCodeForStatus(response.status);
      throw new AppError(code, response.status);
    }
    return result as T;
  } catch (cause) {
    if (init.signal?.aborted || (cause instanceof Error && cause.name === "AbortError")) throw cause;
    const error = cause instanceof AppError ? cause : new AppError("NETWORK_ERROR");
    if (notifyOnError) notifyError(error.message);
    throw error;
  }
}

export const network = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>("GET", endpoint, undefined, options),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>("POST", endpoint, body, options),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", endpoint, body, options),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", endpoint, body, options),
  delete: <T>(endpoint: string, options?: RequestOptions) => request<T>("DELETE", endpoint, undefined, options),
};
