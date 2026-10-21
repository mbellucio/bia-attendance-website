import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { errorResponse } from "@/lib/errors/server";

const STEAM_AUTH_PATHS = new Set(["/api/auth/steam", "/api/auth/steam/callback"]);
const MEMBER_PAGE_PATHS = ["/player-dashboard", "/attendance", "/admin-panel"];

function withHeaders(response: Response, values: Record<string, string>): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(values)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function pageSecurityPolicy(request: NextRequest): NextResponse {
  const nonce = randomBytes(18).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic'" + (isDevelopment ? " 'unsafe-eval'" : ""),
    isDevelopment
      ? "style-src 'self' 'unsafe-inline'"
      : "style-src 'self' 'nonce-" + nonce + "'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://cdn.discordapp.com",
    "font-src 'self' data:",
    "connect-src 'self' blob:" + (isDevelopment ? " ws:" : ""),
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ];
  const csp = directives.join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");
  const isSteamAuth = STEAM_AUTH_PATHS.has(path);
  const isMemberPage = MEMBER_PAGE_PATHS.some((prefix) => path === prefix || path.startsWith(prefix + "/"));

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (isApi) {
    if (isSteamAuth) return NextResponse.next();
    if (!session) return errorResponse("AUTH_REQUIRED");
    return NextResponse.next();
  }

  if (path === "/" || (isMemberPage && session)) return pageSecurityPolicy(request);
  if (isMemberPage) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/:path*", "/player-dashboard/:path*", "/attendance/:path*", "/admin-panel/:path*"],
};
