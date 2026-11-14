import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { humanize, applyEdits } from '../src/engine/engine.js';
import { extractEntities } from '../src/engine/validate.js';
import { OPENER_RULES, STOCK_RULES, PLAIN_RULES, ADJECTIVES, RULE_COUNTS, LEXICON_VERSION } from '../src/engine/lexicon.js';
import { SAMPLES, ruleCase } from './samples.js';

const golden = JSON.parse(readFileSync(new URL('./golden.json', import.meta.url), 'utf8'));
const run = (text, opts = {}) => humanize(text, { seed: 1, ...opts });

test('golden: sample outputs are unchanged for this lexicon version', () => {
  assert.equal(golden.lexiconVersion, LEXICON_VERSION, 'run npm run test:golden:update after a lexicon change');
  for (const [key, expected] of Object.entries(golden.samples)) {
    const [name, tone, strength, variant] = key.split('|');
    assert.equal(run(SAMPLES[name], { tone, strength, variant }).output, expected, key);
  }
});

test('golden: every rule fires as recorded', () => {
  for (const rule of [...OPENER_RULES, ...STOCK_RULES, ...PLAIN_RULES, ...ADJECTIVES]) {
    const { seed, output } = golden.rules[rule.id];
    assert.ok(seed !== null, `${rule.id} has no firing test case`);
    const r = run(ruleCase(rule), { strength: 'strong', tone: 'natural', seed });
    assert.equal(r.output, output, rule.id);
    assert.ok(r.edits.some((e) => e.rule === rule.id.replace(/-(s|ed|ing)$/, '')), rule.id);
  }
});

test('the same seed is identical and a new seed can differ', () => {
  const text = SAMPLES.blog;
  assert.equal(run(text).output, run(text).output);
  const outputs = new Set([1, 2, 3, 4, 5, 6].map((seed) => run(text, { seed }).output));
  assert.ok(outputs.size > 1);
});

test('output always equals the input plus the edit list', () => {
  for (const text of Object.values(SAMPLES)) {
    for (const strength of ['light', 'balanced', 'strong']) {
      const r = run(text, { strength });
      assert.equal(applyEdits(text, r.edits), r.output);
      const sorted = [...r.edits].sort((a, b) => a.start - b.start);
      sorted.forEach((e, i) => assert.ok(i === 0 || sorted[i - 1].end <= e.start, 'edits overlap'));
    }
  }
});

test('reverting any one edit still gives a clean render', () => {
  const text = SAMPLES.blog;
  const r = run(text, { strength: 'strong' });
  assert.ok(r.edits.length > 3);
  const out = applyEdits(text, r.edits.slice(1));
  assert.ok(out.includes(r.edits[0].before.trim()));
});

test('numbers, URLs, quotes, citations and names survive at every setting', () => {
  const text = SAMPLES.entities;
  const expected = extractEntities(text);
  for (const strength of ['light', 'balanced', 'strong']) {
    for (const tone of ['natural', 'professional', 'formal']) {
      for (const seed of [1, 2, 3, 4, 5]) {
        const { output } = run(text, { strength, tone, seed });
        assert.deepEqual(extractEntities(output), expected);
        for (const name of ['Acme Corp', 'Priya Nair', 'https://example.com/a-wide-range-of', '"in order to utilize"', '(Smith, 2020)']) {
          assert.ok(output.includes(name), `${name} missing: ${output}`);
        }
      }
    }
  }
});

test('validation reverts deliberately broken rules and keeps good edits', () => {
  const text = 'Moreover, sales reached 42 units in 2023 and the team plans to utilize the new system in order to grow.';
  const cases = [
    { id: 'bad-number', pattern: 'units in', options: ['units in 99 of'] },
    { id: 'bad-double', pattern: 'the team', options: ['the the team'] },
    { id: 'bad-punct', pattern: 'plans', options: ['plans ,'] },
    { id: 'bad-long', pattern: 'sales', options: ['sales and also many other extremely long added words that go on and on for a very long time indeed to break the limit'] },
  ];
  // The drift rule needs 80 words, so the long case gets a longer base text.
  const long = Array(5).fill(text).join(' ');
  for (const rule of cases) {
    const r = humanize(rule.id === 'bad-long' ? long : text, { seed: 1, extraRules: [rule] });
    assert.ok(r.reverted.some((x) => x.rule === rule.id), `${rule.id} was not reverted: ${r.output}`);
    if (rule.id !== 'bad-long') assert.ok(!r.edits.some((e) => e.rule === rule.id), rule.id);
    assert.ok(r.edits.length > 0, `${rule.id} cost every good edit`);
  }
});

test('layout is preserved: headings, lists, tables and code', () => {
  const text = SAMPLES.layout;
  const r = run(text, { strength: 'strong' });
  assert.equal(r.output.split('\n').length, text.split('\n').length);
  assert.ok(r.output.includes('# Moreover, a heading in order to stay'));
  assert.ok(r.output.includes('```\nin order to utilize\n```'));
  assert.ok(r.output.includes('| in order to | utilize |'));
  assert.match(r.output, /^1\. /m);
  assert.match(r.output, /^2\. /m);
  assert.match(r.output, /^- /m);
});

test('no evasion tricks: output adds no zero-width or look-alike characters', () => {
  for (const text of Object.values(SAMPLES)) {
    const { output } = run(text, { strength: 'strong' });
    assert.doesNotMatch(output, /[​-‏⁠﻿Ѐ-ӿͰ-Ͽ]/);
  }
});

