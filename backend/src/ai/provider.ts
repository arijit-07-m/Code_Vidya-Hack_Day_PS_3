export interface AIProvider {
  generateCompletion(prompt: string, systemPrompt?: string): Promise<string>;
  generateStructured<T>(prompt: string, schema: Record<string, unknown>, systemPrompt?: string): Promise<T>;
  generateEmbedding(text: string): Promise<number[]>;
  name: string;
}