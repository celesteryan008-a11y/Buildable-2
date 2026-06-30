import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { SYSTEM_PROMPT, extractHtml, ChatMessage } from '@/lib/builder';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in with Google to generate apps.' },
        { status: 401 }
      );
    }

    const { allowed, remaining } = checkRateLimit(session.user.email);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily generation limit reached. Try again tomorrow.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const prompt: string = body.prompt;
    const currentHtml: string | undefined = body.currentHtml;
    const history: ChatMessage[] = body.history || [];

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project settings.' },
        { status: 500 }
      );
    }

    const userTurn = currentHtml
      ? `Here is the CURRENT full HTML document of the app:\n\n\`\`\`html\n${currentHtml}\n\`\`\`\n\nNow apply this change request:\n${prompt}`
      : `Build this app from scratch:\n${prompt}`;

    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({ role: m.role, content: m.content } as Anthropic.MessageParam)),
      { role: 'user', content: userTurn },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '';

    if (!raw) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 502 });
    }

    const { html, note } = extractHtml(raw);

    return NextResponse.json({ html, note, raw, remaining });
  } catch (err: any) {
    console.error('Generate error:', err);
    return NextResponse.json(
      { error: err?.message || 'Unknown server error' },
      { status: 500 }
    );
  }
}
