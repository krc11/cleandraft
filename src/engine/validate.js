// Stage 8. This extractor is written separately from the protect step on purpose
// (FR-5), so a protect bug cannot hide itself. A failed check reverts the offending
// edit and keeps the original wording.
import { applyEdits } from './render.js';

const MAX_DRIFT = 0.15;
// Short, dense drafts can lose more than 15% to filler removal alone, and that is the point
// of the tool. The limit guards the document, so it needs enough words to mean something.
const MIN_WORDS_FOR_DRIFT = 80;

const collect = (text, re, into, tag) => {
  for (const m of text.matchAll(re)) {
    const key = `${tag}:${m[0]}`;
    into.set(key, (into.get(key) || 0) + 1);
  }
};

// Multiset of everything that must survive: numbers, URLs, emails, quotes, citations.
export function extractEntities(text) {
  const found = new Map();
  collect(text, /\d[\d,]*(?:\.\d+)?/g, found, 'num');
  collect(text, /https?:\/\/\S+|www\.\S+/gi, found, 'url');
  collect(text, /[^\s@(]+@[^\s@)]+\.\w+/g, found, 'email');
  collect(text, /"[^"\n]+"|“[^”\n]+”/g, found, 'quote');
  collect(text, /\[\d[^\]\n]*\]|\([A-Z][^()\n]{0,40}\d{4}[^()\n]{0,12}\)/g, found, 'cite');
  return found;
}

// Capitalized words after a lower-case word are names. They may move, never vanish.
export function extractNames(text) {
  const found = new Map();
  for (const m of text.matchAll(/(?<=[a-z,;:]\s)[A-Z][a-zA-Z'’-]+/g)) found.set(m[0], (found.get(m[0]) || 0) + 1);
  return found;
}

const SANITY = [
  /\b(\w+)\s+\1\b/gi, // doubled word
  / ,| \.(?=\s|$)|,,|\.\.(?!\.)|,\.|\.,/g, // broken punctuation
  /[.!?]\s+[a-z]/g, // sentence starting in lower case
  /(?:^|[^\w])a\s+(?:an?|the)\b|\ban?\s+(?:a|an|the)\b/gi, // stacked articles
  /\b(?:to|can)\s+can\b/gi, // "to can" from an ability swap
  / {2,}/g,
];
const sanityCount = (text) => SANITY.reduce((n, re) => n + (text.match(re) || []).length, 0);
const wordCount = (t) => (t.match(/\S+/g) || []).length;

const missing = (input, output) => {
  for (const [k, n] of input) if ((output.get(k) || 0) < n) return true;
  return false;
};
// Unlike names, entity counts must also not grow: an added number is invented content.
const entitiesDiffer = (a, b) => {
  if (a.size !== b.size) return true;
  for (const [k, n] of a) if (b.get(k) !== n) return true;
  return false;
};

function checkBlock(original, output) {
  const issues = [];
  if (entitiesDiffer(extractEntities(original), extractEntities(output))) issues.push('entity');
  if (missing(extractNames(original), extractNames(output))) issues.push('name');
  if (sanityCount(output) > sanityCount(original)) issues.push('sanity');
  return issues;
}

// Above this many edits in one paragraph, a search for the one bad edit costs too much.
const MAX_SEARCH_EDITS = 40;
const WINDOW = 48;

// Does this edit break a check on its own? Only the text around it needs comparing.
function editFailsAlone(original, edit, offset) {
  const start = edit.start - offset;
  const end = edit.end - offset;
  const from = Math.max(0, start - WINDOW);
  const to = Math.min(original.length, end + WINDOW);
  const before = original.slice(from, to);
  const after = original.slice(from, start) + edit.after + original.slice(end, to);
  return checkBlock(before, after).length > 0;
}

function fixBlock(text, block, blockEdits, reverted) {
  const original = text.slice(block.start, block.end);
  const render = (list) => applyEdits(original, list.map((e) => ({ ...e, start: e.start - block.start, end: e.end - block.start })));
  const drop = (edit) => reverted.push({ rule: edit.rule, before: edit.before, after: edit.after });

  let active = [];
  for (const edit of blockEdits) {
    if (editFailsAlone(original, edit, block.start)) drop(edit);
    else active.push(edit);
  }

  // What is left can only fail because two edits interact. Remove the one whose absence
  // helps most, so one bad pair does not cost the paragraph its good edits.
  while (active.length && checkBlock(original, render(active)).length) {
    const issues = checkBlock(original, render(active)).length;
    let best = null;
    if (active.length <= MAX_SEARCH_EDITS) {
      let bestScore = issues;
      for (const e of active) {
        const score = checkBlock(original, render(active.filter((x) => x !== e))).length;
        if (score < bestScore) {
          bestScore = score;
          best = e;
        }
      }
    }
    if (!best) {
      // No single edit explains it. Keep the original wording for the whole paragraph.
      active.forEach(drop);
      return [];
    }
    active = active.filter((e) => e !== best);
    drop(best);
  }
  return active;
}

// Length drift is shared by many edits. Only edits pushing in the drifting direction can
// help, and pure filler removals go last: they are the most useful and usually the longest.
function fixDrift(text, edits, reverted) {
  const inputWords = wordCount(text);
  if (inputWords < MIN_WORDS_FOR_DRIFT) return edits;
  const delta = (e) => wordCount(e.after) - wordCount(e.before);
  let outputWords = inputWords + edits.reduce((n, e) => n + delta(e), 0);
  const shrinking = outputWords < inputWords;
  const queue = edits
    .filter((e) => (shrinking ? delta(e) < 0 : delta(e) > 0))
    .sort((a, b) => (a.after ? 0 : 1) - (b.after ? 0 : 1) || Math.abs(delta(b)) - Math.abs(delta(a)));
  const dropped = new Set();
  while (Math.abs(outputWords - inputWords) / inputWords > MAX_DRIFT && queue.length) {
    const edit = queue.shift();
    dropped.add(edit);
    outputWords -= delta(edit);
    reverted.push({ rule: edit.rule, before: edit.before, after: edit.after });
  }
  return edits.filter((e) => !dropped.has(e));
}

export function validateAndRevert(text, edits, blocks) {
  const reverted = [];
  const kept = [];
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  let i = 0;
  for (const block of blocks) {
    const inBlock = [];
    while (i < sorted.length && sorted[i].start < block.end) {
      if (sorted[i].start >= block.start && sorted[i].end <= block.end) inBlock.push(sorted[i]);
      else reverted.push({ rule: sorted[i].rule, before: sorted[i].before, after: sorted[i].after });
      i++;
    }
    if (inBlock.length) kept.push(...fixBlock(text, block, inBlock, reverted));
  }
  return { edits: fixDrift(text, kept, reverted), reverted };
}
