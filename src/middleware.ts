import { NextResponse, type NextRequest } from "next/server";
import { getRootDomain, getSubdomainFromHost } from "@/lib/tenant/subdomain";

/**
 * Subdomain routing (spec §4.3).
 *
 * Resolves the tenant subdomain from the request host and rewrites tenant
 * requests to the internal `/s/<subdomain>` route that renders that tenant's
 * site. Requests to the platform itself (root domain / www / reserved names)
 * pass through untouched so the SaaS app (sign-up, login, dashboard, admin)
 * works as normal.
 *
 * This runs on the Edge runtime and must not touch the database: it only parses
 * the host. The actual tenant lookup + schema selection happens server-side in
 * the tenant route (Node), keyed off the subdomain resolved here.
 */
export function middleware(request: NextRequest) {
  // Behind a reverse proxy (Traefik/Coolify) the real host may be in
  // `x-forwarded-host`; fall back to `host` for direct requests.
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const subdomain = getSubdomainFromHost(host, getRootDomain());

  const { pathname } = request.nextUrl;
  const isInternalSitePath = pathname === "/s" || pathname.startsWith("/s/");

  if (!subdomain) {
    // Platform request: keep the internal tenant path unreachable directly.
    if (isInternalSitePath) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  // Tenant request: rewrite to the internal site route and tag it so the route
  // can confirm it arrived via this middleware (not a direct /s/... visit).
  const url = request.nextUrl.clone();
  url.pathname = `/s/${subdomain}${pathname === "/" ? "" : pathname}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-subdomain", subdomain);

  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
