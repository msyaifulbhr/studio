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
  productName: z.string().describe('Nama produk yang akan diklasifikasikan.'),
});
export type ClassifyProductInput = z.infer<typeof ClassifyProductInputSchema>;

const ClassifyProductOutputSchema = z.object({
  analysisText: z.string().describe('Analisis klasifikasi produk.'),
  hsCode: z.string().describe('Kode HS 6-digit untuk produk.'),
  categoryDescription: z.string().describe('Deskripsi kategori Kode HS.'),
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
  prompt: `Anda adalah seorang ahli dalam mengklasifikasikan produk ke dalam Harmonized System (HS) Code. Diberikan nama produk, Anda akan mengklasifikasikannya ke dalam Kode HS 6-digit yang paling sesuai dan memberikan deskripsi kategorinya.

Nama Produk: {{{productName}}}

Berikut adalah daftar kemungkinan Kode HS dan deskripsinya dalam format 'KODE - Deskripsi':
{{{hsCodes}}}

Berdasarkan nama produk dan daftar di atas, berikan analisis, Kode HS, dan deskripsi kategori.

Pastikan Kode HS hanya berisi angka, dan panjangnya 6 digit.

Keluarkan Kode HS dan deskripsi kategori persis seperti yang ditunjukkan dalam daftar di atas (tanpa menyertakan kode dalam deskripsi).

Teks Analisis:
Kode HS:
Deskripsi Kategori:`,
});

const classifyProductFlow = ai.defineFlow(
  {
    name: 'classifyProductFlow',
    inputSchema: ClassifyProductInputSchema,
    outputSchema: ClassifyProductOutputSchema,
  },
  async input => {
    const hsCodesPath = path.join(process.cwd(), 'src', 'data', 'hs-codes.csv');
    const hsCodesCsv = await fs.readFile(hsCodesPath, 'utf-8');
    
    // Process CSV to create 'CODE - Description' format
    const processedHsCodes = hsCodesCsv
      .split('\n')
      .slice(1) // Skip header row
      .map(row => {
        const [code, description] = row.split(',');
        if (code && description) {
          // Wrap description in quotes if it contains commas
          const cleanDescription = description.includes(',') ? `"${description}"` : description;
          return `${code.trim()} - ${cleanDescription.trim()}`;
        }
        return '';
      })
      .filter(Boolean) // Remove empty lines
      .join('\n');

    const {output} = await prompt({
        productName: input.productName,
        hsCodes: processedHsCodes,
    });
    return output!;
  }
);
