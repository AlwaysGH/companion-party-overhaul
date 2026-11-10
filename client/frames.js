// companion-party-overhaul 3.9.1: party frames (setting party_frames).
//   Each companion's face from its class portrait with its HP and SP always on screen,
//   like the summon icons of an ARPG: 1 a row along the top, starting right of the
//   Basic Info window; 2 a column down the left, below it. Drag them to move (kept per
//   layout), drag the corner to resize (party_frames_size until that setting changes);
//   click one to open its Bag tab. A frame flashes red under your potion mark (drink_hp),
//   greys out when the companion falls, and shows a z when it rests (the scout's lookout
//   eye was dropped at the user's call; its pet is named on hover; the user didn't want a dot).
//   They stay up through NPC talk, like Basic Info, with the last numbers.
//   3.10.1 (beta): ailments (face tint + matching corner icon, silence/bleed mark the SP/HP
//   bar), big hit / heal / level up cues, low SP glow, shopping or heavy-bag chip top left.
//   3.10.2: classes with no portrait show their job icon (jobIcon) instead of a dark box.
//   Asks "@clstat hud" (npc/companion_life.txt, OnCmdStat) every 1.5 s. It replaces the
//   Companions window's old Status tab.
import PICS from './portraits_data.js';
import { CLASS_KEY } from './portraits.js';

// The head in each portrait (320 x 480): centre x, centre y, square size. Each head's
// centre, top of the hair and chin were read off gridded sheets of all 74 (scratchpad
// hud\heads.json): centred between hair and chin, the square 1.08 times that height
// (84-112), so every head sits in the middle like the user's Brizion and Serawen.
// 3.10.0: exported for the Roster tab's faces (index.js).
export const CROPS = {
    novice_m: [158, 105, 110], novice_f: [166, 96, 94], swordman_m: [160, 100, 103], swordman_f: [157, 94, 100],
    mage_m: [154, 114, 84], mage_f: [160, 92, 103], archer_m: [163, 98, 92], archer_f: [154, 88, 92],
    acolyte_m: [154, 94, 92], acolyte_f: [155, 95, 97], merchant_m: [154, 92, 103], merchant_f: [166, 90, 103],
    thief_m: [158, 85, 97], thief_f: [158, 82, 92], knight_m: [162, 90, 92], knight_f: [168, 89, 94],
    crusader_m: [161, 111, 102], crusader_f: [163, 100, 97], priest_m: [158, 103, 94], priest_f: [166, 90, 105],
    monk_m: [160, 98, 103], monk_f: [169, 95, 108], wizard_m: [158, 100, 103], wizard_f: [140, 98, 97],
    sage_m: [155, 103, 84], sage_f: [160, 111, 84], hunter_m: [160, 102, 92], hunter_f: [163, 98, 92],
    blacksmith_m: [158, 102, 92], blacksmith_f: [160, 108, 86], alchemist_m: [160, 102, 92],
    alchemist_f: [175, 106, 91], assassin_m: [150, 95, 97], assassin_f: [170, 112, 84], rogue_m: [155, 98, 103],
    rogue_f: [165, 98, 103], bard_m: [158, 98, 108], dancer_f: [158, 93, 103], lord_knight_m: [155, 96, 92],
    lord_knight_f: [163, 111, 97], paladin_m: [162, 88, 108], paladin_f: [174, 94, 97],
    high_priest_m: [172, 92, 103], high_priest_f: [166, 95, 104], champion_m: [140, 110, 96],
    champion_f: [177, 102, 92], high_wizard_m: [158, 106, 97], high_wizard_f: [158, 106, 91],
    professor_m: [159, 90, 97], professor_f: [162, 98, 86], sniper_m: [176, 92, 103], sniper_f: [184, 90, 114],
    whitesmith_m: [183, 118, 96], whitesmith_f: [150, 103, 101], creator_m: [158, 102, 108],
    creator_f: [153, 104, 103], assassin_cross_m: [157, 98, 109], assassin_cross_f: [150, 100, 91],
    stalker_m: [167, 92, 103], stalker_f: [165, 98, 103], clown_m: [158, 96, 84], gypsy_f: [163, 78, 86],
    super_novice_m: [150, 86, 123], super_novice_f: [145, 88, 116], taekwon_m: [148, 95, 97],
    taekwon_f: [155, 102, 92], star_gladiator_m: [155, 98, 92], star_gladiator_f: [160, 95, 97],
    soul_linker_m: [158, 100, 97], soul_linker_f: [151, 108, 103], gunslinger_m: [150, 95, 114],
    gunslinger_f: [153, 102, 109], ninja_m: [163, 90, 108], ninja_f: [140, 96, 116],
};
const FACE = 46;   // px, at 100%

