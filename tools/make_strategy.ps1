# companion-party-overhaul: writes the companion strategy tables (app 1.5.4+).
#   db/when/chat_replies/population_strategy.yml        answers to what you say in party chat
#   db/when/combat_callouts/population_strategy.yml     bosses, statuses, buffs, broken gear
# Edit the lines below and run:  powershell -ExecutionPolicy Bypass -File tools\make_strategy.ps1
# Then Apply (restart the server) in the app.
# No header-only db/population_strategy.yml: the app can't combine a table with no
# entries with these, and the when/ tables load fine on their own.
#
# Every rule only speaks (Say): none of them moves, casts or holds, so they never change
# how a companion fights. Lines appear over the companion's head, like player chat.

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
# Party chat: what you type (any case, anywhere in the line) -> their answer.
# Placeholders: {name} the companion, {hp} its HP %.
# ---------------------------------------------------------------------------
$chatTriggers = [ordered]@{
	hello   = @('hello', 'hiya', 'howdy')
	morning = @('good morning')
	night   = @('good night', 'goodnight')
	thanks  = @('thank', 'thx', 'tyvm')
	praise  = @('good job', 'gj', 'well done', 'nice work', 'great job')
	go      = @("let's go", 'lets go')
	howru   = @('how are you', 'you ok', 'everyone ok', 'status report')
	laugh   = @('lol', 'haha', 'lmao')
	brb     = @('brb', 'be right back')
	back    = @("i'm back", 'im back')
	sorry   = @('sorry', 'my bad')
	love    = @('love you', '<3')
	rest    = @('take a break', "let's rest", 'lets rest')
	who     = @('who are you', 'introduce yourself')
	hungry  = @('hungry', 'snack')
	follow  = @('assist me', 'focus')
	regroup = @('regroup', 'fall back')
	free    = @('free fight', 'at will')
}

