// companion-party-overhaul: the Companions window.
//   Alt+N (Alt+N is the game's Achievements), or a click on the small "Companions" button, opens it.
//   Status tab: each companion's HP and SP, level and job, and whether it is
//   resting, fallen or on another map, refreshed every second while open.
//   Memories tab: how long you've been together, where you met, monsters and
//   MVPs beaten together, places seen, falls.
//   Bag tab: the party purse (take zeny out, put zeny in) and each companion's
//   own bag as a grid of item icons, like the game's inventory: click a square
//   for its details and Take, double-click to take it all back. Every 3 s while open.
//   It asks @clstat (npc/companion_life.txt, OnCmdStat) for the first two and
//   @clbag (OnCmdBag) for the bag.
//   Drag the button to move it; it and the window remember where they were.

const BTN_STYLE = `
.cb { position: fixed; z-index: 8999; font: bold 11px Tahoma, sans-serif; padding: 4px 9px;
  border: 1px solid #6d8fc2; border-radius: 4px; background: linear-gradient(#f4f7fd, #d5e0f2);
  color: #1f3f73; cursor: pointer; user-select: none; white-space: nowrap; box-shadow: 0 1px 3px #0005; }
.cb:hover { border-color: #3c6fc0; color: #0d2b5a; }
.cb.hurt { border-color: #d0453a; color: #9b1f17; animation: hurt 1.4s ease-in-out infinite; }
@keyframes hurt { 50% { box-shadow: 0 0 8px 2px #ff6b5c99; } }
* { cursor: inherit !important; }
`;

// The game hides the system cursor (".custom-cursor * { cursor: none }") and
// draws its own; that rule can't reach into a mod window, so a hand or text
// cursor of ours showed beside the game's. Everything here takes the game's.
const WIN_STYLE = `
* { cursor: inherit !important; }
.cw { height: 100%; display: flex; flex-direction: column; font: 11px Tahoma, "Segoe UI", sans-serif;
  color: #2b2b2b; background: #f7f8fb; }
.tabs { display: flex; gap: 3px; padding: 5px 6px 0; border-bottom: 1px solid #b9c7de; background: #e9eef7; }
.tabs button { font: bold 11px Tahoma, sans-serif; color: #4a5f80; background: #dde5f2; border: 1px solid #b9c7de;
  border-bottom: none; border-radius: 3px 3px 0 0; padding: 3px 10px; cursor: pointer; }
.tabs button.on { color: #1f3f73; background: #f7f8fb; }
.pane { flex: 1; overflow: auto; padding: 5px 6px; }
.row { padding: 4px 5px 5px; border: 1px solid #d6deeb; border-radius: 3px; background: #fff; margin-bottom: 4px; }
.row.dead { background: #f3e9e9; }
.row.away, .row.off { opacity: .6; }
.top { display: flex; align-items: baseline; gap: 6px; }
.nm { font-weight: bold; color: #1f3f73; }
.jb { color: #6a7a92; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tag { font-size: 10px; padding: 0 5px; border-radius: 7px; color: #fff; background: #8a9ab3; }
.tag.rest { background: #5aa36b; } .tag.dead { background: #c0392b; } .tag.away { background: #b08a2e; } .tag.off { background: #9aa3ad; }
.bar { position: relative; height: 9px; margin-top: 3px; border: 1px solid #9fb0c8; border-radius: 2px; background: #e4e8ef; overflow: hidden; }
.bar i { position: absolute; left: 0; top: 0; bottom: 0; }
.bar.hp i { background: linear-gradient(#5fd86a, #2fa63a); }
.bar.hp.low i { background: linear-gradient(#ff8a7a, #d23b2b); }
.bar.sp i { background: linear-gradient(#6aa8ff, #2f6fd6); }
.bar b { position: absolute; right: 3px; top: -2px; font: 9px Tahoma, sans-serif; color: #1c2533; text-shadow: 0 0 2px #fff; }
.mem { padding: 6px 7px; border: 1px solid #d6deeb; border-radius: 3px; background: #fff; margin-bottom: 5px; line-height: 1.5; }
.mem .nm { font-size: 12px; }
.mem .k { color: #6a7a92; }
.mem .v { color: #1f3f73; font-weight: bold; }
.empty { padding: 18px 8px; text-align: center; color: #6a7a92; }
.purse { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; padding: 6px 7px; margin-bottom: 5px;
  border: 1px solid #d8c88e; border-radius: 3px; background: #fffaf0; }
.purse .z { font-weight: bold; color: #8a6a12; flex: 1; white-space: nowrap; }
.purse input { width: 80px; font: 11px Tahoma, sans-serif; padding: 1px 3px; border: 1px solid #b9c7de; border-radius: 2px; }
.cw button.act { font: bold 10px Tahoma, sans-serif; color: #1f3f73; background: #e4ebf7; border: 1px solid #9fb0c8;
  border-radius: 3px; padding: 1px 6px; cursor: pointer; }
.cw button.act:hover { background: #d3def2; }
.note { padding: 4px 6px; margin-bottom: 5px; color: #6a5a2a; background: #fbf3dc; border: 1px solid #eadbb0; border-radius: 3px; line-height: 1.4; }
.msg { padding: 3px 6px; margin-bottom: 5px; border-radius: 3px; }
.msg.ok { color: #22602f; background: #e5f4e8; } .msg.err { color: #8a2219; background: #f8e5e3; }
.bag { padding: 4px 5px; border: 1px solid #d6deeb; border-radius: 3px; background: #fff; margin-bottom: 5px; }
.am { color: #6a7a92; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, 30px); gap: 2px; padding: 3px 0 1px; }
.sl { position: relative; width: 30px; height: 30px; box-sizing: border-box; border: 1px solid #c9d3e3; border-radius: 3px;
  background: linear-gradient(#ffffff, #eef2f8); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.sl:hover { border-color: #6d8fc2; }
.sl.on { border-color: #3c6fc0; box-shadow: 0 0 0 1px #3c6fc0 inset; background: #e3ecfa; }
.sl.worn { border-color: #d0b25a; background: linear-gradient(#fffdf4, #f6edcf); }
.sl.worn.on { border-color: #b08a2e; box-shadow: 0 0 0 1px #b08a2e inset; }
.sl.use { border-color: #7fb98a; }
.sl.nil { cursor: default; border-style: dashed; border-color: #dde3ec; background: #f7f9fc; }
.sl img { width: 24px; height: 24px; image-rendering: pixelated; pointer-events: none; }
.sl img:not([src]) { visibility: hidden; }
.sl .q, .sl .r { position: absolute; font: bold 9px Tahoma, sans-serif; text-shadow: 0 0 2px #fff, 0 0 2px #fff; pointer-events: none; }
.sl .q { right: 1px; bottom: 0; color: #2b2b2b; }
.sl .r { left: 1px; top: 0; color: #2f5fb3; }
.sl .pips { position: absolute; right: 1px; top: 1px; display: flex; gap: 1px; pointer-events: none; }
.sl .pips i { width: 4px; height: 4px; border-radius: 50%; }
.pc { background: #8e5bd6; } .po { background: #e08a1e; } .pb { background: #c0392b; }
.det { margin-top: 3px; padding: 3px 4px; border: 1px solid #d6deeb; border-radius: 3px; background: #f4f7fc; }
.det .hd { display: flex; align-items: center; gap: 5px; }
.det .more { margin-top: 3px; padding-top: 3px; border-top: 1px dotted #d6deeb; max-height: 140px; overflow: auto; line-height: 1.35; }
.det .op { color: #b0650c; font-weight: bold; }
.det .cd { color: #7a45c4; }
.det .ds { margin-top: 2px; color: #3b4658; white-space: pre-line; }
.det img { width: 24px; height: 24px; image-rendering: pixelated; flex: none; }
.det .tx { flex: 1; min-width: 0; line-height: 1.3; }
.det .tx b { display: block; color: #1f3f73; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.det .tx span { font-size: 10px; color: #6a7a92; }
.bag.over { border-color: #3c6fc0; box-shadow: 0 0 0 2px #9fbbe8; background: #f3f7ff; }
.det.give { border-color: #9fbbe8; background: #eef4ff; }
.det input { width: 38px; font: 10px Tahoma, sans-serif; padding: 0 2px; border: 1px solid #b9c7de; border-radius: 2px; }
.cnt { display: flex; align-items: center; gap: 3px; margin-top: 4px; }
.cnt input { width: 44px; font: bold 12px Tahoma, sans-serif; text-align: center; padding: 1px 2px; -moz-appearance: textfield; }
.cnt input::-webkit-inner-spin-button, .cnt input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.cnt .st { min-width: 20px; }
.cnt .go { margin-left: auto; font-weight: bold; }
.dyes { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 3px 0 1px; }
.dy { display: inline-flex; align-items: center; gap: 3px; }
.dy b { min-width: 34px; text-align: center; font-size: 10px; color: #1f3f73; }
.dy .act { padding: 0 4px; }
.bag .sub { margin-top: 3px; font-size: 10px; font-weight: bold; color: #6a7a92; }
.cw * { scrollbar-width: thin; }
`;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = n => Number(n || 0).toLocaleString('en-US');
// "STR +3" from an option id and value.
const optText = ([id, v]) => OPTION_NAMES[id] ? OPTION_NAMES[id].replace('%d', v).replace('%%', '%') : `Option ${id}: ${v}`;

