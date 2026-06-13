import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'src', 'data');

// Load sets
const setsPath = path.join(dataDir, 'sets.json');
const sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));

// Load all exercises
const customExercises = [];
const dirs = fs.readdirSync(dataDir);
dirs.forEach(dir => {
  const dirPath = path.join(dataDir, dir);
  if (fs.statSync(dirPath).isDirectory()) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const list = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
        customExercises.push(...list);
      }
    });
  }
});

const exerciseIds = new Set(customExercises.map(e => e.id));

console.log(`Loaded ${sets.length} sets and ${customExercises.length} exercises.`);

let missingCount = 0;
sets.forEach(s => {
  s.exerciseIds.forEach(id => {
    if (!exerciseIds.has(id)) {
      console.log(`[MISSING] Exercise ID "${id}" in set "${s.title}" (Set ID: ${s.id})`);
      missingCount++;
    }
  });
});

console.log(`\nCheck complete. Total missing exercise IDs in sets: ${missingCount}`);
