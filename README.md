# Penganalisis Kode HS (HS Code Analyzer)

Ini adalah aplikasi Next.js yang menggunakan AI generatif dari Google untuk membantu pengguna mengklasifikasikan nama produk ke dalam Kode Harmonized System (HS) yang sesuai. Aplikasi ini juga belajar dari koreksi pengguna untuk meningkatkan akurasi dari waktu ke waktu.

## Fitur Utama

- **Klasifikasi dengan AI**: Masukkan satu atau lebih nama produk (dipisahkan oleh titik koma) untuk mendapatkan rekomendasi Kode HS beserta analisisnya.
- **Sistem Umpan Balik**: Pengguna dapat memberikan umpan balik (setuju/tidak setuju) terhadap hasil analisis untuk meningkatkan akurasi model di masa depan.
- **Penjelajah Kode HS**: Jelajahi dan cari daftar lengkap Kode HS yang tersedia di dalam aplikasi.
- **Antarmuka Responsif**: Didesain untuk bekerja dengan baik di desktop maupun perangkat mobile.

## Teknologi yang Digunakan

- **Next.js**: Framework React untuk membangun antarmuka pengguna.
- **Genkit (Google AI)**: Untuk fungsi AI generatif yang mengklasifikasikan produk.
- **TypeScript**: Untuk penulisan kode yang lebih aman dan terstruktur.
- **Tailwind CSS & ShadCN UI**: Untuk styling dan komponen antarmuka yang modern.

## Memulai Secara Lokal

Untuk menjalankan proyek ini di komputer Anda, ikuti langkah-langkah berikut.

### 1. Prasyarat

Pastikan Anda memiliki Node.js dan npm (atau yarn) terinstal di sistem Anda.

### 2. Instalasi

Salin (clone) repositori ini dan instal dependensinya:
```bash
git clone https://github.com/URL_REPOSITORI_ANDA.git
cd nama-folder-proyek
npm install
```

### 3. Menyiapkan Kunci API (Penting)

Aplikasi ini memerlukan API Key dari Google AI Studio untuk berfungsi.
1.  **Dapatkan Kunci API Anda:**
    *   Kunjungi [Google AI Studio](https://aistudio.google.com/app/apikey) untuk membuat kunci API Anda.

2.  **Konfigurasi File `.env`:**
    *   Proyek ini menyertakan file kosong bernama `.env`.
    *   Buka file `.env` dan tambahkan baris berikut, ganti `YOUR_API_KEY` dengan kunci yang Anda dapatkan:
        ```
        GEMINI_API_KEY=YOUR_API_KEY
        ```

### 4. Menjalankan Server Pengembangan

Setelah API key diatur, jalankan server pengembangan:
```bash
npm run dev
```
Buka [http://localhost:9002](http://localhost:9002) di browser Anda untuk melihat hasilnya.

## Deployment ke Vercel

Cara termudah untuk men-deploy aplikasi Next.js ini adalah melalui [Vercel](https://vercel.com).

1. **Unggah ke GitHub**: Pastikan kode Anda sudah diunggah ke repositori GitHub.

2. **Impor Proyek di Vercel**:
    * Masuk ke Vercel dengan akun GitHub Anda.
    * Klik "Add New..." -> "Project".
    * Pilih repositori GitHub Anda dan klik "Import".

3. **Konfigurasi Environment Variable**:
    * Selama proses impor, buka bagian "Environment Variables".
    * Tambahkan variabel berikut:
        - **Name**: `GEMINI_API_KEY`
        - **Value**: Masukkan nilai API Key Google AI Anda.

4. **Deploy**: Klik tombol "Deploy". Vercel akan secara otomatis membangun dan men-hosting aplikasi Anda.
