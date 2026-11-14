// CleanDraft lexicon. Bump LEXICON_VERSION on any rule change: output is
// reproducible from text, settings, seed and lexicon version.
export const LEXICON_VERSION = '1.0.3';

// Options: '' removes the phrase. A leading '~' marks an option Formal skips.
// `when` is an optional guard, called with { before, after } (the surrounding text).

const isVerbContext = ({ before }) =>
  /\b(to|can|could|will|would|should|must|may|might|we|they|you|i|teams|companies|and|or|not|also|often|that|who)\s+$/i.test(before);
const isNounContext = ({ before }) =>
  /\b(the|a|an|our|your|their|its|my|this|that|these|those|main|primary|key)\s+$/i.test(before);
const followedByTo = ({ after }) => /^\s+\w+(\s+\w+)?\s+to\b/i.test(after);
const notStatistical = ({ before }) => !/\b(statistically|not)\s+$/i.test(before);

// --- Stage 2: openers. Matched only at the start of a sentence.
export const OPENERS = [
  ['op-moreover', 'Moreover', ['', 'Also']],
  ['op-furthermore', 'Furthermore', ['', 'Also']],
  ['op-additionally', 'Additionally', ['', 'Also']],
  ['op-in-addition', 'In addition', ['', 'Also']],
  ['op-consequently', 'Consequently', ['So', 'As a result']],
  ['op-therefore', 'Therefore', ['So']],
  ['op-thus', 'Thus', ['So']],
  ['op-hence', 'Hence', ['So']],
  ['op-nevertheless', 'Nevertheless', ['Still', 'Even so']],
  ['op-nonetheless', 'Nonetheless', ['Still', 'Even so']],
  ['op-however', 'However', ['~But', 'Still']],
  ['op-subsequently', 'Subsequently', ['Then', 'Later']],
  ['op-accordingly', 'Accordingly', ['So']],
  ['op-indeed', 'Indeed', ['']],
  ['op-notably', 'Notably', ['']],
  ['op-importantly', 'Importantly', ['']],
  ['op-in-conclusion', 'In conclusion', ['', 'Overall']],
  ['op-in-summary', 'In summary', ['', 'Overall']],
];

