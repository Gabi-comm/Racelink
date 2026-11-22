import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";
import { homeFor, isRole } from "@/lib/roles";

const PUBLIC = new Set(["/", "/request", "/about"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = !!getSessionCookie(request);

  // public site is for signed-out visitors; signed-in users go to their workspace (logout is the way back)
  if (PUBLIC.has(pathname)) {
    if (!hasCookie) return NextResponse.next();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.banned) return NextResponse.next();
    const role = isRole(session.user.role) ? session.user.role : "runner";
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  // fast cookie check lang, real role check is in requireUser()
  if (!hasCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/request",
    "/about",
    "/dashboard/:path*",
    "/register/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/races/:path*",
    "/organizer/:path*",
    "/admin/:path*",
  ],
};
