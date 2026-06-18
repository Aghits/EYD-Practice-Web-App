import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, BookOpen, Lock, CheckCircle2, ArrowRight, Award,
  Sparkles, HelpCircle, Check, X, AlertCircle, RefreshCw, MousePointerClick
} from 'lucide-react';
import { useAppStore, isDayLocked } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { tokenizeText, buildErrorSet, enrichErrors } from '../utils/tokenizer';
import { computeResult, shouldReplacePunctuation, getPunctuationPlacement } from '../utils/scoring';
import InteractiveText from './InteractiveText';
import FeedbackPanel from './FeedbackPanel';


const DAYS_DATA = [
  {
    day: 1,
    title: 'Hari 1: Kalimat Efektif & Pola Kalimat',
    description: 'Kesejajaran, kehematan, kelogisan kalimat, serta struktur dasar S-P-O-Pel-Ket.',
    materiTopics: [
      {
        name: 'Kalimat Efektif',
        apaItu: 'Kalimat efektif adalah kalimat yang disusun agar dapat menyampaikan gagasan secara logis, hemat, sejajar, dan mudah dipahami oleh pembaca. Dalam UTBK/SNBT, keefektifan kalimat diuji melalui aspek struktur (pola dasar), kesetaraan (kesejajaran), dan kehematan (hindari redundansi/pleonasme).',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Cek Pola Struktur (Kelogisan S-P & Aturan Kopula)',
            text: 'Kalimat wajib memiliki Subjek (S) dan Predikat (P) yang jelas.\n• Subjek (S) tidak boleh didahului preposisi (dalam, bagi, untuk, pada, di) karena preposisi mengubah subjek menjadi keterangan.\n• Predikat (P) tidak boleh didahului kata "yang" karena kata hubung relatif tersebut mengubah predikat menjadi anak kalimat perluasan.\n• Predikat kopula (adalah, merupakan) tidak boleh diikuti preposisi (untuk, bagi, dll), konjungsi, atau tanda baca. Kopula harus langsung menghubungkan subjek dengan pelengkap (komplemen).\n• Jika kalimat tidak memiliki kata kerja (verba) utama, carilah kata sifat (adjektiva) atau nomina setelah subjek yang dapat bertindak sebagai predikat.',
            examples: [
              { wrong: 'Dalam 100 gram kacang merah kering dapat menghasilkan protein.', correct: '100 gram kacang merah kering dapat menghasilkan protein.', note: 'Preposisi "Dalam" di awal mengubah subjek menjadi keterangan sehingga kalimat kehilangan subjek. Hapus kata "Dalam".' },
              { wrong: 'Pendidikan karakter adalah untuk membentuk kepribadian siswa.', correct: 'Pendidikan karakter adalah membentuk kepribadian siswa. (atau: Pendidikan karakter bertujuan membentuk kepribadian siswa.)', note: 'Setelah kopula "adalah" tidak boleh diikuti preposisi "untuk". Hapus "untuk" agar kopula langsung menghubungkan subjek dengan pelengkap.' },
              { wrong: 'Upaya yang telah dilakukan untuk melestarikan lingkungan.', correct: 'Upaya telah dilakukan untuk melestarikan lingkungan.', note: 'Kata "yang" sebelum predikat "telah dilakukan" membatalkan fungsinya sebagai predikat utama. Hapus kata "yang".' },
              { wrong: 'Pendidikan karakter erat kaitannya dengan keteladanan.', correct: 'Pendidikan karakter berkaitan erat dengan keteladanan.', note: 'Frasa "erat kaitannya" bukan predikat yang sah. Ubah menjadi kata kerja "berkaitan" agar berfungsi sebagai predikat (P), diikuti pelengkap.' }
            ]
          },
          {
            title: '2. Cek Kesetaraan (Kesejajaran Imbuhan)',
            text: 'Jika terdapat rincian unsur yang dihubungkan dengan konjungsi setara (seperti "dan", "atau"), semua bentuk kata atau imbuhan dalam rincian tersebut wajib sejenis (paralel).',
            examples: [
              { wrong: 'Tugas utama mereka adalah menata pedagang kaki lima dan penertiban parkir liar.', correct: 'Tugas utama mereka adalah menata pedagang kaki lima dan menertibkan parkir liar.', note: 'Kata "penertiban" (nomina pe-an) tidak sejajar dengan "menata" (verba me-). Ubah menjadi "menertibkan" agar keduanya berimbuhan me-.' },
              { wrong: 'Program ini bertujuan untuk mengurangi kerusakan sel darah, meningkatkan daya tahan tubuh, dan berkembangnya antibodi.', correct: 'Program ini bertujuan untuk mengurangi kerusakan sel darah, meningkatkan daya tahan tubuh, dan mengembangkan antibodi.', note: 'Kata "berkembangnya" (verba ber- + -nya) tidak sejajar dengan rincian sebelumnya yang menggunakan imbuhan me-. Ubah menjadi "mengembangkan" agar sejajar.' }
            ]
          },
          {
            title: '3. Cek Kehematan (Hindari Redundansi & Pleonasme)',
            text: 'Gunakan kata secara efisien. Hindari pengulangan kata dengan makna yang sama secara berdampingan (pleonasme) atau menggabungkan penanda jamak ganda.',
            examples: [
              { wrong: 'Para siswa-siswa berkumpul di halaman sekolah agar supaya mendapat arahan.', correct: 'Para siswa berkumpul di halaman sekolah agar mendapat arahan. (atau: Siswa-siswa berkumpul...)', note: 'Kata "para" dan bentuk jamak reduplikasi "siswa-siswa" bermakna ganda. Pilih salah satu. Konjungsi "agar" dan "supaya" juga memiliki fungsi yang sama, pilih salah satu saja.' }
            ]
          }
        ]
      },
      {
        name: 'Pola Kalimat',
        apaItu: 'Pola kalimat adalah susunan unsur tata bahasa yang membentuk kalimat utuh, terdiri atas Subjek (S), Predikat (P), Objek (O), Pelengkap (Pel), dan Keterangan (K). Kalimat yang sah minimal harus memiliki unsur Subjek (S) dan Predikat (P).',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Pindai Predikat (P) Dahulu, Baru Temukan Subjek (S)',
            text: '• Predikat (P) dipindai terlebih dahulu sebagai inti tindakan. Carilah kata kerja (verba), kata sifat (adjektiva), kata benda (nomina), atau kopula. Kata bantu/adverbia (sedang, tidak, harus, telah, akan) yang berada di antara subjek dan kata kerja dihitung sebagai satu kesatuan Predikat.\n• Subjek (S) ditemukan dengan menanyakan "Siapa" atau "Apa" yang melakukan tindakan pada Predikat.',
            examples: [
              { wrong: 'Kandungan natrium yang dimiliki kacang merah (S) sangat (P) rendah (Pel).', correct: 'Kandungan natrium yang dimiliki kacang merah (S) sangat rendah (P).', note: '"sangat rendah" adalah frasa adjektiva yang berfungsi langsung sebagai Predikat. Seluruh frasa "Kandungan natrium yang dimiliki kacang merah" adalah satu unsur Subjek karena diperluas oleh "yang dimiliki...".' }
            ]
          },
          {
            title: '2. Bedakan Objek (O) dan Pelengkap (Pel) dengan Uji Pasif',
            text: '• Objek (O) hanya melengkapi verba aktif transitif (berimbuhan me-). Ciri utamanya: Objek dapat dipasifkan (ditukar posisinya menjadi Subjek, verba aktif me- berubah menjadi verba pasif di-).\n• Pelengkap (Pel) melengkapi verba dasar, verba berimbuhan ber-, ter-, ke-an, kata kopula, atau verba pasif (berimbuhan di-). Ciri utamanya: Pelengkap tidak dapat dipasifkan menjadi subjek. Kalimat pasif tidak memiliki Objek, melainkan diikuti Pelengkap.',
            examples: [
              { wrong: 'Rina (S) membaca (P) buku sejarah (Pel).', correct: 'Rina (S) membaca (P) buku sejarah (O).', note: 'Kalimat dapat dipasifkan menjadi "Buku sejarah dibaca oleh Rina". Maka "buku sejarah" adalah Objek.' },
              { wrong: 'Budi (S) bermain (P) sepak bola (O) di lapangan.', correct: 'Budi (S) bermain (P) sepak bola (Pel) di lapangan.', note: 'Predikat "bermain" (verba ber-) tidak dapat dipasifkan ("sepak bola dimain oleh Budi" tidak berterima). Maka "sepak bola" adalah Pelengkap.' }
            ]
          },
          {
            title: '3. Identifikasi Keterangan (K) dan Perluasan Hubungan Relatif',
            text: '• Keterangan (K) menerangkan waktu, tempat, cara, atau tujuan, biasanya diawali oleh preposisi (di, ke, dari, pada, dalam, dengan, untuk).\n• Kata hubung relatif "yang" berfungsi sebagai perluasan kata benda di depannya. Seluruh anak kalimat perluasan tersebut menyatu dengan unsur utama yang diterangkan (tidak dipisahkan menjadi unsur tersendiri).',
            examples: [
              { wrong: 'Adik memperbaiki mainan (O) yang rusak kemarin (K).', correct: 'Adik (S) memperbaiki (P) mainan yang rusak kemarin (O).', note: 'Frasa "yang rusak kemarin" menerangkan kata "mainan" sehingga seluruh frasa "mainan yang rusak kemarin" menyatu sebagai satu kesatuan Objek (O).' }
            ]
          }
        ]
      }
    ],
    quiz: [
      {
        type: 'multiple-choice',
        q: 'Manakah kalimat berikut yang merupakan kalimat efektif?',
        options: [
          'Bagi mahasiswa yang mengambil mata kuliah ini wajib menyerahkan tugas akhir.',
          'Tugas utamanya adalah menyusun laporan dan penulisan artikel ilmiah.',
          'Pemerintah daerah berencana untuk segera memperlebar trotoar jalan protokol.',
          'Perusahaan itu berhasil meningkatkan produktivitas karyawan melalui pelatihan intensif.',
          'Meskipun hari hujan deras, tetapi ia tetap pergi ke perpustakaan kota.'
        ],
        correct: 3,
        explanation: 'Opsi D adalah kalimat efektif yang hemat, sejajar, dan logis. Opsi A kehilangan subjek karena preposisi "Bagi". Opsi B tidak sejajar ("menyusun" vs "penulisan"). Opsi C mubazir ("berencana untuk segera"). Opsi E menggunakan konjungsi ganda ("Meskipun" dan "tetapi").'
      },
      {
        type: 'multiple-choice',
        q: 'Manakah kalimat berikut yang memenuhi syarat keefektifan kalimat?',
        options: [
          'Kepada Bapak Kepala Sekolah, waktu dan tempat kami persilakan.',
          'Ia memakai baju warna merah saat menghadiri acara kenegaraan itu.',
          'Untuk mengatasi kemacetan lalu lintas memerlukan kerja sama semua pihak.',
          'Para mahasiswa-mahasiswa berkumpul di halaman rektorat sejak pagi.',
          'Siswa kelas XII mendiskusikan masalah kebersihan kelas bersama wali kelasnya.'
        ],
        correct: 4,
        explanation: 'Opsi E efektif.\n\n• Opsi A tidak logis karena secara harfiah mempersilakan benda mati ("waktu dan tempat") untuk berbicara/maju. Seharusnya subjek manusia yang dipersilakan, misalnya: "Bapak Kepala Sekolah kami persilakan."\n• Opsi B mubazir karena menyertakan kata "warna" sebelum nama warna spesifik ("warna merah"). Cukup tulis "baju merah".\n• Opsi C tidak memiliki subjek (S) karena diawali kata depan "Untuk", yang mengubah subjek menjadi keterangan.\n• Opsi D mengalami pleonasme (jamak ganda) karena menggabungkan kata "para" dengan kata ulang "mahasiswa-mahasiswa".'
      },
      {
        type: 'interactive',
        q: 'Ketuk/klik kata depan (preposisi) yang membuat kalimat di bawah ini tidak efektif karena kehilangan Subjek yang sah!',
        exercise: {
          text: 'Untuk pembangunan jembatan itu memerlukan biaya yang sangat besar.',
          errors: [
            {
              word: 'Untuk ',
              occurrence: 0,
              correct: '',
              category: 'structure',
              rule: 'Subjek Didahului Preposisi',
              explanation: 'Preposisi "Untuk" di awal kalimat membuat bagian subjek berubah menjadi keterangan sehingga kalimat kehilangan subjek yang sah. Hapus "Untuk" agar "Pembangunan jembatan itu" menjadi subjek.'
            }
          ]
        }
      },
      {
        type: 'interactive',
        q: 'Ketuk/klik kata benda (nomina) yang tidak sejajar dengan kata kerja sebelumnya dalam rincian kalimat berikut!',
        exercise: {
          text: 'Tugas mereka adalah menata pedagang kaki lima dan penertiban area parkir liar.',
          errors: [
            {
              word: 'penertiban',
              occurrence: 0,
              correct: 'menertibkan',
              category: 'paralelisme',
              rule: 'Kesejajaran Bentuk',
              explanation: 'Kata "penertiban" (nomina) tidak sejajar dengan kata "menata" (verba me-). Seharusnya diubah menjadi verba "menertibkan" agar sejajar.'
            }
          ]
        }
      },
      {
        type: 'multiple-choice',
        q: 'Kalimat: "Adik membaca buku sejarah."\n\nKalimat berikut yang memiliki pola dasar yang sama dengan kalimat di atas adalah...',
        options: [
          'Dia bermain sepak bola di lapangan.',
          'Ayah membelikan adik sepeda baru.',
          'Pemerintah daerah segera meresmikan jembatan gantung itu.',
          'Mereka pergi ke perpustakaan.',
          'Udara malam ini terasa dingin.'
        ],
        correct: 2,
        explanation: 'Analisis Kalimat Soal: "Adik (S) membaca (P, verba aktif transitif me-) buku sejarah (O)." -> Pola dasar S-P-O.\n\n• Opsi A: "Dia (S) bermain (P, verba ber-) sepak bola (Pel) di lapangan (Ket)." -> Pola S-P-Pel-Ket. Sepak bola adalah Pelengkap karena tidak dapat dipasifkan.\n• Opsi B: "Ayah (S) membelikan (P, verba bitransitif) adik (O) sepeda baru (Pel)." -> Pola S-P-O-Pel. Adik adalah Objek karena akan bergeser menjadi Subjek jika kalimat dipasifkan.\n• Opsi C: "Pemerintah daerah (S) segera meresmikan (P, verba me-) jembatan gantung itu (O)." -> Pola S-P-O (SAMA).\n• Opsi D: "Mereka (S) pergi (P) ke perpustakaan (Ket)." -> Pola S-P-Ket.\n• Opsi E: "Udara malam ini (S) terasa (P, verba ter-) dingin (Pel)." -> Pola S-P-Pel.'
      },
      {
        type: 'multiple-choice',
        q: 'Kalimat: "Kakak sedang belajar matematika di kamar."\n\nKalimat berikut yang memiliki pola dasar yang sama dengan kalimat di atas adalah...',
        options: [
          'Ibu memasak sayur sop.',
          'Kami berdiskusi tentang masalah lingkungan.',
          'Dia mengirimi ibunya uang.',
          'Anak itu menangis tersedu-sedu.',
          'Adik tidur siang.'
        ],
        correct: 1,
        explanation: 'Analisis Kalimat Soal: "Kakak (S) sedang belajar (P, verba ber-) matematika (Pel) di kamar (Ket)." -> Pola dasar S-P-Pel.\n\n• Opsi A: "Ibu (S) memasak (P, verba me-) sayur sop (O)." -> Pola S-P-O.\n• Opsi B: "Kami (S) berdiskusi (P, verba ber-) tentang masalah lingkungan (Pel)." -> Pola S-P-Pel (SAMA). Frasa "tentang..." setelah verba intransitif berstatus Pelengkap.\n• Opsi C: "Dia (S) mengirimi (P, verba bitransitif) ibunya (O) uang (Pel)." -> Pola S-P-O-Pel.\n• Opsi D: "Anak itu (S) menangis (P) tersedu-sedu (Ket)." -> Pola S-P-Ket.\n• Opsi E: "Adik (S) tidur siang (P)." -> Pola S-P.'
      }
    ]
  },
  {
    day: 2,
    title: 'Hari 2: Konjungsi, Tanda Koma & Inti Kalimat',
    description: 'Aturan penulisan konjungsi, koma pada pemerincian & anak kalimat, serta mencari inti S-P.',
    materiTopics: [
      {
        name: 'Konjungsi (Kata Hubung)',
        apaItu: 'Konjungsi adalah kata hubung antarklausa (intrakalimat) atau antarkalimat yang berfungsi menghubungkan gagasan agar terstruktur dengan logis.',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Perhatikan Posisi Konjungsi',
            text: '• Konjungsi intrakalimat koordinatif (seperti sehingga, sedangkan, dan, tetapi) tidak boleh diletakkan di awal kalimat baru.\n• Konjungsi subordinatif (seperti karena, jika, ketika, meskipun) boleh diletakkan di awal kalimat jika anak kalimat mendahului induk kalimat (dengan syarat diikuti tanda koma di akhir anak kalimat). Namun, anak kalimat ini tidak boleh berdiri sendiri sebagai kalimat terpisah.\n• Konjungsi antarkalimat (seperti Namun, Oleh karena itu, Selain itu) wajib diletakkan di awal kalimat baru dan diikuti tanda koma.',
            examples: [
              { wrong: 'Hari hujan. Sehingga saya tidak datang.', correct: 'Hari hujan sehingga saya tidak datang.', note: '"Sehingga" adalah konjungsi koordinatif, tidak boleh diletakkan di awal kalimat.' },
              { wrong: 'Saya tidak datang. Karena hari hujan.', correct: 'Saya tidak datang karena hari hujan. (atau: Karena hari hujan, saya tidak datang.)', note: '"Karena" boleh di awal jika anak kalimat mendahului induk kalimat dan dipisahkan tanda koma. Namun, anak kalimat tidak boleh dipisah menjadi kalimat pecahan tersendiri.' },
              { wrong: 'Namun dia tetap menolak.', correct: 'Namun, dia tetap menolak.', note: '"Namun" adalah konjungsi antarkalimat, wajib diikuti tanda koma.' }
            ]
          }
        ]
      },
      {
        name: 'Tanda Koma (,)',
        apaItu: 'Tanda koma berfungsi menandai jeda, rincian unsur, atau pemisah induk dan anak kalimat dalam tata kalimat EYD V.',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Gunakan Koma pada Rincian & Anak Kalimat',
            text: 'Sesuai EYD V, gunakan koma sebelum kata "dan"/"atau" dalam rincian 3 unsur atau lebih. Koma juga digunakan jika anak kalimat berada di depan induk kalimat.',
            examples: [
              { wrong: 'Ibu membeli kopi, gula dan teh.', correct: 'Ibu membeli kopi, gula, dan teh.', note: 'Koma wajib disisipkan sebelum kata "dan" pada rincian terakhir.' },
              { wrong: 'Kami akan pergi berkemah, jika cuaca cerah.', correct: 'Kami akan pergi berkemah jika cuaca cerah.', note: 'Induk kalimat mendahului anak kalimat sehingga tidak memakai koma.' }
            ]
          },
          {
            title: '2. Jangan Pisahkan Subjek dari Predikat',
            text: 'Tanda koma tidak boleh memisahkan subjek dari predikatnya, kecuali jika di antaranya terdapat keterangan tambahan (aposisi) yang diapit oleh tanda koma.',
            examples: [
              { wrong: 'Mahasiswa yang tinggal di asrama itu, diwajibkan bangun pagi.', correct: 'Mahasiswa yang tinggal di asrama itu diwajibkan bangun pagi.', note: 'Subjek panjang tidak boleh dipisah koma dari predikat.' },
              { wrong: 'Budi ketua kelas kami adalah anak yang rajin.', correct: 'Budi, ketua kelas kami, adalah anak yang rajin.', note: 'Keterangan tambahan (aposisi) wajib diapit oleh tanda koma.' }
            ]
          }
        ]
      },
      {
        name: 'Inti Kalimat',
        apaItu: 'Inti kalimat adalah unsur inti paling ringkas (Subjek dan Predikat utama) tanpa modifikasi/perluasan keterangan.',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Cari Unsur Inti Kalimat',
            text: 'Buang semua keterangan, kata sifat penjelas, konjungsi subordinatif (yang, bahwa), dan anak kalimat untuk menemukan pola inti (S-P, S-P-O, atau S-P-Pel).',
            examples: [
              { wrong: 'Inti kalimat: Penelitian mendalam (S) membuahkan hasil (P).', correct: 'Inti kalimat: Penelitian (S) membuahkan (P) hasil (O).', note: 'Subjek inti hanyalah "Penelitian" (tanpa pewatas "mendalam" dan "yang dilakukan..."). Karena "membuahkan" adalah verba transitif, objek "hasil" wajib disertakan sehingga membentuk pola inti S-P-O.' }
            ]
          }
        ]
      }
    ],
    quiz: [
      {
        type: 'multiple-choice',
        q: 'Bencana banjir bandang yang melanda wilayah hulu sungai merusak puluhan rumah warga. [...], warga setempat diimbau untuk segera mengungsi ke tempat yang lebih aman.',
        options: [
          'Sehingga',
          'Oleh karena itu',
          'Tetapi',
          'Sedangkan',
          'Maka'
        ],
        correct: 1,
        explanation: 'Konjungsi "Oleh karena itu" adalah konjungsi antarkalimat yang diletakkan di awal kalimat baru untuk menyatakan akibat. Pilihan lain (sehingga, tetapi, sedangkan, maka) adalah konjungsi intrakalimat koordinatif yang tidak boleh diletakkan di awal kalimat baru.'
      },
      {
        type: 'multiple-choice',
        q: 'Manakah kalimat berikut yang menggunakan konjungsi secara benar dan efektif?',
        options: [
          'Meskipun penelitian itu sulit dilakukan, tetapi para mahasiswa tidak pernah menyerah.',
          'Karena harga bahan pangan terus melonjak, maka daya beli masyarakat mulai menurun.',
          'Walaupun cuaca sangat buruk, mereka tetap berangkat mendaki gunung.',
          'Apabila rancangan undang-undang itu disahkan, sehingga semua pihak harus mematuhinya.',
          'Meskipun data yang dikumpulkan belum lengkap, namun kesimpulan sementara sudah dapat ditarik.'
        ],
        correct: 2,
        explanation: 'Kalimat yang efektif tidak boleh menggunakan konjungsi ganda subordinatif-koordinatif secara bersamaan (seperti "meskipun... tetapi/namun..." atau "karena... maka..."). Namun, harap bedakan dengan konjungsi korelatif berpasangan yang baku (seperti "bukan... melainkan" atau "tidak... tetapi") yang memang wajib digunakan berpasangan. Pilihan C adalah kalimat yang tepat karena hanya menggunakan "Walaupun" tanpa kata pertentangan di tengah.'
      },
      {
        type: 'interactive',
        q: 'Ketuk/klik tanda koma yang diletakkan secara tidak tepat sehingga memisahkan Subjek dari Predikatnya!',
        exercise: {
          text: 'Mahasiswa yang lulus dengan predikat terbaik itu, menerima penghargaan langsung dari rektor.',
          errors: [
            {
              word: ',',
              occurrence: 0,
              correct: '',
              category: 'comma',
              rule: 'Pemisahan Subjek dan Predikat',
              explanation: 'Tanda koma tidak boleh memisahkan subjek panjang ("Mahasiswa yang lulus dengan predikat terbaik itu") dari predikatnya ("menerima").'
            }
          ]
        }
      },
      {
        type: 'interactive',
        q: 'Ketuk/klik kata untuk menyisipkan tanda koma yang hilang dalam pemerincian tiga unsur atau lebih!',
        exercise: {
          text: 'Ibu membeli kopi, gula dan teh di pasar tradisional.',
          errors: [
            {
              word: ' dan',
              occurrence: 0,
              correct: ', dan',
              category: 'comma',
              rule: 'Pemerincian Tiga Unsur atau Lebih',
              explanation: 'Sesuai EYD V, rincian tiga unsur atau lebih wajib dipisahkan tanda koma sebelum kata hubung "dan" atau "atau" ("kopi, gula, dan teh").'
            }
          ]
        }
      },
      {
        type: 'multiple-choice',
        q: 'Manakah kalimat berikut yang penulisan tanda komanya sudah sesuai dengan EYD V?',
        options: [
          'Pemerintah pusat menegaskan, bahwa proyek infrastruktur jalan tol harus selesai tahun ini.',
          'Dia bersedia membantu menyelesaikan tugas itu, jika kamu mau menemaninya.',
          'Kami terpaksa membatalkan rencana piknik, karena ayah mendadak sakit keras.',
          'Dia sangat pintar membaca peluang bisnis, tetapi kurang pandai mengelola modal.',
          'Ia tetap datang ke pesta itu, meskipun tidak mendapatkan undangan resmi.'
        ],
        correct: 3,
        explanation: 'Tanda koma wajib diletakkan sebelum konjungsi pertentangan koordinatif seperti "tetapi", "melainkan", dan "sedangkan". Sebaliknya, tanda koma tidak boleh diletakkan di depan kata "bahwa", serta di depan konjungsi subordinatif ("karena", "jika", "meskipun") jika induk kalimat mendahului anak kalimat.'
      },
      {
        type: 'multiple-choice',
        q: 'Manakah yang paling tepat sebagai kalimat inti dari kalimat: "Penelitian mendalam yang dilakukan oleh para ahli biologi di laboratorium itu akhirnya membuahkan hasil memuaskan."?',
        options: [
          'Penelitian dilakukan ahli biologi.',
          'Laboratorium membuahkan hasil.',
          'Penelitian membuahkan hasil.',
          'Ahli biologi membuahkan hasil.',
          'Penelitian dilakukan di laboratorium.'
        ],
        correct: 2,
        explanation: 'Subjek inti: "Penelitian" (bagian "yang dilakukan..." adalah perluasan subjek). Predikat inti: "membuahkan", Objek inti: "hasil". Keterangan dan pewatas lainnya dapat dibuang sehingga menghasilkan inti kalimat berpola S-P-O: "Penelitian membuahkan hasil".'
      },
      {
        type: 'multiple-choice',
        q: 'Tentukan kalimat inti dari kalimat berikut: "Buku sejarah perkembangan politik Indonesia yang sangat tebal itu sudah dibaca oleh Budi kemarin sore."',
        options: [
          'Buku dibaca Budi.',
          'Buku dibaca.',
          'Buku sejarah dibaca.',
          'Buku tebal dibaca.',
          'Budi membaca buku sejarah.'
        ],
        explanation: 'Dalam kalimat pasif, inti kalimat terdiri dari Subjek inti ("Buku") dan Predikat pasif utama ("dibaca"). Pelaku "oleh Budi" dan modifikasi "yang tebal itu" dibuang.'
      }
    ]
  },
  {
    day: 3,
    title: 'Hari 3: Kapital, Kata Baku, & Penulisan Kata',
    description: 'Kaidah huruf kapital, pemilihan kata baku KBBI, serta penulisan kata majemuk, bentuk terikat, dan bilangan.',
    materiTopics: [
      {
        name: 'Huruf Kapital',
        apaItu: 'Huruf kapital digunakan untuk huruf pertama nama diri (orang, geografi, gelar jabatan spesifik, dll) sesuai kaidah EYD V.',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Bedakan Geografi Nama Diri vs Istilah Umum',
            text: 'Gunakan kapital jika diikuti nama diri geografi spesifik (Danau Toba, Sungai Musi). Gunakan huruf kecil jika hanya merujuk pada bentuk geografinya saja.',
            examples: [
              { wrong: 'Adik mandi di Sungai.', correct: 'Adik mandi di sungai.', note: '"sungai" ditulis kecil jika bukan nama diri.' }
            ]
          },
          {
            title: '2. Cek Jabatan yang Diikuti Nama Orang',
            text: 'Tulis kapital gelar atau jabatan jika diikuti nama diri atau wilayah kekuasaannya secara spesifik. Tulis kecil jika berupa nama jabatan umum.',
            examples: [
              { wrong: 'Dia ingin menemui seorang Gubenur.', correct: 'Dia ingin menemui seorang gubernur. / Dia ingin menemui Gubernur Jawa Barat.', note: 'Kata "gubernur" ditulis dengan huruf kecil karena merujuk pada jabatan secara umum (tidak diikuti nama diri atau wilayah). Sebaliknya, "Gubernur Jawa Barat" menggunakan huruf kapital karena diikuti oleh wilayah kekuasaan spesifik. Selain itu, penulisan "Gubenur" salah karena tidak baku (bentuk baku: "Gubernur").' }
            ]
          },
          {
            title: '3. Nama Jenis (Nama Produk/Buah) vs Asal Daerah',
            text: '• Huruf kapital tidak digunakan untuk nama geografi yang digunakan sebagai nama jenis atau nama produk (misalnya: *jeruk bali*, *kunci inggris*, *pisang ambon*).\n• Huruf kapital wajib digunakan jika nama geografi tersebut menunjukkan kekhasan asal daerah (sebagai nama diri, misalnya: *batik Solo*, *film Indonesia*, *sarung Samarinda*).\n• **Tips Praktis:** Nama jenis biasanya merujuk pada spesies biologis yang **memiliki nama ilmiah/nama Latin** (misalnya *jeruk bali* memiliki nama Latin *Citrus maxima*, sedangkan *batik Solo* tidak memiliki nama Latin).',
            examples: [
              { wrong: 'Ibu membeli Jeruk Bali dan Batik solo.', correct: 'Ibu membeli jeruk bali dan batik Solo.', note: '"jeruk bali" adalah nama jenis sehingga ditulis huruf kecil seluruhnya, sedangkan "Solo" pada "batik Solo" menunjukkan kekhasan asal daerah (nama diri) sehingga wajib huruf kapital.' }
            ]
          }
        ]
      },
      {
        name: 'Kata Baku',
        apaItu: 'Kata baku adalah kata yang ejaannya sesuai dengan standar resmi bahasa Indonesia (KBBI).',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Hafalkan Kata Serapan Populer',
            text: 'Beberapa kata serapan sering salah ditulis: apotek (bukan apotik), aktivitas (bukan aktifitas), praktik (bukan praktek), jadwal (bukan jadual).',
            examples: [
              { wrong: 'Praktek apotik tutup.', correct: 'Praktik apotek tutup.', note: 'Sesuaikan ejaan serapan bahasa asing ke baku Indonesia.' }
            ]
          },
          {
            title: '2. Perubahan Imbuhan Kata Serapan (v vs f)',
            text: '• Kata dengan akhiran *-if* diserap menggunakan huruf "f" (misal: *aktif*, *kreatif*, *efektif*).\n• Namun, jika mendapat sufiks asing *-itas*, huruf "f" berubah menjadi "v" (misal: *aktivitas*, *kreativitas*, *efektivitas* - bukan *aktifitas*, *kreatifitas*, *efektifitas*).\n• Kata *standardisasi* diserap dari bahasa Inggris *standardization* sehingga tetap mempertahankan "d" (bukan *standarisasi*).',
            examples: [
              { wrong: 'Tingkat kreatifitas dan standarisasi kerja di perusahaan itu sangat tinggi.', correct: 'Tingkat kreativitas dan standardisasi kerja di perusahaan itu sangat tinggi.', note: '"kreativitas" menggunakan "v" (berubah dari "kreatif"), dan "standardisasi" menggunakan huruf "d" (bukan standarisasi).' }
            ]
          }
        ]
      },
      {
        name: 'Penulisan Kata',
        apaItu: 'Selain kata baku, EYD V juga mengatur bagaimana kata ditulis — apakah serangkai, dipisah, atau dihubungkan dengan tanda hubung.',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Penulisan Kata Majemuk & Bentuk Terikat',
            text: '• Gabungan kata (kata majemuk) biasa ditulis **terpisah** jika hanya mendapat awalan atau akhiran saja (misalnya *tanggung jawab*).\n• Bentuk terikat (seperti *pro-*, *pasca-*, *sub-*, *non-*, *antar-*, *sosio-*, *anti-*) ditulis **serangkai** tanpa spasi jika diikuti kata dasar umum.\n• **Aturan Cepat:** Awalan *antar-*, *non-*, *pasca-*, *pra-*, *pro-*, *semi-*, *sub-*, *supra-* → selalu ditulis serangkai tanpa spasi dan tanpa tanda hubung, **kecuali** jika diikuti oleh nama diri (kata berhuruf kapital) atau singkatan, maka dihubungkan dengan tanda hubung (-). Contoh:\n  - *antarkota* ✅ tapi *antar-Jakarta-Bandung* ✅\n  - *nonpemerintah* ✅ tapi *non-ASEAN* ✅',
            examples: [
              { wrong: 'tanggungjawab', correct: 'tanggung jawab', note: 'Ditulis dipisah karena tidak diapit awalan dan akhiran sekaligus.' },
              { wrong: 'takternilai', correct: 'tak ternilai', note: 'Partikel "tak" ditulis terpisah dari kata berikutnya.' },
              { wrong: 'pro aktif', correct: 'proaktif', note: '"pro-" adalah bentuk terikat sehingga wajib ditulis serangkai.' },
              { wrong: 'sosio kultural', correct: 'sosiokultural', note: '"sosio-" adalah bentuk terikat sehingga wajib ditulis serangkai.' },
              { wrong: 'antar kawasan', correct: 'antarkawasan', note: 'Bentuk terikat "antar-" ditulis serangkai tanpa spasi.' },
              { wrong: 'antar warga', correct: 'antarwarga', note: 'Bentuk terikat "antar-" ditulis serangkai tanpa spasi.' },
              { wrong: 'non pemerintah', correct: 'nonpemerintah', note: 'Bentuk terikat "non-" ditulis serangkai tanpa spasi.' },
              { wrong: 'pasca Perang Dunia', correct: 'pascaperang dunia', note: 'Bentuk terikat ditulis serangkai ("pascaperang dunia"). Jika diikuti nama diri yang berkapital, gunakan tanda hubung, misalnya "pasca-Perang Dunia II".' }
            ]
          },
          {
            title: '2. Penulisan Angka & Bilangan yang Sering Diuji',
            text: '• **Bilangan satu atau dua kata** ditulis dengan **huruf** (misalnya: *dua belas*, *tiga ratus*).\n• **Bilangan lebih dari dua kata** ditulis dengan **angka** (misalnya: *1.500*, *3.513*).\n• **Penulisan Mata Uang:** Lambang Rp ditulis di depan angka nominal tanpa spasi, dan diakhiri dengan koma diikuti dua angka nol untuk pemisah nilai sen (*Rp1.000,00*).',
            examples: [
              { wrong: 'Rp 1.000', correct: 'Rp1.000,00', note: 'Tidak boleh ada spasi antara lambang "Rp" dan angka nominalnya. Serta wajib diakhiri koma dan dua angka nol sebagai pemisah sen.' }
            ]
          }
        ]
      }
    ],
    quiz: [
      {
        type: 'multiple-choice',
        q: 'Gunakan teks berikut untuk menjawab soal nomor 1–4.\n\n(1) Badan Riset dan Inovasi Nasional (BRIN) baru-baru ini **merilis** laporan tentang dampak perubahan iklim terhadap ketahanan pangan di Indonesia. (2) Menurut laporan tersebut, **produksi** padi di beberapa wilayah Indonesia Timur mengalami penurunan akibat curah hujan yang tidak menentu. (3) Para ahli-ahli menyarankan agar pemerintah segera mengambil langkah **konkret** untuk mengantisipasi krisis pangan. (4) Salah satu solusi yang diusulkan adalah mengembangkan **varietas** padi yang tahan terhadap perubahan iklim melalui riset berkelanjutan. (5) Kepala BRIN menyatakan bahwa anggaran sebesar Rp500 **milyar** telah dialokasikan untuk mendukung program tersebut.\n\nPenulisan huruf kapital yang salah terdapat pada kalimat nomor....',
        options: [
          '(1)',
          '(2)',
          '(3)',
          '(4)',
          '(5)'
        ],
        correct: 1,
        explanation: 'Opsi B benar. Penulisan huruf kapital yang salah terdapat pada kalimat (2), yaitu "wilayah Indonesia Timur". Kata "timur" seharusnya ditulis dengan huruf kecil ("timur") karena kata tersebut tidak merujuk pada nama geografi yang merupakan nama diri (seperti Jawa Timur atau Nusa Tenggara Timur), melainkan hanya menunjukkan bagian wilayah atau arah geografis.'
      },
      {
        type: 'multiple-choice',
        q: 'Gunakan teks berikut untuk menjawab soal nomor 1–4.\n\n(1) Badan Riset dan Inovasi Nasional (BRIN) baru-baru ini **merilis** laporan tentang dampak perubahan iklim terhadap ketahanan pangan di Indonesia. (2) Menurut laporan tersebut, **produksi** padi di beberapa wilayah Indonesia Timur mengalami penurunan akibat curah hujan yang tidak menentu. (3) Para ahli-ahli menyarankan agar pemerintah segera mengambil langkah **konkret** untuk mengantisipasi krisis pangan. (4) Salah satu solusi yang diusulkan adalah mengembangkan **varietas** padi yang tahan terhadap perubahan iklim melalui riset berkelanjutan. (5) Kepala BRIN menyatakan bahwa anggaran sebesar Rp500 **milyar** telah dialokasikan untuk mendukung program tersebut.\n\nKata yang tidak baku dalam teks tersebut terdapat pada kalimat nomor....',
        options: [
          '(1)',
          '(2)',
          '(3)',
          '(4)',
          '(5)'
        ],
        correct: 4,
        explanation: 'Opsi E benar. Kata tidak baku terdapat pada kalimat (5) yaitu "milyar". Berdasarkan KBBI, bentuk baku yang benar adalah "miliar" (menggunakan huruf i, bukan y).'
      },
      {
        type: 'multiple-choice',
        q: 'Gunakan teks berikut untuk menjawab soal nomor 1–4.\n\n(1) Badan Riset dan Inovasi Nasional (BRIN) baru-baru ini **merilis** laporan tentang dampak perubahan iklim terhadap ketahanan pangan di Indonesia. (2) Menurut laporan tersebut, **produksi** padi di beberapa wilayah Indonesia Timur mengalami penurunan akibat curah hujan yang tidak menentu. (3) Para ahli-ahli menyarankan agar pemerintah segera mengambil langkah **konkret** untuk mengantisipasi krisis pangan. (4) Salah satu solusi yang diusulkan adalah mengembangkan **varietas** padi yang tahan terhadap perubahan iklim melalui riset berkelanjutan. (5) Kepala BRIN menyatakan bahwa anggaran sebesar Rp500 **milyar** telah dialokasikan untuk mendukung program tersebut.\n\nKalimat yang mengandung kata mubazir adalah kalimat nomor....',
        options: [
          '(1)',
          '(2)',
          '(3)',
          '(4)',
          '(5)'
        ],
        correct: 2,
        explanation: 'Opsi C benar. Kalimat (3) mengandung kata mubazir (pleonasme) yaitu "Para ahli-ahli". Kata "para" sudah menandakan bentuk jamak sehingga tidak perlu diikuti oleh reduplikasi "ahli-ahli". Seharusnya ditulis "Para ahli" atau "Ahli-ahli".'
      },
      {
        type: 'multiple-choice',
        q: 'Gunakan teks berikut untuk menjawab soal nomor 1–4.\n\n(1) Badan Riset dan Inovasi Nasional (BRIN) baru-baru ini **merilis** laporan tentang dampak perubahan iklim terhadap ketahanan pangan di Indonesia. (2) Menurut laporan tersebut, **produksi** padi di beberapa wilayah Indonesia Timur mengalami penurunan akibat curah hujan yang tidak menentu. (3) Para ahli-ahli menyarankan agar pemerintah segera mengambil langkah **konkret** untuk mengantisipasi krisis pangan. (4) Salah satu solusi yang diusulkan adalah mengembangkan **varietas** padi yang tahan terhadap perubahan iklim melalui riset berkelanjutan. (5) Kepala BRIN menyatakan bahwa anggaran sebesar Rp500 **milyar** telah dialokasikan untuk mendukung program tersebut.\n\nPenulisan kata bercetak tebal yang salah terdapat pada kalimat nomor....',
        options: [
          '(1) - kata bercetak tebal: merilis',
          '(2) - kata bercetak tebal: produksi',
          '(3) - kata bercetak tebal: konkret',
          '(4) - kata bercetak tebal: varietas',
          '(5) - kata bercetak tebal: milyar'
        ],
        correct: 4,
        explanation: 'Opsi E benar. Kata bercetak tebal "milyar" pada kalimat (5) adalah tidak baku. Bentuk baku yang benar sesuai KBBI adalah "miliar". Selain itu, penulisan nominal uang yang tepat menurut EYD V adalah "Rp500,00 miliar" (menggunakan lambang Rp di depan tanpa spasi dan diakhiri dengan koma serta dua angka nol sebagai tanda sen). Kata bercetak tebal lainnya ditulis dengan benar: "merilis" (baku), "produksi" (baku), "konkret" (baku), dan "varietas" (baku).'
      },
      {
        type: 'multiple-choice',
        q: '(A) Ketua panitia melaporkan jadwal praktek kepada gubernur Jawa Barat.\n(B) Setiap sub bab laporan keuangan tersebut disusun secara sistimatis.\n(C) Pihak yayasan menolak untuk bertanggungjawab atas biaya pasca bencana.\n(D) Sebanyak dua ratus lima puluh orang peserta antre di depan apotik untuk membeli obat.\n(E) Kreativitas karyawan meningkat setelah mereka mengikuti pelatihan secara efektif.\n\nKalimat yang penulisannya paling sedikit mengandung kesalahan (atau tanpa kesalahan) adalah....',
        options: [
          '(A)',
          '(B)',
          '(C)',
          '(D)',
          '(E)'
        ],
        correct: 4,
        explanation: 'Opsi E benar. Kalimat (E) tidak memiliki kesalahan penulisan menurut EYD V dan KBBI ("Kreativitas" dan "efektif" adalah bentuk baku, serta ditulis secara tepat). Kalimat lainnya mengandung kesalahan penulisan:\n- Kalimat (A) salah pada "praktek" (seharusnya praktik) dan "gubernur" (seharusnya Gubernur Jawa Barat).\n- Kalimat (B) salah pada "sub bab" (seharusnya subbab) and "sistimatis" (seharusnya sistematis).\n- Kalimat (C) salah pada "bertanggungjawab" (seharusnya bertanggung jawab) and "pasca bencana" (seharusnya pascabencana).\n- Kalimat (D) salah pada "apotik" (seharusnya apotek).'
      },
      {
        type: 'multiple-choice',
        q: 'Pada bulan Nopember lalu, presiden Joko Widodo mengunjungi proyek pembangunan bendungan di daerah Sulawesi Utara. Proyek bernilai Rp200 milyar tersebut dikerjakan oleh kontraktor swasta dengan standar internasional. Pasca\u00a0bencana, pihak kontraktor berjanji akan bertanggungjawab penuh terhadap kwalitas bangunan.\n\nTeks tersebut mengandung berapa kesalahan penulisan?',
        options: [
          '5 kesalahan',
          '6 kesalahan',
          '7 kesalahan',
          '8 kesalahan',
          '9 kesalahan'
        ],
        correct: 2,
        explanation: 'Opsi C benar. Paragraf tersebut mengandung 7 kesalahan penulisan/ejaan, yaitu:\n1. "Nopember" seharusnya "November" (kata baku).\n2. "presiden" seharusnya "Presiden" (huruf pertama nama jabatan yang diikuti nama diri orang wajib menggunakan huruf kapital).\n3. "Rp200" seharusnya "Rp200,00" (lambang Rp diikuti angka tanpa spasi and wajib diakhiri tanda koma serta dua angka nol sebagai penanda sen).\n4. "milyar" seharusnya "miliar" (kata baku).\n5. "Pasca bencana" seharusnya "Pascabencana" (bentuk terikat "pasca-" wajib ditulis serangkai tanpa spasi).\n6. "bertanggungjawab" seharusnya "bertanggung jawab" (gabungan kata majemuk ditulis terpisah jika hanya mendapat awalan).\n7. "kwalitas" seharusnya "kualitas" (kata baku).'
      }
    ]
  },
  {
    day: 4,
    title: 'Hari 4: Makna Kata & Pola Makna',
    description: 'Menganalisis hubungan makna denotatif-konotatif, hipernim-hiponim, pola kelompok kata, dan kata berpasangan tetap.',
    materiTopics: [
      {
        name: 'Makna Denotatif dan Konotatif',
        apaItu: 'Makna denotatif adalah makna sebenarnya dari sebuah kata — makna yang tercantum dalam kamus dan literal.\nMakna konotatif adalah makna tidak sebenarnya — makna yang muncul karena asosiasi atau perumpamaan.',
        bagaimanaMenyelesaikan: [
          {
            title: 'Tanya: Apakah kata ini dipakai sesuai makna aslinya?',
            text: '✅ **Denotatif**: Tikus itu menggerogoti tembok rumah. — tikus benar-benar memakan tembok\n✅ **Konotatif**: Korupsi menggerogoti keuangan negara. — korupsi tidak benar-benar memakan, ini perumpamaan\n\n✅ **Denotatif**: Petani itu menanam padi di sawah. — menanam = meletakkan benih ke tanah secara literal\n✅ **Konotatif**: Pemerintah menanam investasi besar di sektor energi. — menanam = menempatkan/mengalokasikan, bukan literal menanam\n\nJika arti harfiah kata tersebut tidak masuk akal dalam kalimat, kata tersebut pasti digunakan secara kiasan (konotatif).',
            examples: []
          }
        ]
      },
      {
        name: 'Hipernim dan Hiponim (Makna Kata Luas & Sempit)',
        apaItu: 'Kemampuan menentukan hubungan tingkatan (hierarki) kata, baik yang maknanya lebih luas (Hipernim / kategori umum) maupun yang maknanya lebih sempit (Hiponim / jenis/anggota khusus).',
        bagaimanaMenyelesaikan: [
          {
            title: 'Tanya: Apakah soal ini meminta jawaban yang lebih spesifik atau lebih umum?',
            text: '• **Lebih Sempit (Hiponim)**: Cari kata yang merupakan *jenis* dari kata soal.\n  Contoh: Sempit dari **Alat musik** → **Gitar** (gitar adalah salah satu jenis alat musik).\n\n• **Lebih Luas (Hipernim)**: Cari kata yang merupakan *kategori umum* dari kata soal.\n  Contoh: Luas dari **Mobil** → **Kendaraan** (mobil adalah jenis kendaraan).',
            examples: []
          }
        ]
      },
      {
        name: 'Pola Makna Kelompok Kata (MD vs DM)',
        apaItu: 'Pola makna kelompok kata (frasa) menganalisis susunan struktur kata utama (Diterangkan/D) dan kata penjelas (Menerangkan/M), serta hubungan makna antarkatanya (asal, bahan, sifat, tujuan).',
        bagaimanaMenyelesaikan: [
          {
            title: 'Cara Menguji Pola Hubungan Makna Frasa',
            text: '1. **Identifikasi Kata Inti (D) & Penjelas (M)**:\n   - **Pola DM (Diterangkan-Menerangkan)**: Kata inti di depan. Contoh: *meja kayu* (meja [D] terbuat dari kayu [M]).\n   - **Pola MD (Menerangkan-Diterangkan)**: Kata penjelas di depan. Contoh: *sangat cepat* (sangat [M] menerangkan cepat [D]).\n\n2. **Gunakan Uji Sisipan Kata Hubung**:\n   - Hubungan **Sifat**: Sisipkan kata **"yang"** (Contoh: *baju bersih* → baju *yang* bersih).\n   - Hubungan **Asal/Bahan/Sumber**: Sisipkan kata **"dari"** (Contoh: *cincin emas* → cincin *dari* emas).\n   - Hubungan **Tujuan/Fungsi**: Sisipkan kata **"untuk"** (Contoh: *ruang belajar* → ruang *untuk* belajar).',
            examples: []
          }
        ]
      },
      {
        name: 'Kata Berpasangan Tetap',
        apaItu: 'Kata berpasangan tetap adalah dua kata yang digabung membentuk makna baru yang tidak bisa diuraikan dari makna masing-masing kata secara terpisah. Ciri utamanya: kedua kata tidak bisa dipisahkan — jika salah satu kata dihilangkan atau diganti, makna gabungannya hilang/berubah total.\nKata berpasangan tetap sering berkaitan dengan idiom/makna kiasan.',
        bagaimanaMenyelesaikan: [
          {
            title: '',
            text: '1. **Tes Makna Baru** — apakah gabungan dua kata ini membentuk arti yang TIDAK BISA ditebak dari kata-katanya?\n\n• **kambing + hitam = kambing hitam** → artinya pihak yang disalahkan atas kesalahan orang lain\n— *bukan "kambing berwarna hitam", maknanya melompat jauh dari makna asli kedua kata*\n\n• **meja + hijau = meja hijau** → artinya pengadilan\n— *bukan sekadar "meja berwarna hijau"*\n\nJika maknanya melompat seperti ini → kata berpasangan tetap ✅\n\n2. **Tes Sisipan** — coba sisipkan kata "yang" atau preposisi di antara kedua kata\n\n• **tangan kanan** (= orang kepercayaan) → "tangan yang kanan"?\n→ kata berpasangan tetap — makna idiomatiknya hilang begitu disisipi\n\n• **baju baru** → "baju yang baru"?\n— *maknanya tetap sama (tidak berubah/hilang)*\n→ bukan kata berpasangan tetap (hanya frasa biasa)\n\n💡 Kalau makna idiomatik hilang/berubah total begitu disisipi "yang" → kata berpasangan tetap.\n\n3. **Tes Pemisahan** — coba hilangkan salah satu kata, apakah maknanya masih nyambung dengan makna gabungan semula?\n\n• **kepala dingin** (= tenang dalam berpikir) → hilangkan dingin → "kepala" saja\n— *maknanya berubah total, tidak lagi berarti "tenang"*\n→ kata berpasangan tetap\n\n• **baju baru** → hilangkan baru → "baju" saja\n— *maknanya masih nyambung dengan benda aslinya*\n→ bukan kata berpasangan tetap (frasa biasa)',
            examples: []
          }
        ]
      }
    ],
    quiz: [
      {
        type: 'multiple-choice',
        q: 'Bacalah teks berikut untuk menjawab soal nomor 1 sampai 4!\n\n(1) Mikroplastik kini telah menjadi ancaman nyata yang **menggurita** di ekosistem perairan global, termasuk Indonesia. (2) Partikel plastik berukuran kurang dari lima milimeter ini sangat **rentan** tertelan oleh fauna laut karena bentuknya yang menyerupai plankton. (3) Akibatnya, akumulasi zat beracun ini terus meningkat di dalam jaringan tubuh biota perairan. (4) Jalur rantai makanan akhirnya membawa polutan berbahaya tersebut hingga ke meja makan manusia melalui konsumsi **hasil laut**. (5) Oleh karena itu, restorasi lingkungan pesisir dan pengurangan limbah plastik sekali pakai harus segera diakselerasi demi menjaga keberlangsungan hidup generasi mendatang.\n\nKata **menggurita** dalam kalimat (1) digunakan secara kiasan. Makna konotatif yang paling tepat untuk menggambarkan kata tersebut dalam konteks teks adalah ...',
        options: [
          'bertangan banyak seperti gurita',
          'menyebar secara luas dan mencengkeram kuat',
          'melilit mangsa hingga tidak berdaya',
          'merusak habitat terumbu karang secara perlahan',
          'bertambah jumlahnya dengan sangat cepat'
        ],
        correct: 1,
        explanation: 'Dalam kalimat (1), kata "menggurita" digunakan secara kiasan (konotatif) untuk menggambarkan ancaman mikroplastik yang menyebar luas ke berbagai lini ekosistem dan sulit dilepaskan (seperti cengkeraman lengan gurita). Pilihan A adalah makna denotatif (harfiah). Pilihan C, D, dan E tidak tepat menggambarkan cengkeraman ancaman ekologis yang meluas dan mendalam dalam teks.'
      },
      {
        type: 'multiple-choice',
        q: 'Kata **fauna laut** pada kalimat (2) merupakan hipernim dari kata-kata berikut, KECUALI ...',
        options: [
          'paus biru',
          'penyu hijau',
          'kepiting bakau',
          'lamun',
          'ikan cakalang'
        ],
        correct: 3,
        explanation: 'Kata "fauna laut" adalah hipernim (kata umum) dari hewan-hewan yang hidup di laut, seperti paus biru, penyu hijau, kepiting bakau, dan ikan cakalang. Sedangkan "lamun" (seagrass) merupakan kelompok tumbuhan berbunga yang tumbuh di lingkungan laut dangkal, sehingga dikategorikan sebagai flora laut, bukan fauna laut.'
      },
      {
        type: 'multiple-choice',
        q: 'Berdasarkan kalimat (4), kata yang berkedudukan sebagai hipernim dari kata **mikroplastik** dalam teks tersebut adalah ...',
        options: [
          'ekosistem',
          'plankton',
          'hasil laut',
          'polutan',
          'limbah plastik'
        ],
        correct: 3,
        explanation: 'Pada kalimat (4), tertulis "...membawa polutan berbahaya tersebut...". Kata "tersebut" merujuk kembali pada "mikroplastik" dan "zat beracun" pada kalimat-kalimat sebelumnya. Dengan demikian, mikroplastik dikategorikan sebagai salah satu jenis dari "polutan". Oleh karena itu, "polutan" berkedudukan sebagai hipernim (kata bermakna luas) yang menaungi "mikroplastik" sebagai hiponimnya (kata bermakna khusus).'
      },
      {
        type: 'multiple-choice',
        q: 'Perhatikan frasa **hasil laut** pada kalimat (4). Frasa tersebut memiliki pola hubungan makna kelompok kata yang sama dengan frasa ...',
        options: [
          'sangat berbahaya',
          'beberapa spesies',
          'air jernih',
          'energi matahari',
          'rumah sakit'
        ],
        correct: 3,
        explanation: 'Frasa "hasil laut" berpola DM (Diterangkan-Menerangkan). Hubungan makna antarkatanya menyatakan asal/sumber, yaitu "hasil yang berasal dari laut".\n- Opsi A "sangat berbahaya" berpola MD.\n- Opsi B "beberapa spesies" berpola MD (jumlah menerangkan benda).\n- Opsi C "air jernih" berpola DM, menyatakan sifat ("air yang jernih").\n- Opsi D "energi matahari" berpola DM, menyatakan hubungan asal/sumber ("energi yang berasal dari matahari"). Ini sama persis dengan "hasil laut".\n- Opsi E "rumah sakit" berpola DM, menyatakan hubungan tujuan ("rumah untuk merawat orang sakit").'
      },
      {
        type: 'multiple-choice',
        q: 'Pasangan kata yang memiliki hubungan analogi paling setara dengan pasangan **Hewan : Anoa** adalah ...',
        options: [
          'Terumbu karang : Biota laut',
          'Hutan hujan : Ekosistem',
          'Polutan : Mikroplastik',
          'Klorofil : Daun',
          'Flora : Cendrawasih'
        ],
        correct: 2,
        explanation: 'Pasangan kata "Hewan : Anoa" memiliki hubungan makna Hipernim : Hiponim (Hewan adalah kategori umum, sedangkan anoa adalah salah satu jenis hewan spesifik).\n- Opsi A "Terumbu karang : Biota laut" berpola Hiponim : Hipernim (terbalik).\n- Opsi B "Hutan hujan : Ekosistem" berpola Hiponim : Hipernim (terbalik).\n- Opsi C "Polutan : Mikroplastik" berpola Hipernim : Hiponim (Polutan adalah kategori umum zat pencemar, sedangkan mikroplastik adalah salah satu jenis polutan). Ini sangat setara.\n- Opsi D "Klorofil : Daun" berpola meronimi (bagian-keseluruhan).\n- Opsi E "Flora : Cendrawasih" salah kategori karena cendrawasih adalah fauna (hewan), bukan flora (tumbuhan).'
      },
      {
        type: 'multiple-choice',
        q: 'Kalimat-kalimat berikut menggunakan kelompok kata berpasangan tetap yang tepat, KECUALI ...',
        options: [
          'Pemerintah daerah berjanji akan segera mengambil keputusan terkait konflik lahan itu.',
          'Kita harus menyelesaikan masalah ini dengan kepala sejuk agar tidak menimbulkan konflik baru.',
          'Kampanye kelestarian alam tersebut berhasil menarik perhatian jutaan generasi muda.',
          'Tim penyelamat sempat mengalami kegagalan saat mencoba menembus badai di wilayah pesisir.',
          'Masyarakat adat di pegunungan itu masih menghirup udara bersih bebas polusi perkotaan.'
        ],
        correct: 1,
        explanation: 'Opsi B tidak tepat karena gabungan kata berpasangan tetap yang tepat adalah "kepala dingin", bukan "kepala sejuk". Meskipun "dingin" dan "sejuk" bersinonim secara literal, kata penjelas pada kelompok kata berpasangan tetap bersifat mutlak dan tidak dapat diganti dengan sinonimnya tanpa merusak makna khusus frasa tersebut.'
      },
      {
        type: 'multiple-choice',
        q: 'Kata-kata berikut merupakan hiponim (kata bermakna khusus) dari kelompok kata **bencana alam**, KECUALI ...',
        options: [
          'gempa bumi',
          'gunung meletus',
          'tsunami',
          'tanah longsor',
          'perubahan iklim'
        ],
        correct: 4,
        explanation: 'Kata "bencana alam" merupakan hipernim untuk peristiwa bencana alam yang terjadi secara tiba-tiba dan mendadak seperti gempa bumi, gunung meletus, tsunami, dan tanah longsor (semuanya adalah hiponim dari bencana alam). Sementara itu, "perubahan iklim" adalah fenomena perubahan jangka panjang pada pola cuaca dan suhu bumi, bukan merupakan klasifikasi langsung dari jenis bencana alam itu sendiri.'
      }
    ]
  },
  {
    day: 5,
    title: 'Hari 5: Paragraf & Bahasa Buatan',
    description: 'Koherensi paragraf dan logika bahasa buatan.',
    materiTopics: [
      {
        name: 'Paragraf',
        apaItu: 'Paragraf adalah susunan kalimat yang padu, memiliki satu gagasan utama, serta dihubungkan secara kohesif dan koheren.',
        bagaimanaMenyelesaikan: [
          {
            title: '1. Temukan Kepaduan & Kesatuan',
            text: 'Gagasan utama biasanya tertuang dalam kalimat utama (deduktif di awal, induktif di akhir). Hubungan kalimat penjelas harus mendukung kalimat utama.',
            examples: []
          }
        ]
      },
      {
        name: 'Bahasa Buatan',
        apaItu: 'Bahasa buatan menguji logika kita dalam menemukan aturan tata bahasa, arti kata, dan pola kalimat dari bahasa khayalan baru.',
        bagaimanaMenyelesaikan: [
          {
            title: 'Langkah Penyelesaian',
            text: 'Cara mudah memecahkan bahasa buatan:\n\n1. **Urai Arti Kata (Kosakata)**\n   Bandingkan ketiga kalimat contoh berikut:\n   - *"Saya membaca buku"* = *"Kroto ti gla no."*\n   - *"Buku dibacanya"* = *"Kroto su gla pe."*\n   - *"Saya menulis surat"* = *"Plipo ti vri no."*\n\n   Dari perbandingan di atas, kita dapatkan kata dasarnya:\n   - Kata benda: *"buku"* = **Kroto**, *"surat"* = **Plipo**.\n   - Kata kerja: *"baca"* = **gla**, *"tulis"* = **vri**.\n\n2. **Temukan Pola Kalimat & Imbuhan**\n   Lihat letak kata benda dan penandanya:\n   - Kata benda (*Kroto*, *Plipo*) diletakkan di **awal kalimat**.\n   - Dari kalimat *"Buku dibacanya"* (`Kroto su gla pe.`), kita tahu bahwa penanda untuk kata kerja dengan akhiran *"-nya"* adalah **su ... pe** (mengapit kata kerja `gla`).\n\n   Jadi, untuk menerjemahkan *"Surat ditulisnya"*:\n   - Taruh kata benda di depan: **Plipo**.\n   - Apit kata kerja *tulis* (`vri`) dengan penanda **su ... pe**: **su vri pe**.\n   - Gabungan: **Plipo su vri pe.**',
            examples: []
          }
        ]
      }
    ],
    quiz: [
      {
        type: 'multiple-choice',
        q: 'Urutkan kalimat-kalimat berikut menjadi paragraf yang padu:\n(1) Hal ini terjadi karena kurangnya kesadaran membuang sampah.\n(2) Banjir kembali menggenangi wilayah pemukiman warga.\n(3) Akibatnya, saluran air tersumbat dan meluap saat hujan deras.\n(4) Sampah rumah tangga terlihat menumpuk di saluran air.',
        options: [
          '(2)-(1)-(4)-(3)',
          '(2)-(4)-(1)-(3)',
          '(4)-(1)-(2)-(3)',
          '(1)-(4)-(3)-(2)',
          '(3)-(2)-(1)-(4)'
        ],
        correct: 0,
        explanation: 'Urutan logisnya: (2) Kejadian banjir, (1) Sebab utama kejadian banjir, (4) Bukti konkret penumpukan sampah di saluran air, (3) Akibat konkret penyumbatan dan meluapnya air.'
      },
      {
        type: 'multiple-choice',
        q: 'Urutkan kalimat-kalimat berikut menjadi teks prosedur yang logis:\n(1) Setelah matang, angkat dan tiriskan airnya.\n(2) Rebus air di dalam panci hingga mendidih.\n(3) Masukkan mi instan ke dalam air mendidih tersebut.\n(4) Sajikan mi hangat bersama bumbu yang tersedia.',
        options: [
          '(2)-(3)-(1)-(4)',
          '(2)-(1)-(3)-(4)',
          '(3)-(2)-(1)-(4)',
          '(1)-(2)-(3)-(4)',
          '(4)-(2)-(3)-(1)'
        ],
        correct: 0,
        explanation: 'Urutan prosedural logis: Rebus air (2), masukkan mi (3), tiriskan jika sudah matang (1), sajikan hangat dengan bumbu (4).'
      },
      {
        type: 'multiple-choice',
        q: 'Di manakah kalimat sisipan "Langkah konkret ini diharapkan mampu mengurangi tingkat kemacetan jalan raya." paling tepat diletakkan dalam paragraf berikut?\n(1) Pemerintah kota resmi meluncurkan jalur sepeda baru.\n(2) Jalur ini dibuat terpisah dari jalan raya utama menggunakan pembatas beton.\n(3) Selain itu, warga diimbau mulai beralih menggunakan transportasi umum.\n(4) Evaluasi berkala akan terus dilakukan untuk melihat efektivitas proyek ini.',
        options: [
          'Setelah kalimat (1)',
          'Setelah kalimat (2)',
          'Setelah kalimat (3)',
          'Setelah kalimat (4)',
          'Di awal paragraf'
        ],
        correct: 1,
        explanation: 'Kalimat sisipan tersebut merujuk pada "Langkah konkret ini" yang menyambung langsung pada tindakan pembuatan pembatas beton pada jalur sepeda di kalimat (2).'
      },
      {
        type: 'multiple-choice',
        q: 'Teks: "Kemajuan teknologi digital telah merambah sektor UMKM di Indonesia. Banyak pelaku usaha mikro yang kini memanfaatkan platform e-commerce dan pembayaran digital untuk memperluas jangkauan pasar mereka. Pemerintah juga aktif mengadakan pelatihan literasi digital." Apakah judul yang paling tepat untuk teks di atas?',
        options: [
          'Pelatihan Literasi Digital oleh Pemerintah',
          'Pemberdayaan UMKM melalui Digitalisasi',
          'Sejarah E-commerce di Indonesia',
          'Cara Berjualan di Platform Online',
          'Dampak Negatif Perkembangan Teknologi'
        ],
        correct: 1,
        explanation: 'Judul "Pemberdayaan UMKM melalui Digitalisasi" paling tepat karena merangkum keseluruhan teks yang membahas transformasi digital pelaku UMKM serta dukungan pelatihan dari pemerintah.'
      },
      {
        type: 'multiple-choice',
        q: 'Berikut adalah beberapa kata yang diterjemahkan dari bahasa buatan:\n- Touankin = Penyakit berbahaya\n- Reyankin = Hewan berbahaya\n- Touklima = Penyakit otak\n\nKata apakah yang berarti penyakit jiwa?',
        options: [
          'Reyklima',
          'Klimankin',
          'Tourey',
          'Touklusta',
          'Ankinklima'
        ],
        correct: 3,
        explanation: 'Morfologi kata: Tou- = Penyakit, -ankin = berbahaya, Rey- = Hewan, -klima = otak. Jadi kata "penyakit jiwa" harus diawali "Tou-" dan diikuti oleh morfem baru selain "ankin" dan "klima", yaitu "-klusta". Sehingga didapatkan "Touklusta".'
      },
      {
        type: 'multiple-choice',
        q: 'Perhatikan bahasa hipotesis berikut!\n\n- Kroto ti gla no. berarti \'Saya membaca buku.\'\n- Kroto su gla pe. berarti \'Buku dibacanya.\'\n- Plipo ti vri no. berarti \'Saya menulis surat.\'\n\nBagaimana cara mengatakan \'Surat ditulisnya.\'?',
        options: [
          'Plipo ti vri pe.',
          'Plipo su vri pe.',
          'Kroto su vri pe.',
          'Plipo su gla pe.',
          'Kroto ti vri no.'
        ],
        correct: 1,
        explanation: 'Analisis pola kalimat bahasa buatan:\n- "Kroto ti gla no." (Saya membaca buku) vs "Plipo ti vri no." (Saya menulis surat). Pola kalimat dengan subjek "Saya" adalah: [Objek] ti [Kata Kerja] no. Berarti "Kroto" = buku, "Plipo" = surat, "gla" = membaca, "vri" = menulis, "ti ... no" = Saya.\n- "Kroto su gla pe." (Buku dibacanya). Pola kalimat dengan akhiran "-nya" adalah: [Subjek] su [Kata Kerja] pe. Berarti "su ... pe" = penanda untuk kalimat dengan akhiran "-nya" (dibacanya).\n- Untuk menerjemahkan "Surat ditulisnya": [Surat (Plipo)] + [penanda: su ... pe] + [Kata Kerja: menulis/tulis (vri)] → "Plipo su vri pe.". Oleh karena itu, pilihan yang tepat adalah B.'
      }
    ]
  }
];

