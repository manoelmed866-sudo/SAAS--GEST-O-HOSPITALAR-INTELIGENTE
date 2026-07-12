import { NextResponse, type NextRequest } from "next/server";
import { getLoginPath } from "@/lib/auth/redirects";
import { refreshSession } from "@/lib/supabase/proxy";

function isProtectedPath(pathname: string): boolean {
  return pathname === "/painel" || pathname.startsWith("/painel/");
}

function isLoginPath(pathname: string): boolean {
  return pathname === "/login";
}

function copyCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });

  return target;
}

export async function proxy(request: NextRequest) {
  const { response, claims } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !claims) {
    const loginUrl = new URL(getLoginPath(pathname), request.url);

    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (isLoginPath(pathname) && claims) {
    const panelUrl = new URL("/painel", request.url);

    return copyCookies(response, NextResponse.redirect(panelUrl));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)",
  ],
};
