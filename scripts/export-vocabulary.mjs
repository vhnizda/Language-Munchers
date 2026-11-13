import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const source = resolve(process.env.VOCABULARY_SOURCE ?? '/home/vaclav/src/vaclav-language-learning-path/vocabulary/first-300-family-life.csv');
const output = resolve(process.env.VOCABULARY_OUTPUT ?? 'data/vocabulary.json');
const playableFields = ['id', 'group', 'english', 'czech', 'german_standard', 'portuguese_pt'];

function parseLine(line) {
  const fields = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      fields.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  fields.push(current);
  return fields;
}

const lines = (await readFile(source, 'utf8')).trim().split(/\r?\n/);
const headers = parseLine(lines.shift());
const vocabulary = lines.map((line) => {
  const values = parseLine(line);
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  return Object.fromEntries(playableFields.map((field) => [field, row[field]]));
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(vocabulary, null, 2)}\n`, 'utf8');
console.log(`Exported ${vocabulary.length} playable vocabulary rows to ${output}`);
