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
  prompt: `You are an expert in classifying products into Harmonized System (HS) Codes. Your task is to analyze the user's product name and match it to the MOST appropriate HS Code. All your output MUST be in Indonesian.

**CRITICAL INSTRUCTIONS:**
1.  **Check User Corrections First:** Before any analysis, review the provided list of user corrections. If the user's product name EXACTLY matches a 'productName' in the corrections list, you MUST use the corresponding 'correctHsCode' from that entry. This is your highest priority.
2.  **If No Correction Found, Use the Framework Below:** If the product is not in the corrections list, follow this systematic framework:

    🧠 **Analysis Framework for Product Names:**

    **Step 1: Normalize Product Name**
    - Translate or detect the meaning of the raw input to make it more standard and readable.
    - Examples:
        - "apron single" -> "apron (celemek) sekali pakai"
        - "alat tensi digital" -> "sphygmomanometer digital"
        - "SAPI" -> "Hewan ternak jenis sapi hidup"
    - **Goal**: Standardize the term to match it against relevant HS codes or product groups.

    **Step 2: Understand Product Context**
    - Identify keywords to determine what the item is: Is it a tool, material, animal, agricultural product, machine, electronic, component, etc.?
    - Does it have a specific context (medical, household, industrial)?
    - Use your internal knowledge and semantic matching to understand its meaning.

    **Step 3: Classify Function and Industry**
    - Based on context, link it to its function and industry.
    - Is it a testing tool, for human consumption, protective clothing, spare part, etc.?
    - Which industry: medical, agriculture, transport, electronics, etc.?
    - This helps narrow down the relevant HS Code chapters.

    **Step 4: Match to HS Code**
    - Match your analysis to the provided HS Code list hierarchically (from section to chapter to heading to subheading).
    - If an HS Code description closely matches the item's function/category, mark it as a candidate.
    - Example:
        - Item = SAPI
        - Function = Live animal, bovine cattle
        - Match to HS Code: '010200' – "Binatang hidup jenis lembu"
    - You MUST choose a code from the provided list. Do not use external knowledge for the final code. If no code in the list is a reasonable match, you MUST use "000000 - Barang".

    **Step 5: Adjust Based on Details**
    - If the user provides details like units (pcs, box), purpose (research, diagnostic), brand, or model, use them to refine the classification.

3.  **Provide Structured Indonesian Output:**
    - Your entire analysis and final output must be in Indonesian.

**User Corrections (JSON Format, Highest Priority):**
\`\`\`json
{{{corrections}}}
\`\`\`

**User's Product Name:**
{{{productName}}}

**Mandatory List of HS Codes and Descriptions (Format: 'CODE - Description'):**
{{{hsCodes}}}
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
