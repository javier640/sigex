/**
 * SIGEX · Proxy (antes "middleware" en Next.js 15)
 *
 * Primera barrera de acceso. Corre ANTES de renderizar cada ruta:
 *  - Sin sesión válida            → redirige a /login?from=<ruta>
 *  - Con sesión pero sin permiso  → redirige a /no-autorizado
 *  - Con sesión y permiso         → deja pasar y marca la respuesta como no cacheable
 *
 * No es la única barrera: páginas, Server Actions y Route Handlers vuelven
 * a validar sesión y permisos por su cuenta (doble validación).
 *
 * En Next.js 16 el proxy corre en el runtime de Node.js, por eso puede
 * consultar la BD con Prisma para validar la sesión.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, validarTokenSesion } from "@/lib/session";
import { can, permisoRequeridoParaRuta } from "@/lib/permissions";

/** Rutas accesibles sin sesión. */
const RUTAS_PUBLICAS: readonly RegExp[] = [
  /^\/login\/?$/,
  /^\/recuperar\/?$/,
  /^\/restablecer\/[^/]+\/?$/,
];

function esRutaPublica(pathname: string): boolean {
  return RUTAS_PUBLICAS.some((patron) => patron.test(pathname));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // La raíz no tiene contenido propio
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Las Server Actions llegan como POST a la ruta de la página. No se
  // redirigen aquí porque el cliente espera una respuesta de la acción,
  // no una página; cada acción valida sesión y permisos por sí misma.
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }

  if (esRutaPublica(pathname)) {
    return NextResponse.next();
  }

  // ── Validar sesión ──
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  let sesion;
  try {
    sesion = token ? await validarTokenSesion(token) : null;
  } catch (error) {
    // Si la BD no responde se niega el acceso (falla cerrada), sin exponer detalles
    console.error("[proxy] No se pudo validar la sesión:", error);
    return new NextResponse("Servicio no disponible temporalmente.", { status: 503 });
  }

  if (!sesion) {
    const urlLogin = new URL("/login", request.url);
    urlLogin.searchParams.set("from", pathname + search);
    const respuesta = NextResponse.redirect(urlLogin);
    // Si había una cookie pero ya no sirve (expiró, usuario inactivo), se limpia
    if (token) respuesta.cookies.delete(SESSION_COOKIE);
    return respuesta;
  }

  // ── Validar permiso de la ruta ──
  const permiso = permisoRequeridoParaRuta(pathname);
  if (permiso && !can(sesion.usuario, permiso)) {
    return NextResponse.redirect(new URL("/no-autorizado", request.url));
  }

  // ── Dejar pasar ──
  const respuesta = NextResponse.next();
  // Evita que el navegador guarde páginas protegidas: tras el logout,
  // el botón Atrás tiene que pedirlas de nuevo al servidor (y el proxy
  // lo manda a /login) en lugar de mostrarlas desde su caché.
  respuesta.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return respuesta;
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto:
     *  - api/          → los Route Handlers responden 401/403 en JSON por sí mismos
     *  - _next/static  → archivos del build
     *  - _next/image   → optimización de imágenes
     *  - archivos estáticos (favicon, imágenes, robots.txt, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};