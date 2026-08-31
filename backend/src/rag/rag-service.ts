import { AIProvider } from '../ai/provider';
import { firestore } from '../services/firebase';
import { COLLECTIONS } from '@clubops/config';
import { DocumentChunk } from '@clubops/types';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;

  const words = text.split(/\s+/);
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).length > size && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap words
      const overlapWords = current.split(/\s+/).slice(-Math.floor(overlap / 5));
      current = overlapWords.join(' ') + ' ' + word;
    } else {
      current += (current ? ' ' : '') + word;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

export function createRAGService(aiProvider: AIProvider) {
  return {
    async processDocument(
      documentId: string,
      clubId: string,
      content: string
    ): Promise<DocumentChunk[]> {
      const chunks = chunkText(content);
      const chunkDocs: DocumentChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = uuidv4();
        let embedding: number[] = [];

        try {
          embedding = await aiProvider.generateEmbedding(chunks[i]);
        } catch (err) {
          console.error(`Embedding generation failed for chunk ${i}:`, err);
        }

        const chunkDoc: DocumentChunk = {
          id: chunkId,
          documentId,
          clubId,
          chunkIndex: i,
          content: chunks[i],
          embedding,
        };

        await firestore.collection(COLLECTIONS.DOCUMENT_CHUNKS).doc(chunkId).set(chunkDoc);
        chunkDocs.push(chunkDoc);
      }

      return chunkDocs;
    },

    async search(query: string, clubId: string, topK = 5): Promise<{ content: string; documentId: string; chunkIndex: number; score: number }[]> {
      try {
        const queryEmbedding = await aiProvider.generateEmbedding(query);

        // Get all chunks for this club
        const snapshot = await firestore
          .collection(COLLECTIONS.DOCUMENT_CHUNKS)
          .where('clubId', '==', clubId)
          .get();

        const chunks = snapshot.docs.map(d => ({
          id: d.id,
          content: d.data().content as string,
          documentId: d.data().documentId as string,
          chunkIndex: d.data().chunkIndex as number,
          embedding: d.data().embedding as number[] | undefined,
        }));

        // Compute cosine similarity
        const scored = chunks
          .filter(c => c.embedding && c.embedding.length > 0)
          .map(c => ({
            content: c.content,
            documentId: c.documentId,
            chunkIndex: c.chunkIndex,
            score: cosineSimilarity(queryEmbedding, c.embedding!),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);

        return scored;
      } catch (error) {
        console.error('RAG search error:', error);
        // Fallback to text search
        const snapshot = await firestore
          .collection(COLLECTIONS.DOCUMENT_CHUNKS)
          .where('clubId', '==', clubId)
          .get();

        const results = snapshot.docs
          .map(d => ({
            content: d.data().content as string,
            documentId: d.data().documentId as string,
            chunkIndex: d.data().chunkIndex as number,
            score: 0,
          }))
          .filter(d => d.content.toLowerCase().includes(query.toLowerCase()))
          .slice(0, topK);

        return results;
      }
    },

    async generateAnswer(query: string, clubId: string): Promise<{
      answer: string;
      sources: { documentName: string; excerpt: string }[];
    }> {
      const results = await this.search(query, clubId);

      if (results.length === 0) {
        return {
          answer: 'I could not find relevant information in the club documents to answer your question.',
          sources: [],
        };
      }

      // Get document names
      const docIds = [...new Set(results.map(r => r.documentId))];
      const docNames: Record<string, string> = {};

      for (const docId of docIds) {
        const doc = await firestore.collection(COLLECTIONS.DOCUMENTS).doc(docId).get();
        if (doc.exists) {
          docNames[docId] = doc.data()!.name;
        }
      }

      const context = results.map(r => `[From: ${docNames[r.documentId] || 'Unknown'}]: ${r.content}`).join('\n\n');

      const prompt = `Answer the following question based on the provided club documents context. If the context does not contain enough information, say so. Keep your answer concise and helpful.

Context:
${context}

Question: ${query}

Answer:`;

      const answer = await aiProvider.generateCompletion(prompt);

      const sources = results.map(r => ({
        documentName: docNames[r.documentId] || 'Unknown',
        excerpt: r.content.substring(0, 200),
      }));

      return { answer, sources };
    },
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}