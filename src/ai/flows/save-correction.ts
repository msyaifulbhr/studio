'use server';

/**
 * @fileOverview Saves user-provided corrections for HS code classifications.
 *
 * - saveCorrection - A function that appends a new correction to the corrections file.
 * - CorrectionInput - The input type for the saveCorrection function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fs from 'fs/promises';
import path from 'path';

const CorrectionInputSchema = z.object({
  productName: z.string().describe('The original product name entered by the user.'),
  correctHsCode: z.string().describe('The correct HS Code provided by the user.'),
});
export type CorrectionInput = z.infer<typeof CorrectionInputSchema>;

type CorrectionEntry = {
    productName: string;
    correctHsCode: string;
};

export async function saveCorrection(input: CorrectionInput): Promise<void> {
  return saveCorrectionFlow(input);
}

const saveCorrectionFlow = ai.defineFlow(
  {
    name: 'saveCorrectionFlow',
    inputSchema: CorrectionInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const correctionsPath = path.join(process.cwd(), 'src', 'data', 'corrections.json');
    let corrections: CorrectionEntry[] = [];

    try {
      // Check if file exists before reading
      await fs.access(correctionsPath);
      const correctionsJson = await fs.readFile(correctionsPath, 'utf-8');
      if (correctionsJson) {
        corrections = JSON.parse(correctionsJson);
      }
    } catch (error) {
      // File doesn't exist, it will be created.
    }

    // Avoid duplicates: if a correction for this product already exists, update it.
    const existingIndex = corrections.findIndex(c => c.productName.toLowerCase() === input.productName.toLowerCase());

    if (existingIndex !== -1) {
      // Update existing correction
      corrections[existingIndex].correctHsCode = input.correctHsCode;
    } else {
      // Add new correction
      corrections.push(input);
    }
    
    // Write the updated list back to the file
    await fs.writeFile(correctionsPath, JSON.stringify(corrections, null, 2), 'utf-8');
  }
);