// --- Stage 3: stock phrases.
export const STOCK = [
  ['st-important-note', 'it is important to note that', ['']],
  ['st-worth-noting', 'it is worth noting that', ['']],
  ['st-should-noted', 'it should be noted that', ['']],
  ['st-goes-without', 'it goes without saying that', ['']],
  ['st-needless', 'needless to say', ['']],
  ['st-can-be-seen', 'it can be seen that', ['']],
  ['st-no-doubt', 'there is no doubt that', ['']],
  ['st-remember', 'it is important to remember that', ['remember that', 'keep in mind that']],
  ['st-understand', 'it is important to understand that', ['keep in mind that']],
  ['st-today-fast', "in today's fast-paced world", ['today', 'these days']],
  ['st-today-digital', "in today's digital age", ['today', 'these days']],
  ['st-today-world', "in today's world", ['today', 'these days']],
  ['st-ever-evolving-landscape', 'in the ever-evolving landscape of', ['in']],
  ['st-landscape', 'in the landscape of', ['in']],
  ['st-realm', 'in the realm of', ['in']],
  ['st-context-of', 'in the context of', ['in']],
  ['st-crucial-role', 'plays a crucial role in', ['is key to', 'matters for']],
  ['st-crucial-role-pl', 'play a crucial role in', ['are key to', 'matter for']],
  ['st-vital-role', 'plays a vital role in', ['is key to', 'matters for']],
  ['st-vital-role-pl', 'play a vital role in', ['are key to', 'matter for']],
  ['st-pivotal-role', 'plays a pivotal role in', ['is central to', 'is key to']],
  ['st-pivotal-role-pl', 'play a pivotal role in', ['are central to', 'are key to']],
  ['st-testament', 'a testament to', ['proof of', 'a sign of']],
  ['st-delve-into', 'delve into', ['look at', 'dig into']],
  ['st-delves-into', 'delves into', ['looks at', 'digs into']],
  ['st-delving-into', 'delving into', ['looking at', 'digging into']],
  ['st-dive-into', 'dive into', ['look at', 'get into']],
  ['st-dive-deep', 'dive deep into', ['look closely at']],
  ['st-navigate-complexities', 'navigate the complexities of', ['deal with', 'work through']],
  ['st-end-of-day', 'at the end of the day', ['in the end', 'ultimately']],
  ['st-when-comes', 'when it comes to', ['for', 'with']],
  ['st-wide-range', 'a wide range of', ['many', 'all kinds of']],
  ['st-wide-array', 'a wide array of', ['many', 'all kinds of']],
  ['st-broad-range', 'a broad range of', ['many']],
  ['st-diverse-range', 'a diverse range of', ['many', 'all kinds of']],
  ['st-variety', 'a variety of', ['many', 'several']],
  ['st-plethora', 'a plethora of', ['many', 'plenty of']],
  ['st-myriad', 'a myriad of', ['many', 'countless']],
  ['st-due-fact', 'due to the fact that', ['because']],
  ['st-in-order', 'in order to', ['to']],
  ['st-purpose-of', 'for the purpose of', ['for']],
  ['st-regard', 'with regard to', ['about', 'on']],
  ['st-respect', 'with respect to', ['about', 'on']],
  ['st-event-that', 'in the event that', ['if']],
  ['st-light-of', 'in light of', ['given']],
  ['st-first-foremost', 'first and foremost', ['first']],
  ['st-last-least', 'last but not least', ['finally', 'lastly']],
  ['st-each-every', 'each and every', ['every']],
  ['st-ability-has', 'has the ability to', ['can']],
  ['st-ability-have', 'have the ability to', ['can']],
  ['st-is-able', 'is able to', ['can']],
  ['st-are-able', 'are able to', ['can']],
  ['st-point-in-time', 'at this point in time', ['now', 'right now']],
  ['st-near-future', 'in the near future', ['soon']],
  ['st-large-number', 'a large number of', ['many']],
  ['st-significant-number', 'a significant number of', ['many']],
  ['st-vast-majority', 'the vast majority of', ['most']],
  ['st-despite-fact', 'despite the fact that', ['although', 'even though']],
  ['st-spite-fact', 'in spite of the fact that', ['although', 'even though']],
  ['st-daily-basis', 'on a daily basis', ['daily', 'every day']],
  ['st-regular-basis', 'on a regular basis', ['regularly']],
  ['st-timely', 'in a timely manner', ['on time', 'promptly']],
  ['st-serves-as-a', 'serves as a', ['is a', 'works as a']],
  ['st-serves-as-an', 'serves as an', ['is an', 'works as an']],
  ['st-sense-of', 'foster a sense of', ['build', 'encourage']],
  ['st-full-potential', 'unlock the full potential of', ['get the most from', 'make the most of']],
  ['st-unlock-potential', 'unlock the potential of', ['get more from', 'make more of']],
  ['st-next-level', 'take it to the next level', ['improve it', 'make it better']],
  ['st-harness-power', 'harness the power of', ['use', 'make use of']],
  ['st-leverage-power', 'leverage the power of', ['use', 'make use of']],
  ['st-game-changer', 'a game changer', ['a big change', 'a major shift']],
  ['st-pave-way', 'pave the way for', ['lead to', 'open the door to']],
  ['st-paves-way', 'paves the way for', ['leads to', 'opens the door to']],
  ['st-shed-light', 'shed light on', ['explain', 'help explain']],
  ['st-sheds-light', 'sheds light on', ['explains', 'helps explain']],
  ['st-tapestry', 'rich tapestry of', ['mix of', 'blend of']],
  ['st-as-previously', 'as previously mentioned', ['as noted', 'as noted earlier']],
  ['st-as-earlier', 'as mentioned earlier', ['as noted', 'as noted earlier']],
  ['st-simply', 'to put it simply', ['simply put', 'in short']],
  ['st-integral', 'an integral part of', ['a key part of', 'a core part of']],
  ['st-key-aspect', 'a key aspect of', ['a key part of', 'a main part of']],
  ['st-crucial-aspect', 'a crucial aspect of', ['a key part of', 'an important part of']],
  ['st-deeper', 'a deeper understanding of', ['a better grasp of', 'a clearer view of']],
  ['st-informed', 'make informed decisions', ['make better decisions', 'decide with more confidence']],
  ['st-curve', 'stay ahead of the curve', ['stay ahead', 'keep ahead']],
  ['st-hesitate', 'please do not hesitate to', ['please']],
  ['st-hesitate-c', "please don't hesitate to", ['please']],
  ['st-reach-out', 'reach out to', ['contact', '~get in touch with']],
  ['st-email-well', 'i hope this email finds you well', ['~i hope you are well']],
];

