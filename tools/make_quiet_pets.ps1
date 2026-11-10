# Writes data/sprite/<monster>/cpo_pet_<name>.spr/.act: the pets' stock sprites with the
# sounds taken off the stand and walk frames (attack, hurt and die keep theirs).
#
# 3.10.1: the client mutes real pets, but ours are monsters (db/mob_db.yml 31201-31213), so
# a PecoPeco's idle squawks and footsteps played nonstop. System/jobname.lub points the pet
# ids at these copies. Re-run with the client's data.grf (GRF 0x200 or 0x300):
#   powershell -ExecutionPolicy Bypass -File tools\make_quiet_pets.ps1 -Grf <path>\data.grf
# Pure .NET, no Add-Type (Defender flags compiled helpers).
param([Parameter(Mandatory)][string]$Grf)
$root = Split-Path $PSScriptRoot -Parent
$names = 'desert_wolf_b','lunatic','deviruchi','chocho','pecopeco','poring','steel_chocho',
	'spore','isis','yoyo','smokie','rocker','drops'
$cp = [Text.Encoding]::GetEncoding(949)
$monster = -join [char[]](0xBAAC, 0xC2A4, 0xD130)
$out = Join-Path $root "data\sprite\$monster"
New-Item -ItemType Directory -Force $out | Out-Null

function Inflate([byte[]]$b, [int]$n) {
	$ds = [IO.Compression.DeflateStream]::new([IO.MemoryStream]::new($b, 2, ($b.Length - 2)), [IO.Compression.CompressionMode]::Decompress)
	$o = New-Object byte[] $n; $r = 0
	while ($r -lt $n) { $k = $ds.Read($o, $r, $n - $r); if ($k -le 0) { break }; $r += $k }
	,$o   # the comma keeps it a byte[] (PowerShell would unroll it into objects)
}

# ACT: set the sound index of every frame in actions 0-15 (stand, walk; 8 directions) to -1.
function Quiet([byte[]]$b) {
	$ver = $b[3] + $b[2] / 10.0
	$n = [BitConverter]::ToUInt16($b, 4); $p = 16
	for ($a = 0; $a -lt $n; $a++) {
		$fc = [BitConverter]::ToUInt32($b, $p); $p += 4
		for ($f = 0; $f -lt $fc; $f++) {
			$p += 32
			$lc = [BitConverter]::ToUInt32($b, $p); $p += 4
			for ($l = 0; $l -lt $lc; $l++) {
				$p += 16
				if ($ver -ge 2.0) { $p += 8; if ($ver -ge 2.4) { $p += 4 }; $p += 8; if ($ver -ge 2.5) { $p += 8 } }
			}
			if ($ver -ge 2.0) {
				if ($a -lt 16) { [BitConverter]::GetBytes([int]-1).CopyTo($b, $p) }
				$p += 4
			}
			if ($ver -ge 2.3) { $p += 4 + 16 * [BitConverter]::ToUInt32($b, $p) }
		}
	}
	,$b
}

$fs = [IO.File]::OpenRead($Grf); $br = New-Object IO.BinaryReader($fs)
$fs.Seek(42, 'Begin') | Out-Null; $ver = $br.ReadUInt32()
$fs.Seek(30, 'Begin') | Out-Null
if ($ver -ge 0x300) { $tblOff = $br.ReadUInt64() } else { $tblOff = $br.ReadUInt32() }
$fs.Seek(46 + $tblOff, 'Begin') | Out-Null
if ($ver -ge 0x300) { $br.ReadUInt32() | Out-Null }
$clen = $br.ReadUInt32(); $rlen = $br.ReadUInt32()
$tbl = Inflate ($br.ReadBytes($clen)) $rlen
$offSize = if ($ver -ge 0x300) { 8 } else { 4 }
$want = @{}; foreach ($n in $names) { $want["$n.act"] = 1; $want["$n.spr"] = 1 }
$prefix = "data\sprite\$monster\"
$p = 0; $got = 0
while ($p -lt $tbl.Length) {
	$s = $p; $p = [Array]::IndexOf($tbl, [byte]0, $p)
	$name = $cp.GetString($tbl, $s, $p - $s).ToLower(); $p++
	$a = [BitConverter]::ToUInt32($tbl, $p + 4); $r = [BitConverter]::ToUInt32($tbl, $p + 8); $fl = $tbl[$p + 12]
	$off = if ($offSize -eq 8) { [BitConverter]::ToUInt64($tbl, $p + 13) } else { [BitConverter]::ToUInt32($tbl, $p + 13) }
	$p += 13 + $offSize
	if (-not $name.StartsWith($prefix)) { continue }
	$leaf = $name.Substring($prefix.Length)
	if (-not $want.ContainsKey($leaf)) { continue }
	if ($fl -ne 1) { Write-Warning "$leaf is encrypted in this GRF (flags $fl), skipped"; continue }
	$fs.Seek(46 + $off, 'Begin') | Out-Null
	$data = Inflate ($br.ReadBytes($a)) $r
	if ($leaf.EndsWith('.act')) { $data = Quiet $data }
	[IO.File]::WriteAllBytes((Join-Path $out "cpo_pet_$leaf"), $data); $got++
}
$fs.Close()
"wrote $got of $($want.Count) files to $out"
