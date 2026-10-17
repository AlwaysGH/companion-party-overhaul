# Writes db/when/roam_together/population_strategy.yml (setting "roam_together", shown as
# "Roam as a group"). UTF-8 without BOM.
#
# 3.0.0: Together only. Pairs, Trios and the "roam in ..." chat styles are gone: Together is
# the one the tests proved (2.5.9), and the others drifted too far apart to rescue each other.
#
# The engine has no "roaming" check for rules. The script (companion_life.txt, the 5 s tick)
# gives every roaming companion two harmless battleground-queue statuses:
#   Entry_Queue_Apply_Delay               the idle Hold/Sit rules let it go (strolls use it too)
#   Entry_Queue_Notify_Admission_Time_Out  ONLY roamers: the rules below ask for this one
# Before 3.0.0 both meanings shared the first status, so a stroll near you looked like roaming.
# The strategy turn comes before the roam walk, so a rule that moves a companion wins over
# its walk that turn. Partners are looked for within 30 cells (rAthena's walk path is 32
# cells at most). A KeepDistance that is satisfied passes, and the next rule runs.
$root = Split-Path $PSScriptRoot -Parent
$RM = 'self_entry_queue_notify_admission_time_out'
$melee = '[Swordman, Thief, Merchant, Monk, Star_Gladiator]'
$I = '          '   # rule indent inside a job entry

function Keep([string]$name, [int]$prio, [string]$target, [string]$extra = '') {
  $t = "$I- Name: $name`n$I  Priority: $prio`n$I  When: $RM`n$I  Target: { Ally: nearest$target, NotSelf: true, NotOwner: true, Range: 30 }`n"
  if ($extra) { $t += $extra }
  $t + "$I  KeepDistance: { Min: 1, Max: 5 }`n"
}
function NoMelee() { "$I  Absent: { Ally: nearest, Job: $melee, NotSelf: true, NotOwner: true, Range: 30 }`n" }

# 2.5.8: a follower doesn't roam on its own while its leader is in sight: with nothing
# attacking the party within 12 cells it stands until the leader is more than 5 away, then
# follows. The leader picks the way and starts the fights.
function Stay([string]$name, [string]$leaders) {
  "$I- Name: $name`n$I  Priority: 30`n$I  When: $RM`n$I  Count: { Enemy: attacking, Range: 12, Below: 1 }`n" +
  "$I  Present: { Ally: nearest, Job: $leaders, NotSelf: true, NotOwner: true, Range: 30 }`n$I  Hold: true`n"
}

# One leader, in this order: the Swordman line (the tank), then a Merchant line, Thief
# line, Monk line, Star Gladiator. Each follows the nearest of the first rank present that
# comes before its own; the leader follows no one (2.5.5: two melee following each other
# never left).
$ranks = @('Swordman', 'Merchant', 'Thief', 'Monk', 'Star_Gladiator')
function Chain([string]$key, [int]$upto, [bool]$anyone) {
  $t = ''
  # $rk, not $i: PowerShell names ignore case, and $I is the rule indent.
  for ($rk = 0; $rk -lt $upto; $rk++) {
    $abs = ''
    if ($rk -gt 0) { $abs = "$I  Absent: { Ally: nearest, Job: [$(($ranks[0..($rk-1)]) -join ', ')], NotSelf: true, NotOwner: true, Range: 30 }`n" }
    $t += Keep "ct_rb_tog_${key}_$($ranks[$rk].ToLower())" (63 - $rk) ", Job: $($ranks[$rk])" $abs
  }
  if ($anyone) { $t += Keep "ct_rb_tog_${key}_any" 57 '' (NoMelee) }
  if ($upto -gt 0) { $t += Stay "ct_rb_tog_${key}_stay" "[$(($ranks[0..($upto-1)]) -join ', ')]" }
  $t
}

