'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { ChatMessage } from '@/lib/builder';

const STARTER_PROMPTS = [
  'A pomodoro timer with a clean minimal UI',
  'A markdown note-taking app with a live preview pane',
  'A budget tracker with categories and a pie chart',
  'A kanban board for a personal todo list',
];

export default function Home() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(promptOverride?: string) {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || loading) return;

    setError('');
    setInput('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: prompt }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentHtml: html || undefined,
          history: messages,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setHtml(data.html);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.note || 'Built it.' },
      ]);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setMessages((prev) => prev.slice(0, -1)); // roll back user message on failure
    } finally {
      setLoading(false);
    }
  }

  function downloadHtml() {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex h-screen w-full overflow-hidden">
      {/* Chat panel */}
      <div className="flex w-[400px] min-w-[340px] flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Buildable</h1>
            <p className="text-xs text-zinc-500">Describe an app. Watch it get built.</p>
          </div>
          {session?.user && (
            <div className="flex items-center gap-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-7 w-7 rounded-full"
                />
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="mb-3 text-sm text-zinc-500">Try one of these:</p>
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
                >cat > app/login/page.tsx << 'EOF'
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
EOF
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'ml-6 bg-indigo-600/20 text-indigo-100'
                    : 'mr-6 bg-zinc-900 text-zinc-300'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-6 flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                Building...
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-zinc-800 p-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={html ? 'Request a change...' : 'Describe the app you want to build...'}
              rows={2}
              className="flex-1 resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Preview panel */}
      <div className="flex flex-1 flex-col bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <div className="flex gap-1 rounded-lg bg-zinc-950 p-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`rounded-md px-3 py-1 text-sm transition ${
                activeTab === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-500'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`rounded-md px-3 py-1 text-sm transition ${
                activeTab === 'code' ? 'bg-zinc-800 text-white' : 'text-zinc-500'
              }`}
            >
              Code
            </button>
          </div>
          <button
            onClick={downloadHtml}
            disabled={!html}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-30"
          >
            Download .html
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          {!html && (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Your app preview will appear here
            </div>
          )}
          {html && activeTab === 'preview' && (
            <iframe
              key={html.length /* force refresh on change */}
              srcDoc={html}
              sandbox="allow-scripts"
              className="h-full w-full border-0"
              title="App preview"
            />
          )}
          {html && activeTab === 'code' && (
            <pre className="h-full overflow-auto bg-zinc-950 p-4 text-xs text-zinc-300">
              <code>{html}</code>
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
