import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'src', 'data');

function findErrorCharRange(text, word, occurrence) {
  let startIndex = -1;
  for (let i = 0; i <= occurrence; i++) {
    startIndex = text.indexOf(word, startIndex + 1);
    if (startIndex === -1) break;
  }
  if (startIndex === -1) return null;
  return { start: startIndex, end: startIndex + word.length };
}

function getJsonFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results.push(...getJsonFiles(filePath));
    } else if (file.endsWith('.json') && file !== 'sets.json') {
      results.push(filePath);
    }
  });
  return results;
}

const jsonFiles = getJsonFiles(dataDir);
console.log(`Found ${jsonFiles.length} exercise files.`);

let totalDiscrepancies = 0;

jsonFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  let exercises;
  try {
    exercises = JSON.parse(content);
  } catch (e) {
    console.error(`Failed to parse ${file}:`, e.message);
    return;
  }

  const relativePath = path.relative(dataDir, file);

  exercises.forEach((ex, exIdx) => {
    if (!ex.text || !Array.isArray(ex.errors)) return;
    
    ex.errors.forEach((err, errIdx) => {
      const range = findErrorCharRange(ex.text, err.word, err.occurrence ?? 0);
      if (!range) {
        console.log(`[DISCREPANCY] File: ${relativePath}, Exercise: "${ex.title}" (Index ${exIdx})`);
        console.log(`  - Error word: "${err.word}" (occurrence ${err.occurrence ?? 0}) not found in text!`);
        console.log(`  - Text excerpt: "${ex.text.slice(0, 100)}..."`);
        totalDiscrepancies++;
      }
    });
  });
});

console.log(`\nValidation complete. Total discrepancies found: ${totalDiscrepancies}`);
