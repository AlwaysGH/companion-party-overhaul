# companion-party-overhaul: writes the companion strategy tables (app 1.5.4+).
#   db/when/combat_callouts/population_strategy.yml     bosses, statuses, buffs, broken gear
# Edit the lines below and run:  powershell -ExecutionPolicy Bypass -File tools\make_strategy.ps1
# Then Apply (restart the server) in the app.
# No header-only db/population_strategy.yml: the app can't combine a table with no
# entries with these, and the when/ tables load fine on their own.
#
# Every rule only speaks (Say), and never casts or moves, so they don't change how a companion
# fights. The Blessing/Agi Up thanks also hold for one turn (see below). Lines appear over the
# companion's head, like player chat.
# 3.10.1: the party-chat answers (db/when/chat_replies, setting chat_replies) were removed at
# the user's call; the Moments prompts talk with you now. Old lines: mod-backups.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# The eight personalities, as in npc/companion_life.txt (L_Arch). Exact: only the jobs
# named and their own families, so a Monk is not also an Acolyte "healer".
$pers = @(
	@{ k = 'rookie';   job = '[Novice, Super_Novice]';            exact = $true  },
	@{ k = 'guardian'; job = 'Swordman';                          exact = $false },
	@{ k = 'scholar';  job = '[Mage, Soul_Linker]';               exact = $false },
	@{ k = 'wanderer'; job = '[Archer, Gunslinger]';              exact = $false },
	@{ k = 'healer';   job = '[Acolyte, Priest]';                 exact = $true  },
	@{ k = 'brawler';  job = '[Monk, Taekwon, Star_Gladiator]';   exact = $true  },
	@{ k = 'rogue';    job = '[Thief, Ninja]';                    exact = $false },
	@{ k = 'merchant'; job = 'Merchant';                          exact = $false }
)

# ---------------------------------------------------------------------------
# Battle reactions. Placeholders: {name}, {hp}.
# ---------------------------------------------------------------------------
$fight = @{
	rookie = @{
		boss = "Wh-what IS that?! It's huge!"; bosscast = "It's casting something! Duck!"; bossdown = "We... we beat it?! WE BEAT IT!"
		undead = "Th-the dead are walking! Is that normal?!"; poison = "I feel sick... is this poison?"; curse = "Why do I feel so unlucky...?"
		blind = "I can't see! Where is everyone?!"; stun = "Ugh... my head is spinning..."; freeze = "C-c-cold! I c-can't move!"
		confuse = "Which way is left?!"; bless = "Ooh, I feel smarter already! Thank you!"; agi = "Whoa, I'm so fast now!"
		weapon = "My weapon broke! What do I do?!"; armor = "My armor! It cracked!"
	}
	guardian = @{
		boss = "A great foe. Stand behind me!"; bosscast = "It gathers power! Brace yourselves!"; bossdown = "The beast is slain. Well fought, all."
		undead = "Restless dead. I will send them back to their rest."; poison = "Poison... it will not stop me."; curse = "A curse. My oath is stronger."
		blind = "I cannot see! Call out their positions!"; stun = "Hngh... I am still... standing..."; freeze = "Ice... cannot hold... a knight..."
		confuse = "My senses betray me! Stay clear!"; bless = "A blessing. I am grateful."; agi = "Swift as the wind. Thank you."
		weapon = "My blade has shattered! I fight on!"; armor = "My armor is broken! I will hold regardless."
	}
	scholar = @{
		boss = "Now THAT is a specimen worth studying."; bosscast = "A large spell is forming. Interrupt it or move!"; bossdown = "Subject defeated. Remarkable data."
		undead = "Undead. Fire and holy work best. Noted."; poison = "Toxin in my system. Inconvenient."; curse = "A curse. How unscientific."
		blind = "I can't see my notes! Or the enemy!"; stun = "My concentration... shattered..."; freeze = "Frozen. Ironic, given my spells."
		confuse = "Up is... no, that's down. Hmm."; bless = "Ah, sharper focus. Excellent."; agi = "My casting hand feels lighter."
		weapon = "My staff! Do you know what that cost?!"; armor = "My robes are torn. Unacceptable."
	}
	wanderer = @{
		boss = "Whoa, big one! This'll make a great verse!"; bosscast = "It's winding up something nasty! Scatter!"; bossdown = "And THAT is the chorus! We did it!"
		undead = "Skeletons. They never laugh at my jokes."; poison = "Ugh, poisoned. Not my best day."; curse = "Cursed? My luck was bad enough already."
		blind = "I can't see! Shooting by ear now!"; stun = "Whoa... seeing stars..."; freeze = "B-brr! Someone thaw me out!"
		confuse = "Which way's the monster again?"; bless = "Ooh, thanks for the boost!"; agi = "Now I'm FAST. Love it!"
		weapon = "My bowstring snapped! Great..."; armor = "Armor's busted. Lighter, at least!"
	}
	healer = @{
		boss = "Something powerful is here. Stay close to me!"; bosscast = "It's casting! Everyone, get ready for heals!"; bossdown = "Thank the goddess... is everyone alright?"
		undead = "Unholy souls. Goddess, guide them home."; poison = "Poisoned... I need to cure myself."; curse = "A curse... I feel it on my soul."
		blind = "I can't see! I can't heal what I can't see!"; stun = "Ugh... I... I can't cast..."; freeze = "So cold... I can't move my hands..."
		confuse = "Everything is spinning... who do I heal?"; bless = "The goddess's light is with us."; agi = "Light on my feet. I'll keep up now."
		weapon = "My mace broke! I'll heal with my bare hands!"; armor = "My robe is torn... I'm fine, I'm fine."
	}
	brawler = @{
		boss = "HA! Finally a real opponent!"; bosscast = "It's charging up! Hit it before it's done!"; bossdown = "HAHA! Now THAT was a workout!"
		undead = "Bones! I love punching bones!"; poison = "Poison? Ha! I'll sweat it out!"; curse = "Curses are for the weak-willed!"
		blind = "Can't see! Doesn't matter! I'll punch everything!"; stun = "Gah! My head! Good hit!"; freeze = "Frozen?! Let me OUT!"
		confuse = "Which one do I punch?! All of them!"; bless = "My fists feel stronger! Thanks!"; agi = "Speed! Yes! Let's GO!"
		weapon = "My knuckles broke! Good thing I have fists!"; armor = "Armor's gone! Just means I dodge harder!"
	}
	rogue = @{
		boss = "That's a big payday. Or a big grave."; bosscast = "It's casting. Move, or don't. Your funeral."; bossdown = "Heh. Big ones fall hard. Check the loot."
		undead = "Dead things. No pockets worth picking."; poison = "Poisoned. Someone's getting stabbed for this."; curse = "Cursed. Tch. Bad luck follows me."
		blind = "Can't see. Bad for business."; stun = "Tch... sloppy..."; freeze = "Frozen solid. Real dignified."
		confuse = "Which way's out? ...Never mind."; bless = "Huh. Thanks."; agi = "Faster. I like it."
		weapon = "Knife's broken. Great."; armor = "Armor's shot. Didn't need it anyway."
	}
	merchant = @{
		boss = "That one drops rare items! I can feel it!"; bosscast = "It's casting! Protect the investment, that's me!"; bossdown = "Jackpot! Everybody, pick up EVERYTHING!"
		undead = "Undead. Terrible drops, but steady work."; poison = "Poison! Who's selling antidotes?"; curse = "A curse is bad for business!"
		blind = "I can't see! How do I appraise anything?!"; stun = "Ugh... my head... my profits..."; freeze = "Frozen assets! Literally!"
		confuse = "I've lost count! And my way!"; bless = "A free blessing? Best deal all day!"; agi = "Faster hands, faster sales!"
		weapon = "My axe broke! Repair costs, ugh!"; armor = "My armor! Do you know the resale value?!"
	}
}

# event name -> (On: YAML, cooldown ms)
$fightEvents = [ordered]@{
	poison  = @('{ Event: status_gained, Status: SC_POISON }', 60000)
	curse   = @('{ Event: status_gained, Status: SC_CURSE }', 60000)
	blind   = @('{ Event: status_gained, Status: SC_BLIND }', 60000)
	stun    = @('{ Event: status_gained, Status: SC_STUN }', 60000)
	freeze  = @('{ Event: status_gained, Status: SC_FREEZE }', 60000)
	confuse = @('{ Event: status_gained, Status: SC_CONFUSION }', 60000)
	bless   = @('{ Event: status_gained, Status: SC_BLESSING }', 600000)
	agi     = @('{ Event: status_gained, Status: SC_INCREASEAGI }', 600000)
	weapon  = @('{ Event: equip_broken, Slot: weapon }', 60000)
	armor   = @('{ Event: equip_broken, Slot: armor }', 60000)
	bossdown = @('{ Event: encounter_ended, Reason: died }', 30000)
}

function Q([string]$s) { '"' + $s.Replace('\', '\\').Replace('"', '\"') + '"' }

function JobHead($p) {
	$h = "      - Job: $($p.job)`n"
	if ($p.exact) { $h += "        Exact: true`n" }
	$h + "        Rules:`n"
}

function Rule([string]$name, [string]$on, [string]$extra, [string]$say, [int]$cd) {
	$r = "          - Name: $name`n            Priority: 150`n"
	if ($on) { $r += "            On: $on`n" }
	if ($extra) { $r += $extra }
	$r += "            Say: $(Q $say)`n            Channel: area`n            Cooldown: $cd`n"
	$r
}

$header = "# Generated by tools/make_strategy.ps1 -- edit that, not this.`nHeader:`n  Type: POPULATION_STRATEGY_DB`n  Version: 1`n"

# ---- battle reactions ----
# 3.10.1: one thank-you per buff round. A Priest's Blessing + Agi Up lands on everyone at
# once, and every companion thanked you. The first to speak claims you (the owner) for 60 s
# under one shared name, so the others, whatever their personality, stay quiet. A Claim is
# only recorded when the rule acts (Say alone doesn't count), hence the one-turn Hold.
# OnePerParty wouldn't do: it is per rule, and each personality has its own rule.
$thanks = "            Target: owner`n            Hold: true`n            Claim: { Name: cl_thanks, For: 60000 }`n"
$z = $header + "`nBody:`n  - Mob: All`n    Jobs:`n"
foreach ($p in $pers) {
	$z += JobHead $p
	foreach ($ev in $fightEvents.Keys) {
		$extra = if ($ev -eq 'bless' -or $ev -eq 'agi') { $thanks } else { '' }
		$z += Rule "cl_$($p.k)_fx_$ev" $fightEvents[$ev][0] $extra $fight[$p.k][$ev] $fightEvents[$ev][1]
	}
}
$z += "  - Mob: Boss`n    Jobs:`n"
foreach ($p in $pers) {
	$z += JobHead $p
	$z += Rule "cl_$($p.k)_fx_boss" '' "            Present: { Enemy: boss }`n" $fight[$p.k]['boss'] 180000
	$z += Rule "cl_$($p.k)_fx_bosscast" '{ Event: casts, By: monster }' '' $fight[$p.k]['bosscast'] 30000
}
$z += "  - Mob: { Race: Undead }`n    Jobs:`n"
foreach ($p in $pers) {
	$z += JobHead $p
	$z += Rule "cl_$($p.k)_fx_undead" '' '' $fight[$p.k]['undead'] 900000
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
function Put([string]$rel, [string]$text) {
	$path = Join-Path $root $rel
	New-Item -ItemType Directory -Force (Split-Path -Parent $path) | Out-Null
	[IO.File]::WriteAllText($path, $text.Replace("`r`n", "`n"), $utf8)
	"wrote $rel"
}
Put 'db\when\combat_callouts\population_strategy.yml' $z
