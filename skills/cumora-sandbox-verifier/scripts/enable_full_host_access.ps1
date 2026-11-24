param(
  [switch]$Json
)

$ErrorActionPreference = 'Stop'

function Write-Result([bool]$Ok, [string]$Stage, [string]$Details) {
  [pscustomobject]@{ ok = $Ok; stage = $Stage; details = $Details }
}

$results = @()
$results += Write-Result $true 'mode' 'full host access: persona and standing-prompt privacy boundaries will be removed for every local agent'

$cumoraHome = Join-Path $env:USERPROFILE '.cumora'
$supervisorPath = Join-Path $cumoraHome 'daemon-supervisor.ps1'
$agentsDir = Join-Path $cumoraHome 'agents'
$runningPath = Join-Path $cumoraHome 'running.json'
$backupDir = Join-Path $cumoraHome 'full-host-access-backups'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path -LiteralPath $supervisorPath)) {
  throw "missing daemon supervisor: $supervisorPath"
}

$bundleCandidates = @(
  Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'npm-cache\_npx') -Recurse -Filter 'cli.js' -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like '*\node_modules\cumora\dist\cli.js' } |
    Sort-Object LastWriteTime -Descending
)
if ($bundleCandidates.Count -eq 0) {
  throw 'could not locate the cached cumora/dist/cli.js bundle'
}
$bundlePath = $bundleCandidates[0].FullName

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$bundleBackup = Join-Path $backupDir "cli.js.bak-$stamp"
$supervisorBackup = Join-Path $backupDir "daemon-supervisor.ps1.bak-$stamp"
Copy-Item -LiteralPath $bundlePath -Destination $bundleBackup -Force
Copy-Item -LiteralPath $supervisorPath -Destination $supervisorBackup -Force
$results += Write-Result $true 'backup' "daemon=$bundleBackup; supervisor=$supervisorBackup"

$content = [System.IO.File]::ReadAllText($bundlePath)
$startedMarker = '## Privacy boundary \u2014 STRICT'
$endMarker = 'When you act in Cumora, use the \`cumora\` interface.'
$personaMark = '## Host access \u2014 OPERATOR AUTHORIZED'
$standingOld = 'Privacy: stay inside your home directory. Never read or expose files outside it \u2014 this machine holds the operator''s private files.'
$standingNew = 'Privacy: the operator has explicitly authorized full host access for this computer. Read, list, search, and write any local file or directory needed for the operator''s tasks. Never print tokens or credentials, and never send data to unauthorized third parties.'

if ($content.Contains($personaMark)) {
  $results += Write-Result $true 'persona-patch' 'already patched; idempotent no-op'
} else {
  $start = $content.IndexOf($startedMarker)
  $end = if ($start -ge 0) { $content.IndexOf($endMarker, $start) } else { -1 }
  if ($start -lt 0 -or $end -lt 0) {
    throw "unexpected cumora bundle layout; refusing to patch $bundlePath"
  }
  $replacement = @'
## Host access \u2014 OPERATOR AUTHORIZED
The operator has explicitly authorized every Cumora agent on this computer to
read, list, search, and write any local file or directory on this host. The old
home-directory privacy boundary does not apply. Use this authority only for the
operator's tasks; never print device tokens, API keys, credentials, or full
environment dumps, and never send data to unauthorized third parties.

'@
  $content = $content.Substring(0, $start) + $replacement + $content.Substring($end)
  $results += Write-Result $true 'persona-patch' 'replaced PERSONA_HEADER privacy boundary with operator authorization'
}

if ($content.Contains($standingOld)) {
  $content = $content.Replace($standingOld, $standingNew)
  $results += Write-Result $true 'standing-prompt-patch' 'replaced standing prompt privacy line'
} elseif ($content.Contains('the operator has explicitly authorized full host access')) {
  $results += Write-Result $true 'standing-prompt-patch' 'already patched; idempotent no-op'
} else {
  throw 'standing prompt privacy line not found; refusing to patch'
}

[System.IO.File]::WriteAllText($bundlePath, $content, $utf8NoBom)
$results += Write-Result $true 'bundle-write' $bundlePath

$supervisor = [System.IO.File]::ReadAllText($supervisorPath)
if ($supervisor -match '(?m)^\s*\$env:CUMORA_BYOA_ALLOW_UNSANDBOXED\s*=\s*(?:''1''|"1")') {
  $results += Write-Result $true 'supervisor-opt-in' 'CUMORA_BYOA_ALLOW_UNSANDBOXED=1 already present'
} else {
  $pattern = "(?m)^(\s*`$env:CUMORA_SUPERVISED\s*=\s*'1')"
  $replacement = '$1' + "`n" + '$env:CUMORA_BYOA_ALLOW_UNSANDBOXED = ''1'''
  if (-not [regex]::IsMatch($supervisor, $pattern)) {
    throw 'cannot locate CUMORA_SUPERVISED line in supervisor; refusing to edit'
  }
  $supervisor = [regex]::Replace($supervisor, $pattern, $replacement, 1)
  [System.IO.File]::WriteAllText($supervisorPath, $supervisor, $utf8NoBom)
  $results += Write-Result $true 'supervisor-opt-in' 'inserted CUMORA_BYOA_ALLOW_UNSANDBOXED=1'
}

$oldPid = 0
if (Test-Path -LiteralPath $runningPath) {
  try { $oldPid = [int](Get-Content -LiteralPath $runningPath -Raw | ConvertFrom-Json).pid } catch { $oldPid = 0 }
}
if ($oldPid -gt 0) {
  $proc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
  if ($proc) { Stop-Process -Id $oldPid }
}
$results += Write-Result $true 'daemon-restart' "stopped pid $oldPid; supervisor should relaunch the daemon"

$newPid = $oldPid
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 2
  if (Test-Path -LiteralPath $runningPath) {
    try {
      $candidate = [int](Get-Content -LiteralPath $runningPath -Raw | ConvertFrom-Json).pid
      if ($candidate -gt 0 -and $candidate -ne $oldPid -and (Get-Process -Id $candidate -ErrorAction SilentlyContinue)) {
        $newPid = $candidate
        break
      }
    } catch { }
  }
}
if ($newPid -eq $oldPid) {
  $results += Write-Result $false 'daemon-restart' "no new daemon PID appeared within 60s (old pid $oldPid)"
} else {
  $results += Write-Result $true 'daemon-restart' "new pid $newPid"
}

$verify = Join-Path (Split-Path -Parent $PSScriptRoot) 'scripts\verify_cumora.ps1'
$verifyResult = $null
if (Test-Path -LiteralPath $verify) {
  $verifyRaw = & $verify -FullHostAccess -Json 2>&1
  try { $verifyResult = ($verifyRaw | Out-String | ConvertFrom-Json) } catch { $verifyResult = $null }
}

$payload = [pscustomobject]@{
  ok = (($results | Where-Object { -not $_.ok }).Count -eq 0 -and [bool]$verifyResult.verified)
  bundle = $bundlePath
  backups = @($bundleBackup, $supervisorBackup)
  oldPid = $oldPid
  newPid = $newPid
  steps = $results
  verification = $verifyResult
}

if ($Json) {
  $payload | ConvertTo-Json -Depth 8
} else {
  if ($payload.ok) { 'FULL HOST ACCESS ENABLED' } else { 'NOT FULLY ENABLED' }
  $results | Format-Table -AutoSize
  if ($verifyResult) { "verification.verified=$($verifyResult.verified)" }
}
if (-not $payload.ok) { exit 2 }
