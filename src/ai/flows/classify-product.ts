'use server';

/**
 * @fileOverview Classifies a product name into the most appropriate HS Code.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import hsCodesData from '@/data/hs-codes.json';

const CorrectionSchema = z.object({
  productName: z.string(),
  correctHsCode: z.string(),
});

const ClassifyProductInputSchema = z.object({
  productName: z.string().describe('Nama barang yang akan diklasifikasikan.'),
  productContext: z.string().optional().describe('Konteks penggunaan barang untuk akurasi yang lebih baik.'),
  userCorrections: z.array(CorrectionSchema).describe('Koreksi yang diberikan pengguna dari Local Storage.'),
});
export type ClassifyProductInput = z.infer<typeof ClassifyProductInputSchema>;

const ClassifyProductOutputSchema = z.object({
  analysisText: z.string().describe('Analisis klasifikasi barang dalam Bahasa Indonesia.'),
  hsCodeAndDescription: z.string().describe('Kode HS 6-digit dan deskripsi yang digabungkan untuk barang. e.g. "382200 - Reagen diagnosa atau laboratorium..."'),
});
export type ClassifyProductOutput = z.infer<typeof ClassifyProductOutputSchema>;

export async function classifyProduct(input: ClassifyProductInput): Promise<ClassifyProductOutput> {
  return classifyProductFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyProductPrompt',
  input: {schema: z.object({
    productName: ClassifyProductInputSchema.shape.productName,
    productContext: ClassifyProductInputSchema.shape.productContext,
    hsCodes: z.string().describe('Daftar Kode HS yang dipisahkan koma untuk dipertimbangkan.'),
    corrections: z.string().describe('Daftar JSON dari koreksi yang diberikan pengguna sebelumnya. Gunakan ini sebagai sumber utama kebenaran.'),
  })},
  output: {schema: ClassifyProductOutputSchema},
  prompt: `You are an expert in classifying products into Harmonized System (HS) Codes. Your task is to analyze the user's product name and match it to the MOST appropriate HS Code. All your output MUST be in Indonesian.

**CRITICAL INSTRUCTIONS:**
1.  **Use Context First:** The user has provided a "context" for the product. This context is extremely important for accurate classification. Use it to understand the product's function, industry, or material. For example, "gloves" with context "medical" is different from "gloves" with context "motorcycle".
2.  **Check User Corrections:** After considering the context, review the provided list of user corrections. If the user's product name EXACTLY matches a 'productName' in the corrections list, you MUST use the corresponding 'correctHsCode' from that entry. This is your highest priority. Your analysisText should state that a correction was used.
3.  If the product is not in the corrections list, apply the following analysis framework, always informed by the provided context. Do NOT mention that a correction was not found.

    🧠 **Analysis Framework for Product Names:**

    **Step 1: Normalize Product Name & Context**
    - Combine product name and context to create a full picture.
    - Translate or detect the meaning of the raw input to make it more standard and readable.
    - Examples:
        - Name: "apron single", Context: "medical" -> "apron (celemek) sekali pakai untuk medis"
        - Name: "alat tensi digital", Context: "health" -> "sphygmomanometer digital untuk kesehatan"
        - Name: "SAPI", Context: "ternak" -> "Hewan ternak jenis sapi hidup"
    - **Goal**: Standardize the term to match it against relevant HS codes.

    **Step 2: Understand Product Context (Deeper Dive)**
    - Identify keywords from both name and context. What is it? (tool, material, animal, machine).
    - What is its specific function? (medical, household, industrial, protective).
    - Use your internal knowledge and semantic matching to understand its meaning.

    **Step 3: Classify Function and Industry**
    - Based on context, link it to its function and industry (medical, agriculture, transport, electronics).
    - This helps narrow down the relevant HS Code chapters.

    **Step 4: Match to HS Code**
    - Match your analysis to the provided HS Code list hierarchically.
    - If an HS Code description closely matches the item's function/category (informed by the context), mark it as a candidate.
    - You MUST choose a code from the provided list. Do not use external knowledge for the final code. If no code in the list is a reasonable match, you MUST use "000000 - Barang".

    **Step 5: Adjust Based on Details**
    - Use any other details (units, purpose) to refine the classification.

3.  **Provide Structured Indonesian Output:**
    - Your entire analysis and final output must be in Indonesian.

**User Corrections (JSON Format, Highest Priority):**
\`\`\`json
{{{corrections}}}
\`\`\`

**User's Product Name:**
{{{productName}}}

**Product's Context:**
{{#if productContext}}
{{{productContext}}}
{{else}}
(No context provided)
{{/if}}


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
  async (input) => {
    const processedHsCodes = hsCodesData
      .map(item => `${item.code} - ${item.description}`)
      .join('\n');
    
    const correctionsJson = JSON.stringify(input.userCorrections);

    const {output} = await prompt({
        productName: input.productName,
        productContext: input.productContext,
        hsCodes: processedHsCodes,
        corrections: correctionsJson,
    });
    return output!;
  }
);
