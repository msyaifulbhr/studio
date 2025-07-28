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
  input: {schema: ClassifyProductInputSchema},
  output: {schema: ClassifyProductOutputSchema},
  prompt: `Anda adalah seorang ahli dalam mengklasifikasikan produk ke dalam Harmonized System (HS) Code. Diberikan nama produk, Anda akan mengklasifikasikannya ke dalam Kode HS 6-digit yang paling sesuai dan memberikan deskripsi kategorinya.

Nama Produk: {{{productName}}}

Berikut adalah daftar kemungkinan Kode HS dan deskripsinya:
010200 - Binatang hidup jenis lembu
847130 - Mesin pemproses data otomatis, portabel
902511 - Termometer, tidak dikombinasikan dengan peralatan lain
630790 - Kain lap

Berdasarkan nama produk dan daftar di atas, berikan analisis, Kode HS, dan deskripsi kategori.

Pastikan Kode HS hanya berisi angka, dan panjangnya 6 digit.

Keluarkan Kode HS dan deskripsi kategori persis seperti yang ditunjukkan dalam daftar di atas.

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
    const {output} = await prompt(input);
    return output!;
  }
);