function renderTextWithBullets(text) {
  if (!text) return null;
  const lines = text.split('\n');
  
  const formatText = (str) => {
    if (!str) return '';
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic font-semibold text-[var(--text-primary)]">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  let inList = false;
  const elements = [];
  let currentListItems = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Check if line starts with •, -, or * (but not double asterisks)
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || (trimmed.startsWith('*') && !trimmed.startsWith('**') && !trimmed.endsWith('*'))) {
      const cleanText = trimmed.replace(/^[•\-*]\s*/, '');
      currentListItems.push(cleanText);
      inList = true;
    } else {
      if (inList && currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc pl-5 space-y-1.5 my-2 text-sm text-[var(--text-muted)]">
            {currentListItems.map((itemText, i) => (
              <li key={i} className="leading-relaxed">{formatText(itemText)}</li>
            ))}
          </ul>
        );
        currentListItems = [];
        inList = false;
      }
      elements.push(
        <p key={`p-${index}`} className="text-sm text-[var(--text-muted)] leading-relaxed mb-2">
          {formatText(trimmed)}
        </p>
      );
    }
  });
  
  if (inList && currentListItems.length > 0) {
    elements.push(
      <ul key="list-final" className="list-disc pl-5 space-y-1.5 my-2 text-sm text-[var(--text-muted)]">
        {currentListItems.map((itemText, i) => (
          <li key={i} className="leading-relaxed">{formatText(itemText)}</li>
        ))}
      </ul>
    );
  }
  
  return <div className="space-y-1">{elements}</div>;
}