test('tone: Formal adds no contractions and expands existing ones', () => {
  const r = run('We do not know. It is clear they are here, and they do not mind. We can\'t go, and it\'s been a while.', { tone: 'formal' });
  assert.match(r.output, /do not know/);
  assert.match(r.output, /cannot go/);
  assert.match(r.output, /it has been/);
  assert.doesNotMatch(r.output, /n't/);
});

test('tone: Professional uses fewer contractions than Natural', () => {
  const text = Array(40).fill('We do not know why they do not agree, and they are not sure.').join(' ');
  const count = (tone) => run(text, { tone }).edits.filter((e) => e.category === 'contraction').length;
  assert.ok(count('professional') < count('natural'));
});

test('contraction guards', () => {
  const out = (t) => run(t, { strength: 'strong', seed: 3 }).output;
  assert.doesNotMatch(out('That is what it is.'), /it's\./);
  assert.match(out('We know how good it is at this job today.'), /it is at/);
  assert.match(out('We have to go there now.'), /We have to/);
  assert.match(out('It is not only fast, but also cheap.'), /is not only/);
});

test('articles agree after a swap', () => {
  const out = run('This is an innovative approach to work, and we like an optimal plan here.', { strength: 'strong', seed: 2 }).output;
  assert.doesNotMatch(out, /\ban (fresh|creative|best)\b.*\ban (fresh|best)\b/);
  assert.doesNotMatch(run('This is an innovative approach today.', { strength: 'strong', seed: 2 }).output, /\ban fresh\b/);
  assert.doesNotMatch(run('Users can obtain many benefits now.', { seed: 1 }).output, /\bca get\b/);
});

test('removed phrases leave a capitalized sentence', () => {
  assert.equal(run('It is important to note that the plan works well.', { strength: 'light' }).output, 'The plan works well.');
  assert.equal(run('Indeed, the plan works well for us.', { strength: 'light' }).output, 'The plan works well for us.');
});

test('rhythm rules fire at Strong across seeds', () => {
  const seeds = Array.from({ length: 12 }, (_, i) => i + 1);
  const categories = (text) => new Set(seeds.flatMap((seed) => run(text, { strength: 'strong', seed }).edits.map((e) => e.category)));
  assert.ok(categories('In the first quarter, the team shipped the new product line.').has('reorder'));
  assert.ok(categories('The new policy changed the way that our team plans each project every single quarter, and the managers now review all of the results much more often than before.').has('split'));
  assert.ok(categories('The tool works well here. It saves a lot of time.').has('merge'));
});

test('English variant spelling', () => {
  const text = 'The color of the center helps us organize the program for our neighbors.';
  assert.match(run(text, { variant: 'uk' }).output, /colour of the centre helps us organise/);
  assert.match(run(text, { variant: 'au' }).output, /neighbours/);
  assert.match(run(text, { variant: 'ca' }).output, /colour of the centre helps us organize/);
  assert.equal(run('The colour of the centre helps us every day.', { variant: 'us' }).output, 'The color of the center helps us every day.');
});

test('short and empty text does not throw', () => {
  for (const t of ['', '   ', 'Hi', '\n\n', '...', '— —']) assert.equal(typeof run(t).output, 'string');
});

test('2,000 words runs well under one second', () => {
  const text = Array(20).fill(SAMPLES.blog).join('\n\n');
  const words = text.split(/\s+/).length;
  assert.ok(words >= 2000, `only ${words} words`);
  const t0 = performance.now();
  run(text.split(/\s+/).slice(0, 2000).join(' '));
  assert.ok(performance.now() - t0 < 1000);
});

test('lexicon counts', () => {
  assert.equal(RULE_COUNTS.openers, 18);
  assert.equal(RULE_COUNTS.adjectives, 26);
  assert.ok(RULE_COUNTS.stock >= 84);
  assert.ok(RULE_COUNTS.plain >= 73);
});

test('document length stays within 15%, and short dense drafts keep their filler removals', () => {
  const dense = 'Moreover, it is important to note that regular feedback plays a crucial role in team performance.';
  assert.ok(run(dense, { strength: 'light' }).edits.length >= 2);
  const long = Array(10).fill(dense).join(' ');
  const wc = (t) => t.split(/\s+/).length;
  const r = run(long, { strength: 'strong' });
  assert.ok(Math.abs(wc(r.output) - wc(long)) / wc(long) <= 0.15, r.output);
});

test('contractions keep sentence case', () => {
  const seeds = Array.from({ length: 10 }, (_, i) => i + 1);
  for (const seed of seeds) {
    const out = run('I am writing to you today. We know that i am late and it is fine.', { seed }).output;
    assert.doesNotMatch(out, /I'M|IT'S/);
  }
  assert.ok(seeds.some((seed) => run('I am writing to you today about the plan.', { seed }).output.startsWith("I'm writing")));
});

test('Canadian spelling follows US usage for math, aluminum, aging and fulfill', () => {
  const text = 'The aluminium frame and the maths of ageing help us fulfil the plan for the colour centre.';
  assert.match(run(text, { variant: 'ca' }).output, /aluminum frame and the math of aging help us fulfill the plan for the colour centre/);
  assert.match(run('The aluminum frame and the math of aging help us fulfill the plan.', { variant: 'au' }).output, /aluminium frame and the maths of ageing help us fulfil/);
});
