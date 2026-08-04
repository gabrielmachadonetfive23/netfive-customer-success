import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

// O middleware do Next.js roda em Edge runtime e não tem acesso ao Prisma/SQLite
// (dependência nativa Node). Por isso ele faz apenas uma checagem rápida de
// presença do cookie para redirecionar imediatamente usuários sem sessão.
// A validação autoritativa (hash, expiração em 48h) acontece no servidor,
// em src/app/(protected)/layout.tsx e em cada rota de API, via
// requireSessionEmail(), que consulta o banco e retorna 401/redirect quando
// a sessão é inválida ou expirou.
const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/visitas",
  "/clientes",
  "/estatisticas",
  "/noticias",
  "/nps",
  "/qbr",
  "/reunioes",
  "/trocar-senha",
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasCookie = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/visitas/:path*",
    "/clientes/:path*",
    "/estatisticas/:path*",
    "/noticias/:path*",
    "/nps/:path*",
    "/qbr/:path*",
    "/reunioes/:path*",
    "/trocar-senha/:path*",
  ],
};
