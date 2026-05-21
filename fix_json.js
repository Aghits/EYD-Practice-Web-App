const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'custom_2.json');
let content = fs.readFileSync(filePath, 'utf-8').trim();

console.log('Original content length:', content.length);

// If it doesn't end with proper closing brackets, let's try to find where it's broken
// and fix it by trimming and closing the tags.
try {
  JSON.parse(content);
  console.log('JSON is already valid!');
} catch (e) {
  console.log('JSON is invalid, attempting auto-repair...', e.message);
  
  // Let's find the last completed exercise or array element
  // Since it is an array of objects, we can look for the last complete "errors" or similar structure.
  // Or we can try to truncate the incomplete object at the end.
  // The last part is: ... antarwarga sekolah.","errors":[{"word":"november",...
  // Let's locate the last index of `{"id":"custom_`
  const lastIndex = content.lastIndexOf('{"id":"custom_');
  if (lastIndex !== -1) {
    console.log('Truncating at last incomplete exercise, index:', lastIndex);
    const validPart = content.slice(0, lastIndex).trim();
    // Remove the trailing comma if it exists
    let repaired = validPart;
    if (repaired.endsWith(',')) {
      repaired = repaired.slice(0, -1);
    }
    repaired += ']';
    
    try {
      const parsed = JSON.parse(repaired);
      console.log('Successfully repaired JSON! Number of exercises:', parsed.length);
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
      console.log('Wrote repaired JSON back to file.');
    } catch (err) {
      console.error('Failed to parse repaired JSON:', err.message);
    }
  } else {
    console.error('Could not find start of any exercise to truncate.');
  }
}
