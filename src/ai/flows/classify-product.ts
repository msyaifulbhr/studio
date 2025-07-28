'use server';

/**
 * @fileOverview Classifies a product name into the most appropriate HS Code and description using the Gemini API.
 *
 * - classifyProduct - A function that handles the product classification process.
 * - ClassifyProductInput - The input type for the classifyProduct function.
 * - ClassifyProductOutput - The return type for the classifyProduct function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs/promises';
import path from 'path';

const ClassifyProductInputSchema = z.object({
  productName: z.string().describe('Nama barang yang akan diklasifikasikan.'),
});
export type ClassifyProductInput = z.infer<typeof ClassifyProductInputSchema>;

const ClassifyProductOutputSchema = z.object({
  analysisText: z.string().describe('Analisis klasifikasi barang dalam Bahasa Indonesia.'),
  hsCodeAndDescription: z.string().describe('Kode HS 6-digit dan deskripsi yang digabungkan untuk barang. e.g. "382200 - Reagen diagnosa atau laboratorium pada bahan pendukung, olahan reagen diagnosa atau laboratorium pada bahan pendukung maupun tidak, disiapkan dalam bentuk kit maupun tidak, selain yang dimaksud dalam pos 30.06； bahan referensi bersertifikat."'),
});
export type ClassifyProductOutput = z.infer<typeof ClassifyProductOutputSchema>;

export async function classifyProduct(input: ClassifyProductInput): Promise<ClassifyProductOutput> {
  return classifyProductFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyProductPrompt',
  input: {schema: z.object({
    productName: ClassifyProductInputSchema.shape.productName,
    hsCodes: z.string().describe('Daftar Kode HS yang dipisahkan koma untuk dipertimbangkan.'),
  })},
  output: {schema: ClassifyProductOutputSchema},
  prompt: `You are an expert in classifying products into Harmonized System (HS) Codes. Your task is to analyze the user's product name, which may be varied, non-standard, or incomplete, and match it to the MOST appropriate HS Code from the provided list.

**Instructions:**
1.  **Analyze the Product:** Based on the user's input, determine the product's general category (e.g., Medical, Laboratory, Food, Electronics, Textiles) and its primary function.
2.  **Match to HS Code:** Find the most suitable HS Code from the list below. You MUST choose a code from this list. Do not use external knowledge.
3.  **Default if No Match:** If, after careful analysis, no code in the list is a reasonable match, you MUST use "000000 - Barang" as the answer.
4.  **Provide Output in Indonesian:** All your output text MUST be in Indonesian.

**User's Product Name:**
{{{productName}}}

**Mandatory List of HS Codes and Descriptions (Format: 'CODE - Description'):**
{{{hsCodes}}}

**Your Output (must be in Indonesian):**
`,
});

const classifyProductFlow = ai.defineFlow(
  {
    name: 'classifyProductFlow',
    inputSchema: ClassifyProductInputSchema,
    outputSchema: ClassifyProductOutputSchema,
  },
  async input => {
    const hsCodesPath = path.join(process.cwd(), 'src', 'data', 'hs-codes.json');
    const hsCodesJson = await fs.readFile(hsCodesPath, 'utf-8');
    const hsCodesData: { code: string; description: string }[] = JSON.parse(hsCodesJson);
    
    const processedHsCodes = hsCodesData
      .map(item => `${item.code} - ${item.description}`)
      .join('\n');

    const {output} = await prompt({
        productName: input.productName,
        hsCodes: processedHsCodes,
    });
    return output!;
  }
);
