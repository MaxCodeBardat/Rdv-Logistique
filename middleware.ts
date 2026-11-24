import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/session';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isAdminRoute = path.startsWith('/admin');
  const isLoginPage = path === '/admin/login';

  const token = req.cookies.get('session')?.value;
  const session = await decrypt(token);

  // 🚫 pas connecté → redirection login
  if (isAdminRoute && !session && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // 🔁 déjà connecté → pas besoin login
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
