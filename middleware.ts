import { NextRequest, NextResponse } from "next/server";
import { regionForCountry, isRegionId } from "./lib/regions";

// Geo-detect on the bare root and redirect to the right storefront.
// Static assets, API routes and already-prefixed paths pass through.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];

  // Already in a region or a non-page path → leave alone.
  if (isRegionId(first)) return NextResponse.next();

  if (pathname === "/" || pathname === "") {
    const country = req.headers.get("x-vercel-ip-country") || undefined;
    const region = regionForCountry(country);
    const url = req.nextUrl.clone();
    url.pathname = `/${region}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on pages only — skip api, _next, static files, and the admin area.
    "/((?!api|admin|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
