import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const pathname = request.nextUrl.pathname;

  // Route protette
  const protectedRoutes = ['/dashboard', '/jobs', '/quotes', '/clients', '/materials', '/checklists', '/users'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Route pubbliche (auth)
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.includes(pathname);

  // Se è una route protetta e non c'è token, redirect a login
  if (isProtectedRoute && !token) {
    // Verifica anche localStorage (per client-side)
    // Nota: middleware non può accedere a localStorage, quindi gestiamo questo lato client
    return NextResponse.next();
  }

  // Se è una route auth e c'è token, redirect a dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|offline.html).*)'],
};

