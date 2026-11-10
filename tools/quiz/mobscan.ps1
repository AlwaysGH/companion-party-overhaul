param([string]$Root, [string]$Out)
# Monster facts (pre-re mob_db.yml) + where each spawns in the stock spawn scripts.
$mob = @{}
$cur = $null
foreach ($line in [IO.File]::ReadLines("$Root\db\pre-re\mob_db.yml")) {
	if ($line -match '^\s+- Id: (\d+)') { $cur = @{ Id = [int]$matches[1]; Level = 1; Size = 'Small'; Race = ''; Element = ''; Name = ''; Aegis = ''; Boss = $false }; $mob[$cur.Id] = $cur; continue }
	if (-not $cur) { continue }
	if ($line -match '^    AegisName: (.+)') { $cur.Aegis = $matches[1].Trim() }
	elseif ($line -match '^    Name: (.+)') { $cur.Name = $matches[1].Trim().Trim('"') }
	elseif ($line -match '^    Level: (\d+)') { $cur.Level = [int]$matches[1] }
	elseif ($line -match '^    Size: (\w+)') { $cur.Size = $matches[1] }
	elseif ($line -match '^    Race: (\w+)') { $cur.Race = $matches[1] }
	elseif ($line -match '^    Element: (\w+)') { $cur.Element = $matches[1] }
	elseif ($line -match '^    Class: Boss') { $cur.Boss = $true }
	elseif ($line -match '^    Mvp') { $cur.Boss = $true }
}
$spawn = @{}
foreach ($f in Get-ChildItem "$Root\npc\pre-re\mobs" -Recurse -File) {
	foreach ($line in [IO.File]::ReadLines($f.FullName)) {
		if ($line -match '^\s*//') { continue }
		if ($line -match '^([\w@-]+),\d+,\d+(?:,\d+,\d+)?\t(boss_)?monster\t[^\t]+\t(\d+),(\d+)') {
			$map = $matches[1]; $id = [int]$matches[3]; $n = [int]$matches[4]
			if (-not $spawn[$id]) { $spawn[$id] = @{} }
			$spawn[$id][$map] = [int]$spawn[$id][$map] + $n
		}
	}
}
$rows = foreach ($id in $spawn.Keys) {
	$m = $mob[$id]; if (-not $m) { continue }
	$maps = ($spawn[$id].GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "$($_.Key):$($_.Value)" }) -join ' '
	[pscustomobject]@{ Id = $id; Aegis = $m.Aegis; Name = $m.Name; Lv = $m.Level; Size = $m.Size; Race = $m.Race; Ele = $m.Element; Boss = $m.Boss; Maps = $maps }
}
$rows | Sort-Object Lv, Id | Export-Csv -NoTypeInformation -Encoding UTF8 $Out
"rows: " + @($rows).Count
