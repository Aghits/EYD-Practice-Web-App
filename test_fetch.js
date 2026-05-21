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
  const promptText = `Kamu adalah ahli tata bahasa Indonesia EYD V.
Buatkan 1 soal latihan interaktif dalam format JSON persis seperti ini:

{
  "id": "ai_<unix_timestamp>",
  "difficulty": "beginner",
  "categories": ["capitalization"],
  "title": "<judul singkat>",
  "text": "<sebuah paragraf panjang (minimal 3--5 kalimat utuh, berkisar antara 60--120 kata) dalam bahasa Indonesia yang memiliki kesinambungan makna antar-kalimatnya, dengan beberapa kesalahan ejaan/EYD V yang sengaja dimasukkan secara tersebar>",
  "errors": [
    {
      "word": "<kata atau tanda baca salah persis seperti yang tertulis dalam teks>",
      "occurrence": 0,
      "correct": "<versi perbaikan yang benar sesuai kaidah EYD V>",
      "category": "capitalization",
      "rule": "<nama aturan EYD V>",
      "explanation": "<penjelasan singkat mengapa salah dan apa aturannya dalam bahasa Indonesia>"
    }
  ]
}

Aturan penting untuk pembuatan soal:
1. Bidang "text" HARUS berupa satu paragraf utuh yang panjang (terdiri dari minimal 3 sampai 5 kalimat terhubung, bukan hanya satu kalimat tunggal).
2. Kesalahan ejaan atau tanda baca yang disengaja harus disebar di sepanjang paragraf tersebut. Jangan menumpuk kesalahan hanya di satu kalimat.
3. Bidang "occurrence" adalah indeks kemunculan kata salah tersebut dalam teks (dimulai dari 0 untuk kemunculan pertama). Jika kata yang sama muncul lebih dari sekali, pastikan "occurrence" merujuk tepat pada posisi kata salah yang ingin dikoreksi.
4. Bidang "word" harus berisi tepat kata yang salah sebagaimana ia tertulis dalam "text" (termasuk huruf besar/kecil atau tanda baca yang menempel).

Kembalikan hanya JSON, tanpa markdown.`;

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