$chat = @{
	rookie = @{
		hello = "H-hello! I'm here! I'm ready!"; morning = "Good morning! I barely slept, I was too excited!"
		night = "Good night... can I keep the torch lit?"; thanks = "Y-you're thanking ME? Wow..."
		praise = "Really?! I did good? I'm telling everyone!"; go = "Right behind you! Wait for me!"
		howru = "I'm at {hp}%! Still standing! Mostly!"; laugh = "Hehe! What's funny? I want to laugh too!"
		brb = "I'll guard this spot! Nobody gets past me!"; back = "You're back! I didn't move. Not even once!"
		sorry = "No no, it's okay! I mess up all the time!"; love = "W-what?! I... I'll do my best for you!"
		rest = "Phew... my legs were shaking anyway."; who = "I'm {name}! Future hero! Currently... learning."
		hungry = "I have half a Sweet Potato. You can have it!"
		follow = "Y-yes! I'll hit what you hit!"; regroup = "Coming! Wait for me!"; free = "On my own? O-okay! I can do this!"
	}
	guardian = @{
		hello = "Well met. I stand ready."; morning = "Good morning. The watch passed quietly."
		night = "Sleep. I will keep watch until dawn."; thanks = "No thanks needed. It is my duty."
		praise = "You honor me. The credit is yours."; go = "Shields up. Forward, together."
		howru = "{hp}% and holding. My blade is yours."; laugh = "Heh. It is good to hear laughter on the road."
		brb = "Go. I will hold this ground."; back = "Welcome back. Nothing passed my guard."
		sorry = "There is nothing to forgive. We stand together."; love = "My loyalty is yours, now and always."
		rest = "A wise call. Even steel needs rest."; who = "{name}. Sword and shield, sworn to your side."
		hungry = "Rations are in my pack. Eat first, I insist."
		follow = "Your target is my target."; regroup = "Falling back to you. Shields up."; free = "Understood. I choose my foes."
	}
	scholar = @{
		hello = "Hello. You interrupted a fascinating thought."; morning = "Morning. I've been up for hours. Reading, of course."
		night = "Good night. I'll study the stars a while longer."; thanks = "You're welcome. It was the logical choice."
		praise = "Naturally. But thank you, I suppose."; go = "Very well. Try to keep up with my theories."
		howru = "Vitals at {hp}%. Mana permitting, I'm fine."; laugh = "Was that humor? I'll make a note."
		brb = "Take your time. I have a book."; back = "Ah, back. I finished two chapters."
		sorry = "Apology recorded. And accepted."; love = "That is... statistically unexpected. Thank you."
		rest = "Finally. My mana could use the quiet."; who = "{name}. Student of the arcane, and of you, frankly."
		hungry = "Food helps concentration. Studies agree."
		follow = "Focusing fire. Efficient."; regroup = "Retreating to your position."; free = "Finally, some autonomy."
	}
	wanderer = @{
		hello = "Hey hey! Good to hear your voice."; morning = "Morning! The sky looks great today."
		night = "Night! I'll hum you something soft."; thanks = "Anytime! Add it to my song."
		praise = "Told you I never miss. Well, rarely."; go = "Road's calling. Let's move!"
		howru = "{hp}% and still smiling!"; laugh = "Haha! See, this is why I stick around."
		brb = "Sure thing. I'll tune my strings."; back = "There you are! I wrote a verse while you were gone."
		sorry = "Eh, water under the bridge."; love = "Aw, careful, I'll write a ballad about that."
		rest = "Now you're speaking my language."; who = "{name}! Wanderer, song-maker, terrible cook."
		hungry = "I know a great skewer stand. Somewhere. Probably."
		follow = "Got it, aiming where you aim!"; regroup = "On my way back!"; free = "Free to roam? My favorite."
	}
	healer = @{
		hello = "Hello! Are you eating properly?"; morning = "Good morning! May the goddess bless your day."
		night = "Good night. Rest well, I'll pray for you."; thanks = "You're welcome. Please stay safe for me."
		praise = "Thank you... but please be careful too!"; go = "Coming! Stay in range of my heals."
		howru = "I'm at {hp}%. More importantly, how are YOU?"; laugh = "Hehe. It's good to see you smile."
		brb = "Of course. Drink some water while you're there."; back = "Welcome back! Did you rest a little?"
		sorry = "It's alright. Everyone makes mistakes."; love = "The goddess and I both care for you."
		rest = "Thank goodness. Sit, let me look at your wounds."; who = "{name}. I heal, I bless, and I worry about you."
		hungry = "I packed bread and apples. Here, take some."
		follow = "I'll keep you standing while you lead."; regroup = "Coming! Stay where I can reach you."; free = "Alright. I'll watch everyone."
	}
	brawler = @{
		hello = "Yo! Ready to hit something?"; morning = "Morning! I already did 300 push-ups!"
		night = "Night! Tomorrow we train harder!"; thanks = "Ha! Don't mention it!"
		praise = "That's right! Did you see that combo?!"; go = "FINALLY. Let's go, let's go!"
		howru = "{hp}%! I can keep going all day!"; laugh = "HAHA! Good one!"
		brb = "I'll do squats till you're back."; back = "There you are! I did 200 squats!"
		sorry = "Bah! Forget it. Let's fight!"; love = "Ha! You're alright too. Now let's spar!"
		rest = "Rest? Fine. Stretching counts as training."; who = "{name}! Fists of steel, stomach of a dragon!"
		hungry = "FOOD. Did someone say food?!"
		follow = "Point and I punch!"; regroup = "Fine, fine, coming back!"; free = "HA! Let me at them!"
	}
	rogue = @{
		hello = "Hey. Didn't see you there. Kidding, I always see you."; morning = "Morning. Too bright. Way too bright."
		night = "Night. I'll be around. You won't see me."; thanks = "Hm. Yeah. Don't make it weird."
		praise = "Obviously. But... thanks."; go = "Fine. I'll take the shadows."
		howru = "{hp}%. I've had worse."; laugh = "Heh. Okay, that was funny."
		brb = "Sure. Nobody touches your stuff. Except me. Joking."; back = "Back already? Didn't notice. Much."
		sorry = "Whatever. It's fine."; love = "...Don't say stuff like that out loud."
		rest = "Good. My feet hate you right now."; who = "{name}. That's all you need to know."
		hungry = "I might have 'found' some meat. Don't ask."
		follow = "Your mark. Got it."; regroup = "Yeah, yeah. Coming."; free = "Finally."
	}
	merchant = @{
		hello = "Hello hello! Ready to make some zeny?"; morning = "Morning! Markets open early, you know!"
		night = "Good night! I'll count today's earnings."; thanks = "My pleasure! I'll add it to your tab. Kidding!"
		praise = "Excellent work makes excellent profit!"; go = "Let's go! Time is zeny!"
		howru = "{hp}%! Still in business!"; laugh = "Haha! Laughter's free. Best deal around!"
		brb = "Take your time. I'll sort the loot."; back = "Welcome back! I appraised everything while you were gone."
		sorry = "No harm done! No refunds either, haha."; love = "Aw! You're my favorite business partner!"
		rest = "Good. Resting is cheaper than potions."; who = "{name}! Merchant, haggler, your best investment."
		hungry = "I've got snacks! Ten zeny each. For you, free."
		follow = "Your target, our profit!"; regroup = "Retreating! Protect the merchandise!"; free = "Freelancing! Even better."
	}
}

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

# ---- chat replies ----
$y = $header + "`nBody:`n  - Mob: All`n    Jobs:`n"
foreach ($p in $pers) {
	$y += JobHead $p
	foreach ($cat in $chatTriggers.Keys) {
		$i = 0
		foreach ($m in $chatTriggers[$cat]) {
			$i++
			$on = "{ Event: party_chat, Match: $(Q $m), From: owner, Within: 5000 }"
			$y += Rule "cl_$($p.k)_chat_$($cat)_$i" $on '' $chat[$p.k][$cat] 15000
		}
	}
}

# ---- battle reactions ----
$z = $header + "`nBody:`n  - Mob: All`n    Jobs:`n"
foreach ($p in $pers) {
	$z += JobHead $p
	foreach ($ev in $fightEvents.Keys) {
		$z += Rule "cl_$($p.k)_fx_$ev" $fightEvents[$ev][0] '' $fight[$p.k][$ev] $fightEvents[$ev][1]
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
Put 'db\when\chat_replies\population_strategy.yml' $y
Put 'db\when\combat_callouts\population_strategy.yml' $z