// Random option names by id (from the ROenglishRE translation by zackdreaver and llchrisll,
// free to use; the same table Affix Forge ships), for the bag's details.
const OPTION_NAMES = {
    1:"MaxHP +%d", 2:"MaxSP +%d", 3:"STR +%d", 4:"AGI +%d", 5:"VIT +%d", 6:"INT +%d", 7:"DEX +%d", 8:"LUK +%d",
    9:"MaxHP +%d%%", 10:"MaxSP +%d%%", 11:"HP Recovery +%d%%", 12:"SP Recovery +%d%%", 13:"ATK +%d%%",
    14:"MATK +%d%%", 15:"ASPD +%d", 16:"ASPD -%d%%", 17:"ATK +%d", 18:"HIT +%d", 19:"MATK +%d", 20:"DEF +%d",
    21:"MDEF +%d", 22:"FLEE +%d", 23:"Perfect Dodge +%d", 24:"Critical +%d",
    25:"Neutral elemental resistance +%d%%", 26:"Water elemental resistance +%d%%",
    27:"Earth elemental resistance +%d%%", 28:"Fire elemental resistance +%d%%",
    29:"Wind elemental resistance +%d%%", 30:"Poison elemental resistance +%d%%",
    31:"Holy elemental resistance +%d%%", 32:"Shadow elemental resistance +%d%%",
    33:"Ghost elemental resistance +%d%%", 34:"Undead elemental resistance +%d%%",
    35:"All elemental (except Neutral) resistance +%d%%", 36:"Neutral monster resistance +%d%%",
    37:"ATK +%d%% against Neutral monster", 38:"Water monster resistance +%d%%",
    39:"ATK +%d%% against Water monster", 40:"Earth monster resistance +%d%%",
    41:"ATK +%d%% against Earth monster", 42:"Fire monster resistance +%d%%", 43:"ATK +%d%% against Fire monster",
    44:"Wind monster resistance +%d%%", 45:"ATK +%d%% against Wind monster", 46:"Poison monster resistance +%d%%",
    47:"ATK +%d%% against Poison monster", 48:"Holy monster resistance +%d%%", 49:"ATK +%d%% against Holy monster",
    50:"Shadow monster resistance +%d%%", 51:"ATK +%d%% against Shadow monster",
    52:"Ghost monster resistance +%d%%", 53:"ATK +%d%% against Ghost monster",
    54:"Undead monster resistance +%d%%", 55:"ATK +%d%% against Undead monster",
    56:"Neutral monster magic resistance +%d%%", 57:"MATK +%d%% against Neutral monster",
    58:"Water monster magic resistance +%d%%", 59:"MATK +%d%% against Water monster",
    60:"Earth monster magic resistance +%d%%", 61:"MATK +%d%% against  Earth monster",
    62:"Fire monster magic resistance +%d%%", 63:"MATK +%d%% against Fire monster",
    64:"Wind monster magic resistance +%d%%", 65:"MATK +%d%% against Wind monster",
    66:"Poison monster magic resistance +%d%%", 67:"MATK +%d%% against Poison monster",
    68:"Holy monster magic resistance +%d%%", 69:"MATK +%d%% against Holy monster",
    70:"Shadow monster magic resistance +%d%%", 71:"MATK +%d%% against Shadow monster",
    72:"Ghost monster magic resistance +%d%%", 73:"MATK +%d%% against Ghost monster",
    74:"Undead monster magic resistance +%d%%", 75:"MATK +%d%% against Undead monster",
    76:"Armor Element: Neutral", 77:"Armor Element: Water", 78:"Armor Element: Earth", 79:"Armor Element: Fire",
    80:"Armor Element: Wind", 81:"Armor Element: Poison", 82:"Armor Element: Holy", 83:"Armor Element: Shadow",
    84:"Armor Element: Ghost", 85:"Armor Element: Undead", 87:"Formless monster resistance +%d%%",
    88:"Undead monster resistance +%d%%", 89:"Brute monster resistance +%d%%", 90:"Plant monster resistance +%d%%",
    91:"Insect monster resistance +%d%%", 92:"Fish monster resistance +%d%%", 93:"Demon monster resistance +%d%%",
    94:"Demihuman monster resistance +%d%%", 95:"Angel monster resistance +%d%%",
    96:"Dragon monster resistance +%d%%", 97:"ATK +%d%% against Formless monster",
    98:"ATK +%d%% against Undead monster", 99:"ATK +%d%% against Brute monster",
    100:"ATK +%d%% against Plant monster", 101:"ATK +%d%% against Insect monster",
    102:"ATK +%d%% against Fish monster", 103:"ATK +%d%% against Demon monster",
    104:"ATK +%d%% against Demihuman monster", 105:"ATK +%d%% against Angel monster",
    106:"ATK +%d%% against Dragon monster", 107:"MATK +%d%% against Formless monster",
    108:"MATK +%d%% against Undead monster", 109:"MATK +%d%% against Brute monster",
    110:"MATK +%d%% against Plant monster", 111:"MATK +%d%% against Insect monster",
    112:"MATK +%d%% against Fish monster", 113:"MATK +%d%% against Devil monster",
    114:"MATK +%d%% against Demihuman monster", 115:"MATK +%d%% against Angel monster",
    116:"MATK +%d%% against Dragon monster", 117:"Critical +%d against Formless monster",
    118:"Critical +%d against Undead monster", 119:"Critical +%d against Brute monster",
    120:"Critical +%d against Plant monster", 121:"Critical +%d against Insect monster",
    122:"Critical +%d against Fish monster", 123:"Critical +%d against Demon monster",
    124:"Critical +%d against Demihuman monster", 125:"Critical +%d against Angel monster",
    126:"Critical +%d against Dragon monster", 127:"Pierces %d%% DEF of Formless monster",
    128:"Pierces %d%% DEF of Undead monster", 129:"Pierces %d%% DEF of Brute monster",
    130:"Pierces %d%% DEF of Plant monster", 131:"Pierces %d%% DEF of Insect monster",
    132:"Pierces %d%% DEF of Fish monster", 133:"Pierces %d%% DEF of Demon monster",
    134:"Pierces %d%% DEF of Demihuman monster", 135:"Pierces %d%% DEF of Angel monster",
    136:"Pierces %d%% DEF of Dragon monster", 137:"Pierces %d%% MDEF of Formless monster",
    138:"Pierces %d%% MDEF of Undead monster", 139:"Pierces %d%% MDEF of Brute monster",
    140:"Pierces %d%% MDEF of Plant monster", 141:"Pierces %d%% MDEF of Insect monster",
    142:"Pierces %d%% MDEF of Fish monster", 143:"Pierces %d%% MDEF of Demon monster",
    144:"Pierces %d%% MDEF of Demihuman monster", 145:"Pierces %d%% MDEF of Angel monster",
    146:"Pierces %d%% MDEF of Dragon monster", 147:"ATK +%d%% against Normal monster",
    148:"ATK +%d%% against Boss monster", 149:"Normal monster resistance +%d%%",
    150:"Boss monster resistance +%d%%", 151:"MATK +%d%% against Normal monster",
    152:"MATK +%d%% against Boss monster", 153:"Pierces %d%% DEF of Normal monster",
    154:"Pierces %d%% DEF of Boss monster", 155:"Pierces %d%% MDEF of Normal monster",
    156:"Pierces %d%% MDEF of Boss monster", 157:"ATK +%d%% against Small size monster",
    158:"ATK +%d%% against Medium size monster", 159:"ATK +%d%% against Large size monster",
    160:"Small monster resistance +%d%%", 161:"Medium monster resistance +%d%%",
    162:"Large monster resistance +%d%%", 163:"Nullify weapon\u0027s damage size penalty",
    164:"Critical Damage +%d%%", 165:"Critical Damage -%d%%", 166:"Ranged Physical Damage +%d%%",
    167:"Received Ranged Physical Damage -%d%%", 168:"Healing effectiveness +%d%%",
    169:"Recovery gained from Healing skills +%d%%", 170:"Variable Casting Time -%d%%",
    171:"After Skill Delay -%d%%", 172:"SP Consumption -%d%%", 175:"Weapon Element: Neutral",
    176:"Weapon Element: Water", 177:"Weapon Element: Earth", 178:"Weapon Element: Fire",
    179:"Weapon Element: Wind", 180:"Weapon Element: Poison", 181:"Weapon Element: Holy",
    182:"Weapon Element: Shadow", 183:"Weapon Element: Ghost", 184:"Weapon Element: Undead",
    185:"Indestructible in battle", 186:"Indestructible in battle", 187:"MATK against Small size monster +%d%%",
    188:"MATK against Medium size monster +%d%%", 189:"MATK against Large size monster +%d%%",
    190:"Small monster magic resistance +%d%%", 191:"Medium monster magic resistance +%d%%",
    192:"Large monster magic resistance +%d%%", 193:"Elemental attacks resistance +%d%%",
    194:"Formless monster resistance +%d%%", 195:"Undead monster resistance +%d%%",
    196:"Brute monster resistance +%d%%", 197:"Plant monster resistance +%d%%",
    198:"Insect monster resistance +%d%%", 199:"Fish monster resistance +%d%%",
    200:"Demon monster resistance +%d%%", 201:"Demihuman monster resistance +%d%%",
    202:"Angel monster resistance +%d%%", 203:"Dragon monster resistance +%d%%",
    204:"Ranged Physical Damage +%d%%", 205:"Received Ranged Physical Damage -%d%%",
    206:"Demi-Human players resistance + %d%%", 207:"Doram players resistance +%d%%",
    208:"ATK against Demi-Human players +%d%%", 209:"ATK against Doram players +%d%%",
    210:"MATK against Demi-Human players +%d%%", 211:"MATK against Doram players +%d%%",
    212:"Critical +%d for Demi-Human players", 213:"Critical +%d for Doram players",
    214:"Pierces %d%% DEF of Demi-Human players", 215:"Pierces %d%% DEF of Doram players",
    216:"Pierces %d%% MDEF of Demi-Human players", 217:"Pierces %d%% MDEF of Doram players",
    218:"Recieved reflected damage -%d%%", 219:"Melee Physical Damage +%d%%",
    220:"Received Melee Physical Damage -%d%%", 221:"Neutral elemental magic skill damage +%d%%",
    222:"Water elemental magic skill damage +%d%%", 223:"Earth elemental magic skill damage +%d%%",
    224:"Fire elemental magic skill damage +%d%%", 225:"Wind elemental magic skill damage +%d%%",
    226:"Poison elemental magic skill damage +%d%%", 227:"Holy elemental magic skill damage +%d%%",
    228:"Shadow elemental magic skill damage +%d%%", 229:"Ghost elemental magic skill damage +%d%%",
    230:"Undead elemental magic skill damage +%d%%", 231:"All elemental magic skill damage +%d%%",
    232:"Experience gained from Formless race monsters +%d%%",
    233:"Experience gained from Undead race monsters +%d%%",
    234:"Experience gained from Brute race monsters +%d%%", 235:"Experience gained from Plant race monsters +%d%%",
    236:"Experience gained from Insect race monsters +%d%%", 237:"Experience gained from Fish race monsters +%d%%",
    238:"Experience gained from Demon race monsters +%d%%",
    239:"Experience gained from Demi-Human race monsters +%d%%",
    240:"Experience gained from Angel race monsters +%d%%",
    241:"Experience gained from Dragon race monsters +%d%%", 242:"Experience gained from all race monsters +%d%%",
    243:"POW +%d", 244:"SPL +%d", 245:"STA +%d", 246:"WIS +%d", 247:"CON +%d", 248:"CRT +%d", 249:"P.ATK +%d",
    250:"S.MATK +%d", 251:"RES +%d", 252:"MRES +%d", 253:"H.PLUS +%d", 254:"C.RATE +%d"
};

