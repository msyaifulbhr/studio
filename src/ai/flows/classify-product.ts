
'use server';

/**
 * @fileOverview Classifies a product name into the most appropriate HS Code.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import hsCodesData from '@/data/hs-codes.json';

const ClassifyProductInputSchema = z.object({
  productName: z.string().describe('Nama barang yang akan diklasifikasikan.'),
});
export type ClassifyProductInput = z.infer<typeof ClassifyProductInputSchema>;

const ClassifyProductOutputSchema = z.object({
  analysisText: z.string().describe('Analisis singkat mengenai klasifikasi barang dalam Bahasa Indonesia.'),
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
    hsCodes: z.string().describe('Daftar Kode HS yang dipisahkan koma untuk dipertimbangkan.'),
  })},
  output: {schema: ClassifyProductOutputSchema},
  prompt: `Anda adalah seorang ahli dalam mengklasifikasikan produk ke dalam Harmonized System (HS) Code. Tugas Anda adalah menganalisis nama produk pengguna dan mencocokkannya dengan Kode HS yang PALING tepat dari daftar yang disediakan. Semua output Anda HARUS dalam Bahasa Indonesia.

**Instruksi Penting:**
1.  **Analisis Nama Produk**: Fokus pada nama produk yang diberikan. Gunakan pemahaman Anda tentang terminologi umum untuk mengidentifikasi fungsi, bahan, atau kategori utama produk tersebut.
2.  **Cocokkan dengan Daftar Kode HS**: Secara hierarkis, cocokkan hasil analisis Anda dengan daftar Kode HS yang disediakan. Anda HARUS memilih kode dari daftar yang ada. Jangan gunakan pengetahuan eksternal untuk kode akhir.
3.  **Output Analisis**: Berikan 'analysisText' yang singkat dan jelas yang menjelaskan dasar pemikiran Anda dalam memilih kode tersebut.
4.  **Output Kode HS**: Sediakan 'hsCodeAndDescription' dalam format 'KODE - Deskripsi'. Jika tidak ada kode yang cocok, gunakan "000000 - Barang".

**Nama Produk Pengguna:**
{{{productName}}}

**Daftar Wajib Kode HS dan Deskripsinya (Format: 'KODE - Deskripsi'):**
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
    
    const {output} = await prompt({
        productName: input.productName,
        hsCodes: processedHsCodes,
    });
    return output!;
  }
);