// 3.10.2: a class with no portrait (renewal 3rd/4th jobs, Kagerou, Doram...) shows the game's
// own party-window job icon (25 x 25, renewalparty/icon_jobs_<job>.bmp; the client has one for
// every class). Asked once per class; also used by the Roster tab (index.js).
const jobIcons = new Map();   // job id -> Promise<url, or '' when there is none>
export function jobIcon(api, cls) {
    if (!jobIcons.has(cls)) jobIcons.set(cls, typeof api.screens?.image === 'function'
        ? Promise.resolve(api.screens.image(`renewalparty/icon_jobs_${cls}.bmp`)).then(url => url || '', () => '')
        : Promise.resolve(''));
    return jobIcons.get(cls);
}

const STYLE = `
* { cursor: inherit !important; box-sizing: border-box; }
.fw { position: fixed; display: flex; gap: 6px; padding: 0 10px 10px 0; transform-origin: 0 0;
  font: 11px Tahoma, Verdana, sans-serif; color: #eef2f8; user-select: none; }
.fw.top { flex-direction: row; }
.fw.left { flex-direction: column; }
.fw.hidden { display: none; }
.fr { position: relative; background: rgba(16, 20, 30, .78); border: 1px solid rgba(255, 255, 255, .18); border-radius: 4px; }
.face { width: ${FACE}px; height: ${FACE}px; border-radius: 3px; border: 1px solid rgba(255, 255, 255, .35);
  background-color: #222; background-repeat: no-repeat; position: relative; flex: none; }
.lv { position: absolute; left: -1px; bottom: -1px; background: rgba(0, 0, 0, .75); font-size: 9px; padding: 0 3px; border-radius: 0 3px 0 2px; }
.nm { font-weight: bold; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bars { display: grid; gap: 2px; }
.g { height: 6px; background: #2a2f3a; border: 1px solid rgba(0, 0, 0, .6); border-radius: 1px; overflow: hidden; }
.g i { display: block; height: 100%; transition: width .4s; }
.g.hp i { background: #4ec24e; }
.g.hp.mid i { background: #e6c13a; }
.g.hp.low i { background: #e0463e; }
.g.sp i { background: #3d7be0; }
.num { font-size: 9px; color: #c7cfdc; white-space: nowrap; }
.st { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #1d2433;
  border: 1px solid rgba(255, 255, 255, .5); display: none; place-items: center; font-size: 10px; line-height: 1; }
.st.on { display: grid; }
.top .fr { width: 76px; padding: 4px; display: grid; justify-items: center; gap: 3px; }
.top .bars { width: 100%; }
.top .num { display: none; }
.left .fr { width: 168px; padding: 4px; display: flex; gap: 6px; align-items: center; }
.left .info { display: grid; gap: 2px; flex: 1; min-width: 0; }
.top .info { display: contents; }
.fr.out { filter: grayscale(1) brightness(.6); }
.fr.out .face::after { content: "KO"; position: absolute; inset: 0; display: grid; place-items: center; font-weight: bold;
  color: #ff8a80; font-size: 13px; text-shadow: 0 1px 2px #000; }
.fr.away { opacity: .6; }
@keyframes warn { 0%, 100% { box-shadow: 0 0 0 0 rgba(224, 70, 62, 0); } 50% { box-shadow: 0 0 0 3px rgba(224, 70, 62, .9); } }
.fr.low { animation: warn 1s infinite; }
.grip { position: absolute; right: -2px; bottom: -2px; width: 14px; height: 14px; opacity: 0; transition: opacity .2s;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 215, 106, .9) 50% 60%, transparent 60% 70%, rgba(255, 215, 106, .9) 70% 80%, transparent 80%); }
.fw:hover .grip, .grip.on { opacity: 1; }
/* 3.10.1 status cues (beta). Face tints multiply like the client's own sprite tints
   (Online.js updateHealthState/updateBodyState); each corner icon wears its tint's colour. */
.fx { position: absolute; inset: 0; border-radius: 2px; pointer-events: none; }
.fr.poison .g.hp i { background: linear-gradient(90deg, #7a2f8f, #d466c8); }
.fr.poison .fx { background: rgb(230, 102, 204); mix-blend-mode: multiply; animation: pulse 1.8s infinite; }
.fr.curse .fx { background: rgb(150, 40, 30); mix-blend-mode: multiply; }
.fr.stone .fx { background: rgb(72, 72, 72); mix-blend-mode: multiply; }
.fr.stone .fx::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, rgba(255,255,255,.07) 0 1px, transparent 1px 4px); }
.fr.frozen .fx { background: rgb(40, 130, 240); mix-blend-mode: multiply; }
.fr.frozen .fx::after { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(200,240,255,.55), rgba(140,200,255,.1) 55%, rgba(200,240,255,.35)); box-shadow: inset 0 0 6px #cfefff; }
.fr.sleep .fx { background: rgba(40, 30, 90, .4); }
.fr.blind .fx { background: radial-gradient(circle at 50% 40%, transparent 6px, rgba(0,0,0,.88) 16px); }
.fr.silence .g.sp i { background: #4d5262; }
.fr.silence .g.sp, .fr.bleed .g.hp { position: relative; }
.fr.silence .g.sp::after { content: ""; position: absolute; inset: 0; animation: pulse 1.4s infinite;
  background: repeating-linear-gradient(-45deg, rgba(255, 75, 62, .95) 0 2px, transparent 2px 5px); }
.fr.bleed .g.hp::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 7px, rgba(120,0,0,.8) 7px 9px); animation: drip .8s linear infinite; }
.orbit { position: absolute; left: 50%; top: -7px; width: 0; height: 0; display: none; z-index: 4; }
.fr.stun .orbit { display: block; }
.orbit i { position: absolute; left: -5px; top: -5px; width: 10px; height: 10px; font-style: normal; color: #ffe066; font-size: 10px; line-height: 10px;
  text-align: center; text-shadow: 0 0 2px #000, 0 0 4px rgba(255,200,0,.6); animation: orbit 1.2s linear infinite; }
.orbit i:nth-child(2) { animation-delay: -.4s; } .orbit i:nth-child(3) { animation-delay: -.8s; }
.st svg, .chip svg { width: 12px; height: 12px; display: block; }
.chip { position: absolute; z-index: 2; top: -6px; left: -6px; width: 18px; height: 18px; border-radius: 50%; background: #1d2433;
  border: 1px solid rgba(255, 255, 255, .5); display: none; place-items: center; font-size: 10px; line-height: 1; }
.chip.on { display: grid; }
.chip.heavy { background: #6b4a10; } .chip.full { background: #8a1c1c; }
.fr.lowsp .g.sp { animation: spglow 1s infinite; }
.fr.hit { animation: hit .45s; }
.fr.heal { box-shadow: 0 0 0 2px rgba(120, 255, 150, .9), 0 0 12px rgba(120, 255, 150, .7); transition: box-shadow .3s; }
.fr.lvup { box-shadow: 0 0 0 2px #ffd76a, 0 0 14px #ffd76a; }
.fr.lvup::after { content: "LEVEL UP"; position: absolute; left: 50%; top: -15px; transform: translateX(-50%); font: bold 8px Tahoma, sans-serif;
  color: #3a2600; background: linear-gradient(#ffe79a, #f0b93a); padding: 1px 4px; border-radius: 2px; white-space: nowrap;
  box-shadow: 0 0 0 1px #6b4a00; animation: rise 2.4s ease-out forwards; }
@keyframes pulse { 50% { opacity: .35; } }
@keyframes drip { to { background-position: 9px 0; } }
@keyframes spglow { 50% { box-shadow: 0 0 6px 1px #5fa0ff; } }
@keyframes hit { 0%, 100% { transform: none; box-shadow: none; } 20% { transform: translateX(-2px); box-shadow: 0 0 0 2px #ff4b3e, 0 0 10px #ff4b3e; } 50% { transform: translateX(2px); } }
@keyframes rise { 0% { top: -10px; opacity: 0; } 15% { top: -16px; opacity: 1; } 80% { opacity: 1; } 100% { top: -20px; opacity: 0; } }
@keyframes orbit {
  0%   { transform: translate(-15px, 0) scale(.75); opacity: .7; z-index: 1; }
  25%  { transform: translate(0, 3px) scale(1.2); opacity: 1; z-index: 3; }
  50%  { transform: translate(15px, 0) scale(.75); opacity: .7; z-index: 1; }
  75%  { transform: translate(0, -3px) scale(.5); opacity: .35; z-index: 0; }
  100% { transform: translate(-15px, 0) scale(.75); opacity: .7; z-index: 1; } }
@media (prefers-reduced-motion: reduce) { .fr, .fr *, .fr::after { animation: none !important; } }
`;

