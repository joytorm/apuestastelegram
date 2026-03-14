'use client';

import { useState, useRef, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { IconSend, IconLoader2 } from '@tabler/icons-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMeta {
  provider?: string;
  model?: string;
  fallback?: boolean;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<ChatMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantContent =
        data.choices?.[0]?.message?.content ?? 'No response received.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
      setMeta({
        provider: data._meta?.provider,
        model: data._meta?.model,
        fallback: data._meta?.fallback,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      pageTitle='AI Playground'
      pageDescription='Test the AI proxy/router with auto-fallback across providers.'
    >
      <div className='flex flex-col gap-4'>
        {meta && (
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>{meta.provider}</Badge>
            <Badge variant='outline'>{meta.model}</Badge>
            {meta.fallback && <Badge variant='outline'>Fallback used</Badge>}
            {meta.totalTokens != null && (
              <span className='text-muted-foreground text-xs'>
                {meta.totalTokens} tokens ({meta.promptTokens}p / {meta.completionTokens}c)
              </span>
            )}
          </div>
        )}

        <Card className='flex flex-col' style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>Chat</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-1 flex-col overflow-hidden'>
            <div
              ref={scrollRef}
              className='flex-1 space-y-4 overflow-y-auto pr-2'
            >
              {messages.length === 0 && (
                <p className='text-muted-foreground py-8 text-center text-sm'>
                  Send a message to test the AI proxy. It will auto-route through: SambaNova → Groq → Cerebras → Google AI → Mistral → NVIDIA
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <pre className='whitespace-pre-wrap font-sans'>{msg.content}</pre>
                  </div>
                </div>
              ))}
              {loading && (
                <div className='flex justify-start'>
                  <div className='bg-muted rounded-lg px-3 py-2'>
                    <IconLoader2 className='h-4 w-4 animate-spin' />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className='mt-2 text-sm text-red-600 dark:text-red-400'>{error}</p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className='mt-3 flex gap-2'
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Type a message...'
                disabled={loading}
              />
              <Button type='submit' size='icon' disabled={loading || !input.trim()}>
                <IconSend className='h-4 w-4' />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
