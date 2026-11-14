import { WORD_LIMIT, MIN_WORDS, countWords } from '../engine/limits.js';
import { applyEdits, renderParts } from '../engine/render.js';
import { track } from './analytics.js';

const $ = (id) => document.getElementById(id);
const el = {
  input: $('cd-input'), paste: $('cd-paste'), count: $('cd-count'), tone: $('cd-tone'), strength: $('cd-strength'), variant: $('cd-variant'),
  run: $('cd-run'), cancel: $('cd-cancel'), msg: $('cd-msg'), output: $('cd-output'), diff: $('cd-diff'), toggle: $('cd-toggle'),
  copy: $('cd-copy'), download: $('cd-download'), regen: $('cd-regen'), undo: $('cd-undo'), log: $('cd-log'), logTitle: $('cd-log-title'), logList: $('cd-log-list'),
};

// source: the input this result was made from. manual: the visitor typed in the output,
// so the edit list no longer describes it.
let state = null;
const undoStack = [];
let showChanges = false;
let worker = null;
let requestId = 0;
let pending = null;

const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
};

function setMessage(text, kind = '') {
  el.msg.textContent = text;
  el.msg.className = kind ? `msg ${kind}` : 'msg';
}

function guessVariant() {
  const lang = (navigator.language || 'en-US').toLowerCase();
  if (lang.endsWith('-gb') || lang.endsWith('-ie') || lang.endsWith('-nz')) return 'uk';
  if (lang.endsWith('-ca')) return 'ca';
  if (lang.endsWith('-au')) return 'au';
  return 'us';
}

function updateCount() {
  const words = countWords(el.input.value);
  const over = words > WORD_LIMIT;
  el.count.textContent = `${words.toLocaleString('en-US')} / ${WORD_LIMIT.toLocaleString('en-US')} words`;
  el.count.classList.toggle('over', over);
  el.run.disabled = over;
  if (over) setMessage(`That is over the ${WORD_LIMIT.toLocaleString('en-US')}-word limit. Shorten the text or split it into parts. Nothing has been cut.`, 'error');
  else if (el.msg.classList.contains('error')) setMessage('');
}

// --- Running the engine -------------------------------------------------------

function getWorker() {
  if (worker || typeof Worker === 'undefined') return worker;
  try {
    worker = new Worker(new URL('../engine/worker.js', import.meta.url), { type: 'module' });
  } catch {
    worker = null;
  }
  return worker;
}

function runEngine(text, settings) {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    if (!w) {
      // Main-thread fallback for browsers without module workers.
      import('../engine/engine.js').then((m) => resolve(m.humanize(text, settings))).catch(reject);
      return;
    }
    const id = ++requestId;
    pending = { reject };
    w.onmessage = ({ data }) => {
      if (data.id !== id) return;
      pending = null;
      if (data.error) reject(new Error('engine'));
      else resolve(data.result);
    };
    w.onerror = () => {
      pending = null;
      worker = null;
      reject(new Error('engine'));
    };
    w.postMessage({ id, text, settings });
  });
}

function settings(seed) {
  return { tone: el.tone.value, strength: el.strength.value, variant: el.variant.value, seed };
}

async function run(seed, event) {
  const text = el.input.value;
  const words = countWords(text);
  if (words < MIN_WORDS) {
    setMessage(`Add at least ${MIN_WORDS} words so there is something to edit. A full sentence or two works best.`, 'error');
    return;
  }
  if (words > WORD_LIMIT) return;

  el.run.disabled = true;
  el.run.textContent = 'Working…';
  const showCancel = setTimeout(() => (el.cancel.hidden = false), 400);
  try {
    const result = await runEngine(text, settings(seed));
    if (state) undoStack.push(state);
    state = { source: text, edits: result.edits, seed, manual: false, text: result.output };
    render();
    const n = result.edits.length;
    setMessage(n ? `Done. ${n} ${n === 1 ? 'edit' : 'edits'} made.` : 'No changes needed at this strength.', 'success');
    track(event, { words, tone: el.tone.value, strength: el.strength.value, variant: el.variant.value, edits: n, ms: result.ms });
  } catch (err) {
    if (err.message !== 'cancelled') {
      setMessage('Something went wrong and the edit did not finish. Your text is safe. Press Humanize to try again.', 'error');
      track('error');
    }
  } finally {
    clearTimeout(showCancel);
    el.cancel.hidden = true;
    el.run.textContent = 'Humanize';
    updateCount();
  }
}

// --- Rendering ------------------------------------------------------------------