// Corner icon per ailment: [ring colour, svg]. The glyph wears its face tint's colour.
const SLASH = '<line x1="2.5" y1="13.5" x2="13.5" y2="2.5" stroke="#ff4b3e" stroke-width="1.8" stroke-linecap="round"/>';
const AIL = {
    poison: ['#d466c8', '<svg viewBox="0 0 16 16"><path fill="#d466c8" d="M8 1.5c-3.3 0-5.5 2.2-5.5 5.1 0 1.8.9 3.1 2.2 3.8V13h1.6v-1.4h1v1.4h1.4v-1.4h1V13h1.6v-2.6c1.3-.7 2.2-2 2.2-3.8C13.5 3.7 11.3 1.5 8 1.5z"/><circle cx="5.9" cy="7" r="1.5" fill="#12151f"/><circle cx="10.1" cy="7" r="1.5" fill="#12151f"/><path d="M8 8.6l-.8 1.4h1.6z" fill="#12151f"/></svg>'],
    stun: ['#ffe066', '<svg viewBox="0 0 16 16"><path fill="#ffe066" d="M8 1l1.9 4.2 4.6.5-3.4 3.1 1 4.5L8 11l-4.1 2.3 1-4.5L1.5 5.7l4.6-.5z"/></svg>'],
    frozen: ['#8fd3ff', '<svg viewBox="0 0 16 16" stroke="#8fd3ff" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M8 1.5v13M2.4 4.8l11.2 6.4M2.4 11.2l11.2-6.4M6.3 2.6L8 4.2l1.7-1.6M6.3 13.4L8 11.8l1.7 1.6"/></svg>'],
    curse: ['#c0392b', '<svg viewBox="0 0 16 16"><path fill="#c0392b" d="M8 14.2S1.8 10.4 1.8 6a3.2 3.2 0 0 1 5.6-2.1L6.6 6.6l2.2 1.5-1.4 2.6 2.9-3-2.1-1.5 1.1-2.4A3.2 3.2 0 0 1 14.2 6c0 4.4-6.2 8.2-6.2 8.2z"/></svg>'],
    stone: ['#9a9a9a', '<svg viewBox="0 0 16 16"><path fill="#9a9a9a" d="M3 12.5l1.2-5.6L7.5 3l4.6 1.6 1.4 5.2-2.6 3.2z"/><path d="M7.5 3l.6 4.4 5.4 2.4M8.1 7.4l-3.9-.5" stroke="#5c5c5c" stroke-width=".9" fill="none"/></svg>'],
    sleep: ['#ffffff', '<svg viewBox="0 0 16 16"><text x="1" y="13" font-family="Tahoma,Verdana,sans-serif" font-weight="bold" font-size="8" fill="#fff">z</text><text x="6" y="10" font-family="Tahoma,Verdana,sans-serif" font-weight="bold" font-size="10" fill="#fff">Z</text></svg>'],
    silence: ['#ffffff', '<svg viewBox="0 0 16 16"><path fill="#fff" d="M8 2.5c-3.6 0-6 2-6 4.6 0 1.5.8 2.8 2.1 3.6L3.5 13.5l3.1-1.9c.5.1.9.1 1.4.1 3.6 0 6-2 6-4.6S11.6 2.5 8 2.5z"/><circle cx="5.3" cy="7.1" r=".9" fill="#12151f"/><circle cx="8" cy="7.1" r=".9" fill="#12151f"/><circle cx="10.7" cy="7.1" r=".9" fill="#12151f"/>' + SLASH + '</svg>'],
    blind: ['#ffffff', '<svg viewBox="0 0 16 16"><path d="M1.5 8S4 3.8 8 3.8 14.5 8 14.5 8 12 12.2 8 12.2 1.5 8 1.5 8z" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="8" cy="8" r="2" fill="#fff"/>' + SLASH + '</svg>'],
    bleed: ['#e0463e', '<svg viewBox="0 0 16 16"><path fill="#e0463e" d="M8 1.8S3.6 7.2 3.6 10a4.4 4.4 0 0 0 8.8 0C12.4 7.2 8 1.8 8 1.8z"/></svg>'],
};
const AIL_NAME = { poison: 'poisoned', stun: 'stunned', frozen: 'frozen', curse: 'cursed', stone: 'turned to stone',
    sleep: 'asleep', silence: 'silenced', blind: 'blind', bleed: 'bleeding' };
