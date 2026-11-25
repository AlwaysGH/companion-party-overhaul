// companion-party-overhaul 3.2.0: companion portraits (class art by Gravity, cut out by hand).
//   When a companion says something in the chat box, its class portrait slides in at
//   the bottom right (where NPC cutins go) with the line in a speech bubble. The next
//   speaker steps in front and the one before steps back, dimmed; a third fades out.
//   Lines take turns (each stays up long enough to read); party-chat lines (battle
//   callouts, calls for help) are urgent: they go ahead of small talk, in a red bubble,
//   and small talk that waited more than 12 s is dropped. A few seconds after the last
//   line everyone slides out. Hidden while an NPC dialog or an NPC cutin is up; a click
//   on the bubble dismisses it all.
//   Who's who comes from the server ("@@event clcast Name:class:sex|", L_Gather); the
//   pictures from portraits_data.js (made by Portraits\tools\build_data.ps1).
//   3.9.1: the game's own generic AI chat, which companions say too, is left out
//   (app_chat.js, made by tools/make_app_chat.ps1).
import PICS from './portraits_data.js';
import { APP_CHAT } from './app_chat.js';

// The game's lines as they are, and those with {item}, $victim etc. as patterns.
const APP_SAME = new Set(APP_CHAT.filter(t => !/\{\w+\}|\$\w+/.test(t)));
const APP_LIKE = APP_CHAT.filter(t => /\{\w+\}|\$\w+/.test(t)).map(t => new RegExp('^'
    + t.split(/\{\w+\}|\$\w+/).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+?') + '$'));
const appLine = t => APP_SAME.has(t) || APP_LIKE.some(r => r.test(t));

// Job id -> picture name (pre-renewal classes). Babies and the transcendent 1st classes
// (High Novice ... High Thief) wear the same outfit as the normal class, so they use its picture.
// (3.9.1: shared with the party frames, frames.js.)
export const CLASS_KEY = {
    0: 'novice', 1: 'swordman', 2: 'mage', 3: 'archer', 4: 'acolyte', 5: 'merchant', 6: 'thief',
    7: 'knight', 8: 'priest', 9: 'wizard', 10: 'blacksmith', 11: 'hunter', 12: 'assassin', 13: 'knight',
    14: 'crusader', 15: 'monk', 16: 'sage', 17: 'rogue', 18: 'alchemist', 19: 'bard', 20: 'dancer',
    21: 'crusader', 23: 'super_novice', 24: 'gunslinger', 25: 'ninja',
    4001: 'novice', 4002: 'swordman', 4003: 'mage', 4004: 'archer', 4005: 'acolyte',
    4006: 'merchant', 4007: 'thief', 4008: 'lord_knight', 4009: 'high_priest', 4010: 'high_wizard',
    4011: 'whitesmith', 4012: 'sniper', 4013: 'assassin_cross', 4014: 'lord_knight', 4015: 'paladin',
    4016: 'champion', 4017: 'professor', 4018: 'stalker', 4019: 'creator', 4020: 'clown', 4021: 'gypsy',
    4022: 'paladin',
    4023: 'novice', 4024: 'swordman', 4025: 'mage', 4026: 'archer', 4027: 'acolyte', 4028: 'merchant',
    4029: 'thief', 4030: 'knight', 4031: 'priest', 4032: 'wizard', 4033: 'blacksmith', 4034: 'hunter',
    4035: 'assassin', 4036: 'knight', 4037: 'crusader', 4038: 'monk', 4039: 'sage', 4040: 'rogue',
    4041: 'alchemist', 4042: 'bard', 4043: 'dancer', 4044: 'crusader', 4045: 'super_novice',
    4046: 'taekwon', 4047: 'star_gladiator', 4048: 'star_gladiator', 4049: 'soul_linker',
};
// 3.14.5: 3rd classes + expanded (art by patkaiclan's set, the newer outfits). Job ids from
// the client's own table (Online.js): normal, trans (_H), mounts (2), babies (_B) and the
// alternate-outfit ids (_2ND, 4332-4348) all share one picture per class.
for (const [key, ids] of Object.entries({
    rune_knight: [4054, 4060, 4080, 4081, 4096, 4109, 4332, 4345], warlock: [4055, 4061, 4097, 4335],
    ranger: [4056, 4062, 4084, 4085, 4098, 4111, 4337, 4346], arch_bishop: [4057, 4063, 4099, 4336],
    mechanic: [4058, 4064, 4086, 4087, 4100, 4112, 4333, 4347], guillotine_cross: [4059, 4065, 4101, 4334],
    royal_guard: [4066, 4073, 4082, 4083, 4102, 4110, 4338, 4348], sorcerer: [4067, 4074, 4103, 4341],
    minstrel: [4068, 4075, 4104, 4343], wanderer: [4069, 4076, 4105, 4344], sura: [4070, 4077, 4106, 4342],
    genetic: [4071, 4078, 4107, 4339], shadow_chaser: [4072, 4079, 4108, 4340],
    kagerou: [4211, 4223], oboro: [4212, 4224], rebellion: [4215, 4229], summoner: [4218, 4220],
    star_emperor: [4239, 4241, 4243, 4244], soul_reaper: [4240, 4242],
    // 3.14.5: 4th classes (patkaiclan's set). Ids from JobConst.js: normal, _RIDING, and the
    // 4278-4281 / 4316 second mounts.
    dragon_knight: [4252, 4265, 4280], meister: [4253, 4266, 4279], shadow_cross: [4254, 4267],
    arch_mage: [4255, 4268], cardinal: [4256, 4269], windhawk: [4257, 4270, 4278],
    imperial_guard: [4258, 4271, 4281], biolo: [4259, 4272], abyss_chaser: [4260, 4273],
    elemental_master: [4261, 4274], inquisitor: [4262, 4275], troubadour: [4263, 4276],
    trouvere: [4264, 4277], sky_emperor: [4302, 4309, 4316], soul_ascetic: [4303, 4310],
    shinkiro: [4304, 4311], shiranui: [4305, 4312], night_watch: [4306, 4313],
    hyper_novice: [4307, 4314], spirit_handler: [4308, 4315],
})) for (const id of ids) CLASS_KEY[id] = key;
const CLASS_NAME = key => key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

const STYLE = `
* { cursor: inherit !important; }
.stage { position: fixed; right: 0; bottom: 0; width: 320px; height: 480px; transform-origin: bottom right;
  pointer-events: none; transition: opacity .25s; }
.stage.hidden { opacity: 0; }
.por { position: absolute; right: 0; bottom: 0; width: 320px; height: 480px;
  transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s, filter .45s; will-change: transform, opacity; }
.por img { width: 100%; height: 100%; display: block; filter: drop-shadow(0 4px 10px rgba(0,0,0,.35)); }
.por.enter { transform: translateX(140px); opacity: 0; }
.por.front { transform: none; opacity: 1; filter: none; z-index: 3; }
.por.back { transform: translateX(-175px) scale(.86); transform-origin: bottom right; opacity: .95;
  filter: brightness(.55) saturate(.6); z-index: 2; }
.por.gone { transform: translateX(-280px) scale(.78); transform-origin: bottom right; opacity: 0;
  filter: brightness(.4) saturate(.5); z-index: 1; }
.por.leave { transform: translateX(140px); opacity: 0; }
.bubble { position: absolute; right: 70px; bottom: 470px; width: 300px; z-index: 5; pointer-events: auto;
  background: #fbfaf6; color: #2b2b2b; border: 1px solid #8a7d68; border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,.35); padding: 8px 11px 9px; font: 12px/1.4 Tahoma, Verdana, sans-serif;
  opacity: 0; transform: translateY(6px); transition: opacity .2s, transform .2s; visibility: hidden; }
.bubble.on { opacity: 1; transform: none; visibility: visible; }
.bubble::after { content: ""; position: absolute; right: 120px; bottom: -9px; width: 14px; height: 14px;
  background: #fbfaf6; border-right: 1px solid #8a7d68; border-bottom: 1px solid #8a7d68; transform: rotate(45deg); }
.who { font-weight: bold; color: #2f7fb8; margin-bottom: 2px; }
.who small { font-weight: normal; color: #8b8b8b; margin-left: 4px; }
.bubble.urgent { border-color: #c0392b; }
.bubble.urgent .who { color: #c0392b; }
.bubble.plain, .bubble.plain * { cursor: default !important; }
/* 3.14.5: group cut-in (style C+): lines said together. The first speaker stands at the corner,
   the others to its left, smaller, a little dimmed and flush with the bottom of the screen;
   one shared bubble to the left of the main face carries every line. */
.por.grp { transform-origin: bottom right; filter: brightness(.78) saturate(.75); z-index: 2; }
.por.grp.leave { opacity: 0; }
.bubble.grp { right: 205px; bottom: 285px; width: auto; min-width: 170px; max-width: 280px; }
.bubble.grp .who { display: none; }
.bubble.grp .ln { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bubble.grp .ln b { color: #2f7fb8; }
.bubble.grp.urgent .ln b { color: #c0392b; }
.bubble.grp::after { right: -9px; bottom: 24px; border-right: 1px solid #8a7d68; border-bottom: 0; border-top: 1px solid #8a7d68; }
.bubble.grp.urgent::after { border-color: #c0392b; }
`;

// 3.13.10: the game picks its cursor from the map cell under the mouse, and a mod's box
// can't tell it the mouse is on a box (its own windows can), so over a wall or the black
// edge of the map the box showed the game's "can't walk there" cursor. Over a box: the
// game's cursor hides and the plain arrow shows; back on leaving. Returns the "back" switch
// (call it when the box goes, as the mouse may never leave it).
// 3.14.1 (user: the game's own cursor, without the "can't walk" cross): a mod window
// (api.ui.window) gets the client's hover guard, which stops the map reading the cell under
// the mouse while it's over the window. A box borrows it: one small window, never shown,
// whose host hears our mouseenter/mouseleave. The game's cursor then stays as it was and
// stops following the cells. No window possible: the old way (the plain arrow).
let _guard = null;
function guardHost(api) {
    if (_guard !== null) return _guard;
    _guard = false;
    try {
        const w = api && api.ui && api.ui.window({ id: 'cursor-guard', title: 'Companions', width: 120, height: 120, resizable: false });
        const h = w && w.body && w.body.getRootNode && w.body.getRootNode().host;
        if (h) _guard = h;
    } catch (e) { console.warn('[companion-party-overhaul] cursor guard:', e); }
    return _guard;
}
// 3.14.5: exported for the party frames too; shown(el) says whether it's still on screen
// (a bubble: class "on"; the frames pass their own).
// 3.14.5: the game's own Basic Information window first. Its guard (Online.js, a GUIComponent
// in MouseMode.STOP) also turns the cursor back to the arrow; a mod window's host only stops the
// map, so a cursor that came from a no-walk cell kept its red cross.
// Its host id is the component's versioned name (createBasicInfo: "BasicInfoV5", "BasicInfoV4"...),
// so look for any id starting with BasicInfo; then other always-open STOP windows.
const stopHost = () => {
    for (const sel of ['[id^="BasicInfo"]', '[id^="ShortCut"]', '[id^="MiniMap"]']) {
        for (const b of document.querySelectorAll(sel)) if (b.isConnected && b.shadowRoot) return b;   // a GUIComponent host
    }
    return null;
};
export function plainCursor(el, api, shown = x => x.classList.contains('on')) {
    let on = false, how = '', gEl = null;
    const game = () => document.querySelector('.cursor');
    el.addEventListener('mouseenter', () => {
        if (on) return;
        const g = stopHost() || guardHost(api);
        if (g) {
            on = true; how = 'guard'; gEl = g;
            g.dispatchEvent(new Event('mouseenter'));
            return;
        }
        const c = game();
        if (!c || getComputedStyle(c).display === 'none') return;   // the game's cursor is off: the arrow shows anyway
        on = true; how = 'hide';
        c.style.visibility = 'hidden';
        el.classList.add('plain');
    });
    const back = () => {
        if (!on) return;
        on = false;
        if (how === 'guard') {
            if (gEl) gEl.dispatchEvent(new Event('mouseleave'));   // the map reads the cells again
            gEl = null;
            return;
        }
        const c = game();
        if (c) c.style.visibility = '';
        el.classList.remove('plain');
    };
    el.addEventListener('mouseleave', back);
    // The game lets its guards go after any drag (a mousemove re-check); entering again is a no-op
    // while it holds, so moving over us keeps the map stopped.
    el.addEventListener('mousemove', () => { if (on && how === 'guard' && gEl) gEl.dispatchEvent(new Event('mouseenter')); });
    // A box that fades out under a still mouse never hears it leave: the map must read the
    // cells again at once, or a click on the ground would do nothing.
    if (typeof MutationObserver === 'function')
        new MutationObserver(() => { if (on && !shown(el)) back(); })
            .observe(el, { attributes: true, attributeFilter: ['class'] });
    return back;
}

// 3.9.0 "Can we keep it?": a companion asks you, its portrait at the bottom right as for
// its chat lines, with Yes / Not now in the bubble. Shown even with portraits switched off
// (it's a question, not chatter); the chat portraits step aside while it's up, and it steps
// aside for an NPC's dialog. Resolves true (Yes) or false (Not now); closeAsk() (the server
// gave up waiting) or leaving the map closes it without an answer.
const ASK_STYLE = STYLE + `
.stage { pointer-events: none; }
.bubble { width: 290px; }
.bubble .q { margin: 2px 0 0; }
.btns { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; margin-top: 8px; }
.por.two.side { transform: translateX(-165px) scale(.93); transform-origin: bottom right; opacity: 1; filter: brightness(.9); z-index: 2; }
.por.front { z-index: 3; }
.btns button { font: 11px Tahoma, Verdana, sans-serif; color: #333; padding: 2px 10px; border-radius: 3px; border: 1px solid #7f8ea8;
  background: linear-gradient(#fdfdfd, #d7dfeb); }
.btns button:hover { background: linear-gradient(#fff, #c5d6ee); }
.btns button.yes { border-color: #5a8fc4; font-weight: bold; }
.last { color: #8b8b8b; font-size: 10px; margin-top: 4px; }
.tag { display: inline-block; float: right; font: bold 9px Tahoma, Verdana, sans-serif; letter-spacing: .04em; text-transform: uppercase;
  color: #2f7fb8; border: 1px solid #9cc3e0; background: #eef6fc; border-radius: 3px; padding: 0 4px; margin-top: 1px; }
.btns button.two { display: block; width: 100%; padding: 4px 10px; font-weight: normal; text-align: left; }
.btns button.two b { font-weight: bold; }
.btns button.two small { font-size: 10px; color: #4f6a8f; margin-left: 4px; }
/* 3.14.4: one colour per family (--k): edge glow, a light tint, the name and the label.
   Heart rose (bond, story), Growth green (trait), Game gold (quiz, gold, don),
   Battle red (mvp, danger), Errands blue (shop, pet). */
.bubble.k { border-color: var(--k); background: color-mix(in srgb, var(--k) 9%, #fbfaf6);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--k) 35%, transparent), 0 2px 12px color-mix(in srgb, var(--k) 55%, transparent); }
.bubble.k::after { border-color: var(--k); background: color-mix(in srgb, var(--k) 9%, #fbfaf6); }
.bubble.k .who { color: var(--k); }
.bubble.k .tag { color: var(--k); border-color: var(--k); background: color-mix(in srgb, var(--k) 12%, #fff); }
.bubble.bond, .bubble.story { --k: #c2507a; }
.bubble.trait, .bubble.ready { --k: #2e8b57; }
.bubble.quiz, .bubble.gold, .bubble.don { --k: #b8900f; }
.bubble.gold { background: linear-gradient(#fffaf0, #fff1cf); }
.bubble.gold::after { background: #fff1cf; }
.bubble.mvp, .bubble.danger { --k: #c0392b; }
.bubble.danger .tag { color: #fff; background: #c0392b; }
.bubble.shop, .bubble.pet { --k: #2f7fb8; }
.bubble.story .btns button { text-align: left; }
`;
const ASK_TAGS = { quiz: 'Pop quiz', gold: '✦ Golden question', don: 'Double or nothing', danger: 'Danger', trait: '❦ Growth', story: 'Life story',
    bond: '♥ Bond', mvp: '♛ MVP', shop: 'Shopping', pet: 'Pet', ready: 'Ready' };
const askWatch = new Set();   // the chat portraits' "step aside" switches
let askOpen = null;           // { close(answer) }
// 3.13.11: tag given: only a box with that tag (a danger box's close mustn't close an MVP find).
export function closeAsk(tag) { if (!tag || askOpen?.tag === tag) askOpen?.close(undefined); }

export function askKeep(api, { name, cls, sex, last, text }) {
    return askChoice(api, { name, cls, sex, text, options: ['Yes', 'Not now'], note: last ? `The last time ${name} asks.` : '', tag: 'pet' })
        .then(i => i === undefined ? undefined : i === 0);
}

// 3.9.1: the same, with two or three answers of the companion's own ("hey boss"
// moments, client/index.js). Resolves the answer's index, or undefined. With
// second ({ name, cls, sex }): a second portrait behind the first (a story invite:
// two companions talking), and the bubble names them both. 3.10.2: tag (quiz, gold, don)
// puts a small label in the corner; gold also turns the bubble golden.
export function askChoice(api, { name, cls, sex, text, options, note = '', second = null, tag = '' }) {
    askOpen?.close(undefined);
    return new Promise(resolve => {
        const base = CLASS_KEY[cls];
        const key = base && `${base}_${sex === 1 ? 'm' : 'f'}`;
        const base2 = second && CLASS_KEY[second.cls];
        const key2 = base2 && `${base2}_${second.sex === 1 ? 'm' : 'f'}`;
        const host = document.createElement('div');
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = `<style>${ASK_STYLE}</style><div class="stage">`
            + (key2 && PICS[key2] ? `<div class="por two enter"><img alt="" src="${PICS[key2]}"></div>` : '')
            + `<div class="por enter"><img alt=""></div>`
            + `<div class="bubble"><div class="who"></div><div class="q"></div>`
            + `<div class="btns"></div><div class="last"></div></div></div>`;
        // The answers: the first is the "yes" one (bold).
        const btns = root.querySelector('.btns');
        options.filter(Boolean).forEach((label, i) => {
            const b = document.createElement('button');
            // 3.14.0: "Name Rank^what it gives" (a trait talk). 3.14.1: one clean line,
            // "Steadfast (Rank IV · Takes 5% less damage)", both answers alike, full width.
            const [main, sub] = String(label).split('^');
            if (sub) {
                const m = /^(.*?)\s+(I|II|III|IV)$/.exec(main);
                const nm = document.createElement('b');
                nm.textContent = m ? m[1] : main;
                const eff = sub.charAt(0).toUpperCase() + sub.slice(1);
                const s = document.createElement('small');
                s.textContent = '(' + (m ? `Rank ${m[2]} · ` : '') + eff + ')';
                b.append(nm, s);
                b.className = 'two';
            } else {
                b.textContent = main;
                if (i === 0) b.className = 'yes';
            }
            b.addEventListener('click', () => close(i));
            btns.append(b);
        });
        if (note) root.querySelector('.last').textContent = note;
        else root.querySelector('.last').remove();
        const stageEl = root.querySelector('.stage'), por = root.querySelector('.por:not(.two)'), bubble = root.querySelector('.bubble');
        const por2 = root.querySelector('.por.two');
        if (key && PICS[key]) por.querySelector('img').src = PICS[key];
        else por.remove();   // no picture for this class: the bubble alone
        const who = root.querySelector('.who');
        who.textContent = second ? `${name} & ${second.name}` : name;
        const small = document.createElement('small');
        small.textContent = second ? '' : (base ? CLASS_NAME(base) : '');
        who.append(small);
        if (ASK_TAGS[tag]) {
            const t = document.createElement('span');
            t.className = 'tag';
            t.textContent = ASK_TAGS[tag];
            who.append(t);
            bubble.classList.add(tag, 'k');
        }
        root.querySelector('.q').textContent = text;
        const fit = () => { stageEl.style.transform = `scale(${Math.min(1, (innerHeight * 0.75) / 480)})`; };
        fit();
        addEventListener('resize', fit);
        host.style.cssText = 'position: fixed; z-index: 39;';
        for (const type of ['mousedown', 'mouseup', 'click', 'contextmenu']) bubble.addEventListener(type, e => e.stopPropagation());
        const cursorBack = plainCursor(bubble, api);
        document.body.appendChild(host);
        void por.offsetWidth;
        por.className = 'por front';
        if (por2) por2.className = 'por two side';
        setTimeout(() => bubble.classList.add('on'), 260);
        askWatch.forEach(f => f(true));

        // Out of the way of an NPC's dialog, as the chat portraits are.
        const npcOpen = new Set();
        const hideCheck = () => stageEl.classList.toggle('hidden', npcOpen.size > 0 || !!document.getElementById('cutin'));
        const offs = [
            api.on('ui:append', c => { if (c?.name === 'NpcBox' || c?.name === 'NpcMenu') { npcOpen.add(c.name); hideCheck(); } }, { replay: true }),
            api.on('ui:remove', c => { if (npcOpen.delete(c?.name)) hideCheck(); }),
            api.on('map:leave', () => close(undefined)),
        ];
        const bodyWatch = new MutationObserver(hideCheck);
        bodyWatch.observe(document.body, { childList: true });

        function close(answer) {
            if (askOpen !== handle) return;
            askOpen = null;
            removeEventListener('resize', fit);
            bodyWatch.disconnect();
            for (const off of offs) { try { off?.(); } catch { /* fine */ } }
            bubble.classList.remove('on');
            cursorBack();
            por.className = 'por leave';
            if (por2) por2.className = 'por two leave';
            setTimeout(() => host.remove(), 450);
            askWatch.forEach(f => f(false));
            if (answer !== undefined) resolve(answer);
        }
        const handle = { close, tag };
        askOpen = handle;
    });
}

export default function initPortraits(parameters, api) {
    const flag = v => v !== false && v !== 0;
    if (!flag(parameters?.portraits) || typeof MutationObserver !== 'function') return;
    const smallTalk = flag(parameters?.portrait_small_talk);
    const pace = [1.35, 1, 0.7][Math.round(Number(parameters?.portrait_speed ?? 1))] ?? 1;   // Slow, Normal, Fast
    const size = Math.min(100, Math.max(50, Number(parameters?.portrait_size ?? 100) || 100)) / 100;

    // ---- timing (the demo's) ----
    const READ_MS = t => pace * Math.min(6000, Math.max(2400, 1500 + t.length * 50));
    const RUSH = 0.7;          // with 2+ lines waiting, each shows 30% shorter
    const STALE_MS = 12000;    // small talk that waited longer is dropped
    const LINGER_MS = 3500;    // after the last line, they stay this long

    // ---- who's who ----
    const cast = new Map();    // name -> { key, cls }
    api.on('server:event', ({ command, text }) => {
        if (command !== 'clcast') return;
        cast.clear();
        for (const part of String(text || '').split('|')) {
            const [name, cls, sex] = part.split(':');
            const base = CLASS_KEY[Number(cls)];
            if (!name || !base) continue;
            const key = `${base}_${Number(sex) === 1 ? 'm' : 'f'}`;
            if (PICS[key]) cast.set(name, { key, cls: CLASS_NAME(base) });
        }
    });

    // ---- the stage ----
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style><div class="stage"><div class="bubble"><div class="who"></div><div class="txt"></div></div></div>`;
    const stageEl = root.querySelector('.stage');
    const bubble = root.querySelector('.bubble');
    stageEl.style.transform = `scale(${size})`;
    host.style.cssText = 'position: fixed; z-index: 39;';   // under the game's NPC cutin (40)
    for (const type of ['mousedown', 'mouseup', 'click', 'contextmenu']) bubble.addEventListener(type, e => e.stopPropagation());
    const cursorBack = plainCursor(bubble, api);
    document.body.appendChild(host);
    api.cleanup(() => { cursorBack(); host.remove(); });

    const els = new Map();     // name -> portrait element
    let stage = [];            // names, most recent speaker first
    let queue = [];            // { name, text, urgent, at }
    let current = null, timer = 0, lingerTimer = 0, typeTimer = 0, bubbleTimer = 0;

    function portrait(name) {
        let d = els.get(name);
        if (d) return d;
        d = document.createElement('div');
        d.className = 'por enter';
        const img = document.createElement('img');
        img.src = PICS[cast.get(name).key];
        img.alt = name;
        img.draggable = false;
        d.append(img);
        stageEl.insertBefore(d, bubble);
        els.set(name, d);
        return d;
    }

    function layout() {
        stage = stage.slice(0, 3);
        for (const [name, d] of els) {
            const i = stage.indexOf(name);
            d.className = 'por ' + (i === 0 ? 'front' : i === 1 ? 'back' : 'gone');
            if (i < 0) setTimeout(() => { if (!stage.includes(name) && els.get(name) === d) { d.remove(); els.delete(name); } }, 500);
        }
    }

    // 3.14.5: the group cut-in's other speakers (portrait elements of their own, not in els).
    let extras = [];
    function dropExtras() {
        const gone = extras;
        extras = [];
        for (const d of gone) { d.classList.add('leave'); setTimeout(() => d.remove(), 500); }
        bubble.classList.remove('grp');
    }
    const GATHER_MS = 350;     // lines from different companions this close together are one group
    const GROUP_MS = 700;      // ...counted from the first one's arrival

    function sayGroup(lines) {
        clearTimeout(lingerTimer);
        dropExtras();
        const main = lines[0], rest = lines.slice(1);
        current = main;
        const d = portrait(main.name);
        stage = [main.name];
        void d.offsetWidth;
        layout();
        // The others: half the screen height or a bit less with many, overlapping more as they grow.
        const s = rest.length > 4 ? 0.5 : 0.56;
        const step = 320 * s * Math.max(0.3, 0.5 - 0.035 * Math.max(0, rest.length - 2));
        rest.forEach((l, i) => {
            const e = document.createElement('div');
            e.className = 'por grp enter';
            const img = document.createElement('img');
            img.src = PICS[cast.get(l.name).key];
            img.alt = l.name;
            img.draggable = false;
            e.append(img);
            e.style.zIndex = String(2);
            stageEl.insertBefore(e, stageEl.firstChild);   // behind the main speaker
            extras.push(e);
            void e.offsetWidth;
            e.classList.remove('enter');
            e.style.transform = `translateX(${-(198 + i * step)}px) scale(${s})`;
        });
        bubble.classList.remove('on');
        clearTimeout(bubbleTimer);
        clearInterval(typeTimer);
        bubbleTimer = setTimeout(() => {
            bubble.classList.add('grp');
            bubble.classList.toggle('urgent', lines.some(l => l.urgent));
            const txt = bubble.querySelector('.txt');
            txt.textContent = '';
            for (const l of lines) {
                const ln = document.createElement('div');
                ln.className = 'ln';
                const b = document.createElement('b');
                b.textContent = l.name + ': ';
                ln.append(b, document.createTextNode(l.text));
                txt.append(ln);
            }
            bubble.classList.add('on');
        }, 260);
        clearTimeout(timer);
        timer = setTimeout(next, Math.min(9000, READ_MS(lines.map(l => l.text).join(' ')) * 0.8));
    }

    function say(line) {
        clearTimeout(lingerTimer);
        if (extras.length) dropExtras();
        bubble.classList.remove('grp');
        current = line;
        const same = stage[0] === line.name;
        if (!same) {
            const d = portrait(line.name);
            stage = [line.name, ...stage.filter(n => n !== line.name)];
            void d.offsetWidth;   // let "enter" apply before it slides in
            layout();
        }
        const shown = bubble.classList.contains('on');
        bubble.classList.remove('on');
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => {
            bubble.classList.toggle('urgent', !!line.urgent);
            const who = bubble.querySelector('.who');
            who.textContent = line.name;
            const small = document.createElement('small');
            small.textContent = cast.get(line.name)?.cls || '';
            who.append(small);
            const txt = bubble.querySelector('.txt');
            txt.textContent = '';
            bubble.classList.add('on');
            let i = 0;
            clearInterval(typeTimer);
            typeTimer = setInterval(() => {
                txt.textContent = line.text.slice(0, ++i);
                if (i >= line.text.length) clearInterval(typeTimer);
            }, 18);
        }, same && shown ? 120 : 260);
        clearTimeout(timer);
        timer = setTimeout(next, READ_MS(line.text) * (queue.length >= 2 ? RUSH : 1));
    }

    function next() {
        current = null;
        // 3.14.5: while a question box is up the portraits wait behind it (the lines are in the
        // chat box already); they play once you've answered (onAsk).
        if (asked) return;
        const now = Date.now();
        queue = queue.filter(l => l.urgent || now - l.at < STALE_MS);
        const l = queue.shift();
        if (l && cast.has(l.name)) {
            // 3.14.5: other companions' lines that came with it (within GROUP_MS): one group cut-in.
            const group = [l];
            for (let k = 0; k < queue.length && group.length < 8;) {
                const o = queue[k];
                if (o.at - l.at <= GROUP_MS && cast.has(o.name) && !group.some(g => g.name === o.name)) {
                    group.push(o);
                    queue.splice(k, 1);
                } else k++;
            }
            return group.length > 1 ? sayGroup(group) : say(l);
        }
        if (l) return next();
        lingerTimer = setTimeout(clearAll, LINGER_MS);
    }

    // Everyone off, at once (map change, logout, a click on the bubble).
    function clearAll() {
        clearTimeout(timer); clearTimeout(lingerTimer); clearTimeout(bubbleTimer); clearInterval(typeTimer);
        current = null; queue = []; stage = [];
        clearTimeout(gatherTimer);
        dropExtras();
        bubble.classList.remove('on');
        cursorBack();
        for (const d of els.values()) d.className = 'por leave';
        const gone = [...els.entries()];
        setTimeout(() => { for (const [name, d] of gone) if (els.get(name) === d && !stage.includes(name)) { d.remove(); els.delete(name); } }, 500);
    }
    bubble.addEventListener('click', clearAll);

    function arrive(name, text, urgent) {
        const line = { name, text, urgent, at: Date.now() };
        if (urgent) {
            const k = queue.findIndex(l => !l.urgent);   // ahead of small talk, behind other urgent lines
            if (k < 0) queue.push(line); else queue.splice(k, 0, line);
        } else queue.push(line);
        // 3.14.5: a short wait before starting, so lines said together arrive and group up;
        // and nothing starts while a question box is up.
        if (!current && !asked && !gatherTimer) {
            clearTimeout(lingerTimer);
            gatherTimer = setTimeout(() => { gatherTimer = 0; if (!current && !asked) next(); }, GATHER_MS);
        }
    }
    let gatherTimer = 0;

    // ---- stepping aside for NPCs ----
    const npcOpen = new Set();
    let asked = false;   // 3.9.0: a "Can we keep it?" is up (askKeep)
    const hideCheck = () => stageEl.classList.toggle('hidden', asked || npcOpen.size > 0 || !!document.getElementById('cutin'));
    // 3.14.5: once the box closes, the lines that waited behind it play.
    // (next() with nothing waiting starts the usual linger and clears the stage.)
    const onAsk = on => { asked = on; hideCheck(); if (!on && !current) setTimeout(() => { if (!current && !asked) next(); }, 400); };
    askWatch.add(onAsk);
    api.cleanup(() => askWatch.delete(onAsk));
    api.on('ui:append', c => { if (c?.name === 'NpcBox' || c?.name === 'NpcMenu') { npcOpen.add(c.name); hideCheck(); } }, { replay: true });
    api.on('ui:remove', c => { if (npcOpen.delete(c?.name)) hideCheck(); });
    const bodyWatch = new MutationObserver(hideCheck);   // the game's cutin is an <img id="cutin"> on <body>
    bodyWatch.observe(document.body, { childList: true });
    api.cleanup(() => bodyWatch.disconnect());

    // ---- listening to the chat box ----
    let watched = null, observer = null, since = 0;
    const seen = new Map();    // the same line lands once in every chat tab
    const onLine = div => {
        if (!(div instanceof HTMLElement) || div.tagName !== 'DIV' || !cast.size) return;
        const text = (div.textContent || '').trim();
        let name = null;
        for (const n of cast.keys()) if (text.startsWith(n + ' : ')) { name = n; break; }
        if (!name) return;
        const said = text.slice(name.length + 3).trim();
        if (!said || appLine(said)) return;
        const urgent = div.dataset.cpoParty === '1' || div.style.color.replace(/\s/g, '') === 'rgb(230,215,200)';
        if (!urgent && !smallTalk) return;
        const now = Date.now(), k = name + '|' + said;
        if (now - (seen.get(k) || 0) < 2500) return;
        seen.set(k, now);
        if (seen.size > 200) for (const [key, at] of seen) if (now - at > 5000) seen.delete(key);
        arrive(name, said, urgent);
    };
    const watch = component => {
        const r = component?.root;
        if (component?.name !== 'ChatBox' || !r || r === watched) return;
        observer?.disconnect();
        watched = r;
        since = Date.now() + 1000;   // lines put back when the box is drawn again aren't new
        observer = new MutationObserver(records => {
            if (Date.now() < since) return;
            for (const rec of records) rec.addedNodes.forEach(onLine);
        });
        observer.observe(r, { childList: true, subtree: true });
    };
    api.on('ui:append', watch, { replay: true });
    api.on('ui:remove', c => { if (c?.name === 'ChatBox') { observer?.disconnect(); observer = null; watched = null; } });
    api.cleanup(() => observer?.disconnect());

    api.on('map:leave', clearAll);
    api.on('exit', clearAll);
}
