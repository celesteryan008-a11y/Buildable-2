export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login (sign-in page)
     * - /api/auth/* (NextAuth's own routes)
     * - Next.js static/image assets and favicon
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
