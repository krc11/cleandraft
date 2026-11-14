// Site-wide settings. Fill the empty values in as each service goes live.
export const SITE = {
  name: 'CleanDraft',
  url: 'https://cleandraft.online',
  contactEmail: 'hello@cleandraft.online',
  editor: 'Kirti Raj Chaudhary',
  editorLinks: { x: 'https://x.com/theKirti_Raj', github: 'https://github.com/krc11' },
  updated: 'November 14, 2026',
  updatedIso: '2026-11-14',
  // Proves ownership to IndexNow (Bing and others). The same key is a file in public/.
  indexNowKey: 'dbd39a7325b285a72cac934aad807f6b',
  // Your AdSense publisher id, like 'ca-pub-1234567890123456'. Setting it adds the ownership
  // meta tag and ads.txt and relaxes the security policy so Google's code can run. Ad units
  // appear only for slots that also have an id below. Empty means no ad code at all.
  adsenseClient: '',
  adSlots: { A: '', B: '', C: '', D: '' },
  // Optional. Receive counts and rule ids only, never text. Empty means nothing is sent.
  analyticsUrl: '',
};
