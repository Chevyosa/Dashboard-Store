import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decideRedirect, SESSION_COOKIE } from "@/lib/session-cookie";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const decision = decideRedirect({
    hasSession,
    pathname: request.nextUrl.pathname,
    searchParams: request.nextUrl.searchParams,
  });

  if (decision.redirect) {
    const url = new URL(decision.destination, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/...)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