function renderDiff() {
  el.diff.textContent = '';
  if (!state) return;
  const frag = document.createDocumentFragment();
  for (const part of renderParts(state.source, state.edits)) {
    if (part.kind === 'same') {
      frag.append(part.text);
    } else {
      const node = document.createElement(part.kind === 'add' ? 'ins' : 'del');
      node.textContent = part.text;
      frag.append(node);
    }
  }
  el.diff.append(frag);
}

function renderLog() {
  el.logList.textContent = '';
  if (!state || !state.edits.length) {
    el.log.hidden = true;
    return;
  }
  el.log.hidden = false;
  const n = state.edits.length;
  el.logTitle.textContent = `Edit log (${n} ${n === 1 ? 'edit' : 'edits'})`;
  const frag = document.createDocumentFragment();
  [...state.edits].sort((a, b) => a.start - b.start).forEach((edit) => {
    const li = document.createElement('li');
    const change = document.createElement('div');
    change.className = 'change';
    const del = document.createElement('del');
    del.textContent = edit.before.trim() || '(nothing)';
    const ins = document.createElement('ins');
    ins.textContent = edit.after.trim() || '(removed)';
    change.append(del, ' → ', ins);
    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = edit.reason;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'This edit is wrong';
    button.disabled = state.manual;
    button.addEventListener('click', () => revertEdit(edit));
    li.append(change, why, button);
    frag.append(li);
  });
  el.logList.append(frag);
}

function render() {
  el.output.value = state ? state.text : '';
  const has = Boolean(state);
  el.copy.disabled = !has;
  el.download.disabled = !has;
  el.regen.disabled = !has;
  el.toggle.disabled = !has;
  el.undo.disabled = undoStack.length === 0;
  applyView();
  renderLog();
}

function applyView() {
  el.toggle.setAttribute('aria-pressed', String(showChanges));
  el.toggle.textContent = showChanges ? 'Hide changes' : 'Show changes';
  el.output.hidden = showChanges;
  el.diff.hidden = !showChanges;
  if (showChanges) renderDiff();
}

// --- Actions ----------------------------------------------------------------------

function revertEdit(edit) {
  undoStack.push(state);
  const edits = state.edits.filter((e) => e !== edit);
  state = { ...state, edits, text: applyEdits(state.source, edits) };
  render();
  setMessage('Edit reverted. Thanks for the feedback.', 'success');
  track('bad_edit', { rule: edit.rule });
}

el.input.addEventListener('focus', getWorker, { once: true });
el.input.addEventListener('input', updateCount);
el.input.addEventListener('paste', () => track('paste'));

el.paste.addEventListener('click', async () => {
  getWorker();
  try {
    el.input.value = await navigator.clipboard.readText();
    updateCount();
    track('paste');
  } catch {
    setMessage('Your browser blocked the Paste button. Tap the box and paste there instead.');
    el.input.focus();
  }
});

el.run.addEventListener('click', () => run(1, 'run'));
el.regen.addEventListener('click', () => {
  // Input could have changed since the last run; a new seed gives an alternative edit.
  run(Math.floor(Math.random() * 2147483647) + 2, 'regenerate');
});

el.cancel.addEventListener('click', () => {
  if (worker) worker.terminate();
  worker = null;
  if (pending) pending.reject(new Error('cancelled'));
  pending = null;
  setMessage('Cancelled. Your text has not changed.');
});

el.undo.addEventListener('click', () => {
  if (!undoStack.length) return;
  state = undoStack.pop();
  render();
  setMessage('Restored the previous version.');
});

el.output.addEventListener('input', () => {
  if (!state) return;
  if (!state.manual) undoStack.push(state);
  state = { ...state, manual: true, text: el.output.value };
  el.undo.disabled = false;
  renderLog();
  setMessage('Your own changes are kept in the text. The change view and log show only the edits made by the tool.');
});

el.toggle.addEventListener('click', () => {
  showChanges = !showChanges;
  applyView();
  track('change_view', { on: showChanges });
});

el.copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(state.text);
    setMessage('Copied to your clipboard.', 'success');
    track('copy');
  } catch {
    showChanges = false;
    applyView();
    el.output.select();
    setMessage('Your browser blocked copying. The text is selected, so press Ctrl+C or Cmd+C.');
  }
});

el.download.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([state.text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cleandraft-edited.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

for (const [key, control] of [['tone', el.tone], ['strength', el.strength], ['variant', el.variant]]) {
  // A country page sets its own spelling, which wins over a saved choice or the locale.
  const preset = key === 'variant' && $('cd-tool').dataset.variant;
  if (preset) {
    control.value = preset;
    continue;
  }
  const saved = store.get(`cd-${key}`);
  if (saved && [...control.options].some((o) => o.value === saved)) control.value = saved;
  else if (key === 'variant') control.value = guessVariant();
  control.addEventListener('change', () => store.set(`cd-${key}`, control.value));
}

updateCount();
