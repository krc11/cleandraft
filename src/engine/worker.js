import { humanize } from './engine.js';

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ id: data.id, result: humanize(data.text, data.settings) });
  } catch {
    self.postMessage({ id: data.id, error: true });
  }
};
