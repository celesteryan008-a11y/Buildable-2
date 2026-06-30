import GitHubProvider from 'next-auth/providers/github';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],
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
