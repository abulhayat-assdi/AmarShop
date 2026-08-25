import { NextResponse, type NextRequest } from "next/server";
import {
  getRootDomain,
  getSubdomainFromHost,
  isCustomDomainHost,
} from "@/lib/tenant/subdomain";

/**
 * Subdomain + custom-domain routing (spec §4.3, §6.1).
 *
 * Resolves the tenant from the request host and rewrites tenant requests to the
 * internal `/s/...` route that renders that tenant's site:
 *  - `<sub>.<root>`  -> /s/<sub>/...    (x-tenant-subdomain header)
 *  - a custom domain -> /s/_/...        (x-tenant-host header)
 * Requests to the platform itself (root / www / reserved) pass through.
 *
 * Edge runtime — no database access here. The tenant lookup + schema selection
 * happen server-side in the tenant route, keyed off the header set here.
 */
export function middleware(request: NextRequest) {
  // Behind a reverse proxy (Traefik/Coolify) the real host may be in
  // `x-forwarded-host`; fall back to `host` for direct requests.
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const rootDomain = getRootDomain();
  const { pathname } = request.nextUrl;
  const suffix = pathname === "/" ? "" : pathname;

  const subdomain = getSubdomainFromHost(host, rootDomain);
  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/s/${subdomain}${suffix}`;
    const headers = new Headers(request.headers);
    headers.set("x-tenant-subdomain", subdomain);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (isCustomDomainHost(host, rootDomain)) {
    const url = request.nextUrl.clone();
    url.pathname = `/s/_${suffix}`;
    const headers = new Headers(request.headers);
    headers.set("x-tenant-host", (host as string).toLowerCase());
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // Platform request: keep the internal tenant path unreachable directly.
  if (pathname === "/s" || pathname.startsWith("/s/")) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, uploads, Next internals, and static
  // assets. `/uploads/*` must reach its route handler on any host.
  matcher: ["/((?!api|uploads|_next/static|_next/image|favicon.ico).*)"],
};
