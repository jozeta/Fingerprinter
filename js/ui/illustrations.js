// Lesson illustrations (inline SVG, theme-aware via CSS classes). Decorative diagrams; each lesson's text carries the meaning.
const svg = (w, h, body, label) => `<svg class="illus" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${body}</svg>`;
const box = (x, y, w, h, t, cls = 'fill-frost') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="${cls}"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle">${t}</text>`;
const arrow = (x1, y1, x2, y2) => `<path class="accent flow" d="M${x1} ${y1} L${x2} ${y2}"/><path class="accent" d="M${x2 - 6} ${y2 - 4} L${x2} ${y2} L${x2 - 6} ${y2 + 4}"/>`;

export const ILLUSTRATIONS = {
  fundamentals: svg(340, 110, `${box(6, 35, 76, 40, 'Your browser')}${arrow(86, 55, 118, 55)}
    <g><rect x="122" y="14" width="104" height="82" rx="9" class="fill-wash"/>${['screen 2560×1440', 'fonts: 47', 'GPU: Apple M2', 'tz: Europe/…'].map((t, i) => `<text x="132" y="${34 + i * 18}">${t}</text>`).join('')}</g>
    ${arrow(230, 55, 262, 55)}${box(266, 35, 68, 40, 'ID 3f9a…', 'fill-wash')}`, 'Browser traits are collected and combined into one ID'),

  passive: svg(340, 120, `<text x="6" y="20">Passive: sent with every request</text>${box(6, 30, 80, 30, 'Browser')}${arrow(90, 45, 240, 45)}${box(244, 30, 90, 30, 'Server logs')}
    <text x="120" y="38">IP · headers · TLS</text>
    <text x="6" y="86">Active: a script makes your browser work</text>${box(6, 94, 80, 22, 'Browser')}<path class="accent" d="M96 105 h40 m-40 0 c 20 -16 40 -16 40 0"/><text x="146" y="109">draw · play · measure → result</text>`, 'Passive signals arrive automatically; active ones need a script'),

  cookies: svg(340, 120, `<text x="40" y="18" text-anchor="middle">Cookie</text><text x="250" y="18" text-anchor="middle">Fingerprint</text>
    <rect x="10" y="28" width="60" height="70" rx="10" class="fill-wash"/><circle cx="40" cy="62" r="16" class="fill-amber"/><circle cx="34" cy="58" r="2.5" class="fill-frost"/><circle cx="45" cy="66" r="2.5" class="fill-frost"/>
    <text x="80" y="54">stored on your device</text><text x="80" y="72">→ you can delete it</text>
    <circle cx="250" cy="60" r="30" class="fill-wash"/>${[10, 18, 26].map((r) => `<path class="accent" d="M${250 - r} 66 a${r} ${r} 0 1 1 ${2 * r} 0"/>`).join('')}
    <text x="250" y="112" text-anchor="middle">recomputed each visit</text>`, 'Cookies are stored and deletable; fingerprints are recomputed'),

  ip: svg(340, 110, `${box(6, 10, 96, 34, 'Home Wi-Fi')}${box(6, 62, 96, 34, 'Phone network')}<path class="stroke" d="M104 27 L150 50 M104 79 L150 56"/>
    ${box(152, 34, 70, 36, 'Laptop', 'fill-wash')}<path class="accent flow" d="M224 52 L262 52"/>${box(264, 34, 70, 36, 'Same ID', 'fill-wash')}
    <text x="152" y="92">new IP, same fingerprint</text>`, 'The IP changes with the network; the fingerprint follows the device'),

  entropy: svg(340, 104, [64, 32, 16, 8].map((n, i) => {
    const x0 = 6 + i * 84; let dots = '';
    for (let k = 0; k < 64; k++) dots += `<circle cx="${x0 + 8 + (k % 8) * 9}" cy="${10 + Math.floor(k / 8) * 9}" r="3.3" class="${k < n ? 'fill-accent' : 'fill-frost'}"/>`;
    return dots + `<text x="${x0 + 40}" y="98" text-anchor="middle">${i === 0 ? 'everyone' : `+${i} bit${i > 1 ? 's' : ''}: ${n}`}</text>`;
  }).join(''), 'Each bit of information halves the crowd you hide in'),

  correlation: svg(340, 110, `<circle cx="120" cy="55" r="44" class="fill-wash" opacity=".9"/><circle cx="185" cy="55" r="44" class="fill-frost" opacity=".9"/><circle cx="152" cy="55" r="44" class="stroke"/>
    <text x="92" y="58" text-anchor="middle">Fonts</text><text x="214" y="58" text-anchor="middle">Operating system</text><text x="152" y="104" text-anchor="middle">overlap = information you only count once</text>`, 'Correlated signals overlap'),

  canvas: svg(340, 100, `${box(6, 30, 74, 40, 'Draw text')}${arrow(84, 50, 114, 50)}
    <g>${Array.from({ length: 30 }, (_, k) => `<rect x="${118 + (k % 10) * 9}" y="${26 + Math.floor(k / 10) * 9}" width="8" height="8" rx="1.5" class="${[3, 7, 12, 18, 21, 26].includes(k) ? 'fill-accent' : 'fill-wash'}"/>`).join('')}</g>
    <text x="163" y="90" text-anchor="middle">tiny pixel differences</text>${arrow(212, 50, 242, 50)}${box(246, 30, 88, 40, 'Hash 9c41…', 'fill-wash')}`, 'Canvas output becomes a hash'),

  audio: svg(340, 100, `${box(6, 30, 70, 40, 'Tone')}${arrow(80, 50, 104, 50)}${box(108, 30, 84, 40, 'Compressor')}${arrow(196, 50, 220, 50)}
    <path class="accent" d="M224 50 ${Array.from({ length: 22 }, (_, k) => `L${226 + k * 5} ${50 + Math.sin(k * 0.9) * (14 - k * 0.4)}`).join(' ')}"/><text x="276" y="88" text-anchor="middle">silent, just numbers</text>`, 'An offline audio graph produces numbers, not sound'),

  defenses: svg(340, 110, `<g>${[0, 1, 2].map((i) => `<circle cx="${30 + i * 26}" cy="40" r="10" class="fill-accent"/>`).join('')}<text x="56" y="80" text-anchor="middle">Uniformity</text><text x="56" y="96" text-anchor="middle">all identical</text></g>
    <g>${[0, 1, 2].map((i) => `<circle cx="${144 + i * 26}" cy="${34 + i * 7}" r="10" class="${['fill-accent', 'fill-amber', 'fill-pine'][i]}"/>`).join('')}<text x="170" y="80" text-anchor="middle">Randomisation</text><text x="170" y="96" text-anchor="middle">always changing</text></g>
    <g><rect x="258" y="28" width="60" height="26" rx="6" class="fill-frost"/><path class="accent" d="M266 41 h44 M296 34 l-8 14"/><text x="288" y="80" text-anchor="middle">Blocking</text><text x="288" y="96" text-anchor="middle">never runs</text></g>`, 'Three defence strategies'),
  timeline: svg(340, 116, `${[['0 ms', 'Page opens'], ['20 ms', 'Script loads'], ['60 ms', 'Reads ~50 traits'], ['90 ms', 'Sends a hash'], ['120 ms', 'Server matches you']].map(([t, l], i) => `<g style="font-size:10.5px"><circle cx="${40 + i * 65}" cy="44" r="9" class="${i === 4 ? 'fill-accent' : 'fill-wash'}"/><text x="${40 + i * 65}" y="22" text-anchor="middle">${t}</text><text x="${40 + i * 65}" y="72" text-anchor="middle">${l.split(' ').slice(0, 2).join(' ')}</text><text x="${40 + i * 65}" y="86" text-anchor="middle">${l.split(' ').slice(2).join(' ')}</text></g>`).join('')}<path class="accent flow" d="M50 44 H290"/><text x="170" y="110" text-anchor="middle">all invisible, faster than a blink</text>`, 'A tracking script runs in about a tenth of a second'),

  fuzzy: svg(340, 110, `${['screen', 'fonts', 'GPU', 'time zone', 'language', 'canvas'].map((t, i) => `<g><rect x="12" y="${8 + i * 15}" width="96" height="12" rx="3" class="fill-wash"/><text x="18" y="${18 + i * 15}">${t}</text><rect x="232" y="${8 + i * 15}" width="96" height="12" rx="3" class="${i === 1 ? 'fill-amber' : 'fill-wash'}"/><text x="238" y="${18 + i * 15}">${i === 1 ? 'fonts (1 new)' : t}</text></g>`).join('')}
    <path class="accent flow" d="M114 52 H226"/><text x="170" y="44" text-anchor="middle">5 of 6 match</text><text x="170" y="70" text-anchor="middle">→ same person</text>`, 'Five of six traits match, so the visits are still linked'),

  vpn: svg(340, 110, `<text x="10" y="18">What hides what</text>${[['VPN', true, false], ['Private window', false, false], ['Clear cookies', false, false], ['Tor Browser', true, true]].map(([n, ip, fp], i) => `<g><text x="10" y="${42 + i * 18}">${n}</text><text x="150" y="${42 + i * 18}">${ip ? '✓' : '✗'} IP</text><text x="220" y="${42 + i * 18}">${fp ? '✓' : '✗'} fingerprint</text></g>`).join('')}`, 'Only uniformity browsers hide both your IP and your fingerprint'),

  lies: svg(340, 100, `${Array.from({ length: 24 }, (_, k) => `<circle cx="${20 + (k % 12) * 26}" cy="${28 + Math.floor(k / 12) * 26}" r="9" class="${k === 17 ? 'fill-amber' : 'fill-wash'}"/>`).join('')}<text x="170" y="94" text-anchor="middle">the one who lies about their screen stands out</text>`, 'A rare lie makes you more unique, not less'),

  mobile: svg(340, 104, `<rect x="40" y="12" width="44" height="74" rx="8" class="fill-wash"/><rect x="200" y="20" width="110" height="64" rx="6" class="fill-wash"/><rect x="190" y="84" width="130" height="6" rx="3" class="fill-frost"/>
    <text x="62" y="100" text-anchor="middle">phones: few variants</text><text x="255" y="100" text-anchor="middle">computers: many variants</text>`, 'Phones of the same model look alike; computers vary more'),

  evidence: svg(340, 110, `${[1, 2, 3, 4, 5].map((l, i) => `<g><rect x="${14 + i * 64}" y="${80 - (5 - i) * 13}" width="52" height="${(5 - i) * 13}" rx="5" style="fill:var(--s-ev${l})"/><text x="${40 + i * 64}" y="98" text-anchor="middle">L${l}</text></g>`).join('')}<text x="40" y="14" text-anchor="middle">strongest</text><text x="296" y="14" text-anchor="middle">weakest</text>`, 'Five evidence levels from confirmed to unverified'),
};
