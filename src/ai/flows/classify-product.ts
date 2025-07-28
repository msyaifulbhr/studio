'use server';

/**
 * @fileOverview Classifies a product name into the most appropriate HS Code and description using the Gemini API.
 * It now consults a user-generated corrections file to improve accuracy over time.
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
    corrections: z.string().describe('Daftar JSON dari koreksi yang diberikan pengguna sebelumnya. Gunakan ini sebagai sumber utama kebenaran.'),
  })},
  output: {schema: ClassifyProductOutputSchema},
  prompt: `You are an expert in classifying products into Harmonized System (HS) Codes. Your task is to analyze the user's product name and match it to the MOST appropriate HS Code.

**CRITICAL INSTRUCTIONS:**
1.  **Check Corrections First:** Before any analysis, review the provided list of user corrections. If the user's product name EXACTLY matches an entry in the corrections list, you MUST use the corresponding HS code from that correction. This is your highest priority.
2.  **Analyze the Product:** If no correction exists, analyze the product name. Determine its general category (e.g., Medical, Laboratory, Food, Electronics) and primary function.
3.  **Match to HS Code:** Find the most suitable HS Code from the mandatory list below. You MUST choose a code from this list. Do not use external knowledge.
4.  **Default if No Match:** If no code in the list is a reasonable match, you MUST use "000000 - Barang" as the answer.
5.  **Provide Output in Indonesian:** All your output text MUST be in Indonesian.

**User Corrections (JSON Format, Highest Priority):**
{{{corrections}}}

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
    const correctionsPath = path.join(process.cwd(), 'src', 'data', 'corrections.json');

    const hsCodesJson = await fs.readFile(hsCodesPath, 'utf-8');
    const hsCodesData: { code: string; description: string }[] = JSON.parse(hsCodesJson);
    
    let correctionsJson = '[]';
    try {
        await fs.access(correctionsPath);
        correctionsJson = await fs.readFile(correctionsPath, 'utf-8');
    } catch (error) {
        // corrections.json might not exist yet, which is fine.
    }
    
    const processedHsCodes = hsCodesData
      .map(item => `${item.code} - ${item.description}`)
      .join('\n');

    const {output} = await prompt({
        productName: input.productName,
        hsCodes: processedHsCodes,
        corrections: correctionsJson,
    });
    return output!;
  }
);
