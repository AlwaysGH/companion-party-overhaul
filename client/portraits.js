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
import PICS from './portraits_data.js';

// Job id -> picture name (pre-renewal classes). Babies and the transcendent 1st classes
// (High Novice ... High Thief) wear the same outfit as the normal class, so they use its picture.
const CLASS_KEY = {
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
`;

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
    document.body.appendChild(host);
    api.cleanup(() => host.remove());

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

    function say(line) {
        clearTimeout(lingerTimer);
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
        const now = Date.now();
        queue = queue.filter(l => l.urgent || now - l.at < STALE_MS);
        const l = queue.shift();
        if (l && cast.has(l.name)) return say(l);
        if (l) return next();
        lingerTimer = setTimeout(clearAll, LINGER_MS);
    }

    // Everyone off, at once (map change, logout, a click on the bubble).
    function clearAll() {
        clearTimeout(timer); clearTimeout(lingerTimer); clearTimeout(bubbleTimer); clearInterval(typeTimer);
        current = null; queue = []; stage = [];
        bubble.classList.remove('on');
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
        if (!current) { clearTimeout(lingerTimer); next(); }
    }

    // ---- stepping aside for NPCs ----
    const npcOpen = new Set();
    const hideCheck = () => stageEl.classList.toggle('hidden', npcOpen.size > 0 || !!document.getElementById('cutin'));
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
        if (!said) return;
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