// Regular inflections for `v(id, 'utilize', 'use')`. Pass [s, ed, ing] for irregular targets.
const DOUBLED = { concur: ['concurs', 'concurred', 'concurring'], transmit: ['transmits', 'transmitted', 'transmitting'] };
const inflect = (w) => {
  if (DOUBLED[w]) return DOUBLED[w];
  const ed = w.endsWith('e') ? `${w}d` : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ied` : `${w}ed`;
  const ing = w.endsWith('e') ? `${w.slice(0, -1)}ing` : `${w}ing`;
  const s = /(s|sh|ch|x|z)$/.test(w) ? `${w}es` : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`;
  return [s, ed, ing];
};
// A multi-word target inflects its first word: 'speed up' -> 'speeds up'.
const inflectTarget = (t, forms) => {
  const [head, ...rest] = t.split(' ');
  const tail = rest.length ? ` ${rest.join(' ')}` : '';
  return (forms || inflect(head)).map((f) => f + tail);
};
const v = (id, word, targets, when, irregular) => {
  const src = [word, ...inflect(word)];
  const opts = (Array.isArray(targets) ? targets : [targets]).map((t) => {
    const tForms = irregular && irregular[t];
    return [t, ...inflectTarget(t, tForms)];
  });
  const suffix = ['', '-s', '-ed', '-ing'];
  return src.map((form, i) => [`${id}${suffix[i]}`, form, opts.map((o) => o[i]), when]);
};

const GET = { get: ['gets', 'got', 'getting'] };
const HAVE = { have: ['has', 'had', 'having'] };
const START = { start: ['starts', 'started', 'starting'] };
const SHOW = { show: ['shows', 'showed', 'showing'] };
const SPEED_UP = { 'speed up': ['speeds', 'sped', 'speeding'] };

