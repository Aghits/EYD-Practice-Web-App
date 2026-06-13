import fs from 'fs';
import path from 'url';
import fileSystem from 'fs';
import filePathHelper from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = filePathHelper.dirname(__filename);

const dataDir = filePathHelper.join(__dirname, '..', 'src', 'data');

function getJsonFiles(dir) {
  const results = [];
  const list = fileSystem.readdirSync(dir);
  list.forEach(file => {
    const filePath = filePathHelper.join(dir, file);
    const stat = fileSystem.statSync(filePath);
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

jsonFiles.forEach(file => {
  const content = fileSystem.readFileSync(file, 'utf-8');
  let exercises;
  try {
    exercises = JSON.parse(content);
  } catch (e) {
    console.error(`Failed to parse ${file}:`, e.message);
    return;
  }

  let modified = false;

  exercises.forEach((ex, exIdx) => {
    if (!ex.text) return;
    
    // Find all occurrences of *phrase* in text
    // Regex matches * followed by one or more chars (excluding *) followed by *
    const regex = /\*([^*]+)\*/g;
    let match;
    const matches = [];
    while ((match = regex.exec(ex.text)) !== null) {
      matches.push({
        full: match[0],
        phrase: match[1]
      });
    }

    if (matches.length > 0) {
      console.log(`\nFile: ${filePathHelper.relative(dataDir, file)} - Exercise: "${ex.title}"`);
      
      matches.forEach(m => {
        console.log(`  - Found markdown italics: ${m.full}`);
        
        // Remove asterisks from the text
        ex.text = ex.text.replace(m.full, m.phrase);
        modified = true;

        // Check if this is an error word of category "italic"
        const isItalicError = ex.errors && ex.errors.some(err => err.word === m.phrase && err.category === 'italic');

        if (!isItalicError) {
          // If it's not an error, it should be in italicWords so it renders in italics
          if (!ex.italicWords) ex.italicWords = [];
          if (!ex.italicWords.includes(m.phrase)) {
            ex.italicWords.push(m.phrase);
            console.log(`    -> Added "${m.phrase}" to italicWords`);
          }
        } else {
          console.log(`    -> Word "${m.phrase}" is an active italic error (no addition to italicWords needed)`);
        }
      });
    }
  });

  if (modified) {
    fileSystem.writeFileSync(file, JSON.stringify(exercises, null, 2), 'utf-8');
    console.log(`Saved changes to ${filePathHelper.relative(dataDir, file)}`);
  }
});

console.log('\nAsterisk cleanup complete!');