function parse(text) {
    const out = [];
    for (const rec of String(text || '').split('~')) {
        if (!rec.trim()) continue;
        const f = rec.split('|');
        out.push({
            name: f[0], job: f[1], lv: +f[2] || 0, jlv: +f[3] || 0,
            hp: +f[4] || 0, mhp: +f[5] || 0, sp: +f[6] || 0, msp: +f[7] || 0,
            state: f[8] || 'off', map: f[9] || '',
            days: +f[10] || 0, kills: +f[11] || 0, mvps: +f[12] || 0, fell: +f[13] || 0,
            places: +f[14] || 0, metMap: f[15] || '', metLv: +f[16] || 0, firstMvp: f[17] || '', sawFall: +f[18] || 0,
            closest: f[19] || ''
        });
    }
    return out;
}

// @clbag list: P|purse|inventory on|zeny per level, C|cid|name|job,
// I|cid|index|item id|amount|worn|refine|cards|options|bound|rental|name.
function parseBag(text) {
    const bag = { purse: 0, inv: false, rate: 0, comps: [] };
    const byCid = {};
    for (const rec of String(text || '').split('~')) {
        const f = rec.split('|');
        if (f[0] === 'P') { bag.purse = +f[1] || 0; bag.inv = f[2] === '1'; bag.rate = +f[3] || 0; }
        else if (f[0] === 'C') {
            byCid[f[1]] = { cid: f[1], name: f[2], job: f[3], items: [],
                cloth: +f[4] || 0, clothMin: +f[5] || 0, clothMax: +f[6] || 0,
                hair: +f[7] || 0, hairMin: +f[8] || 0, hairMax: +f[9] || 0 };
            bag.comps.push(byCid[f[1]]);
        }
        else if (f[0] === 'I' && byCid[f[1]]) {
            byCid[f[1]].items.push({ idx: f[2], id: +f[3] || 0, amount: +f[4] || 0, worn: +f[5] || 0,
                refine: +f[6] || 0, cardIds: (f[7] || '').split(',').map(Number).filter(Boolean),
                opts: (f[8] || '').split(',').filter(Boolean).map(o => o.split(':').map(Number)),
                bound: f[9] === '1', rental: f[10] === '1', name: f.slice(11).join('|') });
        }
    }
    return bag;
}

