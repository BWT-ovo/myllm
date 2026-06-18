const fs = require('fs');
const cb = JSON.parse(fs.readFileSync('./frontend/public/code-bank.json', 'utf8'));

for (const [ck, ch] of Object.entries(cb.chapters)) {
  for (const [tk, tp] of Object.entries(ch.topics)) {
    for (const ex of tp.exercises) {
      const s = ex.solution;
      // Check if damaged: contains patterns like "nt a," "loat w" etc
      if (/\bnt\b/.test(s) || /\bloat\b/.test(s) || /\bower\(/.test(s) || /\bingspan\(/.test(s) || /int  =/.test(s) || /ouble\*/.test(s)) {
        console.log('Still damaged:', ex.id, ex.title);
        console.log('  First 100 chars:', s.substring(0, 100));
      }
    }
  }
}
