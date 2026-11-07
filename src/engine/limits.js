// Kept apart from engine.js so the page can show the limit without loading the engine.
// The limit protects the browser, not a bill.
export const WORD_LIMIT = 10000;
export const MIN_WORDS = 5;
export const countWords = (t) => (t.match(/\S+/g) || []).length;
