/**
 * Gemini API integration for AI-generated EYD V exercises.
 * Falls back to rich mock exercises when no API key is provided.
 */

const jsonModules = import.meta.glob('../data/**/*.json', { eager: true });
const customExercises = [];
for (const path in jsonModules) {
  if (path.endsWith('sets.json')) continue;
  const content = jsonModules[path].default;
  if (Array.isArray(content)) {
    const validExercises = content.filter(item => item && item.text && Array.isArray(item.errors));
    customExercises.push(...validExercises);
  } else if (content && typeof content === 'object' && content.text && Array.isArray(content.errors)) {
    customExercises.push(content);
  }
}
console.log(`[EYD Practice] Total exercises loaded recursively from src/data: ${customExercises.length}`);

export const getExerciseById = (id) => customExercises.find(e => e.id === id);
export const getAllExercises = () => customExercises;

const SYSTEM_PROMPT = `Kamu adalah ahli tata bahasa Indonesia EYD V.
Buatkan 1 soal latihan interaktif dalam format JSON persis seperti ini:

{
  "id": "ai_<unix_timestamp>",
  "difficulty": "<beginner|intermediate|advanced>",
  "categories": ["<kategori>"],
  "title": "<judul singkat>",
  "text": "<sebuah cerita/teks utuh yang terdiri atas TEPAT 3 paragraf, dengan masing-masing paragraf memiliki MINIMAL 3 kalimat utuh (total minimal 9 kalimat dalam teks), ditulis dalam bahasa Indonesia dengan kesinambungan makna yang kuat antar-paragraf dan antar-kalimat, dan beberapa kesalahan ejaan/EYD V yang sengaja dimasukkan secara tersebar>",
  "italicWords": ["<kata atau frasa asing/daerah/ilmiah yang ditulis miring secara benar di dalam teks (tidak dianggap salah oleh user)>"],
  "errors": [
    {
      "word": "<kata atau tanda baca salah persis seperti yang tertulis dalam teks>",
      "occurrence": 0,
      "correct": "<versi perbaikan yang benar sesuai kaidah EYD V>",
      "category": "<kategori>",
      "rule": "<nama aturan EYD V>",
      "explanation": "<penjelasan singkat mengapa salah dan apa aturannya dalam bahasa Indonesia>"
    }
  ]
}

Aturan penting untuk pembuatan soal:
1. Bidang "text" HARUS terdiri atas TEPAT 3 paragraf yang dipisahkan oleh dua karakter baris baru (\n\n). Setiap paragraf HARUS berisi MINIMAL 3 kalimat utuh (total minimal 9 kalimat). Jangan berupa satu paragraf atau satu kalimat tunggal.
2. Kesalahan ejaan atau tanda baca yang disengaja harus disebar di sepanjang ketiga paragraf tersebut. Jangan menumpuk kesalahan hanya di satu paragraf atau kalimat.
3. Bidang "occurrence" adalah indeks kemunculan kata salah tersebut dalam teks (dimulai dari 0 untuk kemunculan pertama). Jika kata yang sama muncul lebih dari sekali, pastikan "occurrence" merujuk tepat pada posisi kata salah yang ingin dikoreksi.
4. Bidang "word" harus berisi tepat kata yang salah sebagaimana ia tertulis dalam "text" (termasuk huruf besar/kecil atau tanda baca yang menempel).
5. Pastikan teks "correct" (jawaban benar) dan draf teks awal ("text") bebas dari kesalahan tata bahasa/tanda baca yang tidak disengaja. Sangat perhatikan penggunaan tanda koma: salam pembuka surat wajib diakhiri koma (contoh: "Dengan hormat,"), keterangan aposisi di tengah kalimat WAJIB diapit koma, JANGAN menaruh koma sebelum "dan" jika perincian hanya ada dua unsur, dan JANGAN PERNAH menaruh tanda koma sebelum konjungsi subordinatif seperti "sehingga", "karena", "agar", "bahwa", "jika", dll. (contoh salah: "..., sehingga ...", yang benar: "... sehingga ..."). JANGAN mencampur kata contoh seperti "seperti", "misalnya", "antara lain" dengan singkatan "dll.", "dst.", "dsb." dalam satu kalimat (pleonasme).
6. Jika kesalahan melibatkan beberapa kata berurutan yang harus diperbaiki bersama (seperti nama geografi "pulau jawa" -> "Pulau Jawa", atau konjungsi antarkalimat "oleh karena itu" -> "Oleh karena itu,"), Anda WAJIB menggabungkannya sebagai satu entri kesalahan. Set bidang "word" berisi seluruh frasa salah tersebut (contoh: "word": "pulau jawa", "correct": "Pulau Jawa", atau "word": "oleh karena itu", "correct": "Oleh karena itu,"). Jangan memecahnya or mengabaikan sebagian kata dalam frasa tersebut.
7. Jika menggunakan tanda pisah (dash), JANGAN PERNAH menggunakan tanda hubung ganda ("--" atau "- -"). Anda WAJIB menggunakan satu karakter em-dash asli ("—") secara langsung tanpa spasi di sekelilingnya (contoh salah: "itu - - hasil", contoh benar: "itu—hasil").
8. JANGAN PERNAH meletakkan singkatan umum yang memerlukan tanda titik (seperti "dll.", "dst.", "dsb.") di akhir kalimat. Hal ini untuk menghindari kebingungan karena tanda titik singkatan bergabung dengan tanda titik akhir kalimat. Letakkan singkatan tersebut di tengah kalimat jika ingin mengujinya.
9. Bidang "italicWords" wajib berisi daftar kata atau frasa asing/daerah/ilmiah/judul karya yang tertulis secara BENAR di dalam teks (tidak dianggap salah/error oleh user) agar sistem dapat menampilkannya dalam bentuk miring (italic). PENTING: Setiap istilah asing/daerah/judul karya di dalam teks HARUS ditulis miring: (a) jika ditulis benar, masukkan ke dalam "italicWords"; (b) jika ingin dijadikan soal latihan kesalahan (italic error), biarkan tertulis tegak di dalam teks dan Anda WAJIB mendaftarkannya di dalam array "errors" dengan category: "italic" (correct menggunakan tanda bintang, contoh: "*internship*"). JANGAN PERNAH membiarkan istilah asing/daerah tertulis tegak (tidak miring) tanpa didaftarkan sebagai kesalahan, karena hal itu akan dinilai sebagai kesalahan tidak sengaja. Jika tidak ada kata asing yang benar di dalam teks, isi dengan array kosong [].
10. POLA KESALAHAN KHUSUS YANG HARUS DIMASUKKAN (Sangat Penting):
    a. Kata Tidak Baku Tersembunyi: Selipkan tepat satu kata tidak baku di tengah kalimat panjang dan kompleks yang tampak benar. Contoh: "merespon" -> "merespons" (affix), "merubah" -> "mengubah" (affix), "analisa" -> "analisis" (spelling).
    b. Tanda Koma setelah Yaitu/Yakni: Masukkan kesalahan berupa penambahan koma setelah kata hubung "yaitu" atau "yakni" (contoh salah: "...yaitu, ...", yang benar: "...yaitu ..."). Gunakan kategori: "comma".
    c. Koma Pemisah Subjek dan Predikat: Masukkan kesalahan berupa koma yang memisahkan subjek panjang dari predikatnya (contoh salah: "Teknologi keantariksaan yang makin gencar diperbarui, menyebabkan...", yang benar: "Teknologi keantariksaan yang makin gencar diperbarui menyebabkan..."). Gunakan kategori: "comma".
    d. Huruf Kapital Kata Umum: Masukkan huruf kapital salah pada kata umum yang terasa seperti nama diri, seperti "Para Ilmuwan", "Cinta", "Bulan", "Matahari" dalam konteks umum/non-khusus (contoh salah: "para Ilmuwan", yang benar: "para ilmuwan"). Gunakan kategori: "capitalization".
    e. Kalimat Tanpa Subjek Tersamar: Penggunaan kata depan di awal kalimat panjang yang mengaburkan/menghilangkan subjek (contoh salah: "Bagi para siswa yang akan mengikuti ujian, diharapkan...", yang benar: "Para siswa yang akan mengikuti ujian diharapkan..."). Gunakan kategori: "preposition" (perbaikannya adalah menghapus kata depan di depan kalimat).



DAFTAR ATURAN RESMI (HANYA PILIH DARI SINI):
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
    * explanation: "Bilangan di awal kalimat wajib ditulis dengan huruf."

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
* Kategori: ellipsis
  - ID: ellipsis_putus
    * rule: "Tanda Elipsis untuk Kalimat Terputus-putus"
    * explanation: "Tanda elipsis (...) digunakan untuk menunjukkan bahwa dalam suatu kalimat atau kutipan ada bagian yang dihilangkan atau terputus."
  - ID: ellipsis_tanya
    * rule: "Tanda Elipsis untuk Dialog Belum Selesai"
    * explanation: "Tanda elipsis digunakan untuk menulis dialog yang belum selesai atau terhenti."

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
    * explanation: "Kata tidak baku wajib diganti dengan kata baku yang sesuai dengan kaidah bahasa Indonesia PUEBI/EYD V."

Kembalikan hanya JSON, tanpa markdown.`;

