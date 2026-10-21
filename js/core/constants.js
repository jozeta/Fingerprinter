// Versions, enumerations and shared vocabulary. Bump TEST_CATALOGUE_VERSION when test definitions change.
export const APP_NAME = 'Browser Fingerprinting & Privacy Lab';
export const APP_VERSION = '2.2.1';
export const RESULT_SCHEMA_VERSION = '1.0';
export const TEST_CATALOGUE_VERSION = '2026.10.21';
export const EXPORT_FORMAT = 'fp-lab-export';

export const STATUSES = {
  'measured':             { label: 'Revealed',             tone: 'measured',   icon: 'bi-eye',                  definitive: true,  help: 'Your browser gave this value away when asked.' },
  'inferred':             { label: 'Estimated',            tone: 'inferred',   icon: 'bi-lightbulb',            definitive: true,  help: 'Worked out indirectly from other clues. A likely answer, not a certain one.' },
  'blocked':              { label: 'Hidden by browser',    tone: 'blocked',    icon: 'bi-shield-check',         definitive: true,  help: 'Your browser refused to give this value, or gave an empty one. Websites learn nothing from it (though they may notice it was hidden).' },
  'unsupported':          { label: 'Not in this browser',  tone: 'neutral',    icon: 'bi-slash-circle',         definitive: false, help: 'Your browser does not have this feature, so websites cannot use it.' },
  'permission-required':  { label: 'Needs permission',     tone: 'neutral',    icon: 'bi-key',                  definitive: false, help: 'Would need your permission. This lab never asks for it automatically.' },
  'interaction-required': { label: 'Start it yourself',    tone: 'neutral',    icon: 'bi-hand-index',           definitive: false, help: 'This check only runs when you click Run on it (or start the exercise).' },
  'server-only':          { label: 'Only servers see this', tone: 'server',    icon: 'bi-hdd-network',          definitive: false, help: 'Every website\'s server can see this, but this page cannot measure it because it has no server.' },
  'error':                { label: 'Didn\'t finish',        tone: 'error',      icon: 'bi-bug',                  definitive: false, help: 'Something went wrong or the browser did not answer in time. Nothing is known about this value.' },
  'skipped':              { label: 'Not run',              tone: 'neutral',    icon: 'bi-skip-forward',         definitive: false, help: 'This check was cancelled, turned off in Settings, or not started yet.' },
};

export const PROTECTION = {
  'none-detected': { label: 'No protection found', help: 'Repeated measurements were identical and nothing indicated blocking. This does not prove no protection exists.' },
  'randomized':    { label: 'Scrambled on purpose',   help: 'The value changed every time we measured it. Your browser adds random noise so websites cannot use it to recognise you.' },
  'standardized':  { label: 'Same as everyone',       help: 'The value matches the uniform value privacy browsers give everyone (for example time zone UTC).' },
  'blocked':       { label: 'Hidden by browser',      help: 'Your browser refused access or returned an empty value.' },
  'unknown':       { label: 'Unclear',                help: 'This check cannot tell whether a protection is active.' },
};

export const CONFIDENCE = {
  'high':   'Direct API read; the value is what the browser reports (which may itself be spoofed).',
  'medium': 'Derived from a measurement; small chance of misclassification.',
  'low':    'Heuristic inference; often wrong under unusual configurations.',
  'n/a':    'Nothing was measured.',
};

export const EVIDENCE_LEVELS = {
  1: { label: 'Confirmed implementation',     short: 'L1 Confirmed',   help: 'Reliable evidence that this specific technique is implemented (e.g. published source code, the organisation\'s own tool).' },
  2: { label: 'Documented capability',        short: 'L2 Documented',  help: 'First-party documentation describes the capability.' },
  3: { label: 'Research-supported',           short: 'L3 Research',    help: 'Credible independent research or reporting establishes the relationship.' },
  4: { label: 'Category-level relevance',     short: 'L4 Category',    help: 'Relevant to the organisation\'s general purpose; the specific use is unverified.' },
  5: { label: 'Unverified',                   short: 'L5 Unverified',  help: 'Insufficient evidence. Not presented as fact.' },
};

export const RELATIONS = {
  uses: 'Uses / implements', measures: 'Measures (research or test tool)', mitigates: 'Mitigates (defense)',
  researched: 'Published research on', permits: 'Permits by policy',
};

export const PURPOSES = {
  'identification': 'Re-identification / tracking', 'fraud-prevention': 'Fraud prevention', 'bot-detection': 'Bot detection',
  'advertising': 'Advertising', 'analytics': 'Analytics', 'research': 'Research / measurement', 'privacy-defense': 'Privacy defense',
  'malicious-targeting': 'Malicious targeting / cloaking', 'compatibility': 'Feature detection / compatibility',
};

export const CATEGORIES = {
  browser:   { label: 'Browser & environment',  icon: 'bi-browser-chrome' },
  screen:    { label: 'Screen & display',       icon: 'bi-display' },
  rendering: { label: 'Canvas, WebGL & fonts',  icon: 'bi-palette' },
  css:       { label: 'CSS & preferences',      icon: 'bi-filetype-css' },
  media:     { label: 'Audio & media',          icon: 'bi-soundwave' },
  hardware:  { label: 'Hardware & runtime',     icon: 'bi-cpu' },
  apis:      { label: 'APIs & permissions',     icon: 'bi-plug' },
  storage:   { label: 'Storage & persistence',  icon: 'bi-database' },
  advanced:  { label: 'Advanced & consistency', icon: 'bi-diagram-3' },
  behavior:  { label: 'Interaction (opt-in)',   icon: 'bi-mouse' },
  server:    { label: 'Network & server-only',  icon: 'bi-hdd-network' },
};

export const DATA_TYPES = { string: 'Text', number: 'Number', enum: 'Enumerated value', list: 'List', hash: 'Digest', object: 'Structured object', boolean: 'Boolean' };
export const RELEVANCE = { high: 'High', medium: 'Medium', low: 'Low' };
export const STABILITY = { stable: 'Stable', 'semi-stable': 'Semi-stable', volatile: 'Volatile' };
export const MATURITY = { demonstrated: 'Demonstrated technique', research: 'Research concept', speculative: 'Speculative inference' };
