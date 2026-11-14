import { OPENER_RULES, STOCK_RULES } from '../engine/lexicon.js';
import { splitSentences } from '../engine/engine.js';
import { countWords } from '../engine/limits.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = [...STOCK_RULES, ...OPENER_RULES].map((r) => ({
  phrase: r.pattern,
  re: new RegExp(`(?<![\\w-])${esc(r.pattern).replace(/'/g, "['’]").replace(/ /g, '\\s+')}(?![\\w-])`, 'gi'),
}));

const syllables = (word) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return w ? 1 : 0;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
};

function update() {
  const text = $('ck-input').value;
  const words = countWords(text);
  const sentences = text.trim() ? splitSentences(text, 0, text.length) : [];
  const lengths = sentences.map((s) => countWords(text.slice(s.start, s.end)));
  const total = (text.match(/[A-Za-z’'-]+/g) || []).reduce((n, w) => n + syllables(w), 0);

  $('ck-words').textContent = words.toLocaleString('en-US');
  $('ck-chars').textContent = text.length.toLocaleString('en-US');
  $('ck-time').textContent = words ? `${Math.max(1, Math.round(words / 230))} min` : '0 min';
  $('ck-sentences').textContent = sentences.length;
  $('ck-avg').textContent = sentences.length ? (words / sentences.length).toFixed(1) : '0';
  $('ck-long').textContent = lengths.length ? Math.max(...lengths) : 0;
  $('ck-read').textContent = words >= 30 && sentences.length ? Math.round(206.835 - 1.015 * (words / sentences.length) - 84.6 * (total / words)) : 'n/a';

  const hits = [];
  for (const { phrase, re } of patterns) {
    const n = (text.match(re) || []).length;
    if (n) hits.push([phrase, n]);
  }
  $('ck-hits').textContent = hits.reduce((n, h) => n + h[1], 0);
  const list = $('ck-list');
  list.textContent = '';
  for (const [phrase, n] of hits.length ? hits.sort((a, b) => b[1] - a[1]) : [['None yet.', 0]]) {
    const li = document.createElement('li');
    li.textContent = n ? `${phrase} (${n})` : phrase;
    list.append(li);
  }
}

$('ck-input').addEventListener('input', update);
