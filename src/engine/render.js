// Output is always the input plus the active, non-overlapping edits.
export function applyEdits(text, edits) {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  let out = '';
  let pos = 0;
  for (const e of sorted) {
    out += text.slice(pos, e.start) + e.after;
    pos = e.end;
  }
  return out + text.slice(pos);
}

// Parts for the change view: { text, kind: 'same' | 'del' | 'add' }.
export function renderParts(text, edits) {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  const parts = [];
  let pos = 0;
  for (const e of sorted) {
    if (e.start > pos) parts.push({ text: text.slice(pos, e.start), kind: 'same' });
    if (e.before) parts.push({ text: e.before, kind: 'del' });
    if (e.after) parts.push({ text: e.after, kind: 'add' });
    pos = e.end;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), kind: 'same' });
  return parts;
}
