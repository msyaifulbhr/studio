'use server';
/**
 * @fileOverview Saves user feedback to Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  // Check for Firebase service account key in environment variables (for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
    );
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else if (!process.env.VERCEL) {
    // For local development, you can use Application Default Credentials.
    // Ensure you've run `gcloud auth application-default login`.
    initializeApp();
  }
}

export const SaveCorrectionInputSchema = z.object({
  productName: z.string().describe('The original product name submitted by the user.'),
  correctHsCode: z.string().describe('The HS code that the user is providing feedback on.'),
  feedback: z.enum(['agree', 'disagree']).describe('The feedback from the user.'),
});

export type SaveCorrectionInput = z.infer<typeof SaveCorrectionInputSchema>;

export async function saveCorrection(input: SaveCorrectionInput): Promise<{success: boolean}> {
    return saveCorrectionFlow(input);
}


const saveCorrectionFlow = ai.defineFlow(
  {
    name: 'saveCorrectionFlow',
    inputSchema: SaveCorrectionInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    if (!getApps().length) {
      console.error('Firebase not initialized. Cannot save correction.');
      throw new Error('Firebase not initialized');
    }

    const db = getFirestore();
    const docRef = db.collection('hs_code_corrections').doc();

    try {
      await docRef.set({
        ...input,
        timestamp: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error writing document to Firestore: ", error);
      return { success: false };
    }
  }
);
