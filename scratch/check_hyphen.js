import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'src', 'data');

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

let issueCount = 0;

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
    if (!ex.errors) return;
    
    ex.errors.forEach((err, errIdx) => {
      if (err.category === 'hyphen') {
        // If the word doesn't contain a space, it will be tokenized as a single word,
        // making it impossible to insert a hyphen in the middle.
        if (!err.word.includes(' ')) {
          console.log(`[HYPHEN ISSUE] File: ${relativePath}, Exercise: "${ex.title}" (Index ${exIdx})`);
          console.log(`  - Target word: "${err.word}"`);
          console.log(`  - Correct: "${err.correct}"`);
          issueCount++;
        }
      }
    });
  });
});

console.log(`\nScan complete. Found ${issueCount} hyphen errors with single tokens.`);
