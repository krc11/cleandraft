// CleanDraft rules engine. No dependencies, no network, deterministic:
// same text, settings, seed and lexicon version give the same output.
//
// Every stage proposes edits as spans of the ORIGINAL text and claims those spans,
// so edits never overlap. That is what makes one-edit revert, validation revert and
// the change view all simple: output is always input + the active edit list.
//
// Stages: 1 protect spans, 2 phrase lexicon, 3 contractions, 4 dashes, 5 sentence rhythm,
// 6 cleanup (a/an, repeated openers, spelling), 7 restore (protected spans were never
// touched, so this is applyEdits), 8 validate.
import { LEXICON_VERSION, OPENER_RULES, STOCK_RULES, PLAIN_RULES, ADJECTIVES, REASONS, SPELLING } from './lexicon.js';
import { validateAndRevert } from './validate.js';
import { applyEdits } from './render.js';
import { countWords } from './limits.js';

export { applyEdits, renderParts } from './render.js';

export { WORD_LIMIT, countWords } from './limits.js';

const STRENGTHS = {
  light: { stock: 1, plain: false, adjectives: false, contractions: 0, dashes: false, reorder: 0, rhythm: false },
  balanced: { stock: 0.95, plain: 0.85, adjectives: false, contractions: 0.75, dashes: true, reorder: 0.4, rhythm: false },
  strong: { stock: 1, plain: 0.95, adjectives: 0.8, contractions: 0.9, dashes: true, reorder: 0.8, rhythm: true },
};
const TONES = {
  natural: { contraction: 1, formal: false },
  professional: { contraction: 0.55, formal: false },
  formal: { contraction: 0, formal: true },
};

