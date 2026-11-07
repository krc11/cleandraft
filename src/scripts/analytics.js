import { SITE } from '../config.js';

// The only fields that may leave the page (FR-11). Anything else is dropped here, so a
// caller cannot send text by mistake.
const ALLOWED = ['words', 'tone', 'strength', 'variant', 'edits', 'ms', 'rule', 'on'];

export function track(event, data = {}) {
  if (!SITE.analyticsUrl) return;
  const payload = { event };
  for (const key of ALLOWED) if (key in data) payload[key] = data[key];
  try {
    navigator.sendBeacon(SITE.analyticsUrl, JSON.stringify(payload));
  } catch {
    // Analytics must never break the tool.
  }
}