const BAG_SVG = '<svg viewBox="0 0 16 16"><path fill="#f3e2c0" d="M5.5 4.5V4a2.5 2.5 0 0 1 5 0v.5H13l.8 9.5H2.2L3 4.5zm1.3 0h2.4V4a1.2 1.2 0 0 0-2.4 0z"/></svg>';
// Resting: a little figure sitting on the ground, knees up (like /sit), so it isn't read as the sleep Zz.
const SIT_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="#a8e6b0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.6" cy="3.4" r="1.9" fill="#a8e6b0" stroke="none"/><path d="M5.4 6.2L4.2 12.6l5.2-4 3 5M5 8.4l4.2.6"/></svg>';
const COIN_SVG ='<svg viewBox="0 0 16 16"><path fill="#e8c05a" d="M6 2.2h4l-1 1.6c2.6 1 4.2 3.4 4.2 6 0 2.6-2.3 4-5.2 4s-5.2-1.4-5.2-4c0-2.6 1.6-5 4.2-6z"/><text x="8" y="12.2" text-anchor="middle" font-family="Tahoma,sans-serif" font-weight="bold" font-size="6.5" fill="#6b4a00">z</text></svg>';

// While these are open the server holds this character's scripts (as in index.js).
const DIALOGS = ['NpcBox', 'NpcMenu', 'InputBox', 'NpcStore', 'NpcCutin'];
const inDialog = () => DIALOGS.some(id => document.getElementById(id)?.isConnected);