// Seeded random: one independent draw per (seed, rule, position), so changing one
// rule's behaviour does not shift every later choice in the document.
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const draw = (seed, key, pos) => {
  let t = (hash(key) ^ Math.imul(seed + 1, 2654435761) ^ Math.imul(pos + 1, 40503)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const compile = (rule) => {
  if (!rule.re) {
    const body = esc(rule.pattern).replace(/'/g, "['’]").replace(/ /g, '\\s+');
    rule.re = new RegExp(`(?<![\\w'’-])${body}(?![\\w-])`, 'gi');
  }
  rule.re.lastIndex = 0;
  return rule.re;
};
const byLengthDesc = (a, b) => b.pattern.length - a.pattern.length;
const SORTED = {
  stock: [...STOCK_RULES].sort(byLengthDesc),
  plain: [...PLAIN_RULES].sort(byLengthDesc),
  adjectives: [...ADJECTIVES].sort(byLengthDesc),
};

const matchCase = (src, out) => {
  if (!out) return out;
  if (src.length > 1 && src === src.toUpperCase() && /[A-Z]/.test(src)) return out.toUpperCase();
  return /^[A-Z]/.test(src) ? out[0].toUpperCase() + out.slice(1) : out;
};
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

const startsWithVowelSound = (w) => {
  const l = w.toLowerCase();
  if (/^(hour|honest|honou?r|heir)/.test(l)) return true;
  if (/^(uni([^nm]|$)|use|usu|eu|one|once|ubiq)/.test(l)) return false;
  return /^[aeiou]/.test(l);
};

// --- Stage 1: layout and protected spans ------------------------------------

const PROTECT_PATTERNS = [
  /```[\s\S]*?```/g,
  /`[^`\n]+`/g,
  /\[[^\]\n]*\]\([^)\n]*\)/g,
  /\bhttps?:\/\/[^\s<>"')\]]+|\bwww\.[^\s<>"')\]]+/gi,
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,
  /(?<![\w])[@#][\w-]+/g,
  /"[^"\n]*"/g,
  /“[^”\n]*”/g,
  /‘[^’\n]{2,}’(?![a-z])/g,
  /\[\d+(?:\s*[,–-]\s*\d+)*\]/g,
  /\([A-Z][\w'’-]+(?:\s+(?:et al\.?|and|&)\s*[\w'’-]*)?,?\s+\d{4}[a-z]?(?:,\s*pp?\.\s*\d+(?:[–-]\d+)?)?\)/g,
  /\bet al\.?/g,
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?/g,
  /[$€£¥]?\d[\d,]*(?:\.\d+)?(?:\s?(?:%|percent|million|billion|trillion|km|kg|mg|ms|GB|MB|KB))?(?:(?:st|nd|rd|th)\b)?(?:\s?[–-]\s?\d[\d,.]*%?)?/g,
];
const COMMON_FIRST = new Set(
  'a an the in on at by for with from to of and or but so if as this that these those it its we you they he she i our your their my his her there here when while after before during since until although though because however moreover furthermore additionally consequently therefore thus hence nevertheless nonetheless subsequently accordingly indeed notably importantly overall first second third finally also still many most some all each every both no not one two is are was were do does did can could will would should may might must how what why who where which'.split(' ')
);
const ABBREVIATIONS = /(?:^|[\s(])(?:e\.g|i\.e|etc|vs|mr|mrs|ms|dr|prof|st|inc|ltd|co|jr|sr|no|fig|al|u\.s|u\.k|a\.m|p\.m)\.$/i;

export function splitSentences(text, from, to) {
  const out = [];
  const re = /[.!?]+["'”’)\]]*(?=\s+|$)/g;
  re.lastIndex = from;
  let start = from;
  while (start < to && /\s/.test(text[start])) start++;
  let m;
  while ((m = re.exec(text)) && m.index < to) {
    const end = m.index + m[0].length;
    const head = text.slice(Math.max(start, m.index - 8), m.index + 1);
    if (m[0] === '.' && ABBREVIATIONS.test(head)) continue;
    let next = end;
    while (next < to && /\s/.test(text[next])) next++;
    if (next < to && /[a-z]/.test(text[next])) continue;
    out.push({ start, end });
    start = next;
  }
  if (start < to) out.push({ start, end: to });
  return out;
}

// Headings, code, tables and very short title-like lines keep their exact wording.
// List markers are protected but the item text is edited.
function splitBlocks(text, mask) {
  const blocks = [];
  let pos = 0;
  let inFence = false;
  for (const line of text.split('\n')) {
    const start = pos;
    const end = pos + line.length;
    pos = end + 1;
    const trimmed = line.trim();
    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      mask.fill(1, start, end);
      continue;
    }
    if (inFence) {
      mask.fill(1, start, end);
      continue;
    }
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/);
    const titleLike = words.length <= 10 && !/[.!?:;,]["'”’)]?$/.test(trimmed);
    if (/^#{1,6}\s/.test(trimmed) || /^\|/.test(trimmed) || /^>/.test(trimmed) || titleLike) {
      mask.fill(1, start, end);
      continue;
    }
    const marker = line.match(/^\s*(?:[-*+•]|\d+[.)]|[a-zA-Z][.)])\s+/);
    if (marker) mask.fill(1, start, start + marker[0].length);
    blocks.push({ start: marker ? start + marker[0].length : start, end });
  }
  return blocks;
}

function protectSpans(text, mask, blocks) {
  for (const re of PROTECT_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m[0]) mask.fill(1, m.index, m.index + m[0].length);
      else re.lastIndex++;
    }
  }
  // Names: capitalized words anywhere but a sentence start, plus a sentence-initial
  // word when it is not a common word (Google said..., Priya wrote...).
  for (const b of blocks) {
    for (const s of splitSentences(text, b.start, b.end)) {
      const re = /[A-Z][\w'’&-]*(?:\.[A-Z])*/g;
      re.lastIndex = s.start;
      let m;
      while ((m = re.exec(text)) && m.index < s.end) {
        const atStart = !/[\w]/.test(text.slice(s.start, m.index));
        const bare = m[0].replace(/['’]s$/, '').toLowerCase();
        if (atStart && (COMMON_FIRST.has(bare) || isLexiconWord(bare))) continue;
        if (!atStart && m[0] === 'I') continue;
        mask.fill(1, m.index, m.index + m[0].length);
      }
    }
  }
}

const LEXICON_WORDS = new Set();
for (const r of [...OPENER_RULES, ...STOCK_RULES, ...PLAIN_RULES, ...ADJECTIVES]) LEXICON_WORDS.add(r.pattern.split(' ')[0].toLowerCase());
const isLexiconWord = (w) => LEXICON_WORDS.has(w);

// --- Edit bookkeeping ---------------------------------------------------------

function makeContext(text, mask, seed, options) {
  const edits = [];
  const free = (s, e) => {
    for (let i = s; i < e; i++) if (mask[i]) return false;
    return true;
  };
  const claim = (start, end, after, rule, category) => {
    let s = start;
    let replacement = after;
    // Keep a / an correct when the following word changes.
    const art = text.slice(Math.max(0, s - 4), s).match(/(?:^|[^\w])(a|an)\s$/i);
    if (art && replacement) {
      const isAn = art[1].toLowerCase() === 'an';
      const needAn = startsWithVowelSound(replacement);
      if (isAn !== needAn) {
        const artStart = s - art[1].length - 1;
        if (free(artStart, s)) {
          const word = needAn ? 'an' : 'a';
          replacement = `${/^A/.test(art[1]) ? capitalize(word) : word} ${replacement}`;
          s = artStart;
        } else return false;
      }
    }
    if (!free(s, end)) return false;
    mask.fill(2, s, end);
    edits.push({ id: edits.length, start: s, end, before: text.slice(s, end), after: replacement, rule, category, reason: REASONS[category] });
    return true;
  };
  return { text, mask, seed, options, edits, free, claim };
}

const respell = (word, ctx) => {
  const map = SPELLING[ctx.options.variant];
  if (!map) return word;
  return word.replace(/[A-Za-z]+/g, (w) => {
    const hit = map.get(w.toLowerCase());
    return hit ? matchCase(w, hit) : w;
  });
};

const pickOption = (rule, ctx, pos) => {
  const options = rule.options.filter((o) => !(ctx.options.tone.formal && o.startsWith('~'))).map((o) => o.replace(/^~/, ''));
  if (!options.length) return null;
  return options[Math.floor(draw(ctx.seed, `pick:${rule.id}`, pos) * options.length)];
};

// A removal must also take the space after it, a stray comma, and capitalize what follows.
function claimRemovalOrSwap(ctx, sentences, start, end, choice, rule, category) {
  const { text } = ctx;
  const atSentenceStart = sentences.some((s) => s.start === start);
  const srcCase = text.slice(start, end);
  if (choice) return ctx.claim(start, end, respell(matchCase(srcCase, choice), ctx), rule, category);

  let e = end;
  if (text[e] === ',') e++;
  while (e < text.length && text[e] === ' ') e++;
  if (atSentenceStart) {
    if (!/[a-zA-Z]/.test(text[e] || '')) return false;
    if (!ctx.free(e, e + 1) && ctx.mask[e] !== 1) return false;
    // Capitalize the first following word. Protected letters are already capitalized.
    if (/[a-z]/.test(text[e])) {
      if (!ctx.free(e, e + 1)) return false;
      return ctx.claim(start, e + 1, text[e].toUpperCase(), rule, category);
    }
    return ctx.claim(start, e, '', rule, category);
  }
  // Mid-sentence: "Yes, it is worth noting that it works" keeps a single space.
  return ctx.claim(start, e, '', rule, category);
}

function runRules(ctx, rules, blocks, sentencesOf, rate, category) {
  const { text, seed } = ctx;
  for (const b of blocks) {
    const slice = text.slice(b.start, b.end);
    const sentences = sentencesOf(b);
    for (const rule of rules) {
      const re = compile(rule);
      let m;
      while ((m = re.exec(slice))) {
        const start = b.start + m.index;
        const end = start + m[0].length;
        if (!ctx.free(start, end)) continue;
        if (rule.when && !rule.when({ before: text.slice(Math.max(b.start, start - 24), start), after: text.slice(end, Math.min(b.end, end + 40)) })) continue;
        if (draw(seed, rule.id, start) >= rate) continue;
        const choice = pickOption(rule, ctx, start);
        if (choice === null) continue;
        claimRemovalOrSwap(ctx, sentences, start, end, choice, rule.id.replace(/-(s|ed|ing)$/, ''), category);
      }
    }
  }
}

// --- Stage 2: openers ---------------------------------------------------------

const THROAT_CLEARING = new RegExp(
  `^(?:${STOCK_RULES.filter((r) => r.options.length === 1 && r.options[0] === '').map((r) => esc(r.pattern)).join('|')})(?![\w-])`,
  'i'
);

function runOpeners(ctx, blocks, sentencesOf) {
  const { text } = ctx;
  for (const b of blocks) {
    const sentences = sentencesOf(b);
    let lastOpener = null;
    for (const s of sentences) {
      const head = text.slice(s.start, Math.min(s.end, s.start + 20));
      for (const rule of OPENER_RULES) {
        const m = head.match(new RegExp(`^${esc(rule.pattern)}(,|\\s)`, 'i'));
        if (!m) continue;
        const wordEnd = s.start + rule.pattern.length;
        if (!ctx.free(s.start, wordEnd)) break;
        if (m[1] !== ',') break;
        let choice = pickOption(rule, ctx, s.start);
        if (choice === null) break;
        // Two "Also," openers in a row is the pattern this stage exists to remove.
        if (choice && choice === lastOpener) {
          if (!rule.options.includes('')) break;
          choice = '';
        }
        lastOpener = choice;
        if (choice) {
          // "So," and "But," read better without the comma; "Also," and "Still," keep it.
          const dropComma = /^(so|but|and)$/i.test(choice);
          ctx.claim(s.start, dropComma ? wordEnd + 1 : wordEnd, choice, rule.id, 'opener');
        } else {
          // "Moreover, it is important to note that the..." is one piece of filler. Removing
          // the two parts separately would leave the first one holding the capital letter.
          let e = wordEnd + 1;
          while (text[e] === ' ') e++;
          const filler = text.slice(e, Math.min(s.end, e + 40)).match(THROAT_CLEARING);
          const fillerEnd = filler ? e + filler[0].length : wordEnd;
          claimRemovalOrSwap(ctx, sentences, s.start, fillerEnd, '', rule.id, 'opener');
        }
        break;
      }
    }
  }
}

// --- Stage 5: contractions ----------------------------------------------------

const CONTRACTIONS = [
  ['is not', "isn't"], ['are not', "aren't"], ['was not', "wasn't"], ['were not', "weren't"], ['do not', "don't"], ['does not', "doesn't"], ['did not', "didn't"],
  ['has not', "hasn't"], ['have not', "haven't"], ['had not', "hadn't"], ['will not', "won't"], ['would not', "wouldn't"], ['could not', "couldn't"], ['should not', "shouldn't"],
  ['cannot', "can't"], ['can not', "can't"], ['it is', "it's"], ['that is', "that's"], ['there is', "there's"], ['here is', "here's"], ['what is', "what's"],
  ['we are', "we're"], ['they are', "they're"], ['you are', "you're"], ['i am', "I'm"], ['we have', "we've"], ['they have', "they've"], ['you have', "you've"], ['i have', "I've"],
  ['we will', "we'll"], ['they will', "they'll"], ['you will', "you'll"], ['i will', "I'll"], ['it will', "it'll"], ['let us', "let's"],
];
const PARTICIPLE = /^\s+(been|done|seen|made|taken|given|gone|known|found|shown|built|had|got|gotten|become|written|[a-z]+ed)\b/i;
const NEEDS_FOLLOWING_WORD = /^\s+[a-z"“]/i;
const STRANDED_PREP = /^\s+(at|in|on|for|to|of|about|from|with|by)\b/i;

const contractionGuard = (pair, before, after) => {
  const [phrase] = pair;
  if (/\bnot$/.test(phrase) || phrase === 'cannot') {
    if (/^\s+only\b/i.test(after)) return false;
    return !/^\s+(I|you|we|they|he|she|it)\b/.test(after);
  }
  if (!NEEDS_FOLLOWING_WORD.test(after)) return false;
  if (/^\s+not\b/i.test(after)) return false;
  if (/ have$/.test(phrase)) return PARTICIPLE.test(after);
  if (/ is$/.test(phrase)) {
    if (STRANDED_PREP.test(after)) return false;
    if (/\b(as|than|what|how|where|whatever)\s+$/i.test(before)) return false;
  }
  if (/^(that|there|here|what) is$/.test(phrase) && before.trim() && !/[.!?:]["'”’)]?\s*$/.test(before)) return false;
  if (/ are$/.test(phrase) && STRANDED_PREP.test(after)) return false;
  return true;
};

function runContractions(ctx, blocks, rate) {
  const { text, seed } = ctx;
  for (const b of blocks) {
    const slice = text.slice(b.start, b.end);
    for (const pair of CONTRACTIONS) {
      const re = new RegExp(`(?<![\\w'’-])${pair[0].replace(' ', '\\s+')}(?![\\w'’-])`, 'gi');
      let m;
      while ((m = re.exec(slice))) {
        const start = b.start + m.index;
        const end = start + m[0].length;
        if (!ctx.free(start, end)) continue;
        if (!contractionGuard(pair, text.slice(Math.max(b.start, start - 24), start), text.slice(end, Math.min(b.end, end + 30)))) continue;
        if (draw(seed, `ct:${pair[0]}`, start) >= rate) continue;
        ctx.claim(start, end, /^[A-Z]/.test(m[0]) ? capitalize(pair[1]) : pair[1], `ct-${pair[0].replace(' ', '-')}`, 'contraction');
      }
    }
  }
}

const EXPANSIONS = [
  [/\bwon['’]t\b/gi, 'will not'], [/\bcan['’]t\b/gi, 'cannot'], [/\b(\w+)n['’]t\b/gi, '$1 not'], [/\b(we|they|you)['’]re\b/gi, '$1 are'], [/\bI['’]m\b/g, 'I am'],
  [/\b(we|they|you|I)['’]ve\b/gi, '$1 have'], [/\b(we|they|you|I|it|he|she)['’]ll\b/gi, '$1 will'], [/\blet['’]s\b/gi, 'let us'], [/\b(it|that|there|here|what|he|she)['’]s\b/gi, '$1 is'],
];

function runExpansions(ctx, blocks) {
  const { text } = ctx;
  for (const b of blocks) {
    const slice = text.slice(b.start, b.end);
    for (const [re, to] of EXPANSIONS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(slice))) {
        const start = b.start + m.index;
        const end = start + m[0].length;
        if (!ctx.free(start, end)) continue;
        const after = text.slice(end, Math.min(b.end, end + 20));
        // "Don't you agree?" has no clean expansion.
        if (/^\s+(I|you|we|they|he|she|it)\b/.test(after)) continue;
        let out = m[0].replace(re, to);
        re.lastIndex = m.index + m[0].length;
        if (/['’]s$/i.test(m[0]) && /^\s+been\b/i.test(after)) out = out.replace(/ is$/, ' has');
        ctx.claim(start, end, out, 'ct-expand', 'expansion');
      }
    }
  }
}

// --- Stage 6: dashes ----------------------------------------------------------

const CLAUSE_START = /^(?:the|this|that|these|those|it|they|we|you|i|he|she|there|many|most|some)\s+\w+/i;

function runDashes(ctx, blocks, sentencesOf) {
  const { text, seed } = ctx;
  const dash = /\s*(?:—|--|\s–\s)\s*/g;
  for (const b of blocks) {
    for (const s of sentencesOf(b)) {
      const found = [];
      dash.lastIndex = s.start;
      let m;
      while ((m = dash.exec(text)) && m.index < s.end) found.push({ start: m.index, end: m.index + m[0].length });
      if (!found.length) continue;
      if (found.length === 2) {
        // A paired aside reads as commas.
        for (const d of found) if (ctx.free(d.start, d.end)) ctx.claim(d.start, d.end, ', ', 'da-pair', 'dash');
        continue;
      }
      for (const d of found) {
        const rest = text.slice(d.end, s.end);
        if (CLAUSE_START.test(rest) && /[a-z]/.test(text[d.end]) && ctx.free(d.start, d.end + 1)) {
          ctx.claim(d.start, d.end + 1, `. ${text[d.end].toUpperCase()}`, 'da-sentence', 'dash');
        } else if (ctx.free(d.start, d.end)) {
          ctx.claim(d.start, d.end, ', ', 'da-comma', 'dash');
        }
      }
    }
  }
}

// --- Stage 7: rhythm, spelling --------------------------------------------------

const FRONTED = /^(In|At|On|During|After|Before|By|Over|Since|Within|Across|Throughout|Under)\s+[^,.;:!?]{2,48},\s+/;

function runReorder(ctx, blocks, sentencesOf, rate) {
  const { text, seed } = ctx;
  for (const b of blocks) {
    for (const s of sentencesOf(b)) {
      if (text[s.end - 1] !== '.') continue;
      const sent = text.slice(s.start, s.end);
      const m = sent.match(FRONTED);
      if (!m) continue;
      const phraseWords = m[0].trim().split(/\s+/).length;
      if (phraseWords > 7) continue;
      const main = sent.slice(m[0].length, -1);
      if (/[,;:—–()"“”]/.test(main) || main.split(/\s+/).length < 4) continue;
      // The main clause must start with a clear subject, or the moved phrase can dangle.
      if (!/^(the|this|that|these|those|it|they|we|you|i|he|she|our|their|its|many|most|some|[A-Z])/.test(main)) continue;
      // Moving a phrase after a verb that takes a clause changes what it modifies.
      if (/\b(that|which|who|because|if|when|while|although|and|or|but)\b/i.test(main)) continue;
      // Spans holding an edit stay put, protected spans may move because they stay verbatim.
      let touched = false;
      for (let i = s.start; i < s.end; i++) if (ctx.mask[i] === 2) touched = true;
      if (touched) continue;
      if (draw(seed, 'rh-reorder', s.start) >= rate) continue;
      const phrase = m[0].replace(/,\s+$/, '');
      const movedMain = capitalize(main);
      const movedPhrase = lowerFirst(phrase);
      ctx.mask.fill(0, s.start, s.end);
      ctx.claim(s.start, s.end, `${movedMain} ${movedPhrase}.`, 'rh-reorder', 'reorder');
    }
  }
}

const SPLIT_POINT = /,\s+(and|but)\s+(the|this|that|these|those|it|they|we|you|he|she|there|many|most|some|our|their)\s+[a-z]+/g;

function runSplits(ctx, blocks, sentencesOf) {
  const { text, seed } = ctx;
  for (const b of blocks) {
    for (const s of sentencesOf(b)) {
      const sent = text.slice(s.start, s.end);
      if (sent.split(/\s+/).length < 24) continue;
      SPLIT_POINT.lastIndex = 0;
      const m = SPLIT_POINT.exec(sent);
      if (!m) continue;
      const pos = s.start + m.index;
      const conj = m[1];
      const subject = m[2];
      const head = sent.slice(0, m.index).split(/\s+/).length;
      if (head < 8) continue;
      const end = pos + m[0].length - m[0].match(/[a-z]+$/)[0].length - 1;
      if (!ctx.free(pos, end)) continue;
      if (draw(seed, 'rh-split', pos) >= 0.85) continue;
      const keepConj = conj === 'but' && draw(seed, 'rh-split-but', pos) < 0.5;
      const replacement = keepConj ? `. But ${subject}` : `. ${capitalize(subject)}`;
      ctx.claim(pos, end, replacement, 'rh-split', 'split');
    }
  }
}

function runMerges(ctx, blocks, sentencesOf) {
  const { text, seed } = ctx;
  for (const b of blocks) {
    const list = sentencesOf(b);
    for (let i = 0; i + 1 < list.length; i++) {
      const a = text.slice(list[i].start, list[i].end);
      const c = text.slice(list[i + 1].start, list[i + 1].end);
      if (!a.endsWith('.') || !c.endsWith('.')) continue;
      if (a.split(/\s+/).length > 9 || c.split(/\s+/).length > 9) continue;
      if (a.split(/\s+/).length < 3 || c.split(/\s+/).length < 3) continue;
      if (/,/.test(a) || /,/.test(c)) continue;
      const m = c.match(/^(It|They|This|We|He|She)\s/);
      if (!m) continue;
      const gapStart = list[i].end - 1;
      const gapEnd = list[i + 1].start + m[1].length;
      if (!ctx.free(gapStart, gapEnd)) continue;
      if (draw(seed, 'rh-merge', gapStart) >= 0.6) continue;
      ctx.claim(gapStart, gapEnd, `, and ${m[1].toLowerCase()}`, 'rh-merge', 'merge');
      i++;
    }
  }
}

function runSpelling(ctx, blocks) {
  const { text } = ctx;
  const map = SPELLING[ctx.options.variant];
  if (!map) return;
  const re = /[A-Za-z]+/g;
  for (const b of blocks) {
    re.lastIndex = b.start;
    let m;
    while ((m = re.exec(text)) && m.index < b.end) {
      const target = map.get(m[0].toLowerCase());
      if (!target || target === m[0].toLowerCase()) continue;
      const end = m.index + m[0].length;
      // A capitalized word at a sentence start is masked only if it looks like a name.
      if (!ctx.free(m.index, end)) continue;
      ctx.claim(m.index, end, matchCase(m[0], target), 'sp-variant', 'spelling');
    }
  }
}

// --- Pipeline -------------------------------------------------------------------

export function humanize(text, settings = {}) {
  const { tone = 'natural', strength = 'balanced', variant = 'us', seed = 1, extraRules } = settings;
  const profile = STRENGTHS[strength] || STRENGTHS.balanced;
  const toneProfile = TONES[tone] || TONES.natural;
  const started = Date.now();

  const mask = new Uint8Array(text.length);
  const blocks = splitBlocks(text, mask);
  protectSpans(text, mask, blocks);

  const cache = new Map();
  const sentencesOf = (b) => {
    if (!cache.has(b.start)) cache.set(b.start, splitSentences(text, b.start, b.end));
    return cache.get(b.start);
  };
  const ctx = makeContext(text, mask, seed, { tone: toneProfile, variant });

  // Test hook: deliberately broken rules prove that stage 8 reverts them.
  if (extraRules) runRules(ctx, extraRules.map((r) => ({ ...r })), blocks, sentencesOf, 1, 'stock');

  runOpeners(ctx, blocks, sentencesOf);
  runRules(ctx, SORTED.stock, blocks, sentencesOf, profile.stock, 'stock');
  if (profile.plain) runRules(ctx, SORTED.plain, blocks, sentencesOf, profile.plain, 'plain');
  if (profile.adjectives) runRules(ctx, SORTED.adjectives, blocks, sentencesOf, profile.adjectives, 'adjective');

  if (toneProfile.formal) {
    if (strength !== 'light') runExpansions(ctx, blocks);
  } else if (profile.contractions) {
    runContractions(ctx, blocks, profile.contractions * toneProfile.contraction);
  }
  if (profile.dashes) runDashes(ctx, blocks, sentencesOf);

  if (profile.reorder) runReorder(ctx, blocks, sentencesOf, profile.reorder);
  if (profile.rhythm) {
    runSplits(ctx, blocks, sentencesOf);
    runMerges(ctx, blocks, sentencesOf);
  }
  runSpelling(ctx, blocks);

  const { edits, reverted } = validateAndRevert(text, ctx.edits, blocks);
  edits.sort((a, b) => a.start - b.start);
  edits.forEach((e, i) => (e.id = i));

  return {
    output: applyEdits(text, edits),
    edits,
    reverted,
    seed,
    lexiconVersion: LEXICON_VERSION,
    words: countWords(text),
    ms: Date.now() - started,
  };
}