// rAthena equip positions (EQP_*), for the Wearing list.
const AMMO = 0x8000;
function slotName(bits) {
    if (bits & 0x3C00) return 'Costume';
    if (bits >= 0x10000) return 'Shadow';
    if (bits & 0x0301 || bits & 0x0001) return 'Head';
    if (bits & 0x0002) return (bits & 0x0020) ? 'Weapon (two-handed)' : 'Weapon';
    if (bits & 0x0020) return 'Shield';
    if (bits & 0x0010) return 'Armor';
    if (bits & 0x0004) return 'Garment';
    if (bits & 0x0040) return 'Shoes';
    if (bits & 0x0088) return 'Accessory';
    return 'Gear';
}

export default function init(parameters, api) {
    if (api?.version !== 1) throw new Error('This mod requires client API 1');
    if (typeof api.ui?.window !== 'function' || typeof api.server?.request !== 'function') return;
    const showButton = parameters?.window_button !== false && parameters?.window_button !== 0;

    let win = null, body = null, tab = 'status', list = [], timer = null, busy = false;
    let bag = null, bagAt = 0, bagMsg = null;   // the Bag tab: last answer, when, last action's result
    let sel = null;                             // the picked square: "<cid>:<index>" or "<cid>:w<slots>"
    let giving = null;                          // a stack dropped on a companion: { cid, idx, id, max, name, n }
    let takeN = { key: null, n: 0 };            // how many to take of the picked stack (kept through the refresh)
    // Item icons (the game's own), kept so the 3 s refresh doesn't flicker.
    const iconUrl = new Map(), iconAsk = new Set();
    function fillIcons(root) {
        if (typeof api.items?.icon !== 'function') return;
        root.querySelectorAll('img[data-icon]:not([src])').forEach(img => {
            const id = Number(img.dataset.icon);
            if (iconUrl.has(id)) { if (iconUrl.get(id)) img.src = iconUrl.get(id); return; }
            if (iconAsk.has(id)) return;
            iconAsk.add(id);
            Promise.resolve(api.items.icon(id)).then(url => {
                iconUrl.set(id, url || '');
                if (url) body?.querySelectorAll(`img[data-icon="${id}"]:not([src])`).forEach(i => { i.src = url; });
            }).catch(() => iconUrl.set(id, '')).finally(() => iconAsk.delete(id));
        });
    }

    const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, Math.round(a * 100 / b))) : 0);
    const label = { rest: 'Resting', dead: 'Fallen', away: 'Away', off: 'Not here' };

    function renderStatus() {
        if (!list.length) return '<div class="empty">No companions in your party.<br>Recruit one, or call one from the Companions window.</div>';
        return list.map(c => {
            const tag = label[c.state] ? `<span class="tag ${c.state}">${label[c.state]}${c.state === 'away' && c.map ? ' · ' + esc(c.map) : ''}</span>` : '';
            const job = c.state === 'off' ? '' : `Lv ${c.lv} ${esc(c.job)} <span style="color:#9aa7ba">/ ${c.jlv}</span>`;
            const bars = c.state === 'off' ? '' : `
              <div class="bar hp${pct(c.hp, c.mhp) < 30 ? ' low' : ''}"><i style="width:${pct(c.hp, c.mhp)}%"></i><b>${num(c.hp)} / ${num(c.mhp)}</b></div>
              <div class="bar sp"><i style="width:${pct(c.sp, c.msp)}%"></i><b>${num(c.sp)} / ${num(c.msp)}</b></div>`;
            return `<div class="row ${c.state}"><div class="top"><span class="nm">${esc(c.name)}</span><span class="jb">${job}</span>${tag}</div>${bars}</div>`;
        }).join('');
    }

    function renderMemories() {
        if (!list.length) return '<div class="empty">No companions in your party.</div>';
        return list.map(c => {
            const lines = [];
            lines.push(`<span class="k">Together</span> <span class="v">${c.days === 1 ? '1 day' : num(c.days) + ' days'}</span>`
                + (c.metMap ? ` <span class="k">· met in</span> <span class="v">${esc(c.metMap)}</span>` : '')
                + (c.metLv ? ` <span class="k">when you were Lv</span> <span class="v">${c.metLv}</span>` : ''));
            lines.push(`<span class="k">Monsters beaten together</span> <span class="v">${num(c.kills)}</span>`
                + ` <span class="k">· MVPs</span> <span class="v">${num(c.mvps)}</span>`
                + (c.firstMvp ? ` <span class="k">(first:</span> <span class="v">${esc(c.firstMvp)}</span><span class="k">)</span>` : ''));
            lines.push(`<span class="k">Places seen together</span> <span class="v">${num(c.places)}</span>`);
            lines.push(`<span class="k">Fallen</span> <span class="v">${num(c.fell)}</span> <span class="k">· saw you fall</span> <span class="v">${num(c.sawFall)}</span>`);
            if (c.closest) lines.push(`<span class="k">Closest to</span> <span class="v">${c.closest === 'you' ? 'you &#9829;' : esc(c.closest)}</span>`);
            return `<div class="mem"><div class="nm">${esc(c.name)} <span class="jb">${c.job ? esc(c.job) : ''}</span></div>${lines.join('<br>')}</div>`;
        }).join('');
    }

    function renderBag() {
        if (!bag) return '<div class="empty">Looking in the bags...</div>';
        const out = [];
        if (bagMsg) out.push(`<div class="msg ${bagMsg.ok ? 'ok' : 'err'}">${esc(bagMsg.text)}</div>`);
        if (bag.rate > 0 || bag.purse > 0) {
            out.push(`<div class="purse"><span class="z">Party purse: ${num(bag.purse)} z</span>`
                + `<input type="number" min="1" step="1" placeholder="zeny" data-purse>`
                + `<button class="act" data-act="withdraw" title="Into your wallet">Take out</button>`
                + `<button class="act" data-act="deposit" title="From your wallet">Put in</button></div>`);
        }
        if (!bag.inv) {
            out.push('<div class="note">Companion inventory is off (Settings &gt; Population), so their potions and arrows are free and refill by themselves. '
                + 'Turn it on to have them carry only what you give them; then you can take things back here.</div>');
        } else {
            out.push('<div class="note">Drag an item from your inventory onto a companion to give it (gear it can wear goes on at once), or trade it. Click an item to look at it, double-click to take it back.</div>');
        }
        if (!bag.comps.length) out.push('<div class="empty">No companions in your party.</div>');
        const label = it => (it.refine ? `+${it.refine} ` : '') + it.name;
        // One line under the name: what it is and what's special about it.
        const facts = it => [
            it.worn && it.worn !== AMMO ? slotName(it.worn) : it.worn ? 'In use (arrows)' : '',
            it.amount > 1 ? `x${num(it.amount)}` : '',
            it.bound ? 'bound' : '', it.rental ? 'rental' : ''
        ].filter(Boolean).join(' · ');
        const cardName = id => api.items?.get?.(id)?.name || `Card #${id}`;
        // How many: a plain box between - and + (no tiny spinner), All, and the
        // button says the number it will move.
        const amountRow = (n, max, go, word) => `<div class="cnt">`
            + `<button class="act st" data-act="step" data-d="-1" title="One less">&minus;</button>`
            + `<input type="number" min="1" max="${max}" value="${n}" data-n>`
            + `<button class="act st" data-act="step" data-d="1" title="One more">+</button>`
            + `<button class="act st" data-act="step" data-d="all" title="All ${num(max)}">All</button>`
            + `<button class="act go" ${go}>${word} <b>${num(n)}</b></button></div>`;
        const slot = (c, it, key, cls) => {
            const pips = (it.cardIds.length ? '<i class="pc"></i>' : '') + (it.opts.length ? '<i class="po"></i>' : '') + (it.bound || it.rental ? '<i class="pb"></i>' : '');
            const tip = [label(it), facts(it), ...it.opts.map(optText), ...it.cardIds.map(cardName)].filter(Boolean).join('\n');
            const src = iconUrl.get(it.id);
            return `<div class="sl ${cls}${sel === key ? ' on' : ''}" data-sel="${esc(key)}" title="${esc(tip)}">`
                + `<img data-icon="${it.id}"${src ? ` src="${esc(src)}"` : ''} alt="">`
                + (it.refine ? `<span class="r">+${it.refine}</span>` : '')
                + (it.amount > 1 ? `<span class="q">${it.amount > 9999 ? '9k+' : it.amount}</span>` : '')
                + (pips ? `<span class="pips">${pips}</span>` : '') + '</div>';
        };
        for (const c of bag.comps) {
            // Wearing: only gear you gave (the server leaves out its own).
            const wornIt = c.items.filter(it => it.worn && it.worn !== AMMO);
            const bagIt = c.items.filter(it => !it.worn || it.worn === AMMO);
            const worn = wornIt.map(it => slot(c, it, `${c.cid}:w${it.worn}`, 'worn')).join('');
            let cells = bagIt.map(it => slot(c, it, `${c.cid}:${it.idx}`, it.worn ? 'use' : '')).join('');
            // Empty squares, like the game's inventory, to fill the first rows.
            if (bag.inv) cells += '<div class="sl nil"></div>'.repeat(Math.max(0, 8 - bagIt.length));
            const rows = cells ? `<div class="grid">${cells}</div>` : '<div class="am">Empty.</div>';
            // The picked item, with its buttons.
            let det = '';
            const pick = sel && sel.startsWith(c.cid + ':') ? sel.slice(c.cid.length + 1) : null;
            const it = pick === null ? null : pick[0] === 'w' ? wornIt.find(x => 'w' + x.worn === pick) : bagIt.find(x => x.idx === pick);
            if (it) {
                let acts = '', row = '';
                if (it.worn && it.worn !== AMMO) {
                    const tip = it.worn & 0x3C00 ? 'Hands back every costume piece you gave' : 'Back to you; it puts its own piece back on';
                    acts = `<button class="act" data-act="gearback" data-cid="${esc(c.cid)}" data-eq="${it.worn}" title="${tip}">Take back</button>`;
                } else if (it.worn) {
                    acts = '<span class="am">in use</span>';
                } else if (bag.inv && it.amount > 1) {
                    const n = takeN.key === sel && takeN.n > 0 ? Math.min(takeN.n, it.amount) : it.amount;
                    row = amountRow(n, it.amount, `data-act="take" data-cid="${esc(c.cid)}" data-idx="${esc(it.idx)}" data-amt="box"`, 'Take');
                } else if (bag.inv) {
                    acts = `<button class="act" data-act="take" data-cid="${esc(c.cid)}" data-idx="${esc(it.idx)}" data-amt="1">Take</button>`;
                }
                const src = iconUrl.get(it.id);
                // Below the name: its random options, its cards, then the game's own
                // description (the same text as in your inventory).
                const desc = String(api.items?.get?.(it.id)?.description || '').trim();
                const more = it.opts.map(o => `<div class="op">${esc(optText(o))}</div>`).join('')
                    + it.cardIds.map(id => `<div class="cd">${esc(cardName(id))}</div>`).join('')
                    + (desc ? `<div class="ds">${esc(desc)}</div>` : '');
                det = `<div class="det"><div class="hd"><img data-icon="${it.id}"${src ? ` src="${esc(src)}"` : ''} alt="">`
                    + `<div class="tx"><b title="${esc(label(it))}">${esc(label(it))}</b><span>${esc(facts(it))}</span></div>${acts}</div>`
                    + row + (more ? `<div class="more">${more}</div>` : '') + '</div>';
            }
            // Outfit and hair colour: the arrows wrap around the class's own range.
            const dye = (kind, label, v, lo, hi) => {
                if (hi <= lo) return '';
                const prev = v <= lo ? hi : v - 1, next = v >= hi ? lo : v + 1;
                return `<span class="dy"><span class="am">${label}</span>`
                    + `<button class="act" data-act="dye" data-cid="${esc(c.cid)}" data-kind="${kind}" data-val="${prev}" title="Previous colour">&#9664;</button>`
                    + `<b>${v - lo + 1} / ${hi - lo + 1}</b>`
                    + `<button class="act" data-act="dye" data-cid="${esc(c.cid)}" data-kind="${kind}" data-val="${next}" title="Next colour">&#9654;</button></span>`;
            };
            const dyes = dye('cloth', 'Outfit', c.cloth, c.clothMin, c.clothMax) + dye('hair', 'Hair', c.hair, c.hairMin, c.hairMax);
            // A stack dropped here, waiting for "how many".
            if (giving && giving.cid === c.cid) {
                const src = iconUrl.get(giving.id);
                det += `<div class="det give"><div class="hd"><img data-icon="${giving.id}"${src ? ` src="${esc(src)}"` : ''} alt="">`
                    + `<div class="tx"><b>${esc(giving.name)}</b><span>Give how many to <b style="display:inline">${esc(c.name)}</b>? You have ${num(giving.max)}.</span></div>`
                    + `<button class="act" data-act="nogive" title="Cancel">&#10005;</button></div>`
                    + amountRow(giving.n, giving.max, 'data-act="give"', 'Give') + '</div>';
            }
            out.push(`<div class="bag${bag.inv ? ' can' : ''}" data-cid="${esc(c.cid)}"><div class="top"><span class="nm">${esc(c.name)}</span><span class="jb">${esc(c.job)}</span></div>`
                + (dyes ? `<div class="dyes">${dyes}</div>` : '')
                + (worn ? `<div class="sub">Wearing (from you)</div><div class="grid">${worn}</div>` : '')
                + `<div class="sub">Bag</div>${rows}${det}</div>`);
        }
        return out.join('');
    }

    function render() {
        if (!body) return;
        body.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
        const pane = body.querySelector('.pane');
        // Don't wipe the purse box while you type in it.
        const active = pane.getRootNode().activeElement || document.activeElement;
        if (tab === 'bag' && active && pane.contains(active) && active.matches('input')) return;
        const keep = pane.scrollTop;
        pane.innerHTML = tab === 'status' ? renderStatus() : tab === 'bag' ? renderBag() : renderMemories();
        pane.scrollTop = keep;
        if (tab === 'bag') fillIcons(pane);
        if (button) button.classList.toggle('hurt', list.some(c => c.state === 'dead' || (c.mhp && c.hp * 100 / c.mhp < 30)));
    }

    // While an NPC dialog is open the server holds every other script for this
    // character, so @clstat can't run, and a command the server doesn't take is
    // said out loud instead ("Tifa : @clstat 41 list"). The client's dialogs are
    // elements with these ids while they're open (GUIComponent: host.id = name).
    const DIALOGS = ['NpcBox', 'NpcMenu', 'InputBox', 'NpcStore', 'NpcCutin'];
    const inDialog = () => DIALOGS.some(id => document.getElementById(id)?.isConnected);
    let quietUntil = 0;     // after an unanswered request, wait before asking again

    async function refresh() {
        if (busy || inDialog() || Date.now() < quietUntil) return;
        busy = true;
        try {
            if (tab === 'bag') {
                // The bags change slowly: every 3 s is plenty.
                if (Date.now() - bagAt < 3000) return;
                bag = parseBag(await api.server.request('clbag', 'list', { timeout: 4000 }));
                bagAt = Date.now();
            } else {
                list = parse(await api.server.request('clstat', 'list', { timeout: 4000 }));
            }
            render();
        }
        catch { quietUntil = Date.now() + 10000; /* busy or between maps: try again in a while */ }
        finally { busy = false; }
    }

    // Take / All, Take out / Put in: one @clbag action, then a fresh look.
    // quiet: a dye click, which needs no "done" line (an error still shows).
    async function bagAction(args, quiet = false) {
        if (busy || inDialog()) return;
        busy = true;
        try {
            const reply = String(await api.server.request('clbag', args, { timeout: 4000 }) || '');
            const cut = reply.indexOf('|');
            const ok = reply.startsWith('OK');
            bagMsg = quiet && ok ? null : { ok, text: cut >= 0 ? reply.slice(cut + 1) : reply };
        } catch { bagMsg = { ok: false, text: 'No answer from the server. Try again in a moment.' }; }
        finally { busy = false; }
        bagAt = 0;
        await refresh();
    }

    // A double-click on a square: worn gear back, or the whole stack.
    let lastClick = { key: null, at: 0 };
    function takeAll(key) {
        if (!bag) return;
        const cut = key.indexOf(':'), cid = key.slice(0, cut), k = key.slice(cut + 1);
        const c = bag.comps.find(x => x.cid === cid);
        if (!c) return;
        if (k[0] === 'w') { bagAction(`gearback ${cid} ${k.slice(1)}`); return; }
        const it = c.items.find(x => x.idx === k);
        if (it && !it.worn && bag.inv) bagAction(`take ${cid} ${it.idx} ${it.amount}`);
    }

    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function startTimer() {
        stopTimer();
        timer = setInterval(() => { if (win?.isOpen()) refresh(); else stopTimer(); }, 1000);
    }
    api.cleanup(stopTimer);

    // A how-many box changed: its button's number, and the choice kept so the
    // next refresh draws it the same.
    function setAmount(box, v, write) {
        if (write) box.value = v;
        const b = box.parentElement.querySelector('.go b');
        if (b) b.textContent = num(v);
        if (giving && box.closest('.det.give')) giving.n = v;
        else takeN = { key: sel, n: v };
    }

    function ensureWindow() {
        if (win) return win;
        win = api.ui.window({ id: 'companions', title: 'Companions', width: 300, height: 340, resizable: true });
        win.body.innerHTML = `<style>${WIN_STYLE}</style><div class="cw"><div class="tabs">`
            + `<button data-tab="status">Status</button><button data-tab="memories">Memories</button><button data-tab="bag">Bag</button></div>`
            + `<div class="pane"></div></div>`;
        body = win.body;
        body.addEventListener('click', event => {
            const a = event.target.closest('button[data-act]');
            if (a) {
                if (a.dataset.act === 'step') {
                    const box = a.parentElement.querySelector('input[data-n]');
                    if (!box) return;
                    const max = Number(box.max) || 1;
                    const v = a.dataset.d === 'all' ? max : (Math.floor(Number(box.value)) || 0) + Number(a.dataset.d);
                    setAmount(box, Math.min(Math.max(v, 1), max), true);
                }
                else if (a.dataset.act === 'take') {
                    let n = a.dataset.amt;
                    if (n === 'box') {
                        const box = a.parentElement.querySelector('input[data-n]');
                        n = Math.floor(Number(box?.value || 0));
                        if (!(n > 0)) { bagMsg = { ok: false, text: 'Type how many first.' }; box?.blur(); render(); return; }
                        box?.blur();
                    }
                    bagAction(`take ${a.dataset.cid} ${a.dataset.idx} ${n}`);
                }
                else if (a.dataset.act === 'give' && giving) {
                    const box = a.parentElement.querySelector('input[data-n]');
                    const n = Math.floor(Number(box?.value || 0));
                    if (!(n > 0)) { bagMsg = { ok: false, text: 'Type how many first.' }; box?.blur(); render(); return; }
                    box?.blur();
                    const g = giving;
                    giving = null;
                    bagAction(`give ${g.cid} ${g.idx} ${g.id} ${Math.min(n, g.max)}`);
                }
                else if (a.dataset.act === 'nogive') { giving = null; render(); }
                else if (a.dataset.act === 'gearback') bagAction(`gearback ${a.dataset.cid} ${a.dataset.eq}`);
                else if (a.dataset.act === 'dye') bagAction(`dye ${a.dataset.cid} ${a.dataset.kind} ${a.dataset.val}`, true);
                else if (a.dataset.act === 'withdraw' || a.dataset.act === 'deposit') {
                    const box = body.querySelector('input[data-purse]');
                    const z = Math.floor(Number(box?.value || 0));
                    if (!(z > 0)) { bagMsg = { ok: false, text: 'Type an amount of zeny first.' }; box?.blur(); render(); return; }
                    if (box) { box.value = ''; box.blur(); }
                    bagAction(`${a.dataset.act} ${z}`);
                }
                return;
            }
            // A square: pick it, and its details show below the bag. A second click
            // on it soon after takes it all back, like using an item in the game's
            // inventory. (Counted here: the window redraws between the two clicks,
            // so the browser's own dblclick can miss.)
            const s = event.target.closest('.sl[data-sel]');
            if (s) {
                const key = s.dataset.sel, now = Date.now();
                if (lastClick.key === key && now - lastClick.at < 400) {
                    lastClick = { key: null, at: 0 };
                    takeAll(key);
                    return;
                }
                lastClick = { key, at: now };
                sel = key;
                bagMsg = null;
                render();
                return;
            }
            const t = event.target.closest('button[data-tab]');
            if (!t) return;
            tab = t.dataset.tab;
            bagMsg = null;
            giving = null;
            bagAt = 0;
            render();
            refresh();
        });
        // Test build (2.3.0): an item dragged from the game's inventory onto a
        // companion's card. The game puts { type: "item", from: "Inventory",
        // data: item } on the drag (and in window._OBJ_DRAG_); item.index is the
        // server's index + 2.
        const dragged = event => {
            let d = window._OBJ_DRAG_;
            if (!d) { try { d = JSON.parse(event.dataTransfer?.getData('Text') || 'null'); } catch { d = null; } }
            return d && d.type === 'item' && d.from === 'Inventory' && d.data ? d.data : null;
        };
        const card = event => (tab === 'bag' && bag?.inv ? event.target.closest?.('.bag[data-cid]') : null);
        let overCard = null;
        const unmark = () => { overCard?.classList.remove('over'); overCard = null; };
        body.addEventListener('dragover', event => {
            const c = card(event);
            if (!c || !dragged(event)) return;
            event.preventDefault();
            event.stopPropagation();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
            if (overCard !== c) { unmark(); overCard = c; c.classList.add('over'); }
        });
        body.addEventListener('dragleave', event => { if (overCard && !overCard.contains(event.relatedTarget)) unmark(); });
        body.addEventListener('drop', event => {
            const c = card(event);
            const item = c ? dragged(event) : null;
            unmark();
            if (!item) return;
            // Ours: keep the game from also taking it as a drop on the ground.
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            const id = Number(item.ITID) || 0, idx = (Number(item.index) || 0) - 2, max = Number(item.count) || 1;
            if (!id || idx < 0) return;
            if (item.WearState) { bagMsg = { ok: false, text: 'Take it off first, then drag it over.' }; render(); return; }
            const name = api.items?.get?.(id)?.name || `Item #${id}`;
            if (max > 1) { giving = { cid: c.dataset.cid, idx, id, max, name, n: max }; bagMsg = null; render(); return; }
            bagAction(`give ${c.dataset.cid} ${idx} ${id} 1`);
        });
        // Typing in the purse box: keep the keys away from the game (chat, hotkeys).
        // Enter or Escape leaves the box.
        // In a how-many box Enter presses its Give / Take button.
        body.addEventListener('keydown', event => {
            if (!event.target.matches?.('input')) return;
            event.stopPropagation();
            const go = event.key === 'Enter' && event.target.matches('input[data-n]') ? event.target.parentElement.querySelector('.go') : null;
            if (event.key === 'Enter' || event.key === 'Escape') event.target.blur();
            go?.click();
        });
        // Typing a number: the button follows it (an empty box waits for a number).
        body.addEventListener('input', event => {
            const box = event.target;
            if (!box.matches?.('input[data-n]')) return;
            const v = Math.floor(Number(box.value));
            if (v > 0) setAmount(box, Math.min(v, Number(box.max) || 1), false);
        });
        win.onClose?.(() => { stopTimer(); try { api.preferences.set('open', false); } catch { /* fine */ } });
        return win;
    }

    function open() {
        ensureWindow();
        win.show();
        render();
        refresh();
        startTimer();
        try { api.preferences.set('open', true); } catch { /* fine */ }
    }
    function toggle() {
        if (win?.isOpen()) { win.hide(); stopTimer(); try { api.preferences.set('open', false); } catch { /* fine */ } }
        else open();
    }

    const onKey = event => {
        if (!event.altKey || event.ctrlKey || event.shiftKey || event.metaKey || event.repeat) return;
        if (event.code !== 'KeyN') return;
        event.preventDefault();
        event.stopPropagation();
        toggle();
    };
    addEventListener('keydown', onKey, true);
    api.cleanup(() => removeEventListener('keydown', onKey, true));

    // The small button, like the System button: drag to move, click to open.
    let button = null;
    if (showButton) {
        const host = document.createElement('div');
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = `<style>${BTN_STYLE}</style><div class="cb" title="Companions (Alt+N)">Companions</div>`;
        button = root.querySelector('.cb');
        let pos = null;
        try { pos = api.preferences.get('position', null); } catch { /* fine */ }
        if (!pos || !Number.isFinite(pos.left) || !Number.isFinite(pos.top)) pos = { left: 8, top: 272 };
        const place = (left, top) => {
            button.style.left = Math.max(0, Math.min(innerWidth - 80, left)) + 'px';
            button.style.top = Math.max(0, Math.min(innerHeight - 24, top)) + 'px';
        };
        place(pos.left, pos.top);
        let drag = null;
        button.addEventListener('mousedown', event => {
            if (event.button !== 0) return;
            drag = { x: event.clientX, y: event.clientY, left: button.offsetLeft, top: button.offsetTop, moved: false };
        });
        const onMove = event => {
            if (!drag) return;
            const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
            if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
            drag.moved = true;
            place(drag.left + dx, drag.top + dy);
        };
        const onUp = () => {
            if (!drag) return;
            if (drag.moved) { try { api.preferences.set('position', { left: button.offsetLeft, top: button.offsetTop }); } catch { /* fine */ } }
            else toggle();
            drag = null;
        };
        addEventListener('mousemove', onMove, true);
        addEventListener('mouseup', onUp, true);
        api.cleanup(() => { removeEventListener('mousemove', onMove, true); removeEventListener('mouseup', onUp, true); });
        for (const type of ['mousedown', 'mouseup', 'click']) host.addEventListener(type, event => event.stopPropagation());
        host.style.display = 'none';
        document.body.appendChild(host);
        api.cleanup(() => host.remove());
        api.on('map:enter', () => { host.style.display = ''; });
        api.on('exit', () => { host.style.display = 'none'; });
    }

    // The game skips its own shortcuts (Alt+E, Alt+Q...) while a box of ours has
    // the focus, and its windows keep a click from taking it away. So a click
    // anywhere outside this window lets go of it.
    const letGo = event => {
        if (!body) return;
        let el = document.activeElement;
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
        if (el && el !== body && body.contains(el) && !event.composedPath().includes(body)) el.blur?.();
    };
    addEventListener('mousedown', letGo, true);
    api.cleanup(() => removeEventListener('mousedown', letGo, true));

    api.on('exit', () => { if (win?.isOpen()) win.hide(); stopTimer(); });
    // Open again where you left it, if it was open.
    let reopened = false;
    api.on('map:enter', () => {
        let wasOpen = false;
        try { wasOpen = api.preferences.get('open', false) === true; } catch { /* fine */ }
        if (wasOpen && !reopened) { reopened = true; open(); }
        else if (win?.isOpen()) refresh();
    });
    api.on('server:event', ({ command, text }) => {
        if (command === 'clwin' && text === 'open') open();
    });
}