function parseHud(text) {
    const out = [];
    for (const rec of String(text || '').split('~')) {
        if (!rec.trim()) continue;
        const f = rec.split('|');
        out.push({ cid: f[0], name: f[1], cls: +f[2] || 0, sex: +f[3] || 0, lv: +f[4] || 0,
            hp: +f[5] || 0, mhp: +f[6] || 0, sp: +f[7] || 0, msp: +f[8] || 0,
            state: f[9] || 'off', pet: f[10] || '', watch: f[11] === '1',
            ail: AIL[f[12]] ? f[12] : '', wt: +f[13] || 0, shop: f[14] === '1' });
    }
    return out;
}

export default function frames(parameters, api, { openBag } = {}) {
    const mode = Number(parameters?.party_frames ?? 1);
    if (!(mode === 1 || mode === 2)) return;
    const layout = mode === 1 ? 'top' : 'left';
    const lowAt = Number(parameters?.drink_hp) > 0 ? Number(parameters.drink_hp) : 30;
    const pref = (key, dflt) => { try { return api.preferences.get(key, dflt); } catch { return dflt; } };
    const save = (key, v) => { try { api.preferences.set(key, v); } catch { /* fine */ } };

    // Size: the setting, or the corner drag since that setting last changed.
    const setSize = Math.max(60, Math.min(160, Number(parameters?.party_frames_size) || 100));
    let size = setSize;
    const kept = pref('frames_size', null);
    if (kept && kept.from === setSize && Number.isFinite(kept.size)) size = kept.size;
    let pos = pref('frames_pos_' + layout, null);   // null: follow the Basic Info window

    const host = document.createElement('div');
    host.style.cssText = 'position: fixed; z-index: 30;';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style><div class="fw ${layout} hidden"><span class="grip"></span></div>`;
    const wrap = root.querySelector('.fw'), grip = root.querySelector('.grip');
    // Our clicks are ours: the game would walk you to the spot under them.
    for (const type of ['mousedown', 'mouseup', 'click', 'contextmenu']) host.addEventListener(type, event => event.stopPropagation());
    document.body.appendChild(host);
    api.cleanup(() => host.remove());

    function place() {
        let left = 228, top = 8;
        if (pos && Number.isFinite(pos.left)) ({ left, top } = pos);
        else {
            const r = document.getElementById('BasicInfo')?.getBoundingClientRect();
            if (r && r.width) {
                if (layout === 'top') { left = r.right + 8; top = r.top; }
                else { left = r.left; top = r.bottom + 8; }
            } else if (layout === 'left') { left = 6; top = 150; }
        }
        const w = wrap.offsetWidth * size / 100, h = wrap.offsetHeight * size / 100;
        wrap.style.left = Math.max(0, Math.min(innerWidth - Math.min(w, innerWidth), left)) + 'px';
        wrap.style.top = Math.max(0, Math.min(innerHeight - Math.min(h, innerHeight), top)) + 'px';
        wrap.style.transform = `scale(${size / 100})`;
    }

    // One frame per companion, built once and then only updated: the face is a portrait
    // (tens of KB as a data URL), not something to write into the page every 1.5 s.
    const shown = new Map();   // cid -> { el, key }
    function frameFor(c) {
        let f = shown.get(c.cid);
        if (!f) {
            const el = document.createElement('div');
            el.className = 'fr';
            el.dataset.cid = c.cid;
            el.innerHTML = '<span class="chip"></span><div class="face"><div class="fx"></div><span class="orbit"><i>★</i><i>★</i><i>★</i></span>'
                + '<span class="lv"></span></div><div class="info"><div class="nm"></div>'
                + '<div class="bars"><div class="g hp"><i></i></div><div class="g sp"><i></i></div></div><div class="num"></div></div><span class="st"></span>';
            wrap.insertBefore(el, grip);
            f = { el, key: '', hp: -1, lv: 0, ail: '', cue: {} };
            shown.set(c.cid, f);
        }
        return f;
    }
    // A one-shot effect class, restarted if it fires again before it ends.
    function cue(f, el, cls, ms) {
        clearTimeout(f.cue[cls]);
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        f.cue[cls] = setTimeout(() => el.classList.remove(cls), ms);
    }
    function draw(list) {
        const seen = new Set();
        for (const c of list) {
            seen.add(c.cid);
            const f = frameFor(c), el = f.el;
            wrap.insertBefore(el, grip);   // party order
            const base = CLASS_KEY[c.cls], key = base ? `${base}_${c.sex === 1 ? 'm' : 'f'}` : 'job' + c.cls;
            if (key !== f.key && c.state !== 'off') {
                f.key = key;
                const face = el.querySelector('.face'), crop = CROPS[key];
                if (PICS[key] && crop) {
                    const s = FACE / crop[2];
                    face.style.backgroundImage = `url(${PICS[key]})`;
                    face.style.backgroundSize = `${320 * s}px ${480 * s}px`;
                    face.style.backgroundPosition = `${-(crop[0] - crop[2] / 2) * s}px ${-(crop[1] - crop[2] / 2) * s}px`;
                } else {
                    face.style.backgroundImage = '';
                    jobIcon(api, c.cls).then(url => {
                        if (!url || f.key !== key) return;
                        face.style.backgroundImage = `url(${url})`;
                        face.style.backgroundSize = '100% 100%';
                        face.style.backgroundPosition = '0 0';
                    });
                }
            }
            const out = c.state === 'dead', off = c.state === 'off';
            const hpP = c.mhp > 0 ? Math.max(0, Math.min(100, c.hp * 100 / c.mhp)) : 0;
            const spP = c.msp > 0 ? Math.max(0, Math.min(100, c.sp * 100 / c.msp)) : 0;
            el.classList.toggle('out', out || off);
            el.classList.toggle('away', c.state === 'away');
            el.classList.toggle('low', !out && !off && c.mhp > 0 && hpP < lowAt);
            el.querySelector('.lv').textContent = off ? '' : c.lv;
            el.querySelector('.nm').textContent = c.name;
            const hpBar = el.querySelector('.g.hp');
            hpBar.classList.toggle('mid', hpP <= 50 && hpP > 25);
            hpBar.classList.toggle('low', hpP <= 25);
            hpBar.querySelector('i').style.width = hpP + '%';
            el.querySelector('.g.sp i').style.width = (out ? 0 : spP) + '%';
            el.querySelector('.num').textContent = off ? 'Not here' : c.state === 'away' ? 'On another map'
                : `${c.hp.toLocaleString()} / ${c.mhp.toLocaleString()} HP`;
            // 3.10.1 (beta): the worst ailment tints the face and takes the corner icon
            // (over the resting figure); the top-left chip is a shopping trip, else a heavy bag.
            const ail = out || off ? '' : c.ail;
            if (ail !== f.ail) {
                if (f.ail) el.classList.remove(f.ail);
                if (ail) el.classList.add(ail);
                f.ail = ail;
            }
            const st = el.querySelector('.st');
            if (ail) {
                st.innerHTML = AIL[ail][1];
                st.style.borderColor = AIL[ail][0];
                st.style.boxShadow = `0 0 5px ${AIL[ail][0]}`;
                st.classList.add('on');
            } else {
                const mark = !out && !off && c.state === 'rest';
                st.innerHTML = mark ? SIT_SVG : '';
                st.style.borderColor = st.style.boxShadow = '';
                st.classList.toggle('on', !!mark);
            }
            const chip = el.querySelector('.chip');
            const chipKind = out || off ? '' : c.shop ? 'shop' : c.wt >= 90 ? 'full' : c.wt >= 70 ? 'heavy' : '';
            if (chipKind !== f.chip) {
                f.chip = chipKind;
                chip.className = 'chip' + (chipKind ? ' on ' + chipKind : '');
                chip.innerHTML = chipKind === 'shop' ? COIN_SVG : chipKind ? BAG_SVG : '';
            }
            el.classList.toggle('lowsp', !out && !off && c.msp > 0 && spP < 20);
            // Moment cues from the change since the last answer (not on the first sight).
            if (!out && !off && f.hp >= 0 && c.mhp > 0) {
                const delta = (c.hp - f.hp) * 100 / c.mhp;
                if (delta <= -15) cue(f, el, 'hit', 500);
                else if (delta >= 10 && f.hp > 0) cue(f, el, 'heal', 900);
            }
            if (!off && f.lv && c.lv > f.lv) cue(f, el, 'lvup', 2500);
            f.hp = off ? -1 : c.hp;
            if (!off) f.lv = c.lv;
            el.title = off ? `${c.name}: not here` : `${c.name} · Lv ${c.lv}`
                + ` · HP ${c.hp.toLocaleString()} / ${c.mhp.toLocaleString()} · SP ${c.sp.toLocaleString()} / ${c.msp.toLocaleString()}`
                + (ail ? ` · ${AIL_NAME[ail]}` : '')
                + (c.state === 'rest' ? ' · resting' : c.state === 'away' ? ' · on another map' : '')
                + (c.shop ? ' · out shopping' : c.wt >= 70 ? ` · bag ${c.wt}% full` : '')
                + (c.watch ? ' · on lookout' : '') + (c.pet ? ` · ${c.pet} out` : '') + '\nClick: their bag. Right-click: Fly Wing to them. Drag: move.';
        }
        for (const [cid, f] of shown) if (!seen.has(cid)) { f.el.remove(); shown.delete(cid); }
        place();
    }

    // Shown on a map with companions, like Basic Info: NPC talk keeps them up with the
    // last numbers (no request then, the server holds our scripts) until it closes.
    // (Loaded a moment after the mod, so the first map:enter may have passed: the Basic
    // Info window on screen says we're in the game too.)
    let onMap = false, hasParty = false;
    const inGame = () => onMap || !!document.getElementById('BasicInfo')?.isConnected;
    const visible = () => inGame() && hasParty;
    const sync = () => wrap.classList.toggle('hidden', !visible());

    let busy = false, quietUntil = 0;
    async function refresh() {
        sync();
        if (!inGame() || busy || inDialog() || Date.now() < quietUntil) return;
        busy = true;
        try {
            const list = parseHud(await api.server.request('clstat', 'hud', { timeout: 3000 }));
            fastUntil = 0;
            hasParty = list.length > 0;
            draw(list);
            sync();
        } catch {
            // Between maps or busy: try again in a while (soon while just arrived).
            quietUntil = Date.now() + (Date.now() < fastUntil ? 2000 : 10000);
        }
        finally { busy = false; }
    }
    // Just arrived (or just loaded): ask every 0.3 s, one at a time, until the first
    // answer, for at most 6 s; then the 1.5 s timer alone.
    let fastTimer = 0, fastUntil = 0;
    function hurry() {
        fastUntil = Date.now() + 6000;
        clearInterval(fastTimer);
        fastTimer = setInterval(() => Date.now() < fastUntil ? refresh() : clearInterval(fastTimer), 300);
    }
    hurry();
    const timer = setInterval(refresh, 1500);
    api.cleanup(() => { clearInterval(timer); clearInterval(fastTimer); });
    api.on('map:enter', () => { onMap = true; quietUntil = 0; hurry(); });
    api.on('exit', () => { onMap = false; hasParty = false; sync(); });
    api.on('map:leave', ({ reason } = {}) => { onMap = false; if (reason === 'disconnected') hasParty = false; sync(); });
    addEventListener('resize', place);
    api.cleanup(() => removeEventListener('resize', place));

    // Drag to move (5 px before it counts), drag the grip to resize, a plain click on a
    // frame opens its bag.
    let drag = null;
    wrap.addEventListener('mousedown', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        const resize = event.composedPath().includes(grip);
        drag = { x: event.clientX, y: event.clientY, left: wrap.offsetLeft, top: wrap.offsetTop, size, resize, moved: false,
            w: wrap.offsetWidth, cid: event.composedPath().find(n => n.classList?.contains('fr'))?.dataset.cid };
        if (resize) grip.classList.add('on');
    });
    const onMove = event => {
        if (!drag) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        drag.moved = true;
        if (drag.resize) {
            size = Math.max(60, Math.min(160, Math.round((drag.size + dx * 100 / drag.w) / 5) * 5));
            place();
        } else {
            pos = { left: drag.left + dx, top: drag.top + dy };
            place();
        }
    };
    const onUp = () => {
        if (!drag) return;
        grip.classList.remove('on');
        if (drag.moved && drag.resize) save('frames_size', { size, from: setSize });
        else if (drag.moved) save('frames_pos_' + layout, { left: wrap.offsetLeft, top: wrap.offsetTop });
        else if (drag.cid && openBag) openBag(drag.cid);
        drag = null;
    };
    // 3.11.0: a right-click flies you to that companion (one Fly Wing; @clgoto says why not).
    wrap.addEventListener('contextmenu', event => {
        event.preventDefault();
        const cid = event.composedPath().find(n => n.classList?.contains('fr'))?.dataset.cid;
        if (cid && !inDialog()) Promise.resolve(api.server.request('clgoto', cid, { timeout: 4000 })).catch(() => {});
    });
    addEventListener('mousemove', onMove, true);
    addEventListener('mouseup', onUp, true);
    api.cleanup(() => { removeEventListener('mousemove', onMove, true); removeEventListener('mouseup', onUp, true); });
}
