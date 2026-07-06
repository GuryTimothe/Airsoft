import { NextResponse, type NextRequest } from "next/server";

const AUTH_TOKEN_KEY = "ma_access_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;

  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
