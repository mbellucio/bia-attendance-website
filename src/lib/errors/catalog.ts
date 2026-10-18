export const errorCatalog = {
  AUTH_REQUIRED: { status: 401, message: "Please sign in through Steam to continue." },
  FORBIDDEN: { status: 403, message: "You do not have permission to access this resource." },
  ACCOUNT_NOT_FOUND: { status: 404, message: "Your account record could not be found." },
  PLAYER_NOT_FOUND: { status: 404, message: "Your Steam account has no linked player record." },
  EVENT_NOT_FOUND: { status: 404, message: "This event could not be found." },
  RESOURCE_NOT_FOUND: { status: 404, message: "This record could not be found." },
  INVALID_REQUEST: { status: 400, message: "Some request information is invalid. Please check and try again." },
  INVALID_FACTION: { status: 400, message: "Please choose a valid faction." },
  CONFLICT: { status: 409, message: "This record changed. Refresh the page and try again." },
  RATE_LIMITED: { status: 429, message: "Too many requests. Please wait a moment and try again." },
  SERVICE_UNAVAILABLE: { status: 503, message: "The service is temporarily unavailable. Please try again shortly." },
  INTERNAL_ERROR: { status: 500, message: "Something went wrong. Please try again." },
  NETWORK_ERROR: { status: 0, message: "Could not reach the service. Check your connection and try again." },
  INVALID_RESPONSE: { status: 502, message: "The service returned an unexpected response. Please try again." },
} as const;

export type ErrorCode = keyof typeof errorCatalog;
export type ApiFailure = { error: { code: ErrorCode; message: string } };

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && Object.hasOwn(errorCatalog, value);
}

export function errorCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400: return "INVALID_REQUEST";
    case 401: return "AUTH_REQUIRED";
    case 403: return "FORBIDDEN";
    case 404: return "RESOURCE_NOT_FOUND";
    case 409: return "CONFLICT";
    case 429: return "RATE_LIMITED";
    case 502: return "INVALID_RESPONSE";
    case 503: return "SERVICE_UNAVAILABLE";
    default: return "INTERNAL_ERROR";
  }
}

export class AppError extends Error {
  readonly status: number;
  constructor(public readonly code: ErrorCode, status?: number) {
    super(errorCatalog[code].message);
    this.name = "AppError";
    this.status = status ?? errorCatalog[code].status;
  }
}
