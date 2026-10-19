// Every technique module, in display order. Adding a technique = adding a definition to one of these modules.
import browser from './browser.js';
import screen from './screen.js';
import rendering from './rendering.js';
import css from './css.js';
import media from './media.js';
import hardware from './hardware.js';
import apis from './apis.js';
import storage from './storage.js';
import advanced from './advanced.js';
import behavior from './behavior.js';
import server from './server.js';
import extended from './extended.js';

export const ALL_DEFINITIONS = [...browser, ...screen, ...rendering, ...css, ...media, ...hardware, ...apis, ...storage, ...advanced, ...behavior, ...server, ...extended];