// --- Stage 4: plain-language swaps (Balanced and up). Each v() is one rule in the
// count below; its inflected forms share a base id so feedback can be grouped.
export const PLAIN_GROUPS = [
  v('pl-utilize', 'utilize', 'use'),
  v('pl-utilise', 'utilise', 'use'),
  v('pl-leverage', 'leverage', ['use', 'draw on'], isVerbContext, { 'draw on': ['draws', 'drew', 'drawing'] }),
  v('pl-facilitate', 'facilitate', 'help'),
  v('pl-commence', 'commence', 'start', undefined, START),
  v('pl-terminate', 'terminate', 'end'),
  v('pl-endeavor', 'endeavor', 'try', isVerbContext, { try: ['tries', 'tried', 'trying'] }),
  v('pl-ascertain', 'ascertain', 'find out', undefined, { 'find out': ['finds', 'found', 'finding'] }),
  v('pl-demonstrate', 'demonstrate', 'show', undefined, SHOW),
  v('pl-possess', 'possess', 'have', undefined, HAVE),
  v('pl-obtain', 'obtain', 'get', undefined, GET),
  v('pl-acquire', 'acquire', 'get', ({ after }) => !/^\s+(a|an|the)?\s*[A-Z]/.test(after), GET),
  v('pl-purchase', 'purchase', 'buy', isVerbContext, { buy: ['buys', 'bought', 'buying'] }),
  v('pl-assist', 'assist', 'help', isVerbContext),
  v('pl-enhance', 'enhance', 'improve'),
  v('pl-bolster', 'bolster', ['strengthen', 'support']),
  v('pl-underscore', 'underscore', ['highlight', 'stress'], isVerbContext),
  v('pl-showcase', 'showcase', ['show', 'highlight'], isVerbContext, SHOW),
  v('pl-elucidate', 'elucidate', 'explain'),
  v('pl-ameliorate', 'ameliorate', 'improve'),
  v('pl-mitigate', 'mitigate', ['reduce', 'limit']),
  v('pl-encompass', 'encompass', ['include', 'cover']),
  v('pl-exemplify', 'exemplify', 'show', undefined, SHOW),
  v('pl-garner', 'garner', ['earn', 'attract']),
  v('pl-necessitate', 'necessitate', 'require'),
  v('pl-expedite', 'expedite', 'speed up', undefined, SPEED_UP),
  v('pl-initiate', 'initiate', 'start', undefined, START),
  v('pl-modify', 'modify', 'change'),
  v('pl-foster', 'foster', ['build', 'encourage'], undefined, { build: ['builds', 'built', 'building'] }),
  v('pl-streamline', 'streamline', 'simplify', undefined, { simplify: ['simplifies', 'simplified', 'simplifying'] }),
  v('pl-elevate', 'elevate', ['raise', 'lift']),
  v('pl-spearhead', 'spearhead', 'lead', undefined, { lead: ['leads', 'led', 'leading'] }),
  v('pl-revolutionize', 'revolutionize', ['transform', 'change']),
  v('pl-illustrate', 'illustrate', 'show', undefined, SHOW),
  v('pl-adhere', 'adhere', 'stick', ({ after }) => /^\s+to\b/i.test(after), { stick: ['sticks', 'stuck', 'sticking'] }),
  v('pl-attain', 'attain', 'reach'),
  v('pl-transmit', 'transmit', 'send', undefined, { send: ['sends', 'sent', 'sending'] }),
  v('pl-reside', 'reside', 'live'),
  v('pl-inquire', 'inquire', 'ask'),
  v('pl-concur', 'concur', 'agree', undefined, { agree: ['agrees', 'agreed', 'agreeing'] }),
  v('pl-alleviate', 'alleviate', ['ease', 'relieve']),
  v('pl-enable', 'enable', 'help', followedByTo),
  v('pl-ensure', 'ensure', 'make sure', ({ after }) => /^\s+(that|the|your|our|their|you|we|they|it|all|each|every)\b/i.test(after), {
    'make sure': ['makes', 'made', 'making'],
  }),
  ...[
    ['pl-prior-to', 'prior to', ['before']],
    ['pl-subsequent-to', 'subsequent to', ['after']],
    ['pl-pertaining', 'pertaining to', ['about']],
    ['pl-accordance', 'in accordance with', ['following', 'under']],
    ['pl-exception', 'with the exception of', ['except for']],
    ['pl-majority', 'a majority of', ['most']],
    ['pl-at-present', 'at present', ['now', 'currently']],
    ['pl-sufficient', 'sufficient', ['enough']],
    ['pl-numerous', 'numerous', ['many']],
    ['pl-approximately', 'approximately', ['about', 'roughly']],
    ['pl-regarding', 'regarding', ['about', 'on']],
    ['pl-individuals', 'individuals', ['people']],
    ['pl-utilization', 'utilization', ['use']],
    ['pl-methodology', 'methodology', ['method', 'approach']],
    ['pl-assistance', 'assistance', ['help']],
    ['pl-remainder', 'remainder', ['rest']],
    ['pl-ramifications', 'ramifications', ['effects', 'consequences']],
    ['pl-subsequently', 'subsequently', ['later', 'then']],
    ['pl-primarily', 'primarily', ['mainly']],
    ['pl-predominantly', 'predominantly', ['mainly', 'mostly']],
    ['pl-frequently', 'frequently', ['often']],
    ['pl-whilst', 'whilst', ['while']],
    ['pl-amongst', 'amongst', ['among']],
    ['pl-aforementioned', 'aforementioned', ['earlier']],
    ['pl-meticulously', 'meticulously', ['carefully']],
    ['pl-seamlessly', 'seamlessly', ['smoothly']],
    ['pl-substantially', 'substantially', ['greatly', 'considerably']],
    ['pl-inception', 'inception', ['start']],
    ['pl-cognizant', 'cognizant of', ['aware of']],
    ['pl-advantageous', 'advantageous', ['helpful', 'useful']],
    ['pl-beneficial', 'beneficial', ['helpful', 'useful']],
    ['pl-erroneous', 'erroneous', ['wrong', 'incorrect']],
    ['pl-prevalent', 'prevalent', ['common', 'widespread']],
    ['pl-ubiquitous', 'ubiquitous', ['common', 'widespread']],
    ['pl-equitable', 'equitable', ['fair']],
  ].map((r) => [r]),
  [['pl-objective', 'objective', ['goal', 'aim'], isNounContext], ['pl-objective-s', 'objectives', ['goals', 'aims'], isNounContext]],
].map((group) => group.map(([id, pattern, options, when]) => ({ id, pattern, options, when })));