$groups = @(
  @{ Key = 'heal';  Job = 'Priest'; Upto = 5; Any = $true; Exact = '' },
  @{ Key = 'mage';  Job = 'Mage'; Upto = 5; Any = $true; Exact = '' },
  @{ Key = 'rng';   Job = '[Archer, Ninja, Gunslinger]'; Upto = 5; Any = $true; Exact = '' },
  @{ Key = 'other'; Job = '[Taekwon, Soul_Linker, Super_Novice]'; Upto = 5; Any = $true; Exact = "        Exact: true`n" }
)
for ($r = 1; $r -lt $ranks.Count; $r++) {
  $groups += @{ Key = $ranks[$r].ToLower(); Job = $ranks[$r]; Upto = $r; Any = $false; Exact = '' }
}
$plans = ''
foreach ($g in $groups) {
  $plans += "      - Job: $($g.Job)`n$($g.Exact)        Build: ct_group`n        Rules:`n$(Chain $g.Key $g.Upto $g.Any)"
}
$names = [regex]::Matches($plans, 'Name: (ct_rb_\w+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$disable = ''
$line = '              '
foreach ($n in $names) {
  if (($line + $n).Length -gt 100) { $disable += $line.TrimEnd() + "`n"; $line = '              ' }
  $line += "$n, "
}
$disable = ($disable + $line.TrimEnd().TrimEnd(',')).TrimStart()

$text = @"
# companion-party-overhaul: roaming as one group (setting "roam_together"). 3.0.0.
# Made by tools/make_roam.ps1: edit that, not this file.
#
# "go hunt" in party chat (client/index.js) sends them roaming; "come back" calls them back.
# The whole party sticks to the tank (else the next melee in line) and roams as one group.
#
# Trouble, while roaming (the roaming marker, see make_roam.ps1):
#   3+ monsters on one     asks for help in party chat (ct.help); those in sight come
#   no sitting to rest     the script sets the rest marks to never while any roams
#   under 40% HP           kites round the Priest (else the nearest companion)
#   under 60%, nothing on it  waits beside the Priest for heals
#   caster/healer dry      under 15% SP with something on it: runs it round the front
#   someone goes down      within 30 s, as soon as nothing is attacking it, every roamer says
#                          so, walks to the body and guards it within 6 cells; the Priest
#                          revives (base table), else whoever carries a Yggdrasil Leaf
#                          (use_items). Grouping waits meanwhile. Back to roaming 20 s after
#                          no body is in sight, or once it's back with you.
# Companions that follow you are never moved by these rules.

Header:
  Type: POPULATION_STRATEGY_DB
  Version: 1

Body:
  - Mob: All
    Jobs:
      - Job: All
        Build: ct_roam
        Start: roam
        Rules:
          - Name: ct_rh_hurt_priest
            Priority: 68
            When: [self_hp_pct_lt40, $RM]
            Target: { Ally: nearest, Job: Priest, NotSelf: true, NotOwner: true, Range: 30 }
            Kite: { Away: 3, Within: 5, Gap: 2 }
          - Name: ct_rh_hurt
            Priority: 67
            When: [self_hp_pct_lt40, $RM]
            Target: { Ally: nearest, NotSelf: true, NotOwner: true, Range: 30 }
            Kite: { Away: 3, Within: 5, Gap: 2 }
          - Name: ct_rh_await_heal
            Priority: 64
            When: [self_hp_pct_lt60, $RM]
            Absent: { Enemy: attacking, Who: self }
            Target: { Ally: nearest, Job: Priest, NotSelf: true, NotOwner: true, Range: 30 }
            KeepDistance: { Min: 1, Max: 3 }
          - Name: ct_rh_swarmed
            Priority: 66
            When: $RM
            Count: { Enemy: attacking, Who: self, Range: 5, AtLeast: 3 }
            Signal: ct.help
            Say: "Too many on me, help!"
            Channel: party
            Cooldown: 8000
          - Name: ct_rh_help
            Priority: 65
            On: { Event: signal, Name: ct.help, Within: 6000 }
            When: $RM
            MoveTo: event
        Strategies:
          - Name: roam
            Rules:
              # 2.5.2: a companion busy fighting when someone fell went once nothing was on it.
              - Name: ct_rh_to_rally
                Priority: 70
                On: { Event: party_member_died, Within: 30000 }
                Target: event
                When: $RM
                Absent: { Enemy: attacking, Who: self }
                MoveTo: event
                Switch: rally
                Say: "{ally} is down, on my way!"
                Channel: party
          - Name: rally
            Disable: [$disable]
            Rules:
              - Name: ct_rh_with_you
                When: not_$RM
                Switch: roam
              - Name: ct_rh_rally_done
                InStrategy: { AtLeast: 20000 }
                Absent: { Ally: dead, Range: 30 }
                Switch: roam
              - Name: ct_rh_guard_body
                Priority: 68
                Target: { Ally: dead, NotSelf: true, Range: 30 }
                KeepDistance: { Min: 1, Max: 6 }

      # Casters and healers out of SP can't hit back (Attack: false): with something on
      # them they run it round the group's front for the others to take.
      - Job: [Priest, Mage]
        Build: ct_roam_low_sp
        Rules:
          - Name: ct_rh_dry_kite
            Priority: 66
            When: [self_sp_pct_lt15, $RM]
            Present: { Enemy: attacking, Who: self }
            Target: { Ally: nearest, Job: $melee, NotSelf: true, NotOwner: true, Range: 30 }
            Kite: { Away: 3, Within: 5, Gap: 2 }

$plans
"@
$dir = Join-Path $root 'db\when\roam_together'
New-Item -ItemType Directory -Force $dir | Out-Null
[IO.File]::WriteAllText((Join-Path $dir 'population_strategy.yml'), $text.Replace("`r`n", "`n"), (New-Object Text.UTF8Encoding $false))
"wrote roam_together: $($names.Count) grouping rules"