function formatBoldItalicText(str) {
  if (!str) return '';
  const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic font-semibold text-[var(--text-primary)]">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function LearningSeriesScreen() {
  const { 
    goTo, daysProgress, completeDaySeries, resetDaysProgress,
    selectedTokenIds, modifiedTokens, activePunctuation, setActivePunctuation 
  } = useAppStore();
  const { isDevMode } = useAuthStore();
  
  const [bypassLock, setBypassLock] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Modal internal state
  const [activeTab, setActiveTab] = useState('materi'); // 'materi' | 'kuis'
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isPuncBankOpen, setIsPuncBankOpen] = useState(false);
  
  // Progress values
  const prog = daysProgress || { currentDay: 1, completedDays: [] };
  const currentDay = prog.currentDay;
  const completedDays = prog.completedDays;

  const currentQuestion = selectedDay?.quiz?.[currentQuestionIdx];

  const tokens = useMemo(() => {
    if (currentQuestion && currentQuestion.type === 'interactive') {
      return tokenizeText(currentQuestion.exercise.text);
    }
    return [];
  }, [currentQuestion]);

  const errorIds = useMemo(() => {
    if (currentQuestion && currentQuestion.type === 'interactive') {
      return buildErrorSet(tokens, currentQuestion.exercise.errors, currentQuestion.exercise.text);
    }
    return new Set();
  }, [tokens, currentQuestion]);

  const enrichedErrors = useMemo(() => {
    if (currentQuestion && currentQuestion.type === 'interactive') {
      return enrichErrors(tokens, currentQuestion.exercise.errors, currentQuestion.exercise.text);
    }
    return [];
  }, [tokens, currentQuestion]);

  const handleOpenDay = (dayData) => {
    const isLocked = isDayLocked(dayData.day, daysProgress, bypassLock, isDevMode);
    if (isLocked) return;
    
    setSelectedDay(dayData);
    setActiveTab('materi');
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setCorrectAnswersCount(0);
    setQuizFinished(false);
    setIsPuncBankOpen(false);

    useAppStore.setState({
      selectedTokenIds: new Set(),
      modifiedTokens: {},
      activePunctuation: null,
    });
  };

  const handleOptionClick = (idx) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    const isCorrect = idx === selectedDay.quiz[currentQuestionIdx].correct;
    if (isCorrect) {
      setCorrectAnswersCount((c) => c + 1);
    }
  };

  const handleCheckAnswer = () => {
    if (answered) return;
    if (currentQuestion.type === 'interactive') {
      if (selectedTokenIds.size < 2) {
        const confirmSubmit = window.confirm("Kamu baru memilih 1, yakin mau periksa?");
        if (!confirmSubmit) return;
      }
      const result = computeResult(selectedTokenIds, errorIds, enrichedErrors, tokens, modifiedTokens);
      setAnswered(true);
      if (result.perfect || result.accuracy === 100) {
        setCorrectAnswersCount((c) => c + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setAnswered(false);
    setIsPuncBankOpen(false);

    useAppStore.setState({
      selectedTokenIds: new Set(),
      modifiedTokens: {},
      activePunctuation: null,
    });

    if (currentQuestionIdx + 1 < selectedDay.quiz.length) {
      setCurrentQuestionIdx((idx) => idx + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleFinishDay = () => {
    completeDaySeries(selectedDay.day);
    setSelectedDay(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => goTo('home')}
          className="p-2 rounded-lg hover:bg-neutral-800/10 active:scale-95 transition-all flex items-center justify-center border border-[var(--border)] bg-[var(--bg-card)]"
        >
          <ChevronLeft size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-lg font-extrabold gradient-text flex-1">
          Akselerasi PBM & PPU
        </h1>
      </div>

      {/* Program Summary Hero */}
      <div className="glass-card p-6 relative overflow-hidden text-left space-y-3">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(108,99,255,0.2), transparent 70%)' }} />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-dim)] flex items-center justify-center text-xl border border-purple-500/20">
            📅
          </div>
          <div>
            <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Akselerasi PBM & PPU
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Target terarah menguasai materi kunci PBM & PPU.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-2 relative z-10 space-y-1.5">
          <div className="flex justify-between text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            <span>Kemajuan Belajar</span>
            <span>{completedDays.length} / 5 Hari Selesai</span>
          </div>
          <div className="xp-bar-track h-2">
            <div 
              className="xp-bar-fill h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
              style={{ width: `${(completedDays.length / 5) * 100}%` }} 
            />
          </div>
        </div>

        {completedDays.length === 5 && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-pulse mt-2">
            <Sparkles size={14} />
            <span>Selamat! Anda telah menyelesaikan seluruh program Akselerasi PBM & PPU!</span>
          </div>
        )}
      </div>

      {/* Days Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
          Jadwal Belajar Harian
        </h3>

        <div className="space-y-3">
          {DAYS_DATA.map((dayData) => {
            const isCompleted = completedDays.includes(dayData.day);
            const isCurrent = dayData.day === currentDay;
            const isLocked = isDayLocked(dayData.day, daysProgress, bypassLock, isDevMode);

            return (
              <button
                key={dayData.day}
                disabled={isLocked}
                onClick={() => handleOpenDay(dayData)}
                className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none relative group overflow-hidden"
                style={{
                  borderColor: isCompleted
                    ? 'rgba(16, 185, 129, 0.25)'
                    : isCurrent
                    ? 'rgba(108, 99, 255, 0.35)'
                    : 'rgba(255,255,255,0.04)',
                  background: isCompleted
                    ? 'rgba(16, 185, 129, 0.02)'
                    : isCurrent
                    ? 'rgba(108, 99, 255, 0.03)'
                    : 'rgba(25, 23, 42, 0.35)',
                }}
              >
                {/* Visual state vertical accent line */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-full" 
                  style={{
                    background: isCompleted
                      ? '#10b981'
                      : isCurrent
                      ? 'var(--brand)'
                      : 'transparent'
                  }}
                />

                {/* Day circle */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 border transition-all"
                  style={{
                    background: isCompleted
                      ? 'rgba(16, 185, 129, 0.1)'
                      : isCurrent
                      ? 'var(--brand-dim)'
                      : 'rgba(255,255,255,0.02)',
                    borderColor: isCompleted
                      ? '#10b981'
                      : isCurrent
                      ? 'var(--brand)'
                      : 'rgba(255,255,255,0.1)',
                    color: isCompleted
                      ? '#10b981'
                      : isCurrent
                      ? '#c5bfff'
                      : 'var(--text-muted)'
                  }}
                >
                  {isCompleted ? <Check size={16} /> : `0${dayData.day}`}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-extrabold text-sm group-hover:text-white transition-all"
                      style={{ color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)' }}
                    >
                      {dayData.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 animate-pulse">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <p className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                    {dayData.description}
                  </p>
                </div>

                {/* Right Status Symbol */}
                <div className="shrink-0">
                  {isLocked ? (
                    completedDays.includes(dayData.day - 1) ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Buka Besok
                      </span>
                    ) : (
                      <Lock size={15} className="text-neutral-600" />
                    )
                  ) : isCompleted ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Selesai
                    </span>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] border border-purple-500/10 group-hover:bg-[var(--brand)] group-hover:text-white transition-all">
                      <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Progress trigger */}
      <div className="pt-6 text-center">
        <button
          onClick={() => {
            if (window.confirm('Reset progress belajar 5 Hari kamu?')) {
              resetDaysProgress();
            }
          }}
          className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 mx-auto text-neutral-600 hover:text-rose-400 transition-all"
        >
          <RefreshCw size={10} />
          <span>Reset Progress 5 Hari</span>
        </button>
      </div>

      {/* DAY WORKSPACE MODAL OVERLAY */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div 
            className="w-full max-w-xl glass-card border border-neutral-800 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
            style={{ background: 'var(--bg-card)' }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[var(--brand)] tracking-wider">
                  Materi & Kuis Interaktif
                </span>
                <h3 className="font-extrabold text-base text-[var(--text-primary)]">
                  {selectedDay.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-lg hover:bg-neutral-800/20 text-neutral-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs selector */}
            <div className="flex border-b border-neutral-850 px-4">
              <button
                onClick={() => setActiveTab('materi')}
                className="flex-1 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: activeTab === 'materi' ? 'var(--brand)' : 'transparent',
                  color: activeTab === 'materi' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                <BookOpen size={13} />
                <span>📖 Materi</span>
              </button>
              <button
                onClick={() => setActiveTab('kuis')}
                className="flex-1 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: activeTab === 'kuis' ? 'var(--brand)' : 'transparent',
                  color: activeTab === 'kuis' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                <HelpCircle size={13} />
                <span>📝 Kuis Harian</span>
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* TAB MATERI */}
              {activeTab === 'materi' && (
                <div className="space-y-6 animate-fade-in">
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                    Pelajari konsep dasar dan langkah-langkah praktis menyelesaikan soal UTBK di bawah ini.
                  </p>

                  {/* Loop through each topic separately */}
                  {selectedDay.materiTopics.map((topic, topicIdx) => (
                    <div key={topicIdx} className="space-y-4 border-b border-neutral-800/60 pb-6 last:border-b-0 last:pb-0">
                      {/* Topic Name Header */}
                      <h4 className="text-sm font-extrabold text-[var(--text-primary)] border-b border-neutral-800 pb-2 flex items-center gap-2" style={{ color: '#c5bfff' }}>
                        <BookOpen size={15} className="text-purple-400" />
                        <span>{topic.name}</span>
                      </h4>

                      {/* Section 1: Apa itu? */}
                      <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-850 space-y-2">
                        <h5 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#a89dff' }}>
                          <HelpCircle size={13} className="text-purple-400" />
                          <span>Apa itu?</span>
                        </h5>
                        <p className="text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-line">
                          {topic.apaItu}
                        </p>
                      </div>

                      {/* Section 2: Bagaimana cara menyelesaikannya? */}
                      <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-850 space-y-4">
                        <h5 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#00d9a0' }}>
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>Bagaimana cara menyelesaikannya?</span>
                        </h5>
                        
                        <div className="space-y-4">
                          {topic.bagaimanaMenyelesaikan.map((item, idx) => (
                            <div key={idx} className="space-y-2 border-l-2 border-purple-500/30 pl-3.5">
                              <h6 className="text-base font-extrabold text-[var(--text-primary)]">
                                {item.title}
                              </h6>
                              <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                                {renderTextWithBullets(item.text)}
                              </div>

                              {/* Examples */}
                              <div className="space-y-2 pt-1">
                                {item.examples.map((ex, exIdx) => (
                                  <div key={exIdx} className="space-y-2 text-sm p-3 rounded-xl bg-neutral-950/40 border border-neutral-900">
                                    <div className="flex items-start gap-1.5 text-rose-400">
                                      <X size={11} className="mt-0.5 shrink-0" />
                                      <span><strong>Salah:</strong> <em>{ex.wrong}</em></span>
                                    </div>
                                    <div className="flex items-start gap-1.5 text-emerald-400">
                                      <Check size={11} className="mt-0.5 shrink-0" />
                                      <span><strong>Benar:</strong> {ex.correct}</span>
                                    </div>
                                    {ex.note && (
                                      <p className="text-xs text-neutral-500 italic pt-1 border-t border-neutral-900/50">
                                        💡 {ex.note}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setActiveTab('kuis')}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-2 text-xs uppercase"
                  >
                    <span>Lanjut ke Kuis Harian</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* TAB KUIS HARIAN */}
              {activeTab === 'kuis' && (
                <div className="space-y-5 animate-fade-in">
                  {!quizFinished ? (
                    // Quiz questions view
                    <div className="space-y-5">
                      {/* Progress header */}
                      <div className="flex justify-between items-center text-xs font-bold text-[var(--text-muted)] bg-neutral-900/40 px-3 py-2 rounded-xl border border-neutral-850">
                        <span>Soal {currentQuestionIdx + 1} dari {selectedDay.quiz.length}</span>
                        <span className="text-[var(--brand)]">Kuis Harian</span>
                      </div>

                      {/* Question */}
                      <h4 className="font-medium text-base text-[var(--text-primary)] leading-relaxed text-left whitespace-pre-line">
                        {formatBoldItalicText(currentQuestion.q)}
                      </h4>

                      {/* Options for MC */}
                      {currentQuestion.type === 'multiple-choice' && (
                        <div className="space-y-2">
                          {currentQuestion.options.map((opt, optIdx) => {
                            const isCorrectOpt = optIdx === currentQuestion.correct;
                            const isClickedOpt = optIdx === selectedOption;
                            
                            let btnStyle = {
                              background: 'rgba(255,255,255,0.01)',
                              borderColor: 'var(--border)'
                            };
                            let badge = null;

                            if (answered) {
                              if (isCorrectOpt) {
                                btnStyle = {
                                  background: 'rgba(0, 217, 160, 0.08)',
                                  borderColor: 'var(--success)'
                                };
                                badge = <Check size={14} className="text-emerald-400 shrink-0" />;
                              } else if (isClickedOpt) {
                                btnStyle = {
                                  background: 'rgba(255, 71, 87, 0.08)',
                                  borderColor: 'var(--danger)'
                                };
                                badge = <X size={14} className="text-rose-400 shrink-0" />;
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={answered}
                                onClick={() => handleOptionClick(optIdx)}
                                className="w-full p-4 rounded-2xl border text-left text-sm font-bold flex items-center justify-between gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:pointer-events-none"
                                style={btnStyle}
                              >
                                <span style={{ color: answered && isCorrectOpt ? 'var(--success)' : answered && isClickedOpt ? 'var(--danger)' : 'var(--text-primary)' }}>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </span>
                                {badge}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Interactive Token Clicking Viewer */}
                      {currentQuestion.type === 'interactive' && (
                        <div className="space-y-4">
                          {/* Instruction */}
                          {!answered && (
                            <div
                              className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-left animate-fade-in"
                              style={{ background: 'var(--brand-dim)', border: '1px solid rgba(108,99,255,0.2)', color: '#c5bfff' }}
                            >
                              <MousePointerClick size={16} className="mt-0.5 shrink-0 text-purple-400" />
                              <span>
                                Ketuk/klik kata atau tanda baca yang <strong>salah</strong> menurut kaidah EYD V.
                                {selectedTokenIds.size > 0 && (
                                  <>
                                    {' '}
                                    <span className="font-bold text-white bg-purple-500/30 px-1.5 py-0.5 rounded border border-purple-500/20 inline-flex items-center gap-1 whitespace-nowrap align-middle">
                                      {selectedTokenIds.size} terpilih
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                          )}

                          <InteractiveText
                            exercise={currentQuestion.exercise}
                            submitted={answered}
                            enrichedErrors={enrichedErrors}
                          />

                          {/* Punctuation Bank */}
                          {!answered && (
                            <div className="glass-card p-3 space-y-3">
                              <button
                                onClick={() => setIsPuncBankOpen(!isPuncBankOpen)}
                                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider px-2 py-1.5 hover:bg-white/5 rounded-lg transition-all"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <span className="flex items-center gap-2">
                                  📂 Sisipkan Tanda Baca
                                  {activePunctuation && (
                                    <span className="normal-case bg-[var(--brand-dim)] text-[var(--brand)] px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[rgba(108,99,255,0.2)] animate-pulse">
                                      Aktif: <strong className="text-sm font-bold">{activePunctuation}</strong>
                                    </span>
                                  )}
                                </span>
                                <span className={`transition-transform duration-200 ${isPuncBankOpen ? 'rotate-180' : ''}`}>
                                  ▼
                                </span>
                              </button>

                              {isPuncBankOpen && (
                                <div className="flex flex-wrap justify-center gap-2 pt-2 border-t border-white/5 animate-fade-in">
                                  {['.', ',', ':', ';', '?', '-', '—', '/', '"', "'", '(', ')'].map(punc => (
                                    <button
                                      key={punc}
                                      onClick={() => {
                                        setActivePunctuation(activePunctuation === punc ? null : punc);
                                        setIsPuncBankOpen(false); // Auto-collapsing after a punctuation is selected
                                      }}
                                      className={`w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                                        activePunctuation === punc 
                                          ? 'bg-[var(--brand)] text-white shadow-[0_0_15px_rgba(108,99,255,0.4)] scale-110' 
                                          : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                                      }`}
                                    >
                                      {punc}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {activePunctuation && (
                                <div className="flex items-center justify-between bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.15)] rounded-xl px-3 py-2 text-xs animate-fade-in">
                                  <span className="font-medium text-left" style={{ color: 'var(--brand)' }}>
                                    Ketuk kata pada kalimat di atas untuk menyisipkan tanda baca <strong className="text-sm font-bold">{activePunctuation}</strong>
                                  </span>
                                  <button 
                                    onClick={() => setActivePunctuation(null)}
                                    className="text-[var(--text-muted)] hover:text-white font-semibold underline px-1.5 py-0.5 rounded hover:bg-white/5"
                                  >
                                    Batal
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {!answered && (
                            <button
                              onClick={handleCheckAnswer}
                              disabled={selectedTokenIds.size === 0}
                              className="w-full btn-primary py-3.5 uppercase text-xs tracking-wider"
                            >
                              Periksa Jawaban
                            </button>
                          )}
                        </div>
                      )}

                      {/* Explanation & Discussion Section */}
                      {answered && (
                        <div className="space-y-4 animate-fade-in">
                          {currentQuestion.type === 'interactive' && (
                            <>
                              {/* Side-by-side Diff */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                {/* Teks Anda */}
                                <div className="glass-card p-4 space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                    Teks Anda
                                  </h4>
                                  <p className="text-base font-medium leading-loose text-white/80">
                                    {renderUserDiffText(tokens, selectedTokenIds, modifiedTokens, enrichedErrors)}
                                  </p>
                                </div>

                                {/* Teks yang Benar */}
                                <div className="glass-card p-4 space-y-2">
                                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                    Teks yang Benar
                                  </h4>
                                  <p className="text-base font-semibold leading-loose">
                                    {renderCorrectDiffText(tokens, enrichedErrors)}
                                  </p>
                                </div>
                              </div>

                              {/* Explanation cards */}
                              <FeedbackPanel
                                enrichedErrors={enrichedErrors}
                                selectedTokenIds={selectedTokenIds}
                                tokens={tokens}
                                modifiedTokens={modifiedTokens}
                              />
                            </>
                          )}

                          {currentQuestion.type === 'multiple-choice' && (
                            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-850 space-y-2 text-left animate-fade-in">
                              <h5 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-neutral-400">
                                <AlertCircle size={12} className="text-amber-400" />
                                <span>Pembahasan Jawaban</span>
                              </h5>
                              <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                                {renderTextWithBullets(currentQuestion.explanation)}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={handleNextQuestion}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-2 text-xs uppercase"
                          >
                            <span>
                              {currentQuestionIdx + 1 === selectedDay.quiz.length ? 'Selesaikan Kuis' : 'Soal Berikutnya'}
                            </span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Quiz results / completion view
                    <div className="text-center py-6 space-y-5 animate-fade-in">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto animate-bounce">
                        <Award size={32} />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-lg text-[var(--text-primary)]">
                          Harian Selesai!
                        </h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          Kamu menjawab <strong className="text-white">{correctAnswersCount} / {selectedDay.quiz.length}</strong> soal dengan benar.
                        </p>
                      </div>

                      {/* Reward box */}
                      <div className="max-w-xs mx-auto p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center gap-3">
                        <span className="text-2xl">⚡</span>
                        <div className="text-left">
                          <span className="block text-xs font-extrabold text-purple-300 uppercase tracking-wider">Hadiah Program</span>
                          <span className="block text-sm font-extrabold text-white">+50 XP Belajar</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleFinishDay}
                          className="w-full btn-primary py-3.5 uppercase text-xs tracking-wider"
                        >
                          Klaim XP & Selesaikan Hari
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildCorrectedText(text, errors) {
  // Clean the markdown markers from the text first
  const cleanText = text.replace(/\*\*|\*/g, '');
  
  // 1. Map each error to its starting character index using the occurrence property on cleanText
  const errorsWithIndex = errors.map(err => {
    let startIndex = -1;
    const occurrence = err.occurrence ?? 0;
    
    // Clean asterisks from the error word too, just in case
    const cleanWord = err.word.replace(/\*\*|\*/g, '');
    const cleanCorrect = err.correct ? err.correct.replace(/\*\*|\*/g, '') : '';
    
    for (let i = 0; i <= occurrence; i++) {
      startIndex = cleanText.indexOf(cleanWord, startIndex + 1);
      if (startIndex === -1) break;
    }
    return {
      ...err,
      word: cleanWord,
      correct: cleanCorrect,
      start: startIndex,
      end: startIndex !== -1 ? startIndex + cleanWord.length : -1
    };
  });

  // Filter out any errors that we couldn't find in the text
  const validErrors = errorsWithIndex.filter(err => err.start !== -1);

  // 2. Sort the errors by start index in descending order (highest index first)
  validErrors.sort((a, b) => b.start - a.start);

  // 3. Apply the replacements in reverse order to avoid index shifts
  let result = cleanText;
  validErrors.forEach(err => {
    result = result.substring(0, err.start) + err.correct + result.substring(err.end);
  });

  return result;
}

function renderUserDiffText(tokens, selectedTokenIds, modifiedTokens, enrichedErrors) {
  const errorMap = {};
  (enrichedErrors || []).forEach((e) => {
    e.tokenIds.forEach((id) => (errorMap[id] = e));
  });

  return tokens.map((tok) => {
    if (tok.type === 'space') {
      return <span key={tok.id} className="whitespace-pre-wrap">{tok.text}</span>;
    }

    const errInfo = errorMap[tok.id];
    const correctText = errInfo ? errInfo.correct : null;
    const isSelected = selectedTokenIds.has(tok.id);

    let tokText = tok.text;
    let styleClass = '';

    if (modifiedTokens && modifiedTokens[tok.id] !== undefined) {
      const appendedPunc = modifiedTokens[tok.id];
      const isCorrect = errInfo && errInfo.correct && errInfo.correct.includes(appendedPunc);
      styleClass = isCorrect ? 'text-[var(--success)] font-bold' : 'text-[var(--danger)] font-bold';
      
      if (tok.type === 'punct' && shouldReplacePunctuation(tok.text, appendedPunc, correctText)) {
        return <span key={tok.id} className={styleClass}>{appendedPunc}</span>;
      } else {
        const placement = getPunctuationPlacement(tok.text, appendedPunc, correctText);
        if (placement === 'prepend') {
          return (
            <span key={tok.id}>
              <span className={styleClass}>{appendedPunc}</span>
              {tok.text}
            </span>
          );
        } else {
          return (
            <span key={tok.id}>
              {tok.text}
              <span className={styleClass}>{appendedPunc}</span>
            </span>
          );
        }
      }
    } else if (tok.type === 'punct' && isSelected) {
      return <span key={tok.id} className="text-[var(--danger)] line-through mx-0.5">{tok.text}</span>;
    }

    if (isSelected) {
      const isRealError = errInfo !== undefined;
      styleClass = isRealError ? 'text-[var(--success)] font-bold' : 'text-[var(--danger)] font-bold';
    }

    return (
      <span key={tok.id} className={styleClass}>
        {tokText}
      </span>
    );
  });
}

function renderCorrectDiffText(tokens, enrichedErrors) {
  const errorMap = {};
  const renderedErrors = new Set();
  (enrichedErrors || []).forEach((e) => {
    e.tokenIds.forEach((id) => (errorMap[id] = e));
  });

  return tokens.map((tok) => {
    if (tok.type === 'space') {
      return <span key={tok.id} className="whitespace-pre-wrap">{tok.text}</span>;
    }

    const errInfo = errorMap[tok.id];
    if (errInfo) {
      if (renderedErrors.has(errInfo.id)) {
        return null;
      }
      renderedErrors.add(errInfo.id);
      
      const cleanCorrect = errInfo.correct.replace(/\*\*|\*/g, '');
      return (
        <span key={tok.id} className="text-[var(--success)] font-bold bg-[var(--success-dim)] px-1 py-0.5 rounded border border-[rgba(0,217,160,0.2)]">
          {cleanCorrect}
        </span>
      );
    }

    return <span key={tok.id}>{tok.text}</span>;
  });
}

