// Site-wide settings. Fill the empty values in as each service goes live.
export const SITE = {
  name: 'CleanDraft',
  url: 'https://cleandraft.online',
  contactEmail: 'hello@cleandraft.online',
  // PRD open question 3: replace with a real named editor and short bio.
  editor: 'CleanDraft editorial team',
  updated: 'November 14, 2026',
  updatedIso: '2026-11-14',
  // Proves ownership to IndexNow (Bing and others). The same key is a file in public/.
  indexNowKey: 'dbd39a7325b285a72cac934aad807f6b',
  // Set after AdSense approval. Empty means no ad code and no ad space on any page.
  adsenseClient: '',
  adSlots: { A: '', B: '', C: '', D: '' },
  // Optional. Receive counts and rule ids only, never text. Empty means nothing is sent.
  analyticsUrl: '',
};
