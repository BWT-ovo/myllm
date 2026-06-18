const fs = require('fs');

function googleFormat(code) {
  const lines = code.split('\n');
  const result = [];
  let indent = 0;

  for (let line of lines) {
    let t = line.trim();
    if (!t) { result.push(''); continue; }

    // Closing brace: outdent first
    if (t === '}' || t === '};') {
      indent = Math.max(0, indent - 1);
      result.push(' '.repeat(indent * 2) + t);
      continue;
    }

    // Access modifiers: indent -1 from body, put on own line
    if (/^(public|private|protected)\s*:/.test(t)) {
      t = t.replace(/\s+/g, ' ').trim();
      // If there's code after the colon, split it
      const colonIdx = t.indexOf(':');
      const afterColon = t.substring(colonIdx + 1).trim();
      result.push(' '.repeat(Math.max(0, indent - 1) * 2) + t.substring(0, colonIdx + 1));
      if (afterColon) {
        // Push the rest as a new line at current indent
        result.push(' '.repeat(indent * 2) + afterColon);
      }
      continue;
    }

    // Opening brace: add space before {
    t = t.replace(/(\S)\{/g, '$1 {');
    t = t.replace(/\)\{/g, ') {');
    t = t.replace(/\}\{/g, '} {');

    // Space after comma
    t = t.replace(/,(\S)/g, ', $1');

    // Space around = (but not == != <= >=, and not =0 pure virtual)
    t = t.replace(/([^=!<>])=([^=\d])/g, '$1 = $2');

    // Space after // for comments
    t = t.replace(/\/\/(\S)/g, '// $1');

    // Space after for/if/while/switch before (
    t = t.replace(/\b(for|if|while|switch|catch)\(/g, '$1 (');

    // No space before ( for function calls (but keep space after if/for/while)
    // Already handled above

    // Clean up extra spaces
    t = t.replace(/\s{2,}/g, ' ');
    t = t.replace(/\s\)/g, ')');
    t = t.replace(/\(\s/g, '(');

    result.push(' '.repeat(indent * 2) + t);

    // Track indent: if line ends with {, increase
    if (t.endsWith('{') || t.endsWith('{ ')) indent++;
  }

  return result.join('\n');
}

const cb = JSON.parse(fs.readFileSync('./frontend/public/code-bank.json', 'utf8'));
let count = 0;
for (const ch of Object.values(cb.chapters)) {
  for (const ex of ch.exercises) {
    const old = ex.solution;
    ex.solution = googleFormat(old);
    if (old !== ex.solution) count++;
    if (ex.starterCode) ex.starterCode = googleFormat(ex.starterCode);
  }
}

fs.writeFileSync('./frontend/public/code-bank.json', JSON.stringify(cb, null, 2), 'utf8');
console.log('Formatted ' + count + ' solutions with Google C++ Style');
