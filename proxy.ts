import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// fast cookie check lang, real role check is in requireUser()
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/register/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/organizer/:path*",
    "/admin/:path*",
  ],
};
