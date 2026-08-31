import { AIProvider } from './provider';

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    const contents: any[] = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await fetch(
      `${this.baseUrl}/gemini-pro:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const data = await response.json() as GeminiResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateStructured<T>(prompt: string, _schema: Record<string, unknown>, systemPrompt?: string): Promise<T> {
    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks.`
      : `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks.`;

    const text = await this.generateCompletion(fullPrompt);
    
    // Clean response - remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new Error(`Failed to parse Gemini structured response: ${cleaned.substring(0, 200)}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(
      `${this.baseUrl}/embedding-001:embedContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini embedding error: ${err}`);
    }

    const data: any = await response.json();
    return data.embedding?.values || [];
  }
}