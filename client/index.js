// companion-party-overhaul: the Companions window.
//   Alt+N (Alt+N is the game's Achievements), or a click on the small "Companions" button, opens it.
//   3.9.1: the Status tab (HP and SP, level, resting / fallen / away) went: the party
//   frames show it all the time (frames.js); a click on one opens its Bag tab here.
//   Orders tab (3.7.0): the party-chat orders as buttons: stance (Engage / Protect /
//   Hold), focus on your target, roam (as a group or alone; 3.11.0: Normal or MVP hunt), camp, Warp Portal,
//   appraise / repair (3.10.2: Merchant services); greyed out with the reason when nobody can. Asks @clorder state.
//   Bond (3.7.0 tab, was Memories; 3.13.1 a fold in the Roster's More row, the tab
//   went to save room): each companion's bond tier, the perks it brings, a few
//   highlights of your time together, and its Journal.
//   Bag tab (3.5.0): one companion at a time, picked by its name tab, laid out like
//   the game's Equip window: its gear round it and the companion drawn in the middle,
//   then its bag as a grid of item icons. Hover a square for its details, double-click
//   to take it (a stack asks how many); drag from your inventory to give. A weight bar,
//   and a Restock row: drag a shop item onto it and they keep that many, bought in
//   town (3.1.0).
//   Loot tab (3.1.0): the party purse (take zeny out, put zeny in) and the party
//   bag, what they find on party kills: click, then Take or Sell. Every 3 s while open.
//   It asks @clstat (npc/companion_life.txt, OnCmdStat) for the Bond fold,
//   @clorder for Orders and @clbag (OnCmdBag) for the bag and the loot.
//   Drag the button to move it; it and the window remember where they were.
//   3.2.0: companion portraits, in portraits.js (loaded on its own, so the
//   window still works if it's missing).
//   Roster tab (3.10.0): the app's Companions window in ours, Active / Inactive with
//   faces, Bench / Summon, a More row, and a Hire page; the game menu's Companions
//   button opens it (setting roster_button). Asks @clroster.

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
  color: #2b2b2b; background: #f7f8fb; overflow: hidden; }
/* The tabs share the width, so the four always fit and a narrow window never
   gets a sideways scrollbar (the Loot tab was cut off at 245 px). */
.tabs { display: flex; gap: 3px; padding: 5px 6px 0; border-bottom: 1px solid #b9c7de; background: #e9eef7; }
.tabs button { flex: 1 1 0; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  font: bold 11px Tahoma, sans-serif; color: #4a5f80; background: #dde5f2; border: 1px solid #b9c7de;
  border-bottom: none; border-radius: 3px 3px 0 0; padding: 3px 4px; cursor: pointer; }
.tabs button.on { color: #1f3f73; background: #f7f8fb; }
.pane { flex: 1; overflow-x: hidden; overflow-y: auto; padding: 5px 6px; }
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
.msgpin { position: sticky; top: 0; height: 0; z-index: 3; }   /* takes no room: the line floats over the bags */
.msg { padding: 3px 6px; margin-bottom: 5px; border-radius: 3px; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
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
/* 3.1.0: weight on the name line (green under half: from 50% RO stops natural regen). */
.wt { flex: none; position: relative; width: 46px; height: 7px; border: 1px solid #9fb0c8; border-radius: 2px; background: #e4e8ef; overflow: hidden; align-self: center; }
.wt i { position: absolute; left: 0; top: 0; bottom: 0; background: #3fae4f; }
.wt i.mid { background: #e0961e; } .wt i.hi { background: #d23b2b; }
.wn { flex: none; font-size: 10px; color: #6a7a92; }
.wn.hi { color: #b0301f; font-weight: bold; }
/* Restock row: a drop zone with a chip per item. */
.rs { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; margin-top: 4px; padding: 2px 3px; border: 1px dashed #c9d3e3; border-radius: 3px; min-height: 18px; }
.rs .lb { font-size: 10px; font-weight: bold; color: #6a7a92; margin-right: 2px; }
.rs .hint { font-size: 10px; color: #9aa7ba; }
.rs.over { border-color: #3c6fc0; border-style: solid; background: #eef4ff; }
/* 3.9.0: Pet row: the class's pet and an Off / On switch. */
.pt { display: flex; align-items: center; gap: 5px; margin-top: 4px; padding: 2px 3px; border: 1px solid #d6deeb; border-radius: 3px; background: #fbfcfe; }
.pt .lb { font-size: 10px; font-weight: bold; color: #6a7a92; }
.pt .pn { flex: 1; min-width: 0; font-weight: bold; color: #1f3f73; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pt .pn.off { color: #9aa7ba; font-weight: normal; }
.pt .pseg { display: flex; flex: none; }
.pt .ph { flex: 1; min-width: 0; font-size: 10px; color: #8a94a6; font-style: italic; }
.pt .ren { flex: none; border: 0; background: none; padding: 0 2px; font: inherit; font-size: 10px; color: #4a6fa5; text-decoration: underline; cursor: pointer; }
.chip { display: inline-flex; align-items: center; gap: 2px; padding: 0 2px 0 1px; border: 1px solid #c9d3e3; border-radius: 3px; background: #fff; cursor: pointer; font-size: 10px; }
.chip:hover { border-color: #6d8fc2; }
.chip img { width: 16px; height: 16px; image-rendering: pixelated; pointer-events: none; }
.chip img:not([src]) { visibility: hidden; }
.chip b { font-weight: normal; color: #3b4658; pointer-events: none; }
.chip.low b { color: #b0301f; font-weight: bold; }
.chip .x { color: #9aa7ba; padding: 0 1px; }
.chip .x:hover { color: #b0301f; }
/* Loot tab. */
.lh { display: flex; align-items: baseline; gap: 6px; margin: 2px 0 1px; }
.lh .nm { flex: 1; }
.sl.new { border-color: #4caf6a; background: linear-gradient(#ffffff, #e7f6ea); }
.sl .nw { position: absolute; left: 1px; top: 0; font: bold 8px Tahoma, sans-serif; color: #2e8b46; text-shadow: 0 0 2px #fff, 0 0 2px #fff; pointer-events: none; }
.lact { display: flex; gap: 4px; margin-top: 4px; }
.lact .act { flex: 1; padding: 2px 6px; }
.cw button.act.sell { color: #7a5a0c; background: #fbf1d4; border-color: #d8c88e; }
.cw button.act.sell:hover { background: #f6e6b8; }
.cw * { scrollbar-width: thin; }
/* 3.7.0: Orders tab: a box per kind of order, buttons sharing the width. */
.og { padding: 5px 6px 6px; border: 1px solid #d6deeb; border-radius: 3px; background: #fff; margin-bottom: 5px; }
.og h4 { margin: 0 0 4px; font: bold 11px Tahoma, sans-serif; color: #1f3f73; display: flex; align-items: baseline; gap: 6px; }
.og h4 small { font-weight: normal; color: #6a7a92; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ob { display: flex; gap: 4px; }
.ob + .ob { margin-top: 4px; }
.cw .ob4 button.ord { flex: 1 1 auto; padding-left: 0; padding-right: 0; white-space: nowrap; }
.cw button.ord { flex: 1 1 0; min-width: 0; font: bold 11px Tahoma, sans-serif; color: #1f3f73; background: linear-gradient(#f4f7fd, #dde6f4);
  border: 1px solid #9fb0c8; border-radius: 3px; padding: 4px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cw button.ord:hover { border-color: #3c6fc0; }
.cw button.ord.on { color: #fff; background: #3c6fc0; border-color: #3c6fc0; }
.cw button.ord:disabled { color: #9aa7ba; background: #eef1f6; border-color: #d6deeb; cursor: default; }
.why { margin-top: 3px; font-size: 10px; color: #8a6a12; }
.why.ok { color: #2e7d46; }
/* Bonds tab. */
.bd { padding: 5px 7px 6px; border: 1px solid #d6deeb; border-radius: 3px; background: #fff; margin-bottom: 5px; line-height: 1.45; }
.bd .top { margin-bottom: 2px; }
.tier { font-size: 10px; padding: 0 6px; border-radius: 7px; color: #fff; white-space: nowrap; }
.tier.t1 { background: #9aa3ad; } .tier.t2 { background: #5aa36b; } .tier.t3 { background: #3c8fc0; } .tier.t4 { background: #8e5bd6; } .tier.t5 { background: #d0892a; }
.bar.bond { height: 10px; }
.bar.bond i { background: linear-gradient(#ffd98a, #e0a12e); }
.perk { font-size: 10px; color: #2e7d46; }
.perk.next { color: #6a7a92; }
.hl { margin-top: 2px; font-size: 10px; color: #6a7a92; }
.hl b { color: #1f3f73; font-weight: normal; }
.jr { margin-top: 4px; border-top: 1px dashed #d6deeb; padding-top: 3px; }
.jr > button { all: unset; cursor: pointer; font-size: 11px; color: #2f5f9e; display: flex; gap: 4px; align-items: center; }
.jr .ar, .jc .ar { display: inline-block; font-size: 8px; transition: transform .15s; }
.jr.open > button .ar, .jc.open > button .ar { transform: rotate(90deg); }
.jr .cnt { color: #6a7a92; }
.jb2 { display: grid; gap: 3px; margin-top: 4px; }
.jh { font-size: 10.5px; color: #22324f; font-weight: bold; margin-top: 2px; }
.jc { border: 1px solid #e3e8f0; border-radius: 3px; }
.jc > button { all: unset; cursor: pointer; display: flex; width: 100%; box-sizing: border-box; gap: 5px; padding: 2px 6px; background: #f6f8fc; font-size: 11px; }
.jc .tt { flex: 1; color: #22324f; }
.jc .wh { color: #6a7a92; font-size: 10px; }
.jc.locked > button { cursor: default; background: #fafbfd; }
.jc.locked .tt, .jc.locked .wh { color: #a9b3c4; font-style: italic; }
.jl { padding: 3px 8px 5px; font-size: 11px; line-height: 1.5; user-select: text; }
.jl p { margin: 0 0 2px; }
.jl .s { font-weight: bold; color: #2f7fb8; }
.jl .s.b { color: #8a5ac2; }
.jx { margin-top: 3px; padding: 3px 6px; background: #fff8e6; border-left: 3px solid #e0a12e; font-size: 10.5px; color: #6b4d00; }
.jm { font-size: 10.5px; color: #45556f; padding: 1px 4px; }
.jm .ja { color: #2e7d46; }
/* 3.5.0: the Bag tab like the game's Equip window. A name tab per companion (one shown
   at a time; past five they wrap), Outfit and Hair on one row, the gear round the
   companion, then the bag and the restock row. */
.party { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 5px; }
.pk { font: bold 10px Tahoma, sans-serif; color: #4a5f80; background: #dde5f2; border: 1px solid #b9c7de;
  border-radius: 9px; padding: 1px 7px; cursor: pointer; white-space: nowrap; }
.pk:hover { border-color: #6d8fc2; }
.pk.on { color: #fff; background: #3c6fc0; border-color: #3c6fc0; }
.pk.over { box-shadow: 0 0 0 2px #9fbbe8; }
.dyes.one { flex-wrap: nowrap; justify-content: space-between; gap: 6px; }
.dyes.one .act { padding: 0 3px; font-size: 8px; line-height: 12px; }
.dyes.one b { min-width: 26px; }
.doll { display: grid; grid-template-columns: 30px 1fr 30px; gap: 4px; margin: 4px 0 2px; padding: 4px;
  border: 1px solid #d6deeb; border-radius: 3px; background: linear-gradient(#ffffff, #eef2f8); }
.doll .col { display: grid; gap: 3px; align-content: start; }
.stg { display: flex; align-items: flex-end; justify-content: center; min-height: 150px; min-width: 0; }
.stg canvas { width: 110px; height: 150px; image-rendering: pixelated; }
.stg .fb { align-self: center; display: grid; justify-items: center; gap: 3px; color: #9aa7ba; font-size: 10px; text-align: center; }
.stg .fb img { image-rendering: pixelated; }
.sl.own { border-color: #b9c4d4; background: linear-gradient(#ffffff, #eef1f6); cursor: default; }
.sl.ghost { opacity: .45; }
.sl.nil .lb { font-size: 7px; color: #b0bccb; pointer-events: none; }
.cost { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; margin-top: 2px; }
.cost .lb { font-size: 10px; font-weight: bold; color: #6a7a92; margin-right: 3px; }
/* 3.10.2: shadow gear, a light purple next to the gold of the costumes. */
.cost .lb.s2 { margin-left: 10px; }
.cost .none { font-size: 10px; color: #9aa7ba; }
.sl.sh { border-color: #9a86c9; background: linear-gradient(#fbf9ff, #ebe4f8); }
.sl.sh.on { border-color: #6b4fb0; box-shadow: 0 0 0 1px #6b4fb0 inset; }
/* 3.10.0: the Roster tab: Active / Inactive cards, a More row, the Hire page. */
.fc { position: relative; display: block; flex: none; overflow: hidden; border: 1px solid #9fb0c8; border-radius: 4px; background: #e9eef7; }
.fc img { position: absolute; max-width: none; pointer-events: none; }
.fc.nf { display: flex; align-items: center; justify-content: center; font: bold 11px Tahoma, sans-serif; color: #6a7a92; }
.rh { display: flex; align-items: center; justify-content: space-between; margin: 2px 0 4px; font: bold 12px Tahoma, sans-serif; color: #1f3f73; }
.rh.off { color: #6a7a92; margin-top: 8px; }
.rc { padding: 4px 5px; border: 1px solid #d6deeb; border-radius: 3px; background: #fff; margin-bottom: 4px; }
.rc.off { background: #f1f3f7; }
.rc.off .fc { filter: grayscale(.6); opacity: .85; }
.rc .top { align-items: center; }
.rc .who { flex: 1; min-width: 0; }
.rc .who .nm { display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; }
.rc .who .jb { display: block; }
.role { font-size: 9px; padding: 0 5px; border-radius: 7px; color: #fff; font-weight: bold; }
.role.r3 { background: #c0563a; } .role.r1 { background: #4a6fa8; } .role.r2 { background: #4f9a5c; }
.cw button.act.go { color: #fff; background: #3c6fc0; border-color: #2c5aa0; }
.cw button.act.go:hover { background: #2f5fae; }
.cw button.act.red { color: #8a2219; background: #f8e5e3; border-color: #d9a8a2; }
.cw button.act.on { color: #fff; background: #5a7fb8; border-color: #3c6fc0; }
.cw button.act:disabled { color: #9aa7ba; background: #eef1f6; border-color: #d6deeb; cursor: default; }
.cw button.dots { padding: 1px 5px; }
.rmore { margin-top: 4px; padding-top: 4px; border-top: 1px dashed #d6deeb; display: grid; gap: 3px; }
.rmore .ln { display: flex; align-items: center; gap: 6px; }
.rmore .ln .act { width: 74px; flex: none; }
.rmore .ln span { font-size: 10px; color: #6a7a92; }
.rmore .end { display: flex; justify-content: flex-end; }
/* 3.10.2: the Stats fold, under its button. */
.rst { margin: 1px 0 3px 80px; padding: 5px 6px; border: 1px solid #c9d8f0; border-radius: 3px; background: #eef4fd;
  display: grid; grid-template-columns: 1fr 1fr; column-gap: 10px; row-gap: 1px; font-variant-numeric: tabular-nums; }
.rst .pr { display: flex; justify-content: space-between; gap: 6px; }
.rst .k { color: #6a7a92; } .rst .v { color: #1f3f73; font-weight: bold; text-align: right; }
.rst .rule { grid-column: 1 / -1; border-top: 1px dotted #b9c7de; margin: 3px 0 2px; }
.rst .ft { grid-column: 1 / -1; font-size: 9.5px; color: #6a7a92; line-height: 1.35; }
.ask { margin-top: 4px; padding: 5px 6px; border: 1px solid #d9a8a2; border-radius: 3px; background: #fdf3f2; line-height: 1.4; }
.ask.blue { border-color: #9fbbe8; background: #eef4fd; }
.ask b { color: #8a2219; } .ask.blue b { color: #1f3f73; }
.ask .ob { margin-top: 4px; }
.me { padding: 4px 6px; margin-bottom: 5px; border: 1px solid #c9d8f0; border-radius: 3px; background: #eef4fd; line-height: 1.45; }
.me b { color: #1f3f73; }
.seg { display: flex; margin-bottom: 5px; }
.seg button { flex: 1 1 0; font: bold 11px Tahoma, sans-serif; color: #4a5f80; background: #eef2f8; border: 1px solid #b9c7de; padding: 3px 0; cursor: pointer; }
.seg button + button { border-left: none; }
.seg button:first-child { border-radius: 3px 0 0 3px; } .seg button:last-child { border-radius: 0 3px 3px 0; }
.seg button.on { color: #fff; background: #3c6fc0; border-color: #2c5aa0; }
.jobs { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 4px; }
.jt { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 1px 3px; border: 1px solid #d6deeb; border-radius: 4px;
  background: #fff; cursor: pointer; font: bold 10px Tahoma, sans-serif; color: #1f3f73; min-width: 0; }
.jt span.l { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.jt:hover { border-color: #6d8fc2; }
.jt.on { border-color: #3c6fc0; box-shadow: 0 0 0 1px #3c6fc0 inset; background: #eef4fd; }
.jt.lock { cursor: default; opacity: .5; }
.jt.lock:hover { border-color: #d6deeb; }
.jt .lk { font: normal 9px Tahoma, sans-serif; color: #8a6a12; }
.hb { display: flex; align-items: center; gap: 7px; margin-top: 6px; padding: 5px 6px; border: 1px solid #d8c88e; border-radius: 3px; background: #fffaf0; }
.hb .tx { flex: 1; min-width: 0; line-height: 1.4; }
.hb .tx b { color: #1f3f73; }
.hb .z { color: #8a6a12; }
.hdone { display: grid; justify-items: center; gap: 6px; padding: 14px 6px; text-align: center; }
.hdone b { font-size: 13px; color: #1f3f73; }
`;

// 3.5.0: the Bag tab's hover details, drawn over the game (not inside the window, so
// they can reach past its edge).
const TIP_STYLE = `
* { cursor: inherit !important; }
.tip { position: fixed; z-index: 9050; max-width: 230px; padding: 5px 7px; font: 11px Tahoma, "Segoe UI", sans-serif;
  color: #2b2b2b; background: #fdfdfe; border: 1px solid #8fa3bc; border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0,0,0,.35); pointer-events: none; line-height: 1.35; }
.tip[hidden] { display: none; }
.hd { display: flex; gap: 5px; align-items: center; }
.hd img { width: 24px; height: 24px; image-rendering: pixelated; flex: none; }
.hd img:not([src]) { visibility: hidden; }
.hd b { display: block; color: #1f3f73; }
.hd span { font-size: 10px; color: #6a7a92; }
.op { color: #b0650c; font-weight: bold; }
.cd { color: #7a45c4; }
.ds { margin-top: 3px; padding-top: 3px; border-top: 1px dotted #d6deeb; white-space: pre-line; color: #3b4658;
  max-height: 150px; overflow: hidden; }
.hint { margin-top: 3px; font-size: 10px; color: #3c6fc0; }
`;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = n => Number(n || 0).toLocaleString('en-US');
// "STR +3" from an option id and value.
const optText = ([id, v]) => OPTION_NAMES[id] ? OPTION_NAMES[id].replace('%d', v).replace('%%', '%') : `Option ${id}: ${v}`;

// Random option names by id, for the bag's details. A copy of Diablorok's option name table
// (addrandomoptionnametable.lub): every new affix there must be added here too.
const OPTION_NAMES = {
    1:"MaxHP +%d", 2:"MaxSP +%d", 3:"STR +%d", 4:"AGI +%d", 5:"VIT +%d", 6:"INT +%d", 7:"DEX +%d", 8:"LUK +%d",
    9:"MaxHP +%d%%", 10:"MaxSP +%d%%", 11:"HP Recovery +%d%%", 12:"SP Recovery +%d%%", 13:"Damage +%d%%",
    14:"MATK +%d%%", 15:"ASPD +%d", 16:"ASPD +%d%%", 17:"ATK +%d", 18:"HIT +%d", 19:"MATK +%d", 20:"DEF +%d",
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
    47:"ATK +%d%% against Poison monster", 48:"Holy monster resistance +%d%%",
    49:"ATK +%d%% against Holy monster", 50:"Shadow monster resistance +%d%%",
    51:"ATK +%d%% against Shadow monster", 52:"Ghost monster resistance +%d%%",
    53:"ATK +%d%% against Ghost monster", 54:"Undead monster resistance +%d%%",
    55:"ATK +%d%% against Undead monster", 56:"Neutral monster magic resistance +%d%%",
    57:"MATK +%d%% against Neutral monster", 58:"Water monster magic resistance +%d%%",
    59:"MATK +%d%% against Water monster", 60:"Earth monster magic resistance +%d%%",
    61:"MATK +%d%% against  Earth monster", 62:"Fire monster magic resistance +%d%%",
    63:"MATK +%d%% against Fire monster", 64:"Wind monster magic resistance +%d%%",
    65:"MATK +%d%% against Wind monster", 66:"Poison monster magic resistance +%d%%",
    67:"MATK +%d%% against Poison monster", 68:"Holy monster magic resistance +%d%%",
    69:"MATK +%d%% against Holy monster", 70:"Shadow monster magic resistance +%d%%",
    71:"MATK +%d%% against Shadow monster", 72:"Ghost monster magic resistance +%d%%",
    73:"MATK +%d%% against Ghost monster", 74:"Undead monster magic resistance +%d%%",
    75:"MATK +%d%% against Undead monster", 76:"Armor Element: Neutral", 77:"Armor Element: Water",
    78:"Armor Element: Earth", 79:"Armor Element: Fire", 80:"Armor Element: Wind", 81:"Armor Element: Poison",
    82:"Armor Element: Holy", 83:"Armor Element: Shadow", 84:"Armor Element: Ghost", 85:"Armor Element: Undead",
    87:"Formless monster resistance +%d%%", 88:"Undead monster resistance +%d%%",
    89:"Brute monster resistance +%d%%", 90:"Plant monster resistance +%d%%",
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
    162:"Large monster resistance +%d%%", 163:"Nullify weapon's damage size penalty", 164:"Critical Damage +%d%%",
    165:"Critical damage taken -%d%%", 166:"Ranged Physical Damage +%d%%",
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
    234:"Experience gained from Brute race monsters +%d%%",
    235:"Experience gained from Plant race monsters +%d%%",
    236:"Experience gained from Insect race monsters +%d%%",
    237:"Experience gained from Fish race monsters +%d%%", 238:"Experience gained from Demon race monsters +%d%%",
    239:"Experience gained from Demi-Human race monsters +%d%%",
    240:"Experience gained from Angel race monsters +%d%%",
    241:"Experience gained from Dragon race monsters +%d%%", 242:"Experience gained from all race monsters +%d%%",
    243:"POW +%d", 244:"SPL +%d", 245:"STA +%d", 246:"WIS +%d", 247:"CON +%d", 248:"CRT +%d", 249:"P.ATK +%d",
    250:"S.MATK +%d", 251:"RES +%d", 252:"MRES +%d", 253:"H.PLUS +%d", 254:"C.RATE +%d",
    300:"Double Attack chance %d%% (any weapon, best one counts)", 301:"Steal %d%% of damage as HP",
    302:"Steal %d%% of damage as SP", 303:"%d%% chance to bleed the target", 304:"%d%% chance to stun the target",
    305:"%d%% chance to freeze the target", 306:"%d%% chance to blind the target",
    307:"%d%% chance to poison the target", 308:"%d%% chance to curse the target",
    309:"%d%% chance to silence the target", 310:"5%% chance to cast Lv %d Fire Bolt on attack",
    311:"5%% chance to cast Lv %d Cold Bolt on attack", 312:"5%% chance to cast Lv %d Lightning Bolt on attack",
    313:"Resist stun +%d%%", 314:"Resist freeze +%d%%", 315:"Resist stone +%d%%", 316:"Resist sleep +%d%%",
    317:"Resist silence +%d%%", 318:"Resist curse +%d%%", 319:"Resist blind +%d%%", 320:"Resist poison +%d%%",
    321:"Heal %d HP every 5 seconds", 322:"Melee attackers take %d%% of their damage back",
    323:"Walk speed +%d%%", 324:"Heal %d HP on each kill", 325:"Gain %d SP on each kill", 326:"Magic Find +%d%%",
    327:"Gain up to %d extra zeny per kill (best one counts)", 330:"Bash damage +%d%%",
    331:"Bowling Bash damage +%d%%", 332:"Brandish Spear damage +%d%%", 333:"Holy Cross damage +%d%%",
    334:"Shield Boomerang damage +%d%%", 335:"Fire Bolt damage +%d%%", 336:"Cold Bolt damage +%d%%",
    337:"Lightning Bolt damage +%d%%", 338:"Storm Gust damage +%d%%", 339:"Jupitel Thunder damage +%d%%",
    340:"Heaven's Drive damage +%d%%", 341:"Double Strafe damage +%d%%", 342:"Arrow Shower damage +%d%%",
    343:"Blitz Beat damage +%d%%", 344:"Melody Strike damage +%d%%", 345:"Slinging Arrow damage +%d%%",
    346:"Holy Light damage +%d%%", 347:"Magnus Exorcismus damage +%d%%", 348:"Raging Trifecta Blow damage +%d%%",
    349:"Throw Spirit Sphere damage +%d%%", 350:"Asura Strike damage +%d%%", 351:"Mammonite damage +%d%%",
    352:"Cart Revolution damage +%d%%", 353:"Acid Terror damage +%d%%", 354:"Bomb damage +%d%%",
    355:"Sonic Blow damage +%d%%", 356:"Grimtooth damage +%d%%", 357:"Back Stab damage +%d%%",
    358:"Sightless Mind damage +%d%%", 359:"Tornado Kick damage +%d%%", 360:"Tracking damage +%d%%",
    361:"Throw Huuma Shuriken damage +%d%%",
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
            closest: f[19] || '',
            // 3.7.0, Bonds: points, tier 1-5, campfire nights, gifts
            pts: +f[20] || 0, tier: +f[21] || 1, camps: +f[22] || 0, gifts: +f[23] || 0,
            // 3.9.1: char id (the Journal asks by it), chapters of its story told
            cid: f[24] || '', told: +f[25] || 0
        });
    }
    return out;
}

// @clorder state (3.7.0): OK|companions here|portal caster|why no portal|portal home|
// appraiser|why no appraisal|unidentified|camp lit|roamers|roam alone|roaming on|campfire on|
// 3.10.2: smith|why no repair|broken items|3.11.0: hunt (1 MVP)|Fly Wings in their bags|"<name> found <MVP>"|
// 3.12.0: on Stand By|3.12.7: on a shopping trip
function parseOrders(text) {
    const f = String(text || '').split('|');
    if (f[0] !== 'OK') return null;
    return { alive: +f[1] || 0, caster: f[2] || '', warpWhy: f[3] || '', home: f[4] === '1', appraiser: f[5] || '',
        appWhy: f[6] || '', unid: +f[7] || 0, camp: f[8] === '1', roamers: +f[9] || 0, alone: f[10] === '1',
        roamOn: f[11] === '1', campOn: f[12] === '1', smith: f[13] || '', repWhy: f[14] || '', broken: +f[15] || 0,
        mvp: f[16] === '1', wings: +f[17] || 0, found: f[18] || '', standby: f[19] === '1', shopping: f[20] === '1' };
}

// Bond tiers (3.7.0), as the server's .bt_need / .bt_perk.
const TIERS = [null,
    { name: 'Acquaintance', need: 0 }, { name: 'Companion', need: 100, perk: '+2% max HP and SP' },
    { name: 'Trusted', need: 300, perk: 'better gifts, camp meals 15 minutes longer' },
    { name: 'Sworn', need: 750, perk: '+4% max HP and SP' }, { name: 'Kindred', need: 1500, perk: '+6% max HP and SP' }];
const BOND_HPSP = [0, 0, 2, 2, 4, 6];

// @clbag list: P|purse|inventory on|zeny per level|in town, C|cid|name|job|
// colours...|weight|max weight|class|sex|hair style|weapon|shield|head low|head top|
// head mid|garment|mount bits (3.5.0: the look), R|cid|item id|keep|name,
// I|cid|index|item id|amount|worn|refine|cards|options|bound|rental|own|name
// (own, 3.5.0: its own starting gear, listed for the Equip layout, not takeable).
// 3.8.4: "list <cid> <have>": R and I lines come only for the companion picked
// (P's 6th field, detail); the answer is "SAME" when nothing changed.
function parseBag(text) {
    const bag = { purse: 0, inv: false, rate: 0, town: false, detail: null, comps: [] };
    const byCid = {};
    for (const rec of String(text || '').split('~')) {
        const f = rec.split('|');
        if (f[0] === 'P') { bag.purse = +f[1] || 0; bag.inv = f[2] === '1'; bag.rate = +f[3] || 0; bag.town = f[4] === '1'; bag.detail = f[5] ?? null; }
        else if (f[0] === 'C') {
            byCid[f[1]] = { cid: f[1], name: f[2], job: f[3], items: [], restock: [],
                cloth: +f[4] || 0, clothMin: +f[5] || 0, clothMax: +f[6] || 0,
                hair: +f[7] || 0, hairMin: +f[8] || 0, hairMax: +f[9] || 0,
                weight: +f[10] || 0, maxWeight: +f[11] || 0,
                look: f.length > 12 ? { job: +f[12] || 0, sex: +f[13] || 0, head: +f[14] || 0, headpalette: +f[7] || 0,
                    bodypalette: +f[4] || 0, weapon: +f[15] || 0, shield: +f[16] || 0, accessory: +f[17] || 0,
                    accessory2: +f[18] || 0, accessory3: +f[19] || 0, robe: +f[20] || 0, effectState: +f[21] || 0 } : null,
                // 3.9.0: its pet, out 1/0 (-1: the pets setting is off), its name, kept
                // (3) / yours to allow (2) / it will ask (1) / not yet (0), and what it is.
                pet: f[22] === undefined ? -1 : +f[22], petName: f[23] || '',
                petState: +f[24] || 0, petKind: f[25] || f[23] || '' };
            bag.comps.push(byCid[f[1]]);
        }
        else if (f[0] === 'R' && byCid[f[1]]) {
            byCid[f[1]].restock.push({ id: +f[2] || 0, keep: +f[3] || 0, name: f.slice(4).join('|') });
        }
        else if (f[0] === 'I' && byCid[f[1]]) {
            byCid[f[1]].items.push({ idx: f[2], id: +f[3] || 0, amount: +f[4] || 0, worn: +f[5] || 0,
                refine: +f[6] || 0, cardIds: (f[7] || '').split(',').map(Number).filter(Boolean),
                opts: (f[8] || '').split(',').filter(Boolean).map(o => o.split(':').map(Number)),
                // Before 3.5.0 the server sent no own field (its own gear wasn't listed).
                ...(byCid[f[1]].look ? { own: f[11] === '1', name: f.slice(12).join('|') } : { own: false, name: f.slice(11).join('|') }),
                bound: f[9] === '1', rental: f[10] === '1' });
        }
    }
    return bag;
}

// @clbag lootlist: P|purse|trip start|Overcharge %|finds on, then
// L|item id|amount|found at|sell price each|card (1/0, 3.10.1)|name. Newest finds first.
function parseLoot(text) {
    const loot = { purse: 0, trip: 0, oc: 0, on: true, items: [] };
    for (const rec of String(text || '').split('~')) {
        const f = rec.split('|');
        if (f[0] === 'P') { loot.purse = +f[1] || 0; loot.trip = +f[2] || 0; loot.oc = +f[3] || 0; loot.on = f[4] !== '0'; }
        else if (f[0] === 'L') loot.items.push({ id: +f[1] || 0, amount: +f[2] || 0, at: +f[3] || 0, sell: +f[4] || 0, card: f[5] === '1', name: f.slice(6).join('|') });
    }
    loot.items.sort((a, b) => b.at - a.at || a.name.localeCompare(b.name));
    return loot;
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
    import('./portraits.js').then(m => m.default(parameters, api))
        .catch(e => console.error('[companion-party-overhaul] portraits:', e));

    let win = null, body = null, tab = 'orders', list = [], listAt = 0, timer = null, busy = false;
    let bag = null, bagAt = 0, bagMsg = null;   // the Bag tab: last answer, when, last action's result
    let loot = null, lootAt = 0;                // the Loot tab: last answer, when
    let orders = null, ordersAt = 0;            // the Orders tab (3.7.0): last @clorder state, when
    let stance = '';                            // the stance last sent (the engine keeps it; we only remember)
    try { stance = api.preferences.get('stance', '') || ''; } catch { /* fine */ }
    let focus = false;                          // focus on your target, as last sent (back to off on a restart)
    const setOn = key => parameters?.[key] !== false && parameters?.[key] !== 0;
    const focusOk = setOn('chat_orders');       // focus is a party-chat strategy (db/when/chat_orders)
    const roamStyles = setOn('roam_together');  // As a group / Alone needs the group rules loaded
    let msgTimer = null;                        // { msg, id }: the answer line clears itself after a few seconds
    let sel = null;                             // the picked square: "<cid>:<index>" or "<cid>:w<slots>"
    let giving = null;                          // a stack dropped on a companion: { cid, idx, id, max, name, n }
    let takeN = { key: null, n: 0 };            // how many to take of the picked stack (kept through the refresh)
    let lootAsk = false;                        // 3.10.1: the Loot tab's "Sell all?" box is up
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

    const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, Math.round(a * 100 / b))) : 0);   // the Bag tab's weight bar

    // 3.7.0: the bond (was Memories): the tier, a bar to the next, its perks, and a few
    // highlights instead of the counters. 3.13.1: one companion, folded in the Roster.
    function bondHtml(c) {
        {
            const t = Math.min(5, Math.max(1, c.tier || 1));
            const cur = TIERS[t], next = TIERS[t + 1];
            const pct = next ? Math.max(0, Math.min(100, Math.round((c.pts - cur.need) * 100 / (next.need - cur.need)))) : 100;
            const perks = [];
            if (BOND_HPSP[t]) perks.push(`+${BOND_HPSP[t]}% max HP and SP`);
            if (t >= 3) perks.push('better gifts, camp meals 15 minutes longer');
            // 3.9.1: one short line of highlights (first MVP, places and counts went: they
            // still come up in their talk), and the Journal below.
            const hl = [`Together <b>${c.days === 1 ? '1 day' : num(c.days) + ' days'}</b>`];
            if (c.closest) hl.push(`closest to <b>${c.closest === 'you' ? 'you &#9829;' : esc(c.closest)}</b>`);
            return `<div class="bd"><div class="top"><span class="nm">${esc(c.name)}</span><span class="jb">${c.job ? esc(c.job) : ''}</span>`
                + `<span class="tier t${t}">${cur.name}</span></div>`
                + `<div class="bar bond"><i style="width:${pct}%"></i><b>${num(c.pts)}${next ? ' / ' + num(next.need) : ''}</b></div>`
                + (perks.length ? `<div class="perk">&#10003; ${perks.join(' &middot; ')}</div>` : '')
                + (next ? `<div class="perk next">Next: ${next.name} at ${num(next.need)} (${next.perk})</div>` : '<div class="perk">The closest a bond can be.</div>')
                + `<div class="hl">${hl.join(' &middot; ')}</div>`
                + (c.cid ? journalHTML(c) : '') + '</div>';
        }
    }

    // 3.9.1: the Journal, folded under each companion in the Bonds tab: its life story
    // chapter by chapter (the whole talk, who heard it; the ones still to come greyed,
    // with when), your answer in its story and what came of it, and the moments it asked
    // you. Fetched when opened ("@cljournal <cid>", the server's OnCmdJournal).
    const journals = new Map();      // cid -> { data, at } | { loading: true }
    const openJr = new Set(), openCh = new Set();
    function parseJournal(text) {
        const j = { told: 0, chapters: [], choice: null, moments: [] };
        for (const rec of String(text || '').split('~')) {
            const f = rec.split('|');
            if (f[0] === 'J') j.told = +f[1] || 0;
            else if (f[0] === 'C') j.chapters.push({ n: +f[1], title: f[2], who: f[3], turns: (f[4] || '').split('^').filter(Boolean).map(t => [t[0], t.slice(2)]) });
            else if (f[0] === 'L') j.chapters.push({ n: +f[1], title: f[2], when: f[3], locked: true });
            else if (f[0] === 'X') j.choice = { label: f[1], after: f[2] || '' };
            else if (f[0] === 'M') j.moments.push({ q: f[1], a: f[2] });
        }
        return j;
    }
    async function loadJournal(cid) {
        journals.set(cid, { loading: true });
        try {
            const reply = String(await api.server.request('cljournal', cid, { timeout: 5000 }) || '');
            journals.set(cid, { data: reply.startsWith('ERR') ? null : parseJournal(reply), at: Date.now() });
        } catch { journals.delete(cid); }
        render();
    }
    function journalHTML(c) {
        const open = openJr.has(c.cid);
        const j = journals.get(c.cid);
        let body = '';
        if (open) {
            if (!j || j.loading) body = '<div class="jm">Opening the journal...</div>';
            else if (!j.data) body = '<div class="jm">Nothing written yet.</div>';
            else {
                const d = j.data;
                body += `<div class="jh">${esc(c.name)}'s story</div>`;
                for (const h of d.chapters.sort((x, y) => x.n - y.n)) {
                    if (h.locked) {
                        body += `<div class="jc locked"><button disabled><span class="ar">&#9654;</span><span class="tt">Chapter ${h.n}</span><span class="wh">${esc(h.when)}</span></button></div>`;
                        continue;
                    }
                    const key = `${c.cid}:${h.n}`, co = openCh.has(key);
                    body += `<div class="jc${co ? ' open' : ''}"><button data-ch="${esc(key)}"><span class="ar">&#9654;</span><span class="tt">Chapter ${h.n}: ${esc(h.title)}</span><span class="wh">told to ${esc(h.who)}</span></button>`;
                    if (co) {
                        body += '<div class="jl">' + h.turns.map(([s, l]) =>
                            `<p><span class="s${s === 'A' ? '' : ' b'}">${esc(s === 'A' ? c.name : h.who)}:</span> ${esc(l)}</p>`).join('');
                        if (h.n === 3 && d.choice)
                            body += `<div class="jx">You told ${esc(c.name)}: <b>${esc(d.choice.label)}</b>.${d.choice.after ? ` Later: ${esc(d.choice.after)}` : ''}</div>`;
                        body += '</div>';
                    }
                    body += '</div>';
                }
                if (d.choice && d.chapters.filter(h => !h.locked).length < 3)
                    body += `<div class="jx">You told ${esc(c.name)}: <b>${esc(d.choice.label)}</b>.${d.choice.after ? ` Later: ${esc(d.choice.after)}` : ''}</div>`;
                if (d.moments.length) {
                    body += '<div class="jh">Moments</div>' + d.moments.map(m =>
                        `<div class="jm">&middot; ${esc(m.q)} <span class="ja">You: ${esc(m.a)}</span></div>`).join('');
                }
            }
        }
        return `<div class="jr${open ? ' open' : ''}"><button data-jr="${esc(c.cid)}"><span class="ar">&#9654;</span> Journal`
            + ` <span class="cnt">(${c.told} of 5 chapters)</span></button>${open ? `<div class="jb2">${body}</div>` : ''}</div>`;
    }

    // 3.7.0: the Orders tab. Each button is an order you could type in party chat;
    // one nobody can carry out is greyed, with the reason under it.
    function renderOrders() {
        if (!orders) return '<div class="empty">Asking your companions...</div>';
        const o = orders, out = [];
        if (bagMsg) out.push(msgLine());
        if (!o.alive) out.push('<div class="note">No companions standing here with you: orders reach the ones on this map.</div>');
        const btn = (act, label, title, on = false, off = false) =>
            `<button class="ord${on ? ' on' : ''}" data-ord="${act}" title="${esc(title)}"${off ? ' disabled' : ''}>${label}</button>`;
        out.push('<div class="og"><h4>Fight <small>the whole party</small></h4><div class="ob">'
            + btn('stance attack', 'Engage', 'They attack any monster near you', stance === 'attack')
            + btn('stance defensive', 'Protect', 'They fight what attacks you or the party', stance === 'defensive')
            + btn('stance passive', 'Hold', 'They never start a fight', stance === 'passive')
            + '</div><div class="ob">'
            + btn('focus on', 'Focus: On', 'Everyone attacks your target, and switches when you do', focus, !focusOk)
            + btn('focus off', 'Focus: Off', 'Back to choosing their own targets', !focus, !focusOk)
            + '</div>' + (focusOk ? '' : '<div class="why">Focus needs "Orders in party chat" on in the mod settings.</div>') + '</div>');
        // 3.12.0: one job at a time, one click (was Roam: Go hunt, Come back, Normal, MVP).
        // 3.12.7: a shopping trip is roaming to the engine, but no task of yours: no button lit.
        const noRoam = !o.roamOn, out_ = o.roamers > 0, standing = out_ && o.standby, shopping = out_ && o.shopping,
            hunting = out_ && !o.standby && !o.shopping;
        const doing = standing ? `${o.roamers} standing by` : shopping ? `${o.roamers} out shopping` : hunting ? `${o.roamers} ${o.mvp ? 'looking for the MVP' : 'out hunting'}` : 'following you';
        out.push(`<div class="og"><h4>Task <small>${doing}</small></h4><div class="ob ob4">`
            + btn('roam off', 'Follow', 'They follow you', !out_, noRoam)
            + btn('stand on', 'Stand By', 'They stay right here and wait, and only fight what attacks them', standing, noRoam || !o.alive)
            + btn('hunt normal', 'Hunt', 'They roam the map and hunt everything, and Fly Wing on when nothing is around', hunting && !o.mvp, noRoam || !o.alive)
            + btn('hunt mvp', 'Find MVP', 'They fly around looking for the MVP or a mini-boss, call you when they find one, and wait out of its reach', hunting && o.mvp, noRoam || !o.alive)
            + '</div>'
            // Only a Hunt has a choice here: MVP searches are always one by one.
            + (roamStyles && hunting && !o.mvp ? '<div class="ob">'
                + btn('style group', 'Group', 'They stick together behind the tank, call for help and gather at a fallen one', !o.alone)
                + btn('style alone', 'Solo', 'Each one hunts on its own', o.alone) + '</div>' : '')
            + (noRoam ? '<div class="why">Turn on Companion roaming in the app\'s Settings (Population).</div>'
                : o.found ? `<div class="why ok">${esc(o.found)}! Right-click their party frame to Fly Wing over.</div>`
                : standing ? '<div class="why ok">They wait here. Leave the map and they follow you again.</div>'
                : hunting && !o.wings ? `<div class="why">No Fly Wings in their bags, so they go on foot: add some to their restock lists (Bag tab).</div>`
                : hunting ? `<div class="why ok">${o.mvp ? 'They search and call you, no fights.' : 'They hunt everything.'} Fly Wings in their bags: ${num(o.wings)}.</div>` : '')
            + '</div>');
        out.push(`<div class="og"><h4>Camp <small>${o.camp ? 'the fire is lit' : 'or they make camp after 5 minutes standing still'}</small></h4><div class="ob">`
            + btn('camp on', 'Make camp', 'A campfire here: talks, a meal, and Well Rested when you leave', false, !o.campOn || o.camp || !o.alive)
            + btn('camp off', 'Pack up', 'Put the fire out', false, !o.campOn || !o.camp)
            + '</div>' + (o.campOn ? '' : '<div class="why">Campfire nights are off in the mod settings.</div>') + '</div>');
        out.push(`<div class="og"><h4>Warp Portal <small>${esc(o.caster)}</small></h4><div class="ob">`
            + btn('warp', o.home ? 'Take us back' : 'Return to the spot', o.home ? 'A portal to your save point; this spot is remembered'
                : 'A portal back to where you left the hunt', false, !!o.warpWhy)
            + `</div><div class="why${o.warpWhy ? '' : ' ok'}">${esc(o.warpWhy || (o.home ? 'Ready: home now, back to this spot later.' : 'Ready: back to where you left the hunt.'))}</div></div>`);
        // 3.10.2: Merchant services: Appraise (any Merchant line) and Repair (a Blacksmith or Whitesmith).
        const who = [...new Set([o.appraiser, o.smith].filter(Boolean))].join(' & ');
        out.push(`<div class="og"><h4>Merchant Services <small>${esc(who)}</small></h4><div class="ob">`
            + btn('appraise', o.unid ? `Appraise ${num(o.unid)} item${o.unid === 1 ? '' : 's'}` : 'Appraise', 'Identify the unknown items in your bag, 10 SP each', false, !!o.appWhy)
            + btn('repair', o.broken ? `Repair ${num(o.broken)} item${o.broken === 1 ? '' : 's'}` : 'Repair', 'Fix broken gear, yours and the party\'s, 30 SP each', false, !!o.repWhy)
            + `</div><div class="why${o.appWhy ? '' : ' ok'}">Appraise: ${esc(o.appWhy || `${o.appraiser} identifies them for 10 SP each.`)}</div>`
            + `<div class="why${o.repWhy ? '' : ' ok'}">Repair: ${esc(o.repWhy || `${o.smith} fixes them for 30 SP each.`)}</div></div>`);
        return out.join('');
    }

    // An action's answer, floating over the top of the tab (it takes no room).
    const msgLine = () => `<div class="msgpin"><div class="msg ${bagMsg.ok ? 'ok' : 'err'}">${esc(bagMsg.text)}</div></div>`;

    // 3.10.0: the Roster tab, the app's Companions window in ours. Everyone you have
    // saved: Active (in your party) and Inactive (benched), each with Bench / Summon and
    // a More row (Stats, Skills, Role, Homunculus, Rebirth, Part ways; 3.10.2: Stats took
    // Favourite's place, at the user's call). The
    // Hire page: your own class tier (transcendent only once you are), at your level,
    // for a one-time fee (the first companion is free). Asks @clroster (OnCmdRoster).
    let roster = null, rosterAt = 0, rosterRaw = '';
    let rView = 'list', rMore = '', rAsk = null, hireSex = 'm', hireJob = '', hireDone = null;
    let rStats = null;  // 3.10.2: the open Stats fold { name, d: numbers | null, err }
    let rBond = '';     // 3.13.1: whose Bond fold is open (its numbers come from @clstat, `list`)
    let faces = null;   // { PICS, KEY, CROPS, icon } once the portraits are loaded
    Promise.all([import('./portraits_data.js'), import('./portraits.js'), import('./frames.js')])
        .then(([d, p, f]) => { faces = { PICS: d.default || {}, KEY: p.CLASS_KEY || {}, CROPS: f.CROPS || {}, icon: f.jobIcon }; if (tab === 'roster') render(); })
        .catch(() => {});
    // 3.10.2: job icons for classes with no portrait, by job id ('' until it has loaded).
    const jobUrls = new Map();
    function jobUrl(cls) {
        if (!cls || !faces?.icon) return '';
        if (!jobUrls.has(cls)) {
            jobUrls.set(cls, '');
            faces.icon(api, cls).then(url => { if (url) { jobUrls.set(cls, url); if (tab === 'roster') render(); } });
        }
        return jobUrls.get(cls);
    }
    // The engine's duty codes (PopulationRoleType) and the order a Role click walks.
    const ROLE = { 1: 'Tank', 2: 'Support', 3: 'Attacker' };
    const ROLE_NEXT = { 0: 'attacker', 3: 'tank', 1: 'support', 2: 'attacker' };
    const ROLE_CODE = { attacker: 3, tank: 1, support: 2 };
    // Who you may hire: [the engine's draft name, label, class], and for the pairs
    // that are one class per sex, the women's [name, label, class] after.
    const HIRE = {
        1: [['Swordsman', 'Swordman', 1], ['Mage', 'Mage', 2], ['Archer', 'Archer', 3], ['Acolyte', 'Acolyte', 4], ['Merchant', 'Merchant', 5],
            ['Thief', 'Thief', 6], ['Taekwon', 'Taekwon', 4046], ['Gunslinger', 'Gunslinger', 24], ['Ninja', 'Ninja', 25]],
        2: [['Knight', 'Knight', 7], ['Crusader', 'Crusader', 14], ['Wizard', 'Wizard', 9], ['Sage', 'Sage', 16], ['Hunter', 'Hunter', 11],
            ['Bard', 'Bard', 19, 'Dancer', 'Dancer', 20], ['Priest', 'Priest', 8], ['Monk', 'Monk', 15], ['Blacksmith', 'Blacksmith', 10],
            ['Alchemist', 'Alchemist', 18], ['Assassin', 'Assassin', 12], ['Rogue', 'Rogue', 17], ['StarGladiator', 'Star Gladiator', 4047],
            ['SoulLinker', 'Soul Linker', 4049]],
        t: [['LordKnight', 'Lord Knight', 4008], ['Paladin', 'Paladin', 4015], ['HighWizard', 'High Wizard', 4010], ['Professor', 'Professor', 4017],
            ['Sniper', 'Sniper', 4012], ['Clown', 'Clown', 4020, 'Gypsy', 'Gypsy', 4021], ['HighPriest', 'High Priest', 4009],
            ['Champion', 'Champion', 4016], ['Whitesmith', 'Whitesmith', 4011], ['Creator', 'Creator', 4019],
            ['AssassinCross', 'Assassin Cross', 4013], ['Stalker', 'Stalker', 4018]],
    };
    // The lowest level each tier joins at (the engine's job profiles), unless a hire
    // found a higher one for a class (the server's F lines).
    const FLOOR = { 1: 10, 2: 40, t: 70 };

    function parseRoster(text) {
        const r = { tier: '1', lv: 0, zeny: 0, fee: 0, free: false, roamOn: false, mode: 0, comps: [], floors: {} };
        for (const rec of String(text || '').split('~')) {
            const f = rec.split('|');
            if (f[0] === 'M') Object.assign(r, { tier: f[1] || '1', lv: +f[2] || 0, zeny: +f[3] || 0, fee: +f[4] || 0,
                free: f[5] === '1', roamOn: f[6] === '1', mode: +f[7] || 0 });
            else if (f[0] === 'C') r.comps.push({ name: f[1], cls: +f[2] || 0, sex: +f[3] || 0, lv: +f[4] || 0, jlv: +f[5] || 0,
                on: f[6] === '1', fav: f[7] === '1', duty: +f[8] || 0, roam: f[9] === '1', hom: +f[10], reb: +f[11], job: f[12] || '' });
            else if (f[0] === 'F') r.floors[f[1]] = +f[2] || 0;
        }
        return r;
    }

    // A face cut from the class portrait (frames.js's crops), else the class's job icon,
    // else the first letters.
    function faceHtml(cls, sex, size, label = '') {
        const base = faces?.KEY?.[cls];
        let key = base ? `${base}_${sex ? 'm' : 'f'}` : '';
        if (key && !faces.PICS[key]) key = `${base}_${sex ? 'f' : 'm'}`;
        const pic = key && faces.PICS[key], crop = key && faces.CROPS[key];
        if (!pic || !crop) {
            const icon = jobUrl(cls);
            if (icon) return `<span class="fc" style="width:${size}px;height:${size}px"><img alt="" src="${esc(icon)}" style="left:0;top:0;width:100%;height:100%"></span>`;
            return `<span class="fc nf" style="width:${size}px;height:${size}px">${esc(String(label || '?').slice(0, 2))}</span>`;
        }
        const s = size / crop[2];
        return `<span class="fc" style="width:${size}px;height:${size}px"><img alt="" src="${pic}" style="width:${(320 * s).toFixed(1)}px;`
            + `height:${(480 * s).toFixed(1)}px;left:${(-(crop[0] - crop[2] / 2) * s).toFixed(1)}px;top:${(-(crop[1] - crop[2] / 2) * s).toFixed(1)}px"></span>`;
    }

    function rosterCard(c) {
        const n = esc(c.name), open = rMore === c.name;
        const role = c.on && ROLE[c.duty] ? `<span class="role r${c.duty}">${ROLE[c.duty]}</span>` : '';
        let h = `<div class="rc${c.on ? '' : ' off'}"><div class="top">${faceHtml(c.cls, c.sex, 36, c.name)}`
            + `<div class="who"><span class="nm">${n}${role}</span>`
            + `<span class="jb">${esc(c.job)} &middot; Lv ${c.lv} / Job ${c.jlv}</span></div>`
            + (c.on ? `<button class="act" data-rs="bench" data-nm="${n}" title="Send ${n} to rest; summon them again any time">Bench</button>`
                : `<button class="act go" data-rs="summon" data-nm="${n}" title="${n} joins your party">Summon</button>`)
            + `<button class="act dots" data-rs="more" data-nm="${n}" title="More">&#8943;</button></div>`;
        if (open) {
            const ln = (btn, text) => `<div class="ln">${btn}<span>${text}</span></div>`;
            h += '<div class="rmore">'
                + ln(`<button class="act${rStats?.name === c.name ? ' on' : ''}" data-rs="stats" data-nm="${n}">Stats</button>`,
                    c.on ? 'Their stats now, gear and buffs included.' : 'Their own points, saved while they rest.')
                + (rStats?.name === c.name ? statsHtml(c, rStats) : '')
                + ln(`<button class="act" data-rs="skills" data-nm="${n}">Skills</button>`, `Opens ${n}'s skill list in the game's Companions window, where you tick the skills they may use.`)
                + (c.on ? ln(`<button class="act" data-rs="role" data-nm="${n}">Role</button>`,
                    `Their part in a fight, now ${ROLE[c.duty] ? 'the ' + ROLE[c.duty] : 'their own pick'}. Click: Attacker, Tank, Support.`) : '')
                + ln(`<button class="act${rBond === c.name ? ' on' : ''}" data-rs="bond" data-nm="${n}">Bond</button>`,
                    'How close you are, its perks and their Journal. Bonds grow with time, fights, MVPs, places, gifts and campfires.')
                + (rBond === c.name ? bondFold(c) : '')
                + (c.hom >= 0 ? ln(`<button class="act${c.hom ? ' on' : ''}" data-rs="hom" data-arg="${c.hom ? 'off' : 'on'}" data-nm="${n}">Homunculus</button>`,
                    c.hom ? 'Their homunculus is out. Click to put it away.' : 'Their homunculus is put away. Click to bring it back.') : '')
                + (c.reb >= 0 ? ln(`<button class="act${c.reb ? ' go' : ''}" data-rs="rebask" data-nm="${n}"${c.reb ? '' : ' disabled'}>Rebirth</button>`,
                    c.reb ? 'Ready! They can start over as a high class.' : 'Not yet: a 2nd job needs base 99 and job 50 first.') : '')
                + `<div class="end"><button class="act red" data-rs="delask" data-nm="${n}">Part ways</button></div></div>`;
        }
        if (rAsk && rAsk.name === c.name) {
            if (rAsk.kind === 'del') h += `<div class="ask"><b>Part ways with ${n} for good?</b><br>This can't be undone. Their level, gear, memories and bond with you go too.`
                + `<div class="ob"><button class="ord" data-rs="cancel">Keep them</button><button class="ord" data-rs="remove" data-nm="${n}">Part ways</button></div></div>`;
            else h += `<div class="ask blue"><b>Rebirth for ${n}?</b><br>Gear the new class can't wear comes off, and what you gave them comes back to you.`
                + `<div class="ob"><button class="ord" data-rs="reb" data-arg="novice" data-nm="${n}" title="Back to level 1, then the full climb as a high class">High Novice</button>`
                + `<button class="ord" data-rs="reb" data-arg="trans" data-nm="${n}" title="Keeps their level and becomes transcendent now">Transcendent now</button></div>`
                + `<div class="ob"><button class="ord" data-rs="cancel">Not now</button></div></div>`;
        }
        return h + '</div>';
    }

    // 3.13.1: the Bond fold, from the @clstat list (party members only).
    function bondFold(c) {
        if (!c.on) return `<div class="rst"><div class="ft">${esc(c.name)}'s bond shows while they're in your party.</div></div>`;
        const b = list.find(x => x.name === c.name);
        if (!b) return `<div class="rst"><div class="ft">${listAt ? 'No bond found yet.' : 'Reading...'}</div></div>`;
        return bondHtml(b);
    }

    // The Stats fold: the six points, and for one in your party the fight numbers
    // beside them (perfect dodge comes in tenths, as the Status window shows it).
    function statsHtml(c, s) {
        const n = esc(c.name);
        if (s.err) return `<div class="rst"><div class="ft">${esc(s.err)}</div></div>`;
        if (!s.d) return '<div class="rst"><div class="ft">Reading...</div></div>';
        const d = s.d, pr = (k, v) => `<div class="pr"><span class="k">${k}</span><span class="v">${v}</span></div>`;
        const left = ['STR', 'AGI', 'VIT', 'INT', 'DEX', 'LUK'].map((k, i) => pr(k, d[i]));
        if (!s.on) return `<div class="rst">${left.slice(0, 3).map((h, i) => h + left[i + 3]).join('')}`
            + `<div class="rule"></div><div class="ft">HIT, FLEE and the rest show once ${n} is in your party.</div></div>`;
        const right = [pr('HIT', d[6]), pr('FLEE', `${d[7]} + ${Math.floor(d[8] / 10)}`), pr('DEF', `${d[9]} + ${d[10]}`),
            pr('MDEF', `${d[11]} + ${d[12]}`), pr('CRIT', d[13]), pr('ASPD', d[14])];
        return `<div class="rst">${left.map((h, i) => h + right[i]).join('')}`
            + '<div class="rule"></div><div class="ft">STR to LUK are their own points. HIT to ASPD count their gear, cards and buffs, like your Status window.</div></div>';
    }
    // Asked fresh every time the fold opens.
    async function loadStats(nm) {
        rStats = { name: nm, d: null, err: '' };
        render();
        for (let i = 0; busy && i < 30; i++) await new Promise(r => setTimeout(r, 100));	// the refresh may be asking
        let reply = '';
        if (busy || inDialog()) reply = inDialog() ? 'ERR|Close the NPC dialog first.' : 'ERR|Busy, try again.';
        else {
            busy = true;
            try { reply = String(await api.server.request('clroster', `stats ${nm}`, { timeout: 4000 }) || ''); }
            catch { reply = 'ERR|No answer from the server. Try again in a moment.'; }
            finally { busy = false; }
        }
        if (rStats?.name !== nm) return;	// folded away meanwhile
        const f = reply.split('|');
        if (f[0] === 'S') rStats = { name: nm, on: f[1] === '1', d: f.slice(2).map(Number), err: '' };
        else rStats = { name: nm, d: null, err: reply.slice(reply.indexOf('|') + 1) || 'No answer from the server.' };
        render();
    }

    // A hire tile's class for the sex picked (Bard / Dancer, Clown / Gypsy are pairs).
    function hireView(j) {
        if (j[3] && hireSex === 'f') return { eng: j[3], label: j[4], cls: j[5], sex: 0 };
        if (j[3] && hireSex === 'r') return { eng: j[0], label: `${j[1]} / ${j[4]}`, cls: j[2], sex: 1 };
        return { eng: j[0], label: j[1], cls: j[2], sex: hireSex === 'f' ? 0 : 1 };
    }
    function hireGroups(r) {
        if (r.tier === '1') return [['First jobs', HIRE[1], FLOOR[1]]];
        if (r.tier === '2') return [['Second jobs', HIRE[2], FLOOR[2]]];
        if (r.tier === 't') return [['Transcendent', HIRE.t, FLOOR.t], ['Second jobs', HIRE[2], FLOOR[2]]];
        return [];
    }
    const hireFloor = (r, j, fl) => r.floors[j[0]] || (j[3] && r.floors[j[3]]) || fl;

    function renderHire() {
        const r = roster, out = ['<button class="act" data-rs="back" style="margin-bottom:5px">&lsaquo; Back to Roster</button>'];
        if (hireDone) {
            const d = hireDone;
            out.push(`<div class="hdone">${faceHtml(d.cls, d.sex, 96, d.name)}<b>${esc(d.name)} answered your call!</b>`
                + `<span class="am">Lv ${d.lv}${d.fee ? ` &middot; paid ${num(d.fee)} z` : ''}. They joined your party and show up under Active.</span>`
                + '<div class="ob" style="width:100%"><button class="ord" data-rs="again">Hire another</button><button class="ord" data-rs="back">Back to Roster</button></div></div>');
            return out.join('');
        }
        const groups = hireGroups(r);
        if (!groups.length) {
            out.push('<div class="note">Hiring 3rd and 4th jobs isn\'t on this page yet. Turn off "Our Roster on the game\'s Companions button" in the mod settings and hire from the app\'s window.</div>');
            return out.join('');
        }
        const what = { 1: 'first jobs', 2: 'second jobs', t: 'transcendent and second jobs' }[r.tier];
        const next = r.tier === '1' ? ' Second jobs unlock once you change jobs yourself.' : r.tier === '2' ? ' Transcendent classes unlock once you are reborn yourself.' : '';
        out.push(`<div class="me"><b>You can hire ${what}.</b> They join at your level, Lv ${r.lv}.${next}</div>`);
        if (r.mode === 2) out.push('<div class="note">Your hiring rules (app Settings, Population) say companions are hired from a Companion Recruiter in town.</div>');
        out.push('<div class="seg">' + [['m', 'Male'], ['f', 'Female'], ['r', 'Random']].map(([k, l]) =>
            `<button class="${hireSex === k ? 'on' : ''}" data-rs="sex" data-arg="${k}">${l}</button>`).join('') + '</div>');
        // The pick: the one clicked, else the first one open to you.
        const all = groups.flatMap(([, list, fl]) => list.map(j => ({ j, fl })));
        let pick = all.find(x => x.j[0] === hireJob && hireFloor(r, x.j, x.fl) <= r.lv);
        if (!pick) pick = all.find(x => hireFloor(r, x.j, x.fl) <= r.lv);
        for (const [title, list, fl] of groups) {
            out.push(`<div class="rh">${title}</div><div class="jobs">` + list.map(j => {
                const v = hireView(j), floor = hireFloor(r, j, fl), lock = floor > r.lv, on = pick && pick.j === j;
                return `<button class="jt${on ? ' on' : ''}${lock ? ' lock' : ''}" data-rs="job" data-arg="${j[0]}"${lock ? ' disabled' : ''}`
                    + ` title="${esc(lock ? `${v.label}: joins from Lv ${floor}` : v.label)}">${faceHtml(v.cls, v.sex, 50, v.label)}`
                    + `<span class="l">${esc(v.label)}</span>${lock ? `<span class="lk">from Lv ${floor}</span>` : ''}</button>`;
            }).join('') + '</div>');
        }
        if (!pick) {
            out.push(`<div class="note" style="margin-top:6px">Nobody can join at Lv ${r.lv} yet. Level up a little and come back!</div>`);
            return out.join('');
        }
        const v = hireView(pick.j), cost = r.mode === 1 ? 0 : r.free ? 0 : r.fee * r.lv;
        const costText = r.mode === 1 ? "Cost: the app's hiring fee (Settings, Population)"
            : r.free ? 'Free: your first companion' : `Cost: ${num(cost)} z (you have ${num(r.zeny)} z)`;
        const sexText = hireSex === 'r' ? 'Male or female: the world decides' : v.sex ? 'Male' : 'Female';
        const blocked = r.mode === 2 || r.zeny < cost;
        out.push(`<div class="hb">${faceHtml(v.cls, v.sex, 44, v.label)}<div class="tx"><b>${esc(v.label)} &middot; Lv ${r.lv}</b><br>`
            + `<span class="am">${sexText}</span><br><span class="z">${esc(costText)}</span></div>`
            + `<button class="act go" data-rs="dohire" data-arg="${pick.j[0]}"${blocked ? ' disabled' : ''}>Hire</button></div>`);
        return out.join('');
    }

    function renderRoster() {
        if (!roster) return '<div class="empty">Asking for your companions...</div>';
        const out = [];
        if (bagMsg) out.push(msgLine());
        if (rView === 'hire') return out.join('') + renderHire();
        const on = roster.comps.filter(c => c.on), off = roster.comps.filter(c => !c.on);
        out.push(`<div class="rh"><span>Active (${on.length})</span><button class="act go" data-rs="hire">+ Hire</button></div>`);
        out.push(on.length ? on.map(rosterCard).join('')
            : '<div class="am" style="padding:2px 2px 6px">Nobody with you right now. Summon someone below, or hire someone new.</div>');
        out.push(`<div class="rh off"><span>Inactive (${off.length})</span></div>`);
        out.push(off.length ? off.map(rosterCard).join('') : '<div class="am" style="padding:2px">Nobody is resting. Everyone is with you.</div>');
        return out.join('');
    }

    // One @clroster action, then a fresh list. okText: the line to show when it worked
    // ('' for none), else the server's own answer.
    async function rosterAction(args, okText) {
        for (let i = 0; busy && i < 30; i++) await new Promise(r => setTimeout(r, 100));	// the refresh may be asking
        if (busy || inDialog()) { bagMsg = { ok: false, text: inDialog() ? 'Close the NPC dialog first.' : 'Busy, try again.' }; render(); return null; }
        busy = true;
        let reply = '';
        try { reply = String(await api.server.request('clroster', args, { timeout: 8000 }) || ''); }
        catch { reply = 'ERR|No answer from the server. Try again in a moment.'; }
        finally { busy = false; }
        const cut = reply.indexOf('|'), ok = reply.startsWith('OK'), said = cut >= 0 ? reply.slice(cut + 1) : reply;
        const text = said === 'roaming off' ? "Turn on Companion roaming in the app's Settings (Population)." : said;
        bagMsg = ok && okText !== undefined ? (okText ? { ok, text: okText } : null) : (text ? { ok, text } : null);
        rosterAt = 0;
        rosterRaw = '';
        await refresh();
        render();
        return ok ? said : null;
    }

    function rosterClick(act, nm, arg) {
        if (act === 'hire') { rView = 'hire'; hireDone = null; bagMsg = null; render(); }
        else if (act === 'back') { rView = 'list'; hireDone = null; bagMsg = null; render(); }
        else if (act === 'again') { hireDone = null; render(); }
        else if (act === 'sex') { hireSex = arg; render(); }
        else if (act === 'job') { hireJob = arg; render(); }
        else if (act === 'more') { rMore = rMore === nm ? '' : nm; rAsk = null; rStats = null; rBond = ''; render(); }
        else if (act === 'bond') { rBond = rBond === nm ? '' : nm; if (rBond) { listAt = 0; refresh(); } render(); }
        else if (act === 'stats') { if (rStats?.name === nm) { rStats = null; render(); } else loadStats(nm); }
        else if (act === 'cancel') { rAsk = null; render(); }
        else if (act === 'delask') { rAsk = { kind: 'del', name: nm }; render(); }
        else if (act === 'rebask') { rAsk = { kind: 'reb', name: nm }; render(); }
        else if (act === 'remove') { rAsk = null; rMore = ''; rosterAction(`remove ${nm}`); }
        else if (act === 'reb') { rAsk = null; rosterAction(`reb ${arg} ${nm}`); }
        else if (act === 'bench' || act === 'summon') rosterAction(`${act} ${nm}`);
        else if (act === 'hom') rosterAction(`hom ${arg} ${nm}`);
        else if (act === 'skills') openAppWindow(nm);
        else if (act === 'role') {
            // The engine takes a role only as a party-chat line ("<name> tank"), the way
            // the app's own window sends it.
            const c = roster?.comps.find(x => x.name === nm), next = ROLE_NEXT[c?.duty || 0];
            if (!partySay(`${nm} ${next}`)) { bagMsg = { ok: false, text: 'Close the NPC dialog first.' }; render(); return; }
            if (c) c.duty = ROLE_CODE[next];
            rosterRaw = '';
            bagMsg = { ok: true, text: `${nm} will fight as ${next === 'attacker' ? 'an Attacker' : next === 'tank' ? 'a Tank' : 'Support'}.` };
            render();
        }
        else if (act === 'dohire') {
            const j = Object.values(HIRE).flat().find(x => x[0] === arg);
            if (!j) return;
            const v = hireView(j);
            rosterAction(`hire ${v.eng} ${hireSex}`, '').then(said => {
                if (!said) return;
                const [name, lv, fee] = said.split('|');
                hireDone = { name, lv: +lv || 0, fee: +fee || 0, cls: v.cls, sex: v.sex };
                const got = roster?.comps.find(x => x.name === name);
                if (got) { hireDone.cls = got.cls; hireDone.sex = got.sex; }
                render();
            });
        }
    }

    // Skills live in the app's own Companions window (its skill list reaches only it):
    // open it once, past our hold on the menu button, then press that companion's
    // "Choose skills" on its Skills page (drawn even while another page shows), so the
    // picker pops up at once. Its rows fill in after the window asks for the roster.
    function openAppWindow(nm) {
        const shown = () => { const h = document.getElementById('CompanionPanel'); return !!h && h.isConnected && h.style.display !== 'none'; };
        const tip = { ok: true, text: `In the game's Companions window, press Skills on ${nm}'s row.` };
        const pick = (tries) => {
            lockAppWindow();
            if (tries === 30) document.getElementById('CompanionPanel')?.shadowRoot?.querySelector('.tab[data-tab="skills"]')?.click();
            const rows = document.getElementById('CompanionPanel')?.shadowRoot?.querySelectorAll('.page[data-page="skills"] .row') || [];
            const row = [...rows].find(r => r.querySelector('.nm')?.textContent.replace(/^★\s*/, '') === nm);
            const btn = row?.querySelector('button');
            if (btn) { btn.click(); bagMsg = { ok: true, text: `${nm}'s skills are open in the game's Companions window.` }; render(); return; }
            if (tries > 0) setTimeout(() => pick(tries - 1), 100);
        };
        if (shown()) { bagMsg = tip; render(); pick(30); return; }
        if (!menuBtn?.isConnected) { bagMsg = { ok: false, text: "Open the game menu's Companions button with our Roster setting off to reach Skills." }; render(); return; }
        const press = type => {
            bypass = true;
            try { menuBtn.dispatchEvent(new MouseEvent(type, { bubbles: true, composed: true, cancelable: true, button: 0, view: window })); }
            finally { bypass = false; }
        };
        press('mousedown');
        press('mouseup');
        setTimeout(() => { if (!shown()) press('click'); }, 150);
        bagMsg = tip;
        render();
        pick(30);
    }

    // 3.1.0: the Loot tab. The party purse, then the party bag: everything the
    // party found on its kills, newest first; what this trip found is marked new.
    // Click a square, then Take (to you) or Sell (zeny into the purse).
    function renderLoot() {
        if (!loot) return '<div class="empty">Opening the party bag...</div>';
        const out = [];
        if (bagMsg) out.push(msgLine());
        out.push(`<div class="purse"><span class="z">Party purse: ${num(loot.purse)} z</span>`
            + `<input type="number" min="1" step="1" placeholder="zeny" data-purse>`
            + `<button class="act" data-act="withdraw" title="Into your wallet">Take out</button>`
            + `<button class="act" data-act="deposit" title="From your wallet">Put in</button></div>`);
        const worth = loot.items.reduce((z, it) => z + it.sell * it.amount, 0);
        const fresh = loot.items.filter(it => loot.trip && it.at >= loot.trip).length;
        // 3.10.1: Sell all, everything but cards (the server keeps those too).
        const selling = loot.items.filter(it => !it.card);
        const sellWorth = selling.reduce((z, it) => z + it.sell * it.amount, 0);
        const cards = loot.items.length - selling.length;
        if (!selling.length) lootAsk = false;
        out.push(`<div class="bag"><div class="lh"><span class="nm">Party bag</span>`
            + `<span class="am">${loot.items.length ? `${num(loot.items.length)} kind${loot.items.length === 1 ? '' : 's'}${fresh ? ` · ${fresh} new` : ''} · sells for ${num(worth)} z` : ''}</span>`
            + (selling.length ? `<button class="act sell" data-act="lsellask" title="Sell everything but cards, the zeny into the party purse">Sell all</button>` : '')
            + '</div>');
        if (lootAsk) out.push(`<div class="ask blue"><b>Sell ${num(selling.reduce((n, it) => n + it.amount, 0))} things for ${num(sellWorth)} z?</b><br>`
            + `The zeny goes into the party purse.${cards ? ` ${cards === 1 ? 'The card stays' : `The ${cards} cards stay`} in the bag.` : ''}`
            + `<div class="ob"><button class="ord" data-act="lsellno">Keep them</button><button class="ord" data-act="lsellall">Sell all</button></div></div>`);
        if (!loot.items.length) {
            out.push(`<div class="am" style="padding:4px 0">${loot.on
                ? 'Empty. Things the party finds on its kills land here: from the monster\'s own drops, on top of the normal ones.'
                : 'Empty. Loot finds are off (Settings &gt; Mods &gt; this mod &gt; Loot finds).'}</div></div>`);
            return out.join('');
        }
        const cells = loot.items.map(it => {
            const key = 'loot:' + it.id, src = iconUrl.get(it.id), isNew = loot.trip && it.at >= loot.trip;
            const tip = `${it.name}${it.amount > 1 ? ' x' + num(it.amount) : ''}\nSells for ${num(it.sell)} z${it.amount > 1 ? ' each' : ''}${isNew ? '\nFound this trip' : ''}`;
            return `<div class="sl${isNew ? ' new' : ''}${sel === key ? ' on' : ''}" data-sel="${esc(key)}" draggable="true" title="${esc(tip)}">`
                + `<img data-icon="${it.id}"${src ? ` src="${esc(src)}"` : ''} alt="">`
                + (isNew ? '<span class="nw">new</span>' : '')
                + (it.amount > 1 ? `<span class="q">${it.amount > 9999 ? '9k+' : it.amount}</span>` : '') + '</div>';
        }).join('');
        out.push(`<div class="grid">${cells}</div>`);
        const it = sel && sel.startsWith('loot:') ? loot.items.find(x => 'loot:' + x.id === sel) : null;
        if (it) {
            const src = iconUrl.get(it.id);
            const n = takeN.key === sel && takeN.n > 0 ? Math.min(takeN.n, it.amount) : it.amount;
            const desc = String(api.items?.get?.(it.id)?.description || '').trim();
            const count = it.amount > 1 ? `<div class="cnt">`
                + `<button class="act st" data-act="step" data-d="-1" title="One less">&minus;</button>`
                + `<input type="number" min="1" max="${it.amount}" value="${n}" data-n>`
                + `<button class="act st" data-act="step" data-d="1" title="One more">+</button>`
                + `<button class="act st" data-act="step" data-d="all" title="All ${num(it.amount)}">All</button></div>` : '';
            out.push(`<div class="det"><div class="hd"><img data-icon="${it.id}"${src ? ` src="${esc(src)}"` : ''} alt="">`
                + `<div class="tx"><b title="${esc(it.name)}">${esc(it.name)}</b><span>${it.amount > 1 ? 'x' + num(it.amount) + ' · ' : ''}sells for ${num(it.sell)} z${it.amount > 1 ? ' each' : ''}`
                + `${loot.oc ? ` (Overcharge +${loot.oc}%)` : ''}</span></div></div>`
                + count
                + `<div class="lact"><button class="act" data-act="ltake" data-id="${it.id}" title="Into your inventory">Take <b class="lt">${num(n)}</b></button>`
                + `<button class="act sell" data-act="lsell" data-id="${it.id}" data-each="${it.sell}" title="Zeny into the party purse">Sell for <b class="ls">${num(n * it.sell)}</b> z</button></div>`
                + (desc ? `<div class="more"><div class="ds">${esc(desc)}</div></div>` : '') + '</div>');
        }
        out.push('</div>');
        return out.join('');
    }

    // 3.5.0: the Bag tab, one companion at a time (a name tab each; past five they
    // wrap), laid out like the game's Equip window: its gear round it, the companion
    // in the middle (drawn by the game, api.screens.stage), then the bag and the
    // restock row. Hover a square for its details (showTip); a click takes it.
    // Equip window order: left top / lower / weapon / garment / accessory, right mid /
    // armour / shield / shoes / accessory (EQP_* bits; EQP_ACC_L 128, EQP_ACC_R 8).
    const DOLL_L = [[0x100, 'top'], [0x001, 'lower'], [0x002, 'weapon'], [0x004, 'robe'], [0x080, 'acc']];
    const DOLL_R = [[0x200, 'mid'], [0x010, 'armor'], [0x020, 'shield'], [0x040, 'shoes'], [0x008, 'acc']];
    const DOLL_ORDER = [...DOLL_L, ...DOLL_R].map(([bit]) => bit);
    const COSTUME = 0x3C00;
    // 3.10.2: shadow gear (EQP_SHADOW_*, renewal), in the order weapon, shield, armor, shoes,
    // right and left accessory. The Shadow label shows for renewal classes (job id 4054 and
    // up: 3rd jobs and later); another class only gets it while wearing some, so nothing
    // worn is ever out of sight.
    const SHADOW = 0x10000;
    const SHADOW_ORDER = [0x20000, 0x40000, 0x10000, 0x80000, 0x100000, 0x200000];
    // The companion picked in the Bag tab (its char id); the first one when it's gone.
    let pickCid = null;
    const picked = () => bag?.comps.find(x => x.cid === pickCid) || bag?.comps[0] || null;
    const itemKey = (c, it) => `${c.cid}:${it.own ? 'o' + it.idx : it.worn && it.worn !== AMMO ? 'w' + it.worn : it.idx}`;
    const findByKey = key => {
        if (!bag || !key || key.startsWith('loot:')) return null;
        const cut = key.indexOf(':'), c = bag.comps.find(x => x.cid === key.slice(0, cut));
        const it = c?.items.find(x => itemKey(c, x) === key);
        return it ? { c, it } : null;
    };

    function renderBag() {
        if (!bag) return '<div class="empty">Looking in the bags...</div>';
        const out = [];
        if (bagMsg) out.push(msgLine());
        if (!bag.inv) {
            out.push('<div class="note">Companion inventory is off (Settings &gt; Population), so their potions and arrows are free and refill by themselves. '
                + 'Turn it on to have them carry only what you give them; then you can take things back here.</div>');
        }
        if (!bag.comps.length) { out.push('<div class="empty">No companions in your party.</div>'); return out.join(''); }
        const c = picked();
        pickCid = c.cid;
        // The name tabs: a drop on one gives to that companion too.
        out.push('<div class="party">' + bag.comps.map(x =>
            `<span class="pk${x.cid === c.cid ? ' on' : ''}" data-cid="${esc(x.cid)}">${esc(x.name)}</span>`).join('') + '</div>');
        // 3.8.4: just picked; its bag is on the way.
        if (bag.detail != null && bag.detail !== c.cid) { out.push(`<div class="empty">Looking in ${esc(c.name)}'s bag...</div>`); return out.join(''); }
        const square = (it, cls = '') => {
            const pips = (it.cardIds.length ? '<i class="pc"></i>' : '') + (it.opts.length ? '<i class="po"></i>' : '') + (it.bound || it.rental ? '<i class="pb"></i>' : '');
            const src = iconUrl.get(it.id);
            return `<div class="sl ${cls}${it.own ? ' own' : ''}" data-sel="${esc(itemKey(c, it))}"${it.own ? '' : ' draggable="true"'}>`
                + `<img data-icon="${it.id}"${src ? ` src="${esc(src)}"` : ''} alt="">`
                + (it.refine ? `<span class="r">+${it.refine}</span>` : '')
                + (it.amount > 1 ? `<span class="q">${it.amount > 9999 ? '9k+' : it.amount}</span>` : '')
                + (pips ? `<span class="pips">${pips}</span>` : '') + '</div>';
        };
        // Worn gear by slot. A piece over two or three slots (a two-handed weapon, a
        // full helm) shows in each, faded where it isn't its first slot.
        const wornIt = c.items.filter(it => it.worn && it.worn !== AMMO && !(it.worn & COSTUME) && it.worn < 0x10000);
        const slotFor = ([bit, name]) => {
            const it = wornIt.find(x => x.worn & bit);
            if (!it) return `<div class="sl nil" title="${name}"><span class="lb">${name}</span></div>`;
            const first = DOLL_ORDER.find(b => it.worn & b) === bit;
            return square(it, 'worn' + (first ? '' : ' ghost'));
        };
        const costumes = c.items.filter(it => it.worn && (it.worn & COSTUME));
        const sOrd = it => { const i = SHADOW_ORDER.findIndex(b => it.worn & b); return i < 0 ? 9 : i; };
        const shadows = c.items.filter(it => it.worn >= SHADOW).sort((a, b) => sOrd(a) - sOrd(b));
        const showShadow = shadows.length > 0 || (c.look?.job || 0) >= 4054;
        let cost = costumes.length ? `<span class="lb">Costume</span>${costumes.map(it => square(it, 'worn')).join('')}` : '';
        if (showShadow) cost += `<span class="lb${cost ? ' s2' : ''}">Shadow</span>`
            + (shadows.length ? shadows.map(it => square(it, 'worn sh')).join('') : '<span class="none">none worn</span>');
        const bagIt = c.items.filter(it => !it.worn || it.worn === AMMO);
        let cells = bagIt.map(it => square(it, it.worn ? 'use' : '')).join('');
        if (bag.inv) cells += '<div class="sl nil"></div>'.repeat(Math.max(0, 8 - bagIt.length));
        const rows = cells ? `<div class="grid">${cells}</div>` : '<div class="am">Empty.</div>';
        // Outfit and hair colour on one row; the arrows wrap round the class's range.
        const dye = (kind, label, v, lo, hi) => {
            if (hi <= lo) return '';
            const prev = v <= lo ? hi : v - 1, next = v >= hi ? lo : v + 1;
            return `<span class="dy"><span class="am">${label}</span>`
                + `<button class="act" data-act="dye" data-cid="${esc(c.cid)}" data-kind="${kind}" data-val="${prev}" title="Previous colour">&#9664;</button>`
                + `<b>${v - lo + 1}/${hi - lo + 1}</b>`
                + `<button class="act" data-act="dye" data-cid="${esc(c.cid)}" data-kind="${kind}" data-val="${next}" title="Next colour">&#9654;</button></span>`;
        };
        const dyes = dye('cloth', 'Outfit', c.cloth, c.clothMin, c.clothMax) + dye('hair', 'Hair', c.hair, c.hairMin, c.hairMax);
        // Weight, in the game's units (the server counts tenths). From half, RO stops
        // natural HP/SP regen; from 90% no attacking or skills.
        let wt = '';
        if (c.maxWeight > 0) {
            const p = pct(c.weight, c.maxWeight);
            const cls = p >= 90 ? 'hi' : p >= 50 ? 'mid' : '';
            const tip = `Weight ${num(Math.floor(c.weight / 10))} / ${num(Math.floor(c.maxWeight / 10))} (${p}%)`
                + (p >= 90 ? '\nOver 90%: can\'t attack or use skills.' : p >= 50 ? '\nOver 50%: no natural HP/SP regen.' : '');
            wt = `<span class="wt" title="${esc(tip)}"><i class="${cls}" style="width:${p}%"></i></span>`
                + `<span class="wn${cls === 'hi' ? ' hi' : ''}" title="${esc(tip)}">${num(Math.floor(c.weight / 10))}/${num(Math.floor(c.maxWeight / 10))}</span>`;
        }
        // Restock: what it keeps, bought in town; drop a shop item here to add it.
        let rs = '';
        if (bag.inv) {
            const have = id => c.items.reduce((n, x) => n + (x.id === id && !x.worn ? x.amount : 0), 0);
            const chips = c.restock.map(r => {
                const h = have(r.id), src = iconUrl.get(r.id);
                return `<span class="chip${h < r.keep ? ' low' : ''}" data-act="rsedit" data-cid="${esc(c.cid)}" data-id="${r.id}" data-keep="${r.keep}" `
                    + `title="${esc(r.name)}: has ${num(h)}, keeps ${num(r.keep)}. Click to change.">`
                    + `<img data-icon="${r.id}"${src ? ` src="${esc(src)}"` : ''} alt=""><b>${num(h)}/${num(r.keep)}</b>`
                    + `<span class="x" data-act="rsdel" title="Take it off the list">&#10005;</span></span>`;
            }).join('');
            rs = `<div class="rs" data-cid="${esc(c.cid)}" title="Bought from the party purse whenever you reach a town">`
                + `<span class="lb">Restock</span>${chips || '<span class="hint">drag potions, gems, arrows here</span>'}</div>`;
        }
        // 3.9.0: Pet. Each class has its own; a companion asks you whether it may keep it
        // (at the Companion bond). Kept: Off / On and Rename. Asked twice and you said
        // "Not now": Let them keep it.
        let pt = '';
        if (c.pet >= 0 && c.petName) {
            const seg = (v, text) => `<button class="act${c.pet === v ? ' on' : ''}" data-act="pet" data-cid="${esc(c.cid)}" data-on="${v}">${text}</button>`;
            if (c.petState === 3)
                pt = `<div class="pt" title="${esc(c.pet ? `${c.name}'s ${c.petKind} follows and fights at their side. It needs no care.` : `${c.name}'s ${c.petKind} is resting at home.`)}">`
                    + `<span class="lb">Pet</span><span class="pn${c.pet ? '' : ' off'}">${esc(c.petName)}</span>`
                    + `<button class="ren" data-act="petren" data-cid="${esc(c.cid)}">Rename</button>`
                    + `<span class="pseg">${seg(0, 'Off')}${seg(1, 'On')}</span></div>`;
            else if (c.petState === 2)
                pt = `<div class="pt" title="${esc(`A ${c.petKind} keeps following ${c.name}.`)}">`
                    + `<span class="lb">Pet</span><span class="pn off">${esc(c.petKind)}</span>`
                    + `<button class="act" data-act="petkeep" data-cid="${esc(c.cid)}">Let them keep it</button></div>`;
            else
                pt = `<div class="pt"><span class="lb">Pet</span><span class="ph">${c.petState === 1
                    ? `${esc(c.name)} wants to ask you something soon...` : 'Needs the Companion bond'}</span></div>`;
        }
        out.push(`<div class="bag${bag.inv ? ' can' : ''}" data-cid="${esc(c.cid)}"><div class="top"><span class="nm">${esc(c.name)}</span><span class="jb">${esc(c.job)}</span>${wt}</div>`
            + (dyes ? `<div class="dyes one">${dyes}</div>` : '')
            + `<div class="doll"><div class="col">${DOLL_L.map(slotFor).join('')}</div>`
            + `<div class="stg" data-stage></div>`
            + `<div class="col">${DOLL_R.map(slotFor).join('')}</div></div>`
            + (cost ? `<div class="cost">${cost}</div>` : '')
            + `<div class="sub">Bag</div>${rows}${rs}${pt}</div>`);
        return out.join('');
    }

    // The companion in the middle: the game draws it from its look, on one canvas kept
    // for the window (the tab is redrawn every few seconds; the canvas just moves into
    // the new layout). If this client can't draw it, its class icon stands there.
    const stageCanvas = document.createElement('canvas');
    stageCanvas.width = 110;
    stageCanvas.height = 150;
    let stage = null, actor = null, stageLook = '', stageFailed = false;
    function dropStage() {
        try { stage?.dispose(); } catch { /* fine */ }
        stage = null; actor = null; stageLook = '';
    }
    api.cleanup(dropStage);
    function mountStage(pane) {
        const spot = pane.querySelector('[data-stage]');
        const c = picked();
        if (!spot || !c) return;
        if (!stageFailed && c.look && typeof api.screens?.stage === 'function') {
            try {
                const key = JSON.stringify(c.look);
                if (!stage) stage = api.screens.stage(stageCanvas, { scale: 1 });
                // A fresh one for every new look: set() on the old one kept headgear the
                // new look doesn't have (0 doesn't clear a loaded sprite in the client's
                // entity), so Serawen wore Talimel's hat after switching tabs.
                if (!actor || key !== stageLook) {
                    stage.clear();
                    actor = stage.add(c.look, { x: 0.5, y: 0.92, direction: 0, shadow: true });
                }
                stageLook = key;
                spot.appendChild(stageCanvas);
                return;
            } catch (e) {
                stageFailed = true;
                dropStage();
                console.error('[companion-party-overhaul] the companion can\'t be drawn here:', e);
            }
        }
        const job = c.look?.job;
        spot.innerHTML = `<div class="fb"><img alt="" data-jobicon="${job || ''}"><span>${esc(c.job)}</span></div>`;
        if (job && typeof api.screens?.image === 'function') {
            Promise.resolve(api.screens.image(`renewalparty/icon_jobs_${job}.bmp`)).then(url => {
                const img = spot.querySelector('img[data-jobicon]');
                if (url && img) img.src = url;
            }).catch(() => {});
        }
    }

    // Hover details for the Bag tab's squares: name, refine, slot or amount, random
    // options (orange), cards (purple), the game's own description, and what a click does.
    const tipHost = document.createElement('div');
    const tipRoot = tipHost.attachShadow({ mode: 'open' });
    tipRoot.innerHTML = `<style>${TIP_STYLE}</style><div class="tip" hidden></div>`;
    const tipBox = tipRoot.querySelector('.tip');
    document.body.appendChild(tipHost);
    api.cleanup(() => tipHost.remove());
    let tipKey = null, tipAt = { x: 0, y: 0 };
    function hideTip() { tipKey = null; tipBox.hidden = true; }
    function tipHtml(key) {
        const hit = findByKey(key);
        if (!hit) return '';
        const { c, it } = hit;
        const name = (it.refine ? `+${it.refine} ` : '') + it.name;
        const facts = [
            it.worn && it.worn !== AMMO ? slotName(it.worn) : it.worn ? 'In use (arrows)' : '',
            it.amount > 1 ? `x${num(it.amount)}` : '',
            it.own ? `${c.name}'s own` : '', it.bound ? 'bound' : '', it.rental ? 'rental' : ''
        ].filter(Boolean).join(' · ');
        const cardName = id => api.items?.get?.(id)?.name || `Card #${id}`;
        const desc = String(api.items?.get?.(it.id)?.description || '').trim();
        const hint = it.own ? 'Their own gear: it stays on.'
            : it.worn >= SHADOW ? 'Double-click to take it back. Shadow gear given through the app comes back as the whole set.'
            : it.worn && it.worn !== AMMO ? 'Double-click to take it back.'
            : it.worn ? 'In use: they come off with the gear they\'re for.'
            : !bag.inv ? ''
            : it.amount > 1 ? 'Double-click to take some (asks how many), or drag it onto your inventory.'
            : 'Double-click to take it, or drag it onto your inventory.';
        const src = iconUrl.get(it.id);
        return `<div class="hd"><img${src ? ` src="${esc(src)}"` : ''} alt=""><div><b>${esc(name)}</b><span>${esc(facts)}</span></div></div>`
            + it.opts.map(o => `<div class="op">${esc(optText(o))}</div>`).join('')
            + it.cardIds.map(id => `<div class="cd">${esc(cardName(id))}</div>`).join('')
            + (desc ? `<div class="ds">${esc(desc)}</div>` : '')
            + (hint ? `<div class="hint">${hint}</div>` : '');
    }
    function placeTip() {
        const w = tipBox.offsetWidth, h = tipBox.offsetHeight;
        let x = tipAt.x + 14, y = tipAt.y + 16;
        if (x + w > innerWidth - 4) x = Math.max(4, tipAt.x - 14 - w);
        if (y + h > innerHeight - 4) y = Math.max(4, innerHeight - 4 - h);
        tipBox.style.left = x + 'px';
        tipBox.style.top = y + 'px';
    }
    function showTip(key, x, y) {
        tipAt = { x, y };
        if (key !== tipKey) {
            const html = tipHtml(key);
            if (!html) { hideTip(); return; }
            tipKey = key;
            tipBox.innerHTML = html;
            tipBox.hidden = false;
        }
        placeTip();
    }

    function render() {
        if (!body) return;
        body.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
        const pane = body.querySelector('.pane');
        // Don't wipe the purse box while you type in it.
        const active = pane.getRootNode().activeElement || document.activeElement;
        if ((tab === 'bag' || tab === 'loot') && active && pane.contains(active) && active.matches('input')) return;
        const keep = pane.scrollTop;
        pane.innerHTML = tab === 'orders' ? renderOrders() : tab === 'bag' ? renderBag()
            : tab === 'loot' ? renderLoot() : renderRoster();
        // The answer line is sticky, so it shows wherever you are scrolled,
        // and it goes away by itself: "done" after 4 s, a problem after 8 s.
        pane.scrollTop = keep;
        if (bagMsg && msgTimer?.msg !== bagMsg) {
            clearTimeout(msgTimer?.id);
            const shown = bagMsg;
            msgTimer = { msg: shown, id: setTimeout(() => { if (bagMsg === shown) { bagMsg = null; render(); } }, shown.ok ? 4000 : 8000) };
        }
        if (tab === 'bag' || tab === 'loot') fillIcons(pane);
        // 3.5.0: the companion in the middle, and hover details kept up to date (or
        // gone with the square).
        if (tab === 'bag') mountStage(pane);
        if (tipKey) {
            if (tab !== 'bag' || !pane.querySelector(`.sl[data-sel="${CSS.escape(tipKey)}"]`)) hideTip();
            else { const k = tipKey; tipKey = null; showTip(k, tipAt.x, tipAt.y); }
        }
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
                // 3.8.4: only the picked companion's bag, and nothing to redraw when it's
                // the same as last time.
                const have = bag && bag.detail === pickCid ? 1 : 0;
                const reply = String(await api.server.request('clbag', `list ${pickCid || 0} ${have}`, { timeout: 4000 }) || '');
                bagAt = Date.now();
                if (reply.trim() === 'SAME' && have) return;
                bag = parseBag(reply);
            } else if (tab === 'loot') {
                if (Date.now() - lootAt < 3000) return;
                loot = parseLoot(await api.server.request('clbag', 'lootlist', { timeout: 4000 }));
                lootAt = Date.now();
            } else if (tab === 'orders') {
                if (Date.now() - ordersAt < 2000) return;
                orders = parseOrders(await api.server.request('clorder', 'state', { timeout: 4000 })) || orders;
                ordersAt = Date.now();
            } else {
                // 3.10.0: the Roster, every 3 s, and redrawn only when something changed
                // (the faces are big pictures; no need to lay them out every second).
                // 3.13.1: an open Bond fold also asks @clstat, every 5 s.
                let changed = false;
                if (rBond && Date.now() - listAt >= 5000) {
                    list = parse(await api.server.request('clstat', 'list', { timeout: 4000 }));
                    listAt = Date.now();
                    changed = true;
                }
                if (Date.now() - rosterAt >= 3000) {
                    const reply = String(await api.server.request('clroster', 'list', { timeout: 4000 }) || '');
                    rosterAt = Date.now();
                    if (reply !== rosterRaw) { rosterRaw = reply; roster = parseRoster(reply); changed = true; }
                }
                if (!changed) return;
            }
            render();
        }
        // Busy or between maps: try again shortly. 3.10.2: 3 s (was 10; at login, when the
        // server is still bringing the companions in, a tab sat on "Opening..." that long).
        catch { quietUntil = Date.now() + 3000; }
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
        lootAt = 0;
        await refresh();
        render();   // the answer line, even when the bag came back the same
    }

    // 3.7.0: the engine takes its stances ("attack", "defensive", "passive") only as a
    // party-chat line from you, the way the app's own Companions window sends them, and
    // the focus order is a party-chat strategy rule. So the line is typed into the chat
    // box and sent with its own button (the Chronicle's Route trick): '%' in front sends
    // it to the party when the box is on public chat, and a whisper name is set aside.
    function partySay(text) {
        const root = document.getElementById('ChatBox')?.shadowRoot;
        const box = root?.querySelector('.input-chatbox');
        const send = root?.querySelector('.chat-function .chatmode');
        if (!box || !send || inDialog()) return false;
        const typed = box.innerHTML;
        const nick = root.querySelector('.input .username');
        const who = nick ? nick.value : '';
        if (nick) nick.value = '';
        box.textContent = (box.classList.contains('party') ? '' : '%') + text;
        send.click();
        box.innerHTML = typed;
        if (nick) nick.value = who;
        box.blur();	// the send focused it; keys go back to the game
        return true;
    }

    // An Orders button: a party-chat line, or a server order and its answer on top.
    const ORDER_ERR = {
        'roaming off': "Turn on Companion roaming in the app's Settings (Population).", 'no caster': 'No Acolyte in the party.',
        nobody: 'Nobody is here with you.', open: 'The portal is already open. Step in!', nowarp: 'No portals on this map.',
        nowhere: 'Nowhere to go back to yet.', sp: 'Not enough SP yet.', gem: 'No Blue Gemstone.', 'campfire off': 'Campfire nights are off.',
    };
    async function order(act) {
        const [kind, arg] = act.split(' ');
        if (kind === 'stance' || kind === 'focus') {
            const line = kind === 'stance' ? arg : arg === 'on' ? 'focus' : 'free fight';
            if (!partySay(line)) { bagMsg = { ok: false, text: 'Close the NPC dialog first.' }; render(); return; }
            if (kind === 'stance') { stance = arg; try { api.preferences.set('stance', arg); } catch { /* fine */ } }
            else focus = arg === 'on';
            const NAMES = { attack: 'Engage: they attack any monster near you.', defensive: 'Protect: they fight what attacks you or the party.',
                passive: 'Hold: they never start a fight.' };
            bagMsg = { ok: true, text: kind === 'stance' ? NAMES[arg] : focus ? 'Focus on: everyone hits your target.' : 'Focus off: they pick their own targets.' };
            render();
            return;
        }
        for (let i = 0; busy && i < 30; i++) await new Promise(r => setTimeout(r, 100));	// the 1 s refresh may be asking
        if (busy || inDialog()) { bagMsg = { ok: false, text: inDialog() ? 'Close the NPC dialog first.' : 'Busy, try again.' }; render(); return; }
        const ask = kind === 'roam' ? ['clroam', `${arg} tab`] : kind === 'style' ? ['clorder', arg] : kind === 'hunt' ? ['clhunt', `${arg} task`]
            : kind === 'stand' ? ['clstand', 'task'] : kind === 'camp' ? ['clcamp', arg]
            : kind === 'warp' ? ['clwarp', 'tab'] : ['clorder', kind === 'repair' ? 'repair' : 'appraise'];
        busy = true;
        try {
            const reply = String(await api.server.request(ask[0], ask[1], { timeout: 4000 }) || '');
            const cut = reply.indexOf('|');
            const said = cut >= 0 ? reply.slice(cut + 1) : reply;
            const ok = reply.startsWith('OK');
            let text = ORDER_ERR[said] || said;
            if (ok && kind === 'roam') text = 'They are coming back to you.';
            else if (ok && kind === 'style') text = arg === 'alone' ? 'They hunt solo.' : 'They hunt as a group.';
            else if (ok && kind === 'hunt') text = arg === 'mvp' ? 'They are off to find the MVP.' : 'Off they go, hunting.';
            else if (ok && kind === 'stand') text = 'They will wait here for you.';
            else if (ok && kind === 'camp') text = said === '1' ? 'The campfire is lit.' : arg === 'on' ? 'They could not make camp here.' : 'The fire is out.';
            else if (ok && kind === 'warp') text = `${said} is opening a portal.`;
            bagMsg = { ok, text };
        } catch { bagMsg = { ok: false, text: 'No answer from the server. Try again in a moment.' }; }
        finally { busy = false; }
        ordersAt = 0;
        await refresh();
        render();
    }

    // A square dragged onto your inventory (3.1.2): worn gear back, a single item at
    // once, a stack after "how many" (the game-style box, the whole stack filled in).
    function takeOut(key) {
        if (key.startsWith('loot:')) {
            const it = loot?.items.find(x => 'loot:' + x.id === key);
            if (!it) return;
            if (it.amount > 1) askAmount({ id: it.id, max: it.amount, who: 'you' }).then(n => { if (n > 0) bagAction(`ltake ${it.id} ${n}`); });
            else bagAction(`ltake ${it.id} 1`);
            return;
        }
        if (!bag) return;
        const cut = key.indexOf(':'), cid = key.slice(0, cut), k = key.slice(cut + 1);
        const c = bag.comps.find(x => x.cid === cid);
        if (!c) return;
        if (k[0] === 'o') { bagMsg = { ok: false, text: `That's ${c.name}'s own gear. It stays on.` }; render(); return; }
        if (k[0] === 'w') { bagAction(`gearback ${cid} ${k.slice(1)}`); return; }
        const it = c.items.find(x => x.idx === k);
        if (!it || !bag.inv) return;
        if (it.worn) { bagMsg = { ok: false, text: `${c.name} is using those. They come off with the gear they're for.` }; render(); return; }
        if (it.amount > 1) askAmount({ id: it.id, max: it.amount, who: 'you' }).then(n => { if (n > 0) bagAction(`take ${cid} ${it.idx} ${n}`); });
        else bagAction(`take ${cid} ${it.idx} 1`);
    }

    // A double-click on a square: worn gear back, or the whole stack.
    let lastClick = { key: null, at: 0 };
    function takeAll(key) {
        if (key.startsWith('loot:')) {
            const it = loot?.items.find(x => 'loot:' + x.id === key);
            if (it) bagAction(`ltake ${it.id} ${it.amount}`);
            return;
        }
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

    // "How many?" for a stack dropped on a companion, in the game's own amount box
    // (the one you get dropping a stack on the ground): the client's InputBox
    // markup and style, its OK button pictures, the same place on screen. Mods
    // can't open the real one, so this is a copy. Enter or OK gives, Esc or a
    // click outside cancels. Resolves with the amount, or 0.
    const OKPIC = {};
    ['btn_ok.bmp', 'btn_ok_b.bmp', 'btn_ok_a.bmp'].forEach(f => {
        Promise.resolve(api.screens?.image?.('basic_interface/' + f)).then(url => { if (url) OKPIC[f] = url; }).catch(() => {});
    });
    const ASK_STYLE = `
* { cursor: inherit !important; }
.ov { position: fixed; inset: 0; z-index: 9100; }
#inputbox { position: fixed; z-index: 9101; width: 174px; height: 44px; border-radius: 5px; background-color: white;
  padding: 2px; font: 12px 'SCDream', Arial, 'Liberation Sans', Arimo, sans-serif; color: #000; box-sizing: content-box; }
#inputbox .border { border-radius: 5px; border: 1px solid #c1c6c2; width: 162px; height: 37px; padding-top: 5px;
  padding-left: 10px; box-sizing: content-box; }
#inputbox .text { width: 160px; height: 14px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
#inputbox .text i { font-style: normal; color: #6a7a92; }
#inputbox input { border: 0; background-color: #efefef; width: 103px; height: 16px; margin-top: 3px; padding: 0 2px;
  font: inherit; outline: none; }
#inputbox .ok { width: 42px; height: 20px; position: absolute; bottom: 13px; right: 10px; border: 0; padding: 0;
  background: center / 100% 100% no-repeat; font: bold 11px Arial, sans-serif; color: #333; }
#inputbox .ok.pic { color: transparent; }
`;
    let asking = null;
    function askAmount({ id, max, who, value = max }) {
        asking?.cancel();
        return new Promise(resolve => {
            const host = document.createElement('div');
            const root = host.attachShadow({ mode: 'open' });
            const item = api.items?.get?.(id)?.name || `Item #${id}`;
            root.innerHTML = `<style>${ASK_STYLE}</style><div class="ov"></div>`
                + `<div id="inputbox"><div class="border"><div class="text" title="${esc(item)} → ${esc(who)}">${esc(item)} <i>→ ${esc(who)}</i></div>`
                + `<input type="text" inputmode="numeric" value="${value}"><button class="ok">OK</button></div></div>`;
            const box = root.getElementById('inputbox'), input = root.querySelector('input'), ok = root.querySelector('.ok');
            // Where the game puts its own: centred, a little above the middle.
            box.style.left = `${Math.round((innerWidth - 280) / 2 + 1)}px`;
            box.style.top = `${Math.round((innerHeight - 120) / 1.5 - 49)}px`;
            const pic = state => { const u = OKPIC[state]; if (u) { ok.classList.add('pic'); ok.style.backgroundImage = `url("${u}")`; } };
            pic('btn_ok.bmp');
            ok.addEventListener('mouseenter', () => pic('btn_ok_b.bmp'));
            ok.addEventListener('mouseleave', () => pic('btn_ok.bmp'));
            ok.addEventListener('mousedown', () => pic('btn_ok_a.bmp'));
            const done = n => {
                host.remove();
                if (asking?.host === host) asking = null;
                resolve(n);
            };
            const submit = () => {
                const n = parseInt(input.value, 10) | 0;
                done(n > 0 ? Math.min(n, max) : 0);
            };
            ok.addEventListener('click', submit);
            // A click outside cancels, as in the game; the press and release don't
            // reach the game behind it (no walking off).
            const ov = root.querySelector('.ov');
            ov.addEventListener('mousedown', event => event.stopPropagation());
            ov.addEventListener('mouseup', event => event.stopPropagation());
            ov.addEventListener('click', event => { event.stopPropagation(); done(0); });
            // Typing stays in the box (not the chat, not hotkeys); digits only.
            host.addEventListener('keydown', event => {
                event.stopPropagation();
                if (event.key === 'Enter') { event.preventDefault(); submit(); }
                else if (event.key === 'Escape') { event.preventDefault(); done(0); }
            });
            host.addEventListener('keyup', event => event.stopPropagation());
            host.addEventListener('keypress', event => event.stopPropagation());
            input.addEventListener('input', () => { const v = input.value.replace(/\D+/g, ''); if (v !== input.value) input.value = v; });
            box.addEventListener('mousedown', event => event.stopPropagation());
            box.addEventListener('mouseup', event => event.stopPropagation());
            document.body.appendChild(host);
            asking = { host, cancel: () => done(0) };
            setTimeout(() => { input.focus(); input.select(); }, 0);
        });
    }
    api.cleanup(() => asking?.cancel());

    // 3.9.0: the same box with a name in it, for a pet: up to 23 letters (the game's
    // name length). Enter or OK gives the name, Esc or a click outside resolves null.
    function askName({ title, value = '' }) {
        asking?.cancel();
        return new Promise(resolve => {
            const host = document.createElement('div');
            const root = host.attachShadow({ mode: 'open' });
            root.innerHTML = `<style>${ASK_STYLE}</style><div class="ov"></div>`
                + `<div id="inputbox"><div class="border"><div class="text" title="${esc(title)}"><i>Name:</i> ${esc(title)}</div>`
                + `<input type="text" maxlength="23" value="${esc(value)}"><button class="ok">OK</button></div></div>`;
            const box = root.getElementById('inputbox'), input = root.querySelector('input'), ok = root.querySelector('.ok');
            box.style.left = `${Math.round((innerWidth - 280) / 2 + 1)}px`;
            box.style.top = `${Math.round((innerHeight - 120) / 1.5 - 49)}px`;
            const pic = state => { const u = OKPIC[state]; if (u) { ok.classList.add('pic'); ok.style.backgroundImage = `url("${u}")`; } };
            pic('btn_ok.bmp');
            ok.addEventListener('mouseenter', () => pic('btn_ok_b.bmp'));
            ok.addEventListener('mouseleave', () => pic('btn_ok.bmp'));
            ok.addEventListener('mousedown', () => pic('btn_ok_a.bmp'));
            const done = n => {
                host.remove();
                if (asking?.host === host) asking = null;
                resolve(n);
            };
            // The server's separators and the game's colour codes are left out.
            const submit = () => done(input.value.replace(/[|~^]/g, '').replace(/\s+/g, ' ').trim().slice(0, 23));
            ok.addEventListener('click', submit);
            const ov = root.querySelector('.ov');
            ov.addEventListener('mousedown', event => event.stopPropagation());
            ov.addEventListener('mouseup', event => event.stopPropagation());
            ov.addEventListener('click', event => { event.stopPropagation(); done(null); });
            host.addEventListener('keydown', event => {
                event.stopPropagation();
                if (event.key === 'Enter') { event.preventDefault(); submit(); }
                else if (event.key === 'Escape') { event.preventDefault(); done(null); }
            });
            host.addEventListener('keyup', event => event.stopPropagation());
            host.addEventListener('keypress', event => event.stopPropagation());
            box.addEventListener('mousedown', event => event.stopPropagation());
            box.addEventListener('mouseup', event => event.stopPropagation());
            document.body.appendChild(host);
            asking = { host, cancel: () => done(null) };
            setTimeout(() => { input.focus(); input.select(); }, 0);
        });
    }

    // 3.9.0: yes, they may keep it: then its name (Esc keeps what it is, "Lunatic").
    async function keepPet(cid, kind) {
        try {
            const reply = String(await api.server.request('clbag', `keep ${cid} yes`, { timeout: 4000 }) || '');
            if (!reply.startsWith('OK')) return;
            const name = await askName({ title: `your ${kind}`, value: kind });
            await api.server.request('clbag', `petname ${cid} new ${name || ''}`, { timeout: 4000 });
        } catch { /* the Bag tab still shows it, with Rename */ }
    }

    // 3.9.1: "hey boss" moments: "@@event clmoment cid|moment|name|class|sex|question|
    // answer 1|answer 2|answer 3" (answer 3 may be empty), "@@event clmoment -" when the
    // server gave up waiting. The answer goes back as "@clmoment <cid> <moment> <1-3>".
    // 3.10.2: a pop quiz adds a 10th field, the bubble's look: quiz, gold or don.
    api.on('server:event', ({ command, text }) => {
        if (command !== 'clmoment') return;
        import('./portraits.js').then(m => {
            if (text === '-') { m.closeAsk(); return; }
            const [cid, id, name, cls, sex, question, ...opts] = String(text || '').split('|');
            m.askChoice(api, { name, cls: Number(cls), sex: Number(sex), text: question, options: opts.slice(0, 3), tag: opts[3] || '' })
                .then(i => {
                    if (i === undefined) return;
                    Promise.resolve(api.server.request('clmoment', `${cid} ${id} ${i + 1}`, { timeout: 4000 })).catch(() => {});
                });
        }).catch(e => console.error('[companion-party-overhaul] moment:', e));
    });

    // 3.10.1: the shopping ask: "@@event clshop cid|name|class|sex|question|yes|no", and
    // "@@event clshop -" when the server stopped waiting. The answer: "@clshop yes|no".
    api.on('server:event', ({ command, text }) => {
        if (command !== 'clshop') return;
        import('./portraits.js').then(m => {
            if (text === '-') { m.closeAsk(); return; }
            const [, name, cls, sex, question, yes, no] = String(text || '').split('|');
            m.askChoice(api, { name, cls: Number(cls), sex: Number(sex), text: question, options: [yes, no] })
                .then(i => {
                    if (i === undefined) return;
                    Promise.resolve(api.server.request('clshop', i === 0 ? 'yes' : 'no', { timeout: 4000 })).catch(() => {});
                });
        }).catch(e => console.error('[companion-party-overhaul] shop:', e));
    });

    // 3.11.0: an MVP found: "@@event clhunt cid|name|class|sex|line|<answers>", and
    // "@@event clhunt -" when the wait is over. 3.13.0: three answers, Engage together
    // ("@clhunt engage"), Stand by, I'll solo ("@clhunt solo"), both flying you to the finder
    // with one of your Fly Wings and everyone to you; Retreat ("@clhunt skip", 3.12.7's Not
    // now): they come back and follow you, the mark stays.
    const HUNT_ANSWERS = ['engage', 'solo', 'skip'];
    api.on('server:event', ({ command, text }) => {
        if (command !== 'clhunt') return;
        import('./portraits.js').then(m => {
            if (text === '-') { m.closeAsk(); return; }
            const [, name, cls, sex, line, ...options] = String(text || '').split('|');
            m.askChoice(api, { name, cls: Number(cls), sex: Number(sex), text: line, options: options.slice(0, 3) })
                .then(i => {
                    const a = HUNT_ANSWERS[i];
                    if (a) Promise.resolve(api.server.request('clhunt', a, { timeout: 4000 })).catch(() => {});
                });
        }).catch(e => console.error('[companion-party-overhaul] hunt:', e));
    });

    // 3.9.1: a story invite: "@@event clstory teller|class|sex|listener|class|sex|text",
    // both portraits, Listen / Not now ("@clstory yes|no"); "@@event clstory -" when the
    // server stopped waiting. No click: nothing is sent, the server lets it wait.
    api.on('server:event', ({ command, text }) => {
        if (command !== 'clstory') return;
        import('./portraits.js').then(m => {
            if (text === '-') { m.closeAsk(); return; }
            const [a, ac, as, b, bc, bs, ...rest] = String(text || '').split('|');
            m.askChoice(api, { name: a, cls: Number(ac), sex: Number(as), text: rest.join('|'), options: ['Listen', 'Not now'],
                second: { name: b, cls: Number(bc), sex: Number(bs) } })
                .then(i => {
                    if (i === undefined) return;
                    Promise.resolve(api.server.request('clstory', i === 0 ? 'yes' : 'no', { timeout: 4000 })).catch(() => {});
                });
        }).catch(e => console.error('[companion-party-overhaul] story:', e));
    });

    // 3.9.0: "Can we keep it?": the companion's portrait asks (client/portraits.js),
    // "@@event clask cid|name|class|sex|ask (1, 2)|what it is|the question", and
    // "@@event clask -" when the server gave up waiting (a fight, it fell, 2 minutes).
    api.on('server:event', ({ command, text }) => {
        if (command !== 'clask') return;
        import('./portraits.js').then(m => {
            if (text === '-') { m.closeAsk(); return; }
            const [cid, name, cls, sex, round, kind, ...rest] = String(text || '').split('|');
            m.askKeep(api, { name, cls: Number(cls), sex: Number(sex), last: Number(round) >= 2, text: rest.join('|') })
                .then(yes => {
                    if (yes) keepPet(cid, kind);
                    else Promise.resolve(api.server.request('clbag', `keep ${cid} later`, { timeout: 4000 })).catch(() => {});
                });
        }).catch(e => console.error('[companion-party-overhaul] ask:', e));
    });

    // A how-many box changed: its button's number, and the choice kept so the
    // next refresh draws it the same.
    function setAmount(box, v, write) {
        if (write) box.value = v;
        const b = box.parentElement.querySelector('.go b');
        if (b) b.textContent = num(v);
        // The Loot tab's Take / Sell buttons say the number and the zeny.
        const det = box.closest('.det');
        const lt = det?.querySelector('.lt'), ls = det?.querySelector('.ls'), sell = det?.querySelector('[data-each]');
        if (lt) lt.textContent = num(v);
        if (ls && sell) ls.textContent = num(v * (Number(sell.dataset.each) || 0));
        if (giving && box.closest('.det.give')) giving.n = v;
        else takeN = { key: sel, n: v };
    }

    function ensureWindow() {
        if (win) return win;
        win = api.ui.window({ id: 'companions', title: 'Companions', width: 320, height: 360, resizable: true });
        win.body.innerHTML = `<style>${WIN_STYLE}</style><div class="cw"><div class="tabs">`
            + `<button data-tab="orders">Orders</button>`
            + `<button data-tab="bag">Bag</button><button data-tab="loot">Loot</button><button data-tab="roster">Roster</button></div>`
            + `<div class="pane"></div></div>`;
        // 3.6.2: the game's resize grip is an invisible 12 px corner (and its
        // resize cursor never shows under the game's own cursor), so nobody
        // found it. Draw it as the usual corner stripes, a little bigger.
        const frame = win.body.getRootNode();
        if (frame instanceof ShadowRoot) {
            const grip = document.createElement('style');
            grip.textContent = `.grip { width: 16px; height: 16px; z-index: 2; opacity: .75;
  background: linear-gradient(135deg, transparent 0 50%, #6b7a99 50% 57%, transparent 57% 66%, #6b7a99 66% 73%, transparent 73% 82%, #6b7a99 82% 89%, transparent 89%); }
.grip:hover { opacity: 1; }`;
            frame.appendChild(grip);
        }
        body = win.body;
        body.addEventListener('click', event => {
            // 3.10.0: the Roster tab's buttons.
            const rb = event.target.closest('button[data-rs]');
            if (rb) { if (!rb.disabled) rosterClick(rb.dataset.rs, rb.dataset.nm || '', rb.dataset.arg || ''); return; }
            // 3.9.1: the Journal folds (3.13.1: in the Roster's Bond fold). Opening one fetches it fresh.
            const jb = event.target.closest('button[data-jr]');
            if (jb) {
                const cid = jb.dataset.jr;
                if (openJr.has(cid)) openJr.delete(cid);
                else { openJr.add(cid); loadJournal(cid); }
                render();
                return;
            }
            const cb = event.target.closest('button[data-ch]');
            if (cb) {
                const key = cb.dataset.ch;
                if (openCh.has(key)) openCh.delete(key); else openCh.add(key);
                render();
                return;
            }
            const ob = event.target.closest('button[data-ord]');
            if (ob) { if (!ob.disabled) order(ob.dataset.ord); return; }
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
                else if (a.dataset.act === 'ltake' || a.dataset.act === 'lsell') {
                    const box = a.closest('.det')?.querySelector('input[data-n]');
                    const it = loot?.items.find(x => x.id === Number(a.dataset.id));
                    const n = box ? Math.floor(Number(box.value || 0)) : (it?.amount || 1);
                    if (!(n > 0)) { bagMsg = { ok: false, text: 'Type how many first.' }; box?.blur(); render(); return; }
                    box?.blur();
                    takeN = { key: null, n: 0 };
                    bagAction(`${a.dataset.act} ${a.dataset.id} ${n}`);
                }
                else if (a.dataset.act === 'lsellask') { lootAsk = true; render(); }
                else if (a.dataset.act === 'lsellno') { lootAsk = false; render(); }
                else if (a.dataset.act === 'lsellall') { lootAsk = false; sel = null; bagAction('lsellall'); }
                else if (a.dataset.act === 'nogive') { giving = null; render(); }
                else if (a.dataset.act === 'gearback') bagAction(`gearback ${a.dataset.cid} ${a.dataset.eq}`);
                else if (a.dataset.act === 'pet') {
                    if (a.classList.contains('on')) return;   // already so
                    bagAction(`pet ${a.dataset.cid} ${a.dataset.on}`);
                }
                // 3.9.0: keep it (after two "Not now"s) and name it; or a new name.
                else if (a.dataset.act === 'petkeep' || a.dataset.act === 'petren') {
                    const c = bag?.comps.find(x => x.cid === a.dataset.cid);
                    if (!c) return;
                    if (a.dataset.act === 'petren')
                        askName({ title: `${c.name}'s ${c.petKind}`, value: c.petName })
                            .then(n => { if (n !== null) bagAction(`petname ${c.cid} re ${n}`); });
                    else keepPet(c.cid, c.petKind).then(() => { bagAt = 0; refresh(); });
                }
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
            // 3.1.0: a restock chip: its x takes it off the list, a click changes how many.
            const chip = event.target.closest('.chip[data-act="rsedit"]');
            if (chip) {
                const { cid, id } = chip.dataset;
                if (event.target.closest('[data-act="rsdel"]')) { bagAction(`rsset ${cid} ${id} 0`); return; }
                const who = bag?.comps.find(x => x.cid === cid)?.name || 'companion';
                askAmount({ id: Number(id), max: 30000, value: Number(chip.dataset.keep) || 1, who: `${who} keeps` })
                    .then(n => { if (n > 0) bagAction(`rsset ${cid} ${id} ${n}`); });
                return;
            }
            // 3.5.0: a companion's name tab in the Bag tab.
            const pk = event.target.closest('.pk[data-cid]');
            if (pk) { pickCid = pk.dataset.cid; hideTip(); bagMsg = null; render(); bagAt = 0; refresh(); return; }
            // A square in the Bag tab: a double-click takes it (worn gear back, a stack
            // after "how many"), as in the game's inventory; its details are on hover.
            // 3.5.2: was a single click. Counted here: the window redraws between the
            // two clicks, so the browser's own dblclick can miss.
            const s = event.target.closest('.sl[data-sel]');
            if (s && tab === 'bag') {
                const key = s.dataset.sel, now = Date.now();
                if (lastClick.key === key && now - lastClick.at < 400) {
                    lastClick = { key: null, at: 0 };
                    hideTip();
                    takeOut(key);
                } else lastClick = { key, at: now };
                return;
            }
            // A Loot square: pick it, and its details show below. A second click on it
            // soon after takes it all, like using an item in the game's inventory.
            // (Counted here: the window redraws between the two clicks, so the
            // browser's own dblclick can miss.)
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
            hideTip();
            if (tab !== 'bag') dropStage();
            bagMsg = null;
            giving = null;
            bagAt = 0;
            lootAt = 0;
            ordersAt = 0;
            rosterAt = 0;
            rosterRaw = '';
            quietUntil = 0;	// a click asks now, even after a missed answer
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
        // 3.1.0: the Restock row inside a card is its own drop zone (add to the list).
        // 3.5.0: a companion's name tab is a drop zone too (give to that one).
        const card = event => (tab === 'bag' && bag?.inv ? event.target.closest?.('.rs[data-cid]') || event.target.closest?.('.pk[data-cid]')
            || event.target.closest?.('.bag[data-cid]') : null);
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
            if (c.classList.contains('rs')) {
                // Onto the Restock row: how many to keep (the server checks it's a shop item).
                const cid = c.dataset.cid;
                const comp = bag?.comps.find(x => x.cid === cid);
                const now = comp?.restock.find(r => r.id === id)?.keep;
                askAmount({ id, max: 30000, value: now || Math.min(Math.max(max, 1), 100), who: `${comp?.name || 'companion'} keeps` })
                    .then(n => { if (n > 0) bagAction(`rsset ${cid} ${id} ${n} ${idx}`); });   // 3.1.1: your stack goes in first
                return;
            }
            if (item.WearState) { bagMsg = { ok: false, text: 'Take it off first, then drag it over.' }; render(); return; }
            const name = api.items?.get?.(id)?.name || `Item #${id}`;
            if (max > 1) {
                // Test build (2.3.5): the game-style amount box instead of the row in the Bag tab.
                const cid = c.dataset.cid;
                const who = bag?.comps.find(x => x.cid === cid)?.name || 'companion';
                giving = null;
                askAmount({ id, max, who }).then(n => { if (n > 0) bagAction(`give ${cid} ${idx} ${id} ${n}`); });
                return;
            }
            bagAction(`give ${c.dataset.cid} ${idx} ${id} 1`);
        });
        // 3.1.2: the other way: a square dragged out of a companion's bag (or the Loot
        // tab) onto your game inventory window takes it, like a double-click. A stack
        // asks how many first. The game's inventory is a host element with id
        // InventoryV0..V3; this listens on the window in the capture phase, so the drop
        // is ours before the game's own handlers (storage, cart, ground) see it.
        let outDrag = null;
        const overInv = event => event.composedPath().some(el => typeof el.id === 'string' && /^Inventory/.test(el.id));
        // 3.5.0: hover details on the Bag tab's squares.
        body.addEventListener('mousemove', event => {
            const s = tab === 'bag' ? event.target.closest?.('.sl[data-sel]') : null;
            if (s) showTip(s.dataset.sel, event.clientX, event.clientY);
            else if (tipKey) hideTip();
        });
        body.addEventListener('mouseleave', hideTip);
        body.addEventListener('dragstart', event => {
            hideTip();
            const s = event.target.closest?.('.sl[data-sel]');
            if (!s || (tab !== 'bag' && tab !== 'loot')) return;
            outDrag = s.dataset.sel;
            event.dataTransfer?.setData('text/plain', 'companion-item');
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        });
        body.addEventListener('dragend', () => { outDrag = null; });
        const onOutOver = event => {
            if (!outDrag || !overInv(event)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        };
        const onOutDrop = event => {
            if (!outDrag) return;
            const key = outDrag;
            outDrag = null;
            if (!overInv(event)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            takeOut(key);
        };
        addEventListener('dragover', onOutOver, true);
        addEventListener('drop', onOutDrop, true);
        api.cleanup(() => { removeEventListener('dragover', onOutOver, true); removeEventListener('drop', onOutDrop, true); });
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
        win.onClose?.(() => { stopTimer(); hideTip(); dropStage(); try { api.preferences.set('open', false); } catch { /* fine */ } });
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
        if (win?.isOpen()) { win.hide(); stopTimer(); hideTip(); dropStage(); try { api.preferences.set('open', false); } catch { /* fine */ } }
        else open();
    }
    // 3.9.1: a click on a party frame (frames.js): the Bag tab, with that companion picked.
    function openBag(cid) {
        pickCid = String(cid);
        tab = 'bag';
        hideTip();
        bagMsg = null;
        giving = null;
        bagAt = 0;
        if (win?.isOpen()) { render(); refresh(); }
        else open();
    }
    import('./frames.js').then(m => m.default(parameters, api, { openBag }))
        .catch(e => console.error('[companion-party-overhaul] frames:', e));

    // 3.10.0: the Roster tab; a second press of the menu button closes the window.
    function openRoster() {
        if (win?.isOpen() && tab === 'roster') { toggle(); return; }
        tab = 'roster';
        rView = 'list';
        hireDone = null;
        hideTip();
        dropStage();
        bagMsg = null;
        rosterAt = 0;
        rosterRaw = '';
        if (win?.isOpen()) { render(); refresh(); }
        else open();
    }
    // The game menu's Companions button (Basic Info, #companion: the app's own window)
    // opens our Roster instead (setting roster_button), and wears our icon: two
    // friends, so it no longer looks like the Party button. The press is caught on the
    // way down (window, capture), before the game's own handler hears it. Skills still
    // opens the app's window through it (openAppWindow, bypass).
    const rosterOn = setOn('roster_button');
    let menuBtn = null, bypass = false;
    // 3.13.3: with our Roster on, the app's window is only reached for Skills, so its Summon
    // tab goes: it drafts any job at any level (free on the app's default hiring), round our
    // Roster's tier, level and fee (angespirit's report). Setting off: the window is untouched.
    function lockAppWindow() {
        if (!rosterOn) return;
        const r = document.getElementById('CompanionPanel')?.shadowRoot;
        if (!r || r.querySelector('style[data-cpo-lock]')) return;
        const st = document.createElement('style');
        st.dataset.cpoLock = '1';
        st.textContent = '.tab[data-tab="summon"], .page[data-page="summon"] { display: none !important; }';
        r.appendChild(st);
    }
    const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><defs>'
        + '<linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc0f5"/><stop offset="1" stop-color="#2b4f9a"/></linearGradient>'
        + '<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6fc4"/><stop offset="1" stop-color="#1b3570"/></linearGradient></defs>'
        + '<rect x=".5" y=".5" width="35" height="35" rx="5" fill="url(#a)" stroke="#132652"/><rect x="3" y="3" width="30" height="30" rx="3.5" fill="url(#b)"/>'
        + '<circle cx="12" cy="13.5" r="4" fill="#8fe0d0" stroke="#0f3b3a"/><path d="M5.5 28c0-5 3-8 6.5-8s6.5 3 6.5 8z" fill="#3fb3a0" stroke="#0f3b3a"/>'
        + '<circle cx="23" cy="12.5" r="4.6" fill="#ffd9a8" stroke="#5a2d0c"/><path d="M15.5 29c0-6 3.4-9.2 7.5-9.2s7.5 3.2 7.5 9.2z" fill="#f08a3c" stroke="#5a2d0c"/></svg>';
    const ICON_CSS = `#companion { background-image: url("data:image/svg+xml,${encodeURIComponent(ICON)}") !important;`
        + ' background-size: 100% 100% !important; background-repeat: no-repeat !important; background-position: center !important; }';
    api.on('ui:append', component => {
        if (/^CompanionPanel/i.test(component?.name || '')) { lockAppWindow(); return; }
        if (!/^BasicInfo/i.test(component?.name || '')) return;
        const btn = component.root?.querySelector?.('#companion');
        if (!btn) return;
        menuBtn = btn;
        if (rosterOn && !component.root.querySelector('style[data-cpo-roster]')) {
            const st = document.createElement('style');
            st.dataset.cpoRoster = '1';
            st.textContent = ICON_CSS;
            component.root.appendChild(st);
        }
    }, { replay: true });
    if (rosterOn) {
        const grab = event => {
            if (bypass || !menuBtn?.isConnected || event.button !== 0) return;
            if (!event.composedPath().includes(menuBtn)) return;
            event.stopImmediatePropagation();
            event.preventDefault();
            if (event.type === 'mousedown') openRoster();
        };
        for (const type of ['mousedown', 'mouseup', 'click']) addEventListener(type, grab, true);
        api.cleanup(() => { for (const type of ['mousedown', 'mouseup', 'click']) removeEventListener(type, grab, true); });
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
        api.on('map:leave', ({ reason } = {}) => { if (reason === 'disconnected') host.style.display = 'none'; });
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
    // 'exit' is only a chosen leave; a server restart or a lost connection drops
    // you at the login screen without it, and the window stayed up there.
    api.on('map:leave', ({ reason } = {}) => {
        if (reason !== 'disconnected') return;
        if (win?.isOpen()) win.hide();
        stopTimer();
    });
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

    // Roaming orders in party chat (setting chat_orders, with Settings → Population →
    // Companion roaming on): "go hunt" sends companions roaming the map, "come back"
    // has them follow again. Strategy rules hear party chat but can't run a command,
    // so this watches the chat box for your own party lines and hands the order to
    // the server script (@clroam), which runs "@companion roam" and has the companion
    // answer. Party lines are drawn in rgb(230, 215, 200) as "Name : text".
    const chatOrders = parameters?.chat_orders !== false && parameters?.chat_orders !== 0;
    // 3.0.0: one roam style (Roam as a group), so the "roam in ..." style lines went.
    const ROAM_ON = ['go hunt', 'go roam', 'spread out', 'roam together'];
    const ROAM_OFF = ['come back', 'regroup', 'fall back', 'follow me'];
    const CAMP_ON = ['make camp', 'campfire', 'camp fire', 'set up camp', "let's rest", 'lets rest', "let's camp", 'lets camp'];
    const CAMP_OFF = ['time to go', "let's go", 'lets go', 'put out the fire', 'pack up', 'break camp'];
    // 3.7.0: no more yes to an offer: they make camp on their own when you stand still.
    // 3.3.0: Warp Portal. The server picks the way: out hunting → your save point,
    // in town → back to the spot you left from.
    const WARP = ['take us back', 'warp us back', 'take us home', 'warp us home', 'open a portal', 'portal us'];
    // 3.9.0: companions with a pet out show it off.
    const PET_SHOW = ['show me your pet', 'show your pet', 'show me the pet', 'let me see your pet', 'your pets', 'pet show'];
    // 3.10.1: a shopping trip in town (the server says so when it's not one).
    const SHOP = ['go shopping', 'shopping time', 'time to shop'];
    // 3.11.0: MVP hunts: the hunt is set and they go roaming (wins over "go hunt").
    const HUNT_MVP = ['hunt the mvp', 'find the mvp', 'mvp hunt', 'hunt mvp', 'find mvp', 'hunt the boss', 'find the boss', 'boss hunt'];
    const HUNT_ALL = ['hunt everything', 'normal hunt', 'hunt anything'];
    // 3.12.0: Stand By: they stay where they are until told otherwise.
    const STAND = ['stand by', 'standby', 'wait here', 'stay here'];
    // 3.13.0: during a solo (Stand by, I'll solo on an MVP find): they all join in.
    const HELP = ['help me', 'need help', 'help us', 'assist me'];
    // 3.0.1: companions' lines in their own colour (setting chat_colour, 0 = white as
    // before), everyday talk (public chat) and battle callouts (party chat) alike. The
    // server sends their names as "@@event clnames A|B|" whenever they change. The words
    // over their heads are drawn by the game itself and stay white.
    const CHAT_COLOURS = ['', '#8fd3ff', '#8ef0b4', '#ffd76a', '#ffa8d8', '#c8b0ff'];
    const chatColour = CHAT_COLOURS[Math.round(Number(parameters?.chat_colour ?? 1))] ?? CHAT_COLOURS[1];
    let compNames = [];
    let petGids = new Set();
    api.on('server:event', ({ command, text }) => {
        if (command === 'clnames') compNames = String(text || '').split('|').filter(Boolean);
        // 3.9.0: the companions' pets: the plain cursor over them, and attack-nearest
        // leaves them alone (app 1.7.3). Pets that went (a warp, sent home) are unmarked.
        else if (command === 'clpets' && api.monsters?.friendly) {
            const now = new Set(String(text || '').split('|').filter(Boolean).map(Number));
            for (const g of petGids) if (!now.has(g)) api.monsters.friendly(g, false);
            for (const g of now) if (!petGids.has(g)) api.monsters.friendly(g, true);
            petGids = now;
        }
    });
    const colourLine = div => {
        if (!chatColour || !compNames.length) return;
        const text = div.textContent || '';
        if (!compNames.some(n => text.startsWith(n + ' : '))) return;
        // Party chat is drawn in rgb(230, 215, 200); remember it for the portraits (3.2.0).
        if (div.style.color.replace(/\s/g, '') === 'rgb(230,215,200)') div.dataset.cpoParty = '1';
        div.style.color = chatColour;
    };

    if ((chatOrders || chatColour) && typeof MutationObserver === 'function') {
        let watched = null, observer = null, since = 0;
        const seen = new Map();   // the same line lands once in every chat tab
        const onLine = div => {
            if (!(div instanceof HTMLElement) || div.tagName !== 'DIV') return;
            if (!chatOrders) return;
            if (div.style.color.replace(/\s/g, '') !== 'rgb(230,215,200)') return;
            const me = api.snapshot()?.player?.name;
            const text = (div.textContent || '').trim();
            if (!me || !text.startsWith(me + ' : ')) return;
            const said = text.slice(me.length + 3).toLowerCase().replace(/\s+/g, ' ');
            const now = Date.now();
            if (now - (seen.get(said) || 0) < 2000) return;
            // 3.0.0: campfire nights (setting campfire): light or put out.
            // "let's go shopping" is a shopping trip, not "let's go" (camp off).
            const shop = SHOP.some(w => said.includes(w));
            const camp = shop ? '' : CAMP_ON.some(w => said.includes(w)) ? 'on'
                : CAMP_OFF.some(w => said.includes(w)) ? 'off' : '';
            const warp = WARP.some(w => said.includes(w));
            const hunt = HUNT_MVP.some(w => said.includes(w)) ? 'mvp' : HUNT_ALL.some(w => said.includes(w)) ? 'normal' : '';
            const stand = !warp && !shop && !hunt && STAND.some(w => said.includes(w));
            const on = !warp && !shop && !hunt && !stand && ROAM_ON.some(w => said.includes(w));
            const off = !warp && !on && !shop && !hunt && !stand && ROAM_OFF.some(w => said.includes(w));
            const pets = PET_SHOW.some(w => said.includes(w));
            // The server ignores it when no solo is on (and then it's just chat).
            if (HELP.some(w => said.includes(w))) {
                seen.set(said, now);
                Promise.resolve(api.server.request('clhunt', 'help', { timeout: 4000 })).catch(() => {});
            }
            if (!on && !off && !camp && !warp && !pets && !shop && !hunt && !stand) return;
            seen.set(said, now);
            if (hunt) Promise.resolve(api.server.request('clhunt', `${hunt} ${said}`, { timeout: 4000 })).catch(() => {});
            if (stand) Promise.resolve(api.server.request('clstand', said, { timeout: 4000 })).catch(() => {});
            if (shop) Promise.resolve(api.server.request('clshop', 'go', { timeout: 4000 })).catch(() => {});
            if (pets) Promise.resolve(api.server.request('clbag', 'petshow', { timeout: 4000 })).catch(() => {});
            if (warp) Promise.resolve(api.server.request('clwarp', 'go', { timeout: 4000 })).catch(() => {});
            if (camp) Promise.resolve(api.server.request('clcamp', camp, { timeout: 4000 })).catch(() => {});
            if (on || off) Promise.resolve(api.server.request('clroam', `${on ? 'on' : 'off'} ${said}`, { timeout: 4000 })).catch(() => {});
        };
        const watch = component => {
            const root = component?.root;
            if (component?.name !== 'ChatBox' || !root || root === watched) return;
            observer?.disconnect();
            watched = root;
            since = Date.now() + 1000;   // lines put back when the box is drawn again aren't new
            observer = new MutationObserver(records => {
                // Colour every line, the ones put back on a redraw too; orders only new ones.
                for (const r of records) r.addedNodes.forEach(n => { if (n instanceof HTMLElement && n.tagName === 'DIV') colourLine(n); });
                if (Date.now() < since) return;
                for (const r of records) r.addedNodes.forEach(onLine);
            });
            observer.observe(root, { childList: true, subtree: true });
        };
        api.on('ui:append', watch, { replay: true });
        api.on('ui:remove', component => {
            if (component?.name === 'ChatBox') { observer?.disconnect(); observer = null; watched = null; }
        });
        api.cleanup(() => observer?.disconnect());
    }
}
