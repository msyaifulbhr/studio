# Firebase Studio - Penganalisis Kode HS

Ini adalah aplikasi Next.js yang menggunakan AI generatif dari Google untuk mengklasifikasikan nama produk ke dalam Kode Harmonized System (HS) yang sesuai.

## Menyiapkan Kunci API (Penting)

Secara default, aplikasi ini akan menggunakan kuota gratis dari API Google, yang sangat terbatas. Untuk menggunakan aplikasi ini secara ekstensif atau dengan akun Gemini Pro Anda, Anda harus menyediakan kunci API Anda sendiri.

1.  **Dapatkan Kunci API Anda:**
    *   Kunjungi [Google AI Studio](https://aistudio.google.com/app/apikey) untuk membuat kunci API Anda.

2.  **Konfigurasi File `.env`:**
    *   Proyek ini menyertakan file kosong bernama `.env`.
    *   Buka file `.env` dan tambahkan baris berikut, ganti `YOUR_API_KEY` dengan kunci yang Anda dapatkan pada langkah sebelumnya:
        ```
        GEMINI_API_KEY=YOUR_API_KEY
        ```
    *   Aplikasi akan secara otomatis mendeteksi dan menggunakan kunci ini saat Anda memulai ulang server pengembangan.

## Memulai

Untuk memulai, lihat `src/app/page.tsx`.
