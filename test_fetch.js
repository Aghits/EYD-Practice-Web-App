import { generateExercise } from './src/utils/gemini.js';
import fs from 'fs';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Try to read API key from local .env file or process environment variables
let activeKey = process.env.VITE_GEMINI_API_KEY || '';
if (!activeKey && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/VITE_GEMINI_API_KEY\s*=\s*(.*)/);
  if (match) {
    activeKey = match[1].trim().replace(/['"]/g, '');
  }
}

async function testFetch() {
  const promptText = `Buatkan satu set latihan EYD V baru yang berisi TEPAT 5 soal latihan dengan tema yang kohesif dalam format JSON.

PILIH KESULITAN BERIKUT (Silakan sesuaikan sebelum mengirim):
- Tingkat Kesulitan: [beginner / intermediate / advanced]

TEMA OTOMATIS:
Anda WAJIB menentukan nama tema yang menarik, deskripsi singkat tema (1 kalimat), dan emoji tema yang sesuai secara otomatis dan mandiri. Kelima soal dalam set ini wajib memiliki cerita/topik yang selaras dan kohesif dengan tema tersebut.
PENTING: Jenis tema yang Anda pilih HARUS sesuai dengan tingkat kesulitan (difficulty) yang diminta:
- Jika tingkat kesulitan adalah "beginner" (pemula), pilih tema seputar kehidupan sehari-hari, sekolah, hobi santai, atau keluarga (misalnya: Kebersihan Rumah, Kegiatan di Kebun, Belanja di Pasar).
- Jika tingkat kesulitan adalah "intermediate" (menengah), pilih tema seputar berita umum, olahraga, sastra, seni, atau kegiatan formal (misalnya: Apresiasi Sastra, Era Digital, Organisasi dan Rapat).
- Jika tingkat kesulitan adalah "advanced" (mahir), pilih tema seputar sains, hukum, penerbangan, sejarah, ekonomi, atau akademik/spesialis (misalnya: Dunia Penerbangan, Dunia Hukum & Peradilan, Fosil dan Purbakala).

PANDUAN PEMBUATAN SOAL (IKUTI SECARA KETAT):
1. KELARASAN TEMA:
   - Kelima soal harus berlatar belakang cerita/topik yang relevan dengan tema otomatis yang ditentukan di atas.

2. STRUKTUR TEKS & KESALAHAN BERDASARKAN TINGKAT KESULITAN (DIFERENSIASI KETAT):
   Anda WAJIB menyesuaikan panjang teks, jumlah kesalahan, dan jenis aturan secara ketat berdasarkan tingkat kesulitan yang dipilih di atas:
   - Beginner (Pemula):
      * Panjang teks: 1 paragraf, 3–4 kalimat, sekitar 60–80 kata.
      * Jumlah kesalahan: 2–3 kesalahan.
      * Jumlah distraktor: 0 distraktor.
      * Jenis kesalahan: HANYA kata_baku (yang paling jelas), capitalization, preposition, hyphen, numeral. DILARANG menggunakan kategori yang membutuhkan analisis struktur kalimat.
      * Kosakata: kehidupan sehari-hari, sekolah, keluarga — topik yang familiar.
      * Prinsip: Pengguna bisa menemukan kesalahan hanya dengan melihat kata yang salah itu sendiri.
 
    - Intermediate (Menengah):
      * Panjang teks: 1–2 paragraf, 4–5 kalimat, sekitar 80–120 kata. (Pisahkan paragraf dengan dua baris baru \n\n).
      * Jumlah kesalahan: 3–5 kesalahan.
      * Jumlah distraktor: 1–2 distraktor.
      * Jenis kesalahan: WAJIB minimal 1 error dari jenis tryout trap: kata_baku (tersembunyi/tidak baku tersembunyi), redundansi, comma_subjek_predikat, comma_yaitu, comma_bahwa, comma_konjungsi, comma_keterangan_awal, paralelisme.
      * Teks harus mengandung kalimat panjang (20+ kata) yang menyembunyikan error.
      * Bahasa: semiformal (artikel/berita/esai).
      * Prinsip: Pengguna harus memahami fungsi kata dalam kalimat untuk menemukan kesalahan.
  
    - Advanced (Mahir):
      * Panjang teks: 2–3 paragraf, 5+ kalimat, sekitar 150–300 kata. (Pisahkan paragraf dengan dua baris baru \n\n).
      * Jumlah kesalahan: 4–6 kesalahan.
      * Jumlah distraktor: 2–3 distraktor.
      * Jenis kesalahan: WAJIB minimal 2 errors dari jenis tryout trap. BOLEH gunakan: comma_sisipan_sebelah, kapitalisasi kata umum, nominal uang, semua jenis comma trap, serta kategori kompleks lainnya (dash, single-quotation, apostrophe, slash, dll.).
      * Teks harus berupa multi-paragraf dengan kalimat kompleks.
      * Bahasa: formal (jurnal/dokumen resmi/pidato).
      * Prinsip: Pengguna harus menguasai aturan EYD spesifik untuk menemukan kesalahan.
  
    Aturan Umum Diferensiasi:
    - Jangan pernah membuat soal beginner dengan kesalahan yang membutuhkan analisis kalimat.
    - Jangan pernah membuat soal advanced dengan hanya kesalahan sederhana (kapital/preposisi saja).
    - Setiap tingkat harus terasa BERBEDA secara signifikan dari tingkat lainnya.
    - Difficulty yang diminta di prompt harus KETAT dipatuhi sesuai panduan di atas.
    - WAJIB LAKUKAN VERIFIKASI JUMALAH KESALAHAN: Sebelum memproduksi JSON, hitung jumlah elemen di dalam array "errors". Untuk tingkat "advanced" (mahir), array "errors" harus berisi tepat antara 4 sampai 6 entri kesalahan (4, 5, atau 6 kesalahan). JANGAN PERNAH membuat kurang dari 4 kesalahan untuk tingkat "advanced". Untuk tingkat "intermediate", array "errors" harus berisi tepat 3 sampai 5 entri kesalahan (3, 4, atau 5 kesalahan). Untuk tingkat "beginner", array "errors" harus berisi tepat 2 sampai 3 entri kesalahan (2 atau 3 kesalahan). Kepatuhan pada batasan jumlah kesalahan ini bersifat wajib dan mutlak!bersifat wajib dan mutlak!
    - DISTRAKTOR (KHUSUS MENENGAH DAN MAHIR):
      Untuk level intermediate (menengah) dan advanced (mahir), WAJIB sisipkan konstruksi yang TERLIHAT SALAH tapi sebenarnya BENAR untuk menguji ketelitian siswa.
      Contoh distraktor yang baik:
      * "mereka pun turut berpartisipasi" — partikel pun terpisah, ini BENAR
      * "ke mana arah kebijakan itu" — kata depan ke mana terpisah, ini BENAR
      * "antikorupsi" — bentuk terikat anti- ditulis serangkai tanpa tanda hubung, ini BENAR
      * "Adiknya yang bungsu sedang sakit" — tanpa koma sebelum "yang" pewatas, ini BENAR
      * "busana muslim" — kata muslim berhuruf kecil untuk konsep umum, ini BENAR
      Jumlah distraktor per level:
      * Intermediate: minimal 1 distraktor
      * Advanced: minimal 2 distraktor
      PENTING: JANGAN cantumkan distraktor di daftar "errors". Distraktor adalah bagian dari teks yang 100% BENAR.

3. DRAFTING TERBALIK:
   - Untuk setiap soal, buatlah teks bahasa Indonesia yang 100% BENAR secara EYD V terlebih dahulu (sesuai spesifikasi panjang dan kosakata di atas).
   - Pilih kesalahan sesuai ketentuan kategori di atas dari "Daftar Aturan Resmi" di bawah ini.
   - Ubah teks tersebut dengan menerapkan kesalahan yang dipilih untuk menghasilkan bidang "text" akhir.

4. ATURAN PENULISAN SOAL & VARIASI KATEGORI:
   - Tingkat kesulitan kelima soal HARUS sama dengan tingkat kesulitan tema yang dipilih.
   - Set soal harus mencampur variasi aturan EYD sesuai ketentuan di atas. Jangan biarkan kelima soal fokus pada satu kategori kesalahan saja. Sebar kesalahan di seluruh kategori yang relevan.
   - STRUKTUR TATA BAHASA YANG LENGKAP: Setiap kalimat harus memiliki struktur tata bahasa yang lengkap dan jelas (terutama memiliki Subjek dan Predikat yang jelas). Hindari struktur kalimat tidak bersubjek (subjectless) yang sering timbul akibat kesalahan meletakkan kata depan di awal kalimat sebelum subjek (Contoh salah: "Dalam novel ini menceritakan tentang..." — ini salah karena tidak ada subjek. Contoh benar: "Novel ini menceritakan tentang..." atau "Dalam novel ini diceritakan tentang..."). JANGAN PERNAH membuat struktur anak kalimat tidak bersubjek (dangling predicate) berupa kata kerja aktif yang diletakkan langsung setelah tanda koma tanpa subjek atau kata hubung penjelas (Contoh salah: "...tanggal 26 Juli 2024, menandai pertama kalinya...", yang benar: "...tanggal 26 Juli 2024 yang menandai..." atau pecah menjadi kalimat baru: "...tanggal 26 Juli 2024. Peristiwa ini menandai...").
   - Teks draf awal ("text") dan perbaikan ("correct") harus benar-benar bersih dari kesalahan ketidaksengajaan.
   - Kesalahan sengaja harus disebar merata di sepanjang teks (jangan menumpuk kesalahan hanya di satu paragraf atau satu bagian teks saja).
   - JANGAN PERNAH menaruh tanda koma sebelum kata hubung subordinatif seperti "sehingga", "karena", "agar", "bahwa", "jika", dll. (Contoh salah: "..., sehingga ...", yang benar: "... sehingga ...").
   - JANGAN mencampur kata contoh seperti "seperti", "misalnya", "antara lain" dengan singkatan "dll.", "dst.", "dsb." dalam satu kalimat (pleonasme).
   - JANGAN PERNAH meletakkan singkatan umum yang memerlukan tanda titik (seperti "dll.", "dst.", "dsb.") di akhir kalimat draf maupun teks salah. Letakkan singkatan tersebut di tengah kalimat.
   - JANGAN PERNAH menggunakan tanda titik dua (:) langsung setelah kata predikat transitif (seperti "meliputi", "mencakup", "adalah", "merupakan", "yaitu", "yakni") karena klausa sebelum tanda titik dua harus berupa pernyataan lengkap (independent clause).
   - Jika menggunakan tanda pisah (dash), JANGAN PERNAH menggunakan tanda hubung ganda ("--" atau "- -"). Anda WAJIB menggunakan satu karakter em-dash asli ("—") tanpa spasi di sekelilingnya (Contoh salah: "itu - - hasil", contoh benar: "itu—hasil").
   - Setiap kesalahan yang dimasukkan ke dalam teks WAJIB didaftarkan ke dalam array "errors".
   - Jika kesalahan melibatkan beberapa kata berurutan yang harus diperbaiki bersama (seperti nama geografi "pulau jawa" -> "Pulau Jawa", atau konjungsi antarkalimat "oleh karena itu" -> "Oleh karena itu,"), Anda WAJIB menggabungkannya sebagai satu entri kesalahan di array "errors".
   - DILARANG membuat kesalahan yang melibatkan pemindahan tanda baca (seperti tanda titik atau koma) dari luar tanda petik ke dalam tanda petik, atau sebaliknya (misalnya memindahkan letak titik/koma seperti tidur." -> tidur".). Semua petikan langsung di dalam teks HARUS sudah ditulis dengan tanda baca penutup yang benar di dalam tanda petik (misalnya: "Perkara ini... semata."). Jika ingin membuat kesalahan kategori quotation/single-quotation, buatlah kesalahan berupa: (a) menghilangkan tanda petik pembuka dan penutup sama sekali pada petikan langsung/istilah khusus, (b) tidak menutup tanda petik yang sudah dibuka, atau (c) salah menggunakan tanda petik tunggal untuk petikan langsung (seharusnya petik ganda). Hal ini penting karena antarmuka pengguna hanya mendukung penyisipan satu tanda baca per kata.
   - Bidang "occurrence" adalah indeks kemunculan kata salah tersebut dalam teks (dimulai dari 0 untuk kemunculan pertama). Jika kata yang sama muncul lebih dari sekali, pastikan "occurrence" merujuk tepat pada posisi kata salah yang ingin dikoreksi.
   - Bidang "italicWords" wajib berisi daftar kata atau frasa asing/daerah/ilmiah/judul karya yang tertulis secara BENAR di dalam teks (tidak dianggap salah/error oleh user) agar sistem dapat menampilkannya dalam bentuk miring (italic). PENTING: Setiap istilah asing/daerah/judul karya di dalam teks HARUS ditulis miring: (a) jika ditulis benar, masukkan ke dalam "italicWords"; (b) jika ingin dijadikan soal latihan kesalahan (italic error), biarkan tertulis tegak di dalam teks dan Anda WAJIB mendaftarkannya di dalam array "errors" dengan category: "italic" (correct menggunakan tanda bintang, contoh: "*internship*"). JANGAN PERNAH membiarkan istilah asing/daerah tertulis tegak (tidak miring) tanpa didaftarkan sebagai kesalahan, karena hal itu akan dinilai sebagai kesalahan tidak sengaja. Jika tidak ada kata asing yang benar di dalam teks, isi dengan array kosong [].

5. POLA KESALAHAN KHUSUS YANG HARUS DIMASUKKAN (Sangat Penting untuk Latihan UTBK PBM & PPU):
    - Kata Tidak Baku Tersembunyi (kata_baku): Sembunyikan satu kata TIDAK BAKU di tengah kalimat panjang dan kompleks yang tampak benar (DILARANG diletakkan di awal atau akhir kalimat). Gunakan kata yang sering salah di UTBK. Contoh prioritas:
      * merespon (→ merespons), analisa (→ analisis), merubah (→ mengubah)
      * nasehat (→ nasihat), resiko (→ risiko), praktek (→ praktik)
      * sistim (→ sistem), apotik (→ apotek), atlit (→ atlet)
      * diagnosa (→ diagnosis), propinsi (→ provinsi), ijin (→ izin)
      * tehnik (→ teknik), kreatifitas (→ kreativitas), produktip (→ produktif)
      * rubah (→ ubah), karir (→ karier), sekedar (→ sekadar)
      * aktifitas (→ aktivitas), efektifitas (→ efektivitas)
      * nampak (→ tampak), nafas (→ napas), hutang (→ utang)
      * jaman (→ zaman), himbau (→ imbau), azas (→ asas)
      Gunakan kategori: "spelling".
    - Redundansi / Pleonasme (redundansi): Sisipkan redundansi/pleonasme yang terasa natural (misal: "berbagai macam X-X", "sejumlah X-X", "para X-X", "saling X satu sama lain", "agar supaya", "demi untuk", "seperti misalnya", "adalah merupakan", "sangat amat", "naik ke atas", "turun ke bawah"). Perbaikannya adalah menghilangkan salah satu unsur redundan. Gunakan kategori: "spelling".
    - Ketidakparalelan Frasa Rincian (paralelisme): Buat satu frasa rincian (minimal 3 unsur) dengan bentuk kata turunan yang tidak paralel (terutama unsur terakhir/ke-3). Contoh: "memperluas, menambah, dan pembentuk" (→ membentuk), atau "peningkatan, pengembangan, dan melatih" (→ pelatihan). Gunakan kategori: "affix".
    - Koma setelah Yaitu/Yakni (comma_yaitu): Sisipkan koma setelah "yaitu/yakni" (contoh salah: "...yaitu, ...", yang benar: "...yaitu ..."). Gunakan kategori: "comma".
    - Koma Pemisah Subjek dan Predikat (comma_subjek_predikat): Sisipkan koma yang salah memisahkan subjek panjang dari predikatnya. PENTING: Sengaja buat subjek yang SANGAT panjang (20–30 kata) agar koma setelahnya terasa seperti jeda napas alami yang wajar — semakin panjang subjeknya, semakin efektif jebakannya karena koma terasa "perlu" padahal tetap salah. Gunakan kategori: "comma".
    - Koma Sebelum Bahwa (comma_bahwa): Sisipkan koma sebelum "bahwa" yang salah. Gunakan kategori: "comma".
    - Koma Sisipan Sebelah (comma_sisipan_sebelah): Sisipkan keterangan aposisi/sisipan yang pincang karena hanya diberi tanda koma di satu sisi. Gunakan kategori: "comma".
    - Koma Konjungsi Hilang (comma_konjungsi): Hilangkan koma sebelum tetapi, melainkan, sedangkan. Gunakan kategori: "comma".
    - Koma Keterangan Awal Pendek (comma_keterangan_awal): Hilangkan koma setelah keterangan waktu/modalitas PENDEK di awal kalimat. Pola jebakan: "Saat ini X terlibat...", "Idealnya X harus...", "Pada dasarnya X merupakan...", "Sementara itu X juga...", "Di sisi lain X menganggap...". Keterangan awal yang pendek ini sangat sering lolos dari perhatian siswa karena kalimat terasa wajar tanpa koma padahal EYD V mewajibkannya. Gunakan kategori: "comma" (rule: comma_anak_kalimat).
    - Penulisan Nominal Uang (nominal_uang): Tulis nominal uang TANPA koma desimal untuk nilai bulat. Contoh salah: "Rp3.750.000.000" → benar: "Rp3.750.000.000,00". Contoh salah: "Rp15.000" → benar: "Rp15.000,00". Gunakan kategori: "comma".
    - Huruf Kapital Kata Umum: Masukkan huruf kapital salah pada kata umum yang terasa seperti nama diri, seperti "Para Ilmuwan", "Cinta", "Bulan", "Matahari" dalam konteks umum/non-khusus (contoh salah: "para Ilmuwan", yang benar: "para ilmuwan"). Gunakan kategori: "capitalization".
    - Kalimat Tanpa Subjek Tersamar: Penggunaan kata depan di awal kalimat panjang yang mengaburkan/menghilangkan subjek (contoh salah: "Bagi para siswa yang akan mengikuti ujian, diharapkan...", yang benar: "Para siswa yang akan mengikuti ujian diharapkan..."). Gunakan kategori: "preposition" (perbaikannya adalah menghapus kata depan di depan kalimat).

DAFTAR ATURAN RESMI (PILIH KATEGORI, RULE, DAN EXPLANATION DARI DAFTAR INI SAJA):

* Kategori: capitalization
  - ID: capitalization_awal
    * rule: "Huruf Pertama Awal Kalimat"
    * explanation: "Huruf pertama awal kalimat harus menggunakan huruf kapital."
  - ID: capitalization_nama
    * rule: "Huruf Kapital Nama Orang"
    * explanation: "Huruf pertama nama diri orang atau julukan ditulis dengan huruf kapital."
  - ID: capitalization_geografi
    * rule: "Huruf Kapital Nama Geografi"
    * explanation: "Huruf pertama nama diri geografi ditulis dengan huruf kapital jika diikuti nama diri geografinya."
  - ID: capitalization_waktu
    * rule: "Huruf Kapital Nama Hari, Bulan, dan Hari Raya"
    * explanation: "Huruf pertama nama hari, bulan, tahun, hari raya, dan peristiwa sejarah ditulis dengan huruf kapital."
  - ID: capitalization_gelar
    * rule: "Huruf Kapital Nama Gelar"
    * explanation: "Huruf pertama nama gelar kehormatan, keturunan, keagamaan, atau akademik yang diikuti nama orang ditulis dengan huruf kapital."
  - ID: capitalization_akronim
    * rule: "Huruf Kapital Singkatan dan Akronim"
    * explanation: "Singkatan nama resmi lembaga, organisasi, atau dokumen resmi ditulis dengan huruf kapital."
  - ID: capitalization_umum
    * rule: "Huruf Kecil untuk Kata Umum"
    * explanation: "Kata umum (bukan nama diri) yang terasa seperti istilah khusus tetap ditulis dengan huruf kecil jika tidak termasuk dalam kategori yang memerlukan huruf kapital (contoh: ilmuwan, bulan, matahari dalam konteks umum)."

* Kategori: italic
  - ID: italic_asing
    * rule: "Huruf Miring untuk Istilah Asing"
    * explanation: "Kata atau ungkapan dalam bahasa asing atau bahasa daerah yang belum diserap ditulis dengan huruf miring."
  - ID: italic_karya
    * rule: "Huruf Miring untuk Judul Karya"
    * explanation: "Huruf miring digunakan untuk menuliskan judul buku, nama majalah, atau nama surat kabar yang dikutip dalam tulisan."
  - ID: italic_istilah
    * rule: "Huruf Miring untuk Penegasan Kata"
    * explanation: "Huruf miring digunakan untuk menegaskan atau mengkhususkan huruf, bagian kata, kata, atau kelompok kata."

* Kategori: affix
  - ID: affix_gabung
    * rule: "Kata Turunan Berimbuhan Gabung"
    * explanation: "Gabungan kata yang sekaligus mendapat awalan dan akhiran ditulis serangkai."
  - ID: affix_terikat
    * rule: "Kata Turunan Bentuk Terikat"
    * explanation: "Bentuk terikat (seperti antar-, pasca-, sub-, multi-) ditulis serangkai dengan kata yang mengikutinya."
  - ID: affix_paralelisme
    * rule: "Keselarasan Bentuk Kata Turunan dalam Frasa Rincian"
    * explanation: "Unsur-unsur dalam frasa rincian harus memiliki bentuk kata turunan yang paralel (misalnya semua verba atau semua nomina)."

* Kategori: preposition
  - ID: preposition_di
    * rule: "Penulisan Kata Depan 'di'"
    * explanation: "Kata depan 'di' wajib ditulis terpisah dari kata yang mengikutinya jika menunjukkan tempat."
  - ID: preposition_ke
    * rule: "Penulisan Kata Depan 'ke'"
    * explanation: "Kata depan 'ke' wajib ditulis terpisah dari kata yang mengikutinya jika menunjukkan arah tujuan."

* Kategori: particle
  - ID: particle_pun
    * rule: "Penulisan Partikel 'pun'"
    * explanation: "Partikel 'pun' ditulis terpisah dari kata yang mendahuluinya, kecuali pada konjungsi yang sudah padu."
  - ID: particle_lah
    * rule: "Penulisan Partikel 'lah/kah'"
    * explanation: "Partikel '-lah', '-kah', dan '-tah' ditulis serangkai dengan kata yang mendahuluinya."

* Kategori: abbreviation
  - ID: abbreviation_umum
    * rule: "Singkatan Umum Tiga Huruf"
    * explanation: "Singkatan umum yang terdiri atas tiga huruf atau lebih diikuti satu tanda titik (dll., dsb.)."
  - ID: abbreviation_satuan
    * rule: "Singkatan Satuan Ukuran"
    * explanation: "Singkatan satuan ukuran, takaran, timbangan, dan mata uang tidak diikuti tanda titik (kg, cm, Rp)."

* Kategori: numeral
  - ID: numeral_teks_biasa
    * rule: "Penulisan Bilangan Satu atau Dua Kata"
    * explanation: "Bilangan dalam teks yang dapat dinyatakan dengan satu atau dua kata wajib ditulis dengan huruf, bukan angka."
  - ID: numeral_awal_kalimat
    * rule: "Penulisan Bilangan di Awal Kalimat"
    * explanation: "Penulisan bilangan di awal kalimat wajib ditulis dengan huruf."

* Kategori: pronoun
  - ID: pronoun_ku_kau
    * rule: "Penulisan Kata Ganti ku-, kau-, -ku, -mu, -nya"
    * explanation: "Kata ganti ku- dan kau- ditulis serangkai dengan kata yang mengikutinya; -ku, -mu, dan -nya ditulis serangkai dengan kata yang mendahuluinya."
  - ID: pronoun_nya
    * rule: "Penulisan Kata Ganti -nya Tuhan"
    * explanation: "Kata ganti Tuhan (-Nya, -Mu, -Ku) ditulis dengan huruf kapital dan dirangkai dengan tanda hubung."

* Kategori: article
  - ID: article_si_sang
    * rule: "Penulisan Kata Sandang si dan sang"
    * explanation: "Kata 'si' dan 'sang' ditulis terpisah dari kata yang mengikutinya."

* Kategori: period
  - ID: period_akhir
    * rule: "Tanda Titik Akhir Kalimat"
    * explanation: "Tanda titik digunakan pada akhir kalimat pernyataan."
  - ID: period_ribuan
    * rule: "Tanda Titik untuk Bilangan Ribuan"
    * explanation: "Tanda titik digunakan untuk memisahkan bilangan ribuan atau kelipatannya yang menunjukkan jumlah."

* Kategori: comma
  - ID: comma_perincian
    * rule: "Tanda Koma pada Perincian"
    * explanation: "Tanda koma digunakan di antara unsur-unsur dalam perincian yang terdiri atas tiga unsur atau lebih."
  - ID: comma_penghubung
    * rule: "Tanda Koma setelah Konjungsi Antarkalimat"
    * explanation: "Tanda koma digunakan di belakang kata atau ungkapan penghubung antarkalimat yang terdapat pada awal kalimat."
  - ID: comma_anak_kalimat
    * rule: "Tanda Koma pada Anak Kalimat yang Mendahului Induk Kalimat"
    * explanation: "Tanda koma digunakan untuk memisahkan anak kalimat yang mendahului induk kalimatnya."
  - ID: comma_aposisi
    * rule: "Tanda Koma untuk Keterangan Aposisi"
    * explanation: "Tanda koma digunakan untuk mengapit keterangan tambahan atau keterangan aposisi."
  - ID: comma_konjungsi_antarklausa
    * rule: "Tanda Koma sebelum Konjungsi Antarklausa"
    * explanation: "Tanda koma digunakan sebelum konjungsi pertentangan seperti tetapi, melainkan, dan sedangkan yang menghubungkan dua klausa."
  - ID: comma_desimal_uang
    * rule: "Tanda Koma sebagai Pemisah Desimal Mata Uang"
    * explanation: "Penulisan nominal mata uang menggunakan tanda koma sebagai pemisah desimal, termasuk untuk nilai bulat (contoh: Rp1.000,00)."

* Kategori: semicolon
  - ID: semicolon_setara
    * rule: "Tanda Titik Koma untuk Kalimat Setara"
    * explanation: "Tanda titik koma digunakan sebagai pengganti kata penghubung untuk memisahkan bagian kalimat yang setara."
  - ID: semicolon_perincian
    * rule: "Tanda Titik Koma pada Perincian Akhir"
    * explanation: "Tanda titik koma digunakan pada akhir perincian yang berupa klausa."

* Kategori: colon
  - ID: colon_perincian
    * rule: "Tanda Titik Dua pada Perincian Lengkap"
    * explanation: "Tanda titik dua digunakan pada akhir suatu pernyataan lengkap yang diikuti perincian."
  - ID: colon_transitif
    * rule: "Titik Dua Setelah Predikat Transitif"
    * explanation: "Tanda titik dua tidak digunakan langsung setelah predikat transitif (seperti meliputi, mencakup, memuat, adalah, yaitu) karena klausa sebelumnya bukan merupakan pernyataan lengkap."
  - ID: colon_kutipan
    * rule: "Tanda Titik Dua Sebelum Kutipan/Penjelasan"
    * explanation: "Tanda titik dua digunakan sesudah kata atau ungkapan yang memerlukan pemerian."

* Kategori: hyphen
  - ID: hyphen_ulang
    * rule: "Tanda Hubung pada Kata Ulang"
    * explanation: "Tanda hubung digunakan untuk menyambung unsur kata ulang."
  - ID: hyphen_imbuhan_asing
    * rule: "Tanda Hubung untuk Imbuhan Asing/Bahasa Daerah"
    * explanation: "Tanda hubung digunakan untuk merangkai unsur bahasa Indonesia dengan unsur bahasa asing atau daerah."

* Kategori: dash
  - ID: dash_batasan
    * rule: "Tanda Pisah untuk Batasan Bilangan/Tanggal"
    * explanation: "Tanda pisah (—) digunakan di antara dua bilangan atau tanggal yang berarti 'sampai dengan'."
  - ID: dash_penyisipan
    * rule: "Tanda Pisah untuk Penjelasan Tambahan"
    * explanation: "Tanda pisah (—) digunakan untuk membatasi penyisipan kata atau kalimat yang memberi penjelasan di luar bangun kalimat."

* Kategori: question
  - ID: question_akhir
    * rule: "Tanda Tanya Akhir Kalimat Tanya"
    * explanation: "Tanda tanya digunakan pada akhir kalimat tanya."
  - ID: question_ragu
    * rule: "Tanda Tanya untuk Menyatakan Keraguan"
    * explanation: "Tanda tanya digunakan di dalam tanda kurung untuk menyatakan bagian kalimat yang disangsikan atau kurang dapat dibuktikan kebenarannya."

* Kategori: quotation
  - ID: quotation_langsung
    * rule: "Tanda Petik untuk Petikan Langsung"
    * explanation: "Tanda petik digunakan untuk mengapit petikan langsung yang berasal dari naskah/pembicaraan."

* Kategori: single-quotation
  - ID: single-quotation_makna
    * rule: "Tanda Petik Tunggal untuk Makna Kata/Ungkapan"
    * explanation: "Tanda petik tunggal digunakan untuk mengapit terjemahan atau penjelasan kata atau ungkapan asing."
  - ID: single-quotation_petikan
    * rule: "Tanda Petik Tunggal dalam Petikan Lain"
    * explanation: "Tanda petik tunggal digunakan untuk mengapit petikan yang terdapat dalam petikan lain."

* Kategori: parentheses
  - ID: parentheses_tambahan
    * rule: "Tanda Kurung untuk Penjelasan Tambahan"
    * explanation: "Tanda kurung digunakan untuk mengapit penjelasan tambahan."

* Kategori: slash
  - ID: slash_nomor_tahun
    * rule: "Tanda Garis Miring untuk Nomor Surat dan Tahun"
    * explanation: "Tanda garis miring (/) digunakan dalam nomor surat, nomor alamat, dan penandaan masa satu tahun yang terbagi dalam dua tahun takwim."
  - ID: slash_arti_atau
    * rule: "Tanda Garis Miring sebagai Pengganti Dan/Atau/Tiap"
    * explanation: "Tanda garis miring (/) digunakan sebagai pengganti kata 'dan', 'atau', serta 'tiap'."

* Kategori: apostrophe
  - ID: apostrophe_penghilangan
    * rule: "Tanda Apostrof untuk Penghilangan Bagian Kata"
    * explanation: "Tanda penyingkat (') digunakan untuk menunjukkan penghilangan bagian kata atau bagian angka tahun."

* Kategori: spelling
  - ID: spelling_tidak_baku
    * rule: "Penulisan Kata Baku"
    * explanation: "Kata tidak baku wajib diganti dengan kata baku yang sesuai dengan kaidah bahasa Indonesia EYD V."
  - ID: spelling_redundansi
    * rule: "Penghindaran Pleonasme/Redundansi"
    * explanation: "Penggunaan unsur kata yang berlebihan (pleonasme/redundansi) harus dihindari dengan menghilangkan salah satu unsur yang bermakna sama."

VERIFIKASI AKHIR SEBELUM OUTPUT:
1. Baca ulang setiap "text" — pastikan setiap kata di field "word" BENAR-BENAR ADA di dalam "text" (karakter per karakter, case-sensitive).
2. Pastikan "correct" adalah perbaikan yang BENAR sesuai EYD V, bukan sekadar alternatif.
3. Hitung jumlah elemen di array "errors" — pastikan sesuai batasan kesulitan (beginner: 2–3, intermediate: 2–4, advanced: 3–5).
4. Pastikan semua istilah asing di teks sudah masuk ke "italicWords" ATAU ke "errors" (tidak ada yang terlewat).
5. Pastikan TIDAK ADA kategori yang tidak terdaftar di DAFTAR ATURAN RESMI di atas.
6. Pastikan "occurrence" benar untuk setiap error — jika kata yang sama muncul lebih dari sekali di teks, "occurrence" harus merujuk ke kemunculan yang tepat (0 untuk pertama, 1 untuk kedua, dst.).

SKEMA OUTPUT JSON (KEMBALIKAN HANYA JSON INI SAJA):
{
  "setConfig": {
    "id": "set_[id_set_baru, misalnya set_020]",
    "title": "[Nama Tema]",
    "description": "[Deskripsi Singkat Tema]",
    "difficulty": "[Tingkat Kesulitan]",
    "emoji": "[Emoji Tema]",
    "exerciseIds": [
      "custom_[unix_timestamp_soal_1]",
      "custom_[unix_timestamp_soal_2]",
      "custom_[unix_timestamp_soal_3]",
      "custom_[unix_timestamp_soal_4]",
      "custom_[unix_timestamp_soal_5]"
    ]
  },
  "exercises": [
    {
      "id": "custom_[unix_timestamp_soal_1]",
      "difficulty": "[Tingkat Kesulitan]",
      "categories": ["[isi kategori utama kesalahan yang dipilih]"],
      "title": "[Judul Menarik Soal 1]",
      "text": "[Teks sesuai spesifikasi tingkat kesulitan]",
      "italicWords": ["[daftar kata/frasa asing yang ditulis miring secara benar di teks 1, jika tidak ada isi []]"],
      "errors": [
        {
          "word": "[kata/frasa salah di teks]",
          "occurrence": 0,
          "correct": "[kata/frasa yang benar]",
          "category": "[kategori dari daftar resmi]",
          "rule": "[salin kolom 'rule' dari daftar resmi secara persis sesuai ID aturan]",
          "explanation": "[salin kolom 'explanation' dari daftar resmi secara persis sesuai ID aturan]"
        }
      ]
    },
    {
      "id": "custom_[unix_timestamp_soal_2]",
      "difficulty": "[Tingkat Kesulitan]",
      "categories": ["[isi kategori utama kesalahan yang dipilih]"],
      "title": "[Judul Menarik Soal 2]",
      "text": "[Teks sesuai spesifikasi tingkat kesulitan]",
      "italicWords": ["[daftar kata/frasa asing yang ditulis miring secara benar di teks 2, jika tidak ada isi []]"],
      "errors": [
        {
          "word": "[kata/frasa salah di teks]",
          "occurrence": 0,
          "correct": "[kata/frasa yang benar]",
          "category": "[kategori dari daftar resmi]",
          "rule": "[salin kolom 'rule' dari daftar resmi secara persis sesuai ID aturan]",
          "explanation": "[salin kolom 'explanation' dari daftar resmi secara persis sesuai ID aturan]"
        }
      ]
    },
    {
      "id": "custom_[unix_timestamp_soal_3]",
      "difficulty": "[Tingkat Kesulitan]",
      "categories": ["[isi kategori utama kesalahan yang dipilih]"],
      "title": "[Judul Menarik Soal 3]",
      "text": "[Teks sesuai spesifikasi tingkat kesulitan]",
      "italicWords": ["[daftar kata/frasa asing yang ditulis miring secara benar di teks 3, jika tidak ada isi []]"],
      "errors": [
        {
          "word": "[kata/frasa salah di teks]",
          "occurrence": 0,
          "correct": "[kata/frasa yang benar]",
          "category": "[kategori dari daftar resmi]",
          "rule": "[salin kolom 'rule' dari daftar resmi secara persis sesuai ID aturan]",
          "explanation": "[salin kolom 'explanation' dari daftar resmi secara persis sesuai ID aturan]"
        }
      ]
    },
    {
      "id": "custom_[unix_timestamp_soal_4]",
      "difficulty": "[Tingkat Kesulitan]",
      "categories": ["[isi kategori utama kesalahan yang dipilih]"],
      "title": "[Judul Menarik Soal 4]",
      "text": "[Teks sesuai spesifikasi tingkat kesulitan]",
      "italicWords": ["[daftar kata/frasa asing yang ditulis miring secara benar di teks 4, jika tidak ada isi []]"],
      "errors": [
        {
          "word": "[kata/frasa salah di teks]",
          "occurrence": 0,
          "correct": "[kata/frasa yang benar]",
          "category": "[kategori dari daftar resmi]",
          "rule": "[salin kolom 'rule' dari daftar resmi secara persis sesuai ID aturan]",
          "explanation": "[salin kolom 'explanation' dari daftar resmi secara persis sesuai ID aturan]"
        }
      ]
    },
    {
      "id": "custom_[unix_timestamp_soal_5]",
      "difficulty": "[Tingkat Kesulitan]",
      "categories": ["[isi kategori utama kesalahan yang dipilih]"],
      "title": "[Judul Menarik Soal 5]",
      "text": "[Teks sesuai spesifikasi tingkat kesulitan]",
      "italicWords": ["[daftar kata/frasa asing yang ditulis miring secara benar di teks 5, jika tidak ada isi []]"],
      "errors": [
        {
          "word": "[kata/frasa salah di teks]",
          "occurrence": 0,
          "correct": "[kata/frasa yang benar]",
          "category": "[kategori dari daftar resmi]",
          "rule": "[salin kolom 'rule' dari daftar resmi secara persis sesuai ID aturan]",
          "explanation": "[salin kolom 'explanation' dari daftar resmi secara persis sesuai ID aturan]"
        }
      ]
    }
  ]
}
`;

  const res = await fetch(`${GEMINI_API_URL}?key=${activeKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
    }),
  });

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  console.log('--- RAW AI GENERATED TEXT ---');
  console.log(rawText);
  console.log('-----------------------------');
  
  fs.writeFileSync('test_output.json', JSON.stringify(data, null, 2));
}

testFetch();