// --- Stage 4: adjective swaps (Strong only). These caused most awkward edits in the
// prototype, so `the/a + adjective + noun` shape is required by the shared guard below.
const attributive = ({ before, after }) =>
  /\b(a|an|the|this|that|these|those|our|your|their|its|very|more|most|is|are|was|were)\s+$/i.test(before) && /^\s+[a-z]/.test(after);
export const ADJECTIVES = [
  ['ad-crucial', 'crucial', ['key', 'important']],
  ['ad-pivotal', 'pivotal', ['key', 'central']],
  ['ad-vital', 'vital', ['important', 'key']],
  ['ad-robust', 'robust', ['strong', 'solid']],
  ['ad-comprehensive', 'comprehensive', ['full', 'thorough']],
  ['ad-innovative', 'innovative', ['new', 'creative']],
  ['ad-cutting-edge', 'cutting-edge', ['modern', 'latest']],
  ['ad-groundbreaking', 'groundbreaking', ['new', 'pioneering']],
  ['ad-transformative', 'transformative', ['major', 'far-reaching']],
  ['ad-seamless', 'seamless', ['smooth']],
  ['ad-meticulous', 'meticulous', ['careful', 'thorough']],
  ['ad-multifaceted', 'multifaceted', ['complex', 'many-sided']],
  ['ad-intricate', 'intricate', ['complex', 'detailed']],
  ['ad-holistic', 'holistic', ['complete', 'whole-picture']],
  ['ad-nuanced', 'nuanced', ['subtle', 'careful']],
  ['ad-profound', 'profound', ['deep', 'lasting']],
  ['ad-unparalleled', 'unparalleled', ['unmatched']],
  ['ad-compelling', 'compelling', ['strong', 'convincing']],
  ['ad-invaluable', 'invaluable', ['very useful', 'highly useful']],
  ['ad-vibrant', 'vibrant', ['lively']],
  ['ad-significant', 'significant', ['big', 'major'], notStatistical],
  ['ad-substantial', 'substantial', ['large', 'sizable']],
  ['ad-optimal', 'optimal', ['best']],
  ['ad-game-changing', 'game-changing', ['major']],
  ['ad-state-of-art', 'state-of-the-art', ['modern', 'latest']],
  ['ad-sophisticated', 'sophisticated', ['advanced']],
].map(([id, pattern, options, when]) => ({
  id,
  pattern,
  options,
  when: when ? (c) => when(c) && attributive(c) : attributive,
}));

const toRule = ([id, pattern, options, when]) => ({ id, pattern, options, when });
export const OPENER_RULES = OPENERS.map(toRule);
export const STOCK_RULES = STOCK.map(toRule);
export const PLAIN_RULES = PLAIN_GROUPS.flat();

// Rule counts by category (an inflected verb counts as one rule).
export const RULE_COUNTS = {
  openers: OPENER_RULES.length,
  stock: STOCK_RULES.length,
  plain: PLAIN_GROUPS.length,
  adjectives: ADJECTIVES.length,
};