const FALLBACK_EXERCISE = {
  id: "fallback_001",
  difficulty: "beginner",
  categories: ["capitalization"],
  title: "Latihan Bawaan (Dataset Kosong)",
  text: "selamat datang di eyd trainer. silakan tambahkan berkas json berisi kumpulan soal latihan ke dalam folder src/data.",
  errors: [
    {
      word: "selamat",
      occurrence: 0,
      correct: "Selamat",
      category: "capitalization",
      rule: "Huruf Kapital",
      explanation: "Huruf pertama awal kalimat harus menggunakan huruf kapital."
    }
  ]
};

export async function generateExercise(apiKey, difficulty = 'random', category = '', currentId = '') {
  // AI is disabled. Always pull from the local dataset.
  return getMockExercise(difficulty, category, currentId);
}

/** Randomly pick a mock exercise matching the requested category and difficulty */
function getMockExercise(difficulty, category, currentId = '') {
  const targetDifficulty = difficulty || 'random';
  const isRandom = targetDifficulty === 'all' || targetDifficulty === 'random';
  let pool = customExercises.length ? customExercises : [FALLBACK_EXERCISE];
  
  if (category) {
    const catPool = pool.filter((e) => e.categories.includes(category));
    if (catPool.length > 0) {
      const diffPool = isRandom ? catPool : catPool.filter((e) => e.difficulty === targetDifficulty);
      pool = diffPool.length > 0 ? diffPool : catPool;
    }
  } else if (!isRandom) {
    pool = pool.filter((e) => e.difficulty === targetDifficulty);
  }

  const src = pool.length ? pool : [FALLBACK_EXERCISE];
  
  // Filter out the current exercise if possible
  let filteredSrc = src;
  if (currentId) {
    filteredSrc = src.filter(e => e.baseId !== currentId && e.id !== currentId);
    
    // If the specific difficulty pool only had 1 exercise, fall back to any difficulty in the SAME category
    if (filteredSrc.length === 0 && category) {
      const broaderPool = (customExercises.length ? customExercises : [FALLBACK_EXERCISE]).filter((e) => e.categories.includes(category));
      filteredSrc = broaderPool.filter(e => e.baseId !== currentId && e.id !== currentId);
    }
    
    // If absolutely no other exercise exists, just repeat it
    if (filteredSrc.length === 0) {
      filteredSrc = src;
    }
  }

  const picked = filteredSrc[Math.floor(Math.random() * filteredSrc.length)] || FALLBACK_EXERCISE;
  return { ...picked, baseId: picked.baseId || picked.id, id: `mock_${Date.now()}` };
}

export const CATEGORY_LABEL = {
  'capitalization': 'Huruf Kapital',
  'italic': 'Huruf Miring',
  'spelling': 'Kata Baku/Tidak Baku',
  'affix': 'Kata Turunan',
  'preposition': 'Kata Depan',
  'particle': 'Partikel',
  'abbreviation': 'Singkatan',
  'numeral': 'Angka dan Bilangan',
  'pronoun': 'Kata Ganti',
  'article': 'Kata Sandang',
  'period': 'Tanda Titik',
  'comma': 'Tanda Koma',
  'semicolon': 'Tanda Titik Koma',
  'colon': 'Tanda Titik Dua',
  'hyphen': 'Tanda Hubung',
  'dash': 'Tanda Pisah',
  'question': 'Tanda Tanya',
  'ellipsis': 'Ellipsis',
  'quotation': 'Tanda Petik',
  'single-quotation': 'Tanda Petik Tunggal',
  'parentheses': 'Tanda Kurung',
  'slash': 'Tanda Garis Miring',
  'apostrophe': 'Tanda Apostrof',
};
