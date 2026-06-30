import GoogleProvider from 'next-auth/providers/google';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // Optional allowlist: if ALLOWED_EMAILS is set (comma-separated), only those
  // emails may sign in. Leave unset to allow any Google account.
  callbacks: {
    async signIn({ user }) {
      const allowList = process.env.ALLOWED_EMAILS;
      if (!allowList) return true;
      const allowed = allowList.split(',').map((e) => e.trim().toLowerCase());
      return !!user.email && allowed.includes(user.email.toLowerCase());
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
