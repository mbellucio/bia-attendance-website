import { AppError, errorCatalog, type ApiFailure, type ErrorCode } from "./catalog";

export function errorResponse(code: ErrorCode): Response {
  const entry = errorCatalog[code];
  const body: ApiFailure = { error: { code, message: entry.message } };
  return Response.json(body, { status: entry.status || 500, headers: { "Cache-Control": "private, no-store" } });
}

export function handleApiError(cause: unknown): Response {
  return errorResponse(cause instanceof AppError ? cause.code : "INTERNAL_ERROR");
}
