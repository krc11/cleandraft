// Records current outputs as the golden file. Read the diff before committing it.
import { writeFileSync } from 'node:fs';
import { humanize } from '../src/engine/engine.js';
import { OPENER_RULES, STOCK_RULES, PLAIN_RULES, ADJECTIVES, LEXICON_VERSION } from '../src/engine/lexicon.js';
import { SAMPLES, ruleCase, firingSeed } from './samples.js';

const samples = {};
for (const name of Object.keys(SAMPLES)) {
  for (const tone of ['natural', 'professional', 'formal']) {
    for (const strength of ['light', 'balanced', 'strong']) {
      for (const variant of ['us', 'uk']) {
        samples[`${name}|${tone}|${strength}|${variant}`] = humanize(SAMPLES[name], { tone, strength, variant, seed: 1 }).output;
      }
    }
  }
}
const rules = {};
const silent = [];
for (const rule of [...OPENER_RULES, ...STOCK_RULES, ...PLAIN_RULES, ...ADJECTIVES]) {
  const seed = firingSeed(humanize, rule, rule.id.replace(/-(s|ed|ing)$/, ''));
  if (seed === null) silent.push(`${rule.id}: ${ruleCase(rule)}`);
  rules[rule.id] = { seed, output: humanize(ruleCase(rule), { strength: 'strong', tone: 'natural', seed: seed ?? 1 }).output };
}
writeFileSync(new URL('./golden.json', import.meta.url), `${JSON.stringify({ lexiconVersion: LEXICON_VERSION, samples, rules }, null, 1)}\n`);
console.log(`${Object.keys(samples).length} samples, ${Object.keys(rules).length} rules`);
if (silent.length) console.log(`Rules that did not fire on their test case (${silent.length}):\n${silent.join('\n')}`);
