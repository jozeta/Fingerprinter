// Interaction exercises. Data comes ONLY from the Learning Center lab widgets after the user presses Start,
// is kept in memory, contains timing/geometry only (never which keys), and is discarded on reset.
import { define } from './define.js';
import { measured, interactionRequired } from '../core/schema.js';

const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };

export function pointerStats(points) {
  const speeds = [], angles = [];
  for (let i = 1; i < points.length; i++) {
    const dt = points[i].t - points[i - 1].t; if (dt <= 0 || dt > 100) continue;
    const dx = points[i].x - points[i - 1].x, dy = points[i].y - points[i - 1].y;
    speeds.push(Math.hypot(dx, dy) / dt); angles.push(Math.atan2(dy, dx));
  }
  let turn = 0; for (let i = 1; i < angles.length; i++) turn += Math.abs(angles[i] - angles[i - 1]);
  return { samples: points.length, meanSpeed: +mean(speeds).toFixed(3), speedStd: +std(speeds).toFixed(3),
    meanDirectionChange: angles.length > 1 ? +(turn / (angles.length - 1)).toFixed(3) : 0, untrusted: points.filter((p) => !p.trusted).length };
}

export function keyStats(keys) {
  const dwell = keys.map((k) => k.dwell), flight = keys.map((k) => k.flight).filter((f) => f !== null && f < 2000);
  return { keystrokes: keys.length, meanDwellMs: +mean(dwell).toFixed(1), dwellStdMs: +std(dwell).toFixed(1), meanFlightMs: +mean(flight).toFixed(1), flightStdMs: +std(flight).toFixed(1) };
}

export default [
  define({
    id: 'pointer-dynamics', version: '1.0.0', category: 'behavior', name: 'Pointer movement dynamics', tier: 'advanced', interaction: true, stability: 'volatile',
    simple: 'How you move your mouse (speed, smoothness, curvature) can tell a human from a script.',
    how: 'Only inside the Learning Center pad, and only after you press <em>Start</em>, the lab records pointer coordinates and timestamps in memory and computes speed, variability and direction change.',
    technical: 'Bot-defense products score pointer telemetry: humans produce curved, accelerating, jittery paths, while naive bots produce straight or replayed ones. Research on behavioral biometrics shows partial re-identification is possible, but it is noisy and context-dependent.',
    exposes: 'Movement statistics from the lab pad only.', dataType: 'object', apis: ['PointerEvent'],
    purpose: ['bot-detection', 'fraud-prevention'], relevance: 'low', relevanceBasis: 'Mainly bot detection; weak as a stable identifier.',
    privacyImpact: 'Behavioral data can be sensitive; this lab keeps it in memory only.', concern: 'privacy',
    limitations: ['Highly variable between sessions and devices.'], defenses: 'None practical.', mitigations: ['Be aware that checkout and login pages may collect such telemetry.'],
    sources: ['cf-turnstile', 'datadome-cdp', 'popets-2025-behavior'],
    run: async ({ options }) => {
      const pts = options?.lab?.pointer;
      if (!pts || pts.length < 20) return interactionRequired('Open the Learning Center, press Start on the pointer pad and move your pointer.');
      return measured(pointerStats(pts), { confidence: 'medium' });
    },
  }),

  define({
    id: 'keystroke-timing', version: '1.0.0', category: 'behavior', name: 'Keystroke timing', tier: 'advanced', interaction: true, stability: 'volatile',
    simple: 'Your typing rhythm: how long you hold keys and the gaps between them.',
    how: 'Only in the Learning Center text box, after you press <em>Start</em>, the lab records key-down/key-up <em>timestamps</em>. It never records which keys were pressed, and the text is not read.',
    technical: '"Dwell" (press→release) and "flight" (release→next press) times form a rhythm used in continuous-authentication and fraud products. Rhythm varies with keyboard, fatigue and language.',
    exposes: 'Timing statistics only.', dataType: 'object', apis: ['KeyboardEvent'],
    purpose: ['fraud-prevention', 'bot-detection'], relevance: 'low', relevanceBasis: 'Behavioral, not a stable device identifier.',
    privacyImpact: 'Behavioral biometrics can be sensitive.', limitations: ['Requires enough keystrokes; noisy.'], defenses: 'Password managers avoid typing on login forms.',
    mitigations: ['Use a password manager for logins.'], sources: ['cf-turnstile'],
    run: async ({ options }) => {
      const keys = options?.lab?.keys;
      if (!keys || keys.length < 10) return interactionRequired('Open the Learning Center, press Start and type at least 10 characters.');
      return measured(keyStats(keys), { confidence: 'medium' });
    },
  }),
];
