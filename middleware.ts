import { NextRequest, NextResponse } from "next/server";
import { getMiddlewareAuthState } from "@/lib/supabase/middleware";

const protectedRoutes = [
  "/dashboard",
  "/ventas",
  "/costos",
  "/costos-por-collar",
  "/gastos",
  "/retiros",
  "/configuracion-financiera",
  "/resumen-mensual",
  "/asistente",
];

const authRoutes = ["/login", "/registro"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request: NextRequest) {
  const { user, response } = await getMiddlewareAuthState(request);
  const isAuthenticated = Boolean(user);
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && matchesRoute(pathname, protectedRoutes)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && matchesRoute(pathname, authRoutes)) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/registro",
    "/dashboard/:path*",
    "/ventas/:path*",
    "/costos/:path*",
    "/costos-por-collar/:path*",
    "/gastos/:path*",
    "/retiros/:path*",
    "/configuracion-financiera/:path*",
    "/resumen-mensual/:path*",
    "/asistente/:path*",
  ],
};
