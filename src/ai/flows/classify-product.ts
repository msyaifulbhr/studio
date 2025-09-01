
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
    priorityHsCodes: z.string().describe('Daftar Kode HS prioritas yang harus diperiksa terlebih dahulu.'),
    allHsCodes: z.string().describe('Daftar lengkap Kode HS jika tidak ada yang cocok dari daftar prioritas.'),
  })},
  output: {schema: ClassifyProductOutputSchema},
  prompt: `Anda adalah seorang ahli dalam mengklasifikasikan produk ke dalam Harmonized System (HS) Code. Tugas Anda adalah menganalisis nama produk pengguna dan mencocokkannya dengan Kode HS yang PALING tepat. Semua output Anda HARUS dalam Bahasa Indonesia.

**Instruksi Penting:**
1.  **Analisis Nama Produk**: Fokus pada nama produk yang diberikan. Gunakan pemahaman Anda tentang terminologi umum untuk mengidentifikasi fungsi, bahan, atau kategori utama produk tersebut.
2.  **Prioritaskan Kode HS Utama**: Pertama, coba cocokkan produk dengan daftar **Kode HS Prioritas** yang disediakan. Jika Anda menemukan kecocokan yang kuat di sini, gunakan kode tersebut.
3.  **Gunakan Daftar Lengkap Jika Perlu**: Jika tidak ada kecocokan yang memuaskan dari daftar prioritas, barulah cari dari **Daftar Lengkap Kode HS**.
4.  **Output Analisis**: Berikan 'analysisText' yang informatif. Jelaskan kategori umum produk, alasan logis mengapa produk tersebut masuk ke dalam Kode HS yang Anda pilih, dan sebutkan jika kode tersebut dipilih dari daftar prioritas.
5.  **Output Kode HS**: Sediakan 'hsCodeAndDescription' dalam format 'KODE - Deskripsi'. Jika sama sekali tidak ada kode yang cocok, gunakan "000000 - Barang".

**Nama Produk Pengguna:**
{{{productName}}}

**Kode HS Prioritas (Format: 'KODE - Deskripsi'):**
{{{priorityHsCodes}}}

**Daftar Lengkap Kode HS (Format: 'KODE - Deskripsi'):**
{{{allHsCodes}}}
`,
});

const classifyProductFlow = ai.defineFlow(
  {
    name: 'classifyProductFlow',
    inputSchema: ClassifyProductInputSchema,
    outputSchema: ClassifyProductOutputSchema,
  },
  async (input) => {
    const priorityCodesList = ["330700", "382200", "850400", "901800", "902200", "902700"];
    
    const getCodeDescription = (code: string) => {
        const item = hsCodesData.find(d => d.code === code);
        return item ? `${item.code} - ${item.description}` : null;
    };

    const priorityHsCodes = priorityCodesList
        .map(getCodeDescription)
        .filter(Boolean)
        .join('\n');

    const allHsCodes = hsCodesData
      .map(item => `${item.code} - ${item.description}`)
      .join('\n');
    
    const {output} = await prompt({
        productName: input.productName,
        priorityHsCodes: priorityHsCodes,
        allHsCodes: allHsCodes,
    });
    return output!;
  }
);
