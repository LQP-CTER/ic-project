const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(CEREBRAS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model || 'llama-3.3-70b',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cerebras API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