export const REASONS = {
  opener: 'Removed or simplified a filler transition',
  stock: 'Replaced a stock phrase common in AI drafts',
  plain: 'Swapped for a plainer word',
  adjective: 'Swapped an overused adjective',
  contraction: 'Added a contraction for a more natural tone',
  expansion: 'Expanded a contraction for a formal tone',
  dash: 'Replaced a dash with simpler punctuation',
  reorder: 'Moved an opening phrase to vary the sentence start',
  split: 'Split a long sentence',
  merge: 'Joined two short sentences',
  spelling: 'Matched your chosen English spelling',
};

// English variant spelling. Entries are [US, UK/AU, CA]; CA defaults to UK unless given.
const ourWords = ['color', 'flavor', 'honor', 'favor', 'neighbor', 'behavior', 'labor', 'harbor', 'humor', 'rumor', 'endeavor', 'savor', 'vigor'];
const ourSuffixes = ['', 's', 'ed', 'ing', 'ful', 'able', 'ite', 'ites', 'hood', 'al'];
const izeStems = [
  'organiz', 'recogniz', 'realiz', 'prioritiz', 'summariz', 'emphasiz', 'minimiz', 'maximiz', 'optimiz', 'customiz', 'standardiz',
  'specializ', 'finaliz', 'categoriz', 'apologiz', 'analyz', 'criticiz', 'memoriz', 'moderniz', 'personaliz', 'revolutioniz',
  'stabiliz', 'symboliz', 'visualiz', 'utiliz', 'initializ', 'authoriz', 'capitaliz', 'characteriz', 'centraliz', 'generaliz', 'mobiliz',
  'neutraliz', 'normaliz',
];
const reWords = [['center', 'centre'], ['theater', 'theatre'], ['fiber', 'fibre'], ['liter', 'litre'], ['caliber', 'calibre']];
const pairs = [
  ['defense', 'defence'], ['offense', 'offence'], ['pretense', 'pretence'], ['catalog', 'catalogue'], ['catalogs', 'catalogues'], ['dialog', 'dialogue'],
  ['traveled', 'travelled'], ['traveling', 'travelling'], ['traveler', 'traveller'], ['travelers', 'travellers'], ['canceled', 'cancelled'], ['canceling', 'cancelling'],
  ['labeled', 'labelled'], ['labeling', 'labelling'], ['modeled', 'modelled'], ['modeling', 'modelling'], ['fueled', 'fuelled'], ['fueling', 'fuelling'],
  ['signaling', 'signalling'], ['counselor', 'counsellor'], ['jewelry', 'jewellery'], ['enrollment', 'enrolment'], ['fulfill', 'fulfil', 'fulfill'], ['fulfillment', 'fulfilment', 'fulfillment'],
  ['skillful', 'skilful'], ['gray', 'grey'], ['aluminum', 'aluminium', 'aluminum'], ['mold', 'mould'], ['plow', 'plough', 'plow'], ['aging', 'ageing', 'aging'], ['math', 'maths', 'math'],
];

const buildSpelling = () => {
  const us = new Map();
  const uk = new Map();
  const ca = new Map();
  const add = (u, b, c = b) => {
    for (const w of [u, b, c]) {
      us.set(w, u);
      uk.set(w, b);
      ca.set(w, c);
    }
  };
  for (const w of ourWords) {
    const stem = w.slice(0, -2);
    for (const s of ourSuffixes) add(`${w}${s}`, `${stem}our${s}`);
  }
  for (const stem of izeStems) {
    const base = stem.slice(0, -1);
    for (const s of ['e', 'es', 'ed', 'ing', 'ation', 'ations', 'er', 'ers']) {
      if (stem === 'analyz') {
        if (s.startsWith('ation')) continue;
        add(`analyz${s}`, `analys${s}`, `analyz${s}`);
      } else {
        add(`${stem}${s}`, `${base}s${s}`, `${stem}${s}`);
      }
    }
  }
  for (const [u, b] of reWords) for (const s of ['', 's']) add(`${u}${s}`, `${b}${s}`);
  // A third entry is the Canadian form where it follows US usage, not British.
  for (const [u, b, c] of pairs) add(u, b, c);
  return { us, uk, au: uk, ca };
};
export const SPELLING = buildSpelling();
