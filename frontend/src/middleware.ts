import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api", "/_next", "/favicon.ico", "/docs", "/openapi.json", "/redoc"];
const AUTH_COOKIE = "dmics_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/docs" || pathname === "/openapi.json" || pathname === "/redoc") {
    return NextResponse.rewrite(new URL(`/api${pathname}`, request.url));
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.get(AUTH_COOKIE)?.value;

  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
