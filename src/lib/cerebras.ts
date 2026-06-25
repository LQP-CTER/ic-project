const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY?.trim();
const DEFAULT_MODEL = import.meta.env.VITE_CEREBRAS_MODEL?.trim() || 'gpt-oss-120b';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CerebrasMessage {
  content?: string;
  reasoning?: string;
}

interface CerebrasResponse {
  choices?: Array<{
    message?: CerebrasMessage;
    finish_reason?: string;
  }>;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!API_KEY) {
    throw new Error('VITE_CEREBRAS_API_KEY is not configured');
  }

  const model = options?.model || DEFAULT_MODEL;
  const res = await fetch(CEREBRAS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cerebras API error ${res.status}${errText ? `: ${errText}` : ''}`);
  }

  const data = await res.json() as CerebrasResponse;
  const message = data.choices?.[0]?.message;
  const content = message?.content?.trim();

  if (content) return content;

  throw new Error('Cerebras API returned an empty message content');
}