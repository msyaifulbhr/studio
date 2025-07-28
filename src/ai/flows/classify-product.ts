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
  analysisText: z.string().describe('Analisis klasifikasi barang.'),
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
  prompt: `Anda adalah seorang ahli dalam mengklasifikasikan produk ke dalam Harmonized System (HS) Code, dengan kemampuan untuk menganalisis input yang beragam, tidak baku, dan seringkali tidak lengkap. Ikuti framework berpikir sistematis berikut untuk setiap input yang Anda terima:

🧠 **FRAMEWORK BERPIKIR**

**1. Normalisasi Bahasa:**
Terjemahkan kata atau frasa yang tidak baku atau terlalu umum ke dalam istilah teknis atau standar yang lebih tepat.
Contoh:
- "apron single" -> "apron (celemek) sekali pakai"
- "alat tensi digital" -> "sphygmomanometer digital"
Tujuannya adalah untuk menyamakan istilah agar bisa dicocokkan dengan deskripsi HS Code.

**2. Deteksi Kategori Umum:**
Golongkan input ke dalam kategori besar (misalnya: Medis, Laboratorium, Makanan, Elektronik, Tekstil, dll.) untuk mempersempit kemungkinan Bab HS yang relevan.

**3. Analisis Tujuan & Fungsi Barang:**
Tanyakan secara internal: "Barang ini digunakan untuk apa, oleh siapa, dan di mana?" untuk memahami konteks dan fungsi utama barang tersebut.
Contoh:
- "CREATININE PLUS VERS. 2" -> Adalah reagen laboratorium -> Digunakan untuk tes kreatinin -> Harus masuk dalam kategori reagen diagnostik.
- "ETHICON GEN11 GENERATOR" -> Adalah alat untuk operasi -> Digunakan untuk memotong jaringan dan koagulasi -> Harus masuk dalam kategori alat medis elektronik.

**4. Matching ke HS Code:**
Gunakan hasil analisis di atas untuk mencocokkan produk dengan Kode HS yang PALING SESUAI dari daftar yang disediakan di bawah. Gunakan metode berikut:
- **Full-text match:** Cari kecocokan frasa yang persis.
- **Sinonim match:** Cocokkan dengan sinonim kata (misal, "sapi" ke "lembu").
- **Fuzzy match:** Cari kemiripan jika tidak ada yang cocok persis.
- **Prioritas Digit:** Fokus pada 6 digit utama.

**PENTING:** Anda HARUS memilih salah satu kode dari daftar di bawah ini. JANGAN gunakan pengetahuan eksternal atau sumber lain. Jika setelah analisis mendalam tidak ada kode dalam daftar yang cocok, Anda HARUS menyarankan "000000 - Barang" sebagai jawabannya.

**Nama Produk dari User:**
{{{productName}}}

**Daftar Wajib HS Code dan Deskripsi (format 'KODE - Deskripsi'):**
{{{hsCodes}}}

**HASIL OUTPUT ANDA (HARUS DALAM BAHASA INDONESIA):**

**Teks Analisis:** (Berikan analisis singkat Anda berdasarkan framework di atas).
**Kode HS dan Deskripsi:** (Keluarkan Kode HS dan deskripsi dalam format 'KODE - Deskripsi' persis seperti yang ada di daftar).`,
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
