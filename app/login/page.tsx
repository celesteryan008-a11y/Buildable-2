'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Buildable</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Sign in to start building apps with AI.
        </p>
        <button
          onClick={() => signIn('github', { callbackUrl: '/' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
        >
          Continue with GitHub
        </button>
      </div>
    </main>
  );
}
