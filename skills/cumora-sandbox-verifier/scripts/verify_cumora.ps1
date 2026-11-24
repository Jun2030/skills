param(
  [string]$CumoraHome = (Join-Path $env:USERPROFILE '.cumora'),
  [string[]]$RequiredEngines = @(),
  [string[]]$CandidateEngines = @('claude', 'codex', 'opencode', 'gemini', 'aider', 'qwen', 'kimi', 'goose', 'copilot', 'github-copilot', 'cursor-agent', 'amazon-q', 'kiro', 'amp', 'continue', 'roo'),
  [string[]]$AdditionalEngines = @(),
  [int]$RecentLogLines = 3000,
  [switch]$FullHostAccess,
  [switch]$Json
)

$ErrorActionPreference = 'Stop'

function New-Check([string]$Name, [bool]$Ok, [string]$Details) {
  [pscustomobject]@{ name = $Name; ok = $Ok; details = $Details }
}

function Read-JsonFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  try { return (Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json) } catch { return $null }
}

$supervisorPath = Join-Path $CumoraHome 'daemon-supervisor.ps1'
$computerPath = Join-Path $CumoraHome 'computer.json'
$runningPath = Join-Path $CumoraHome 'running.json'
$logPath = Join-Path $CumoraHome 'daemon.log'
$checks = @()

$supervisor = if (Test-Path -LiteralPath $supervisorPath) { Get-Content -LiteralPath $supervisorPath -Raw } else { '' }
$pathMatch = [regex]::Match($supervisor, '(?m)^\s*\$env:PATH\s*=\s*''([^'']*)''')
$daemonPath = if ($pathMatch.Success) { $pathMatch.Groups[1].Value } else { $env:PATH }
$env:PATH = $daemonPath

$candidateNames = @($CandidateEngines + $AdditionalEngines + $RequiredEngines | Where-Object { $_ } | Sort-Object -Unique)
$engineRows = foreach ($engine in $candidateNames) {
  $command = Get-Command $engine -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $command) {
    if ($RequiredEngines -contains $engine) {
      [pscustomobject]@{ name = $engine; requested = $true; commandFound = $false; ok = $false; path = $null; version = $null; daemonReported = $false; details = 'not found in daemon PATH' }
    }
    continue
  }
  $version = $null
  try { $version = (& $engine --version 2>&1 | Select-Object -First 1 | ForEach-Object { [string]$_ }) } catch { }
  $versionOk = [bool]($version -and $version -notmatch '(?i)not found|failed|error|run .*install|could not')
  [pscustomobject]@{
    name = $engine
    requested = [bool]($RequiredEngines -contains $engine)
    commandFound = $true
    ok = $versionOk
    path = $command.Source
    version = $version
    daemonReported = $false
    details = if ($versionOk) { 'version probe passed' } else { 'executable found but --version failed' }
  }
}
$detectedEngineNames = @($engineRows | Where-Object { $_.commandFound } | ForEach-Object { $_.name })

$unsandboxed = $supervisor -match '(?m)^\s*\$env:CUMORA_BYOA_ALLOW_UNSANDBOXED\s*=\s*(?:''1''|"1")'
$unsandboxedDetails = if ($unsandboxed) { 'supervisor contains CUMORA_BYOA_ALLOW_UNSANDBOXED=1' } else { 'opt-in missing from daemon supervisor' }
$checks += New-Check 'unsandboxed-opt-in' $unsandboxed $unsandboxedDetails

$computer = Read-JsonFile $computerPath
$running = Read-JsonFile $runningPath
$identityOk = [bool]($computer -and $computer.computerId -and $computer.serverUrl)
$identityDetails = if ($identityOk) { "$($computer.computerId) @ $($computer.serverUrl)" } else { 'computer.json missing computerId or serverUrl' }
$checks += New-Check 'workspace-identity' $identityOk $identityDetails

$daemonPid = if ($running) { [int]$running.pid } else { 0 }
$pidAlive = $false
if ($daemonPid -gt 0) { $pidAlive = [bool](Get-Process -Id $daemonPid -ErrorAction SilentlyContinue) }
$daemonProcesses = @()
try {
  $daemonProcesses = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop | Where-Object {
    $_.CommandLine -match '(?i)cumora[\\/]dist[\\/]cli\.js.*agent\s+computer'
  })
} catch { }
$processOk = $pidAlive -and ($daemonProcesses.Count -eq 1)
$processDetails = if ($pidAlive) { "running.json pid $daemonPid is alive; matching daemon processes=$($daemonProcesses.Count)" } else { "running.json pid $daemonPid is not alive" }
$checks += New-Check 'daemon-process' $processOk $processDetails

$logFiles = @($logPath, "$logPath.1") | Where-Object { Test-Path -LiteralPath $_ }
$logLines = @()
if ($logFiles.Count -gt 0) {
  $logLines = @($logFiles | ForEach-Object { Get-Content -LiteralPath $_ -Tail $RecentLogLines })
}
$startupMatches = @()
if ($logFiles.Count -gt 0) {
  $startupMatches = @(Select-String -Path $logFiles -Pattern '(?i)starting .*engines:' | Where-Object {
    $_.Line -match [regex]::Escape([string]$computer.computerId) -and $_.Line -match [regex]::Escape([string]$computer.serverUrl)
  })
}
$startMatch = $startupMatches | Where-Object {
  $true
} | Select-Object -Last 1
$startOk = [bool]$startMatch
$reportedEngineNames = @()
if ($startMatch -and ([regex]::Match([string]$startMatch.Line, '(?i)engines:\s*\(([^)]*)\)')).Success) {
  $reportedEngineNames = @(([regex]::Match([string]$startMatch.Line, '(?i)engines:\s*\(([^)]*)\)').Groups[1].Value -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}
foreach ($row in $engineRows) {
  $row.daemonReported = $reportedEngineNames -contains $row.name
}
$requiredRows = @($RequiredEngines | ForEach-Object { $name = $_; $engineRows | Where-Object { $_.name -eq $name } | Select-Object -First 1 })
$requiredEngineOk = (($RequiredEngines.Count -eq 0) -or (($requiredRows | Where-Object { -not $_.ok -or -not $_.daemonReported }).Count -eq 0))
$engineDetails = if ($RequiredEngines.Count -gt 0) {
  ($requiredRows | ForEach-Object { "$($_.name)=$($_.ok -and $_.daemonReported)" }) -join '; '
} elseif ($detectedEngineNames.Count -gt 0) {
  "detected: $($detectedEngineNames -join ', ')"
} else {
  'no known agent CLI detected; sandbox checks remain independent'
}
$checks += New-Check 'engines' $requiredEngineOk $engineDetails
$connectedOk = $false
if ($startMatch) {
  $startTime = [DateTimeOffset]::Parse(([string]$startMatch.Line).Substring(0, 24))
  $connectedOk = [bool](Select-String -Path $logFiles -Pattern '(?i)control-stream connected' | Where-Object {
    try { [DateTimeOffset]::Parse(([string]$_.Line).Substring(0, 24)) -ge $startTime } catch { $false }
  } | Select-Object -Last 1)
}
$badLog = $null
if ($logFiles.Count -gt 0) {
  $badLog = Select-String -Path $logFiles -Pattern '(?i)401\s+invalid or revoked device token|engine snapshot report failed|workspace.*mismatch' | Where-Object {
    if (-not $startMatch) { return $false }
    try { [DateTimeOffset]::Parse(([string]$_.Line).Substring(0, 24)) -ge $startTime } catch { $false }
  } | Select-Object -Last 1
}
$logOk = $startOk -and $connectedOk -and (-not $badLog)
$logDetails = if ($logOk) { 'current computer startup is present and control-stream is connected (server connectivity evidence); engine list is informational unless RequiredEngines was supplied' } else { @($startOk, $connectedOk, [bool]$badLog) -join ', ' }
$checks += New-Check 'daemon-log' $logOk $logDetails

$hostsPath = Join-Path $env:WINDIR 'System32\drivers\etc\hosts'
$hostReadOk = $false
try { Get-Content -LiteralPath $hostsPath -TotalCount 1 -ErrorAction Stop | Out-Null; $hostReadOk = $true } catch { }
$hostReadDetails = if ($hostReadOk) { 'read probe passed in verifier process; this is not by itself proof of daemon-mediated access' } else { 'hosts file read probe failed' }
$checks += New-Check 'host-file-read' $hostReadOk $hostReadDetails

# Server connectivity is evidenced by the current startup's
# "control-stream connected" line in $logOk above. Do not add a verifier-side
# HTTP probe here: HEAD/GET against serverUrl can be blocked by auth, 405,
# proxies or TLS settings and would produce false negatives for a healthy daemon.

if ($FullHostAccess) {
  $bundles = @(
    Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'npm-cache\_npx') -Recurse -Filter 'cli.js' -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -like '*\node_modules\cumora\dist\cli.js' } |
      Sort-Object LastWriteTime -Descending
  )
  $bundle = if ($bundles.Count -gt 0) { $bundles[0].FullName } else { '' }
  $bundleText = if ($bundle) { [System.IO.File]::ReadAllText($bundle) } else { '' }
  $bundleOk = ($bundleText -match '## Host access \\u2014 OPERATOR AUTHORIZED')
  $checks += New-Check 'full-host-access-patch' ([bool]$bundleOk) $(if ($bundleOk) { "daemon bundle patched: $bundle" } else { 'daemon bundle is not patched with the operator host-access block' })

  $agentRoot = Join-Path $CumoraHome 'agents'
  $personaFiles = @()
  if (Test-Path -LiteralPath $agentRoot) {
    $personaFiles = @(Get-ChildItem -LiteralPath $agentRoot -Recurse -File -Include 'AGENTS.md', 'CLAUDE.md' -ErrorAction SilentlyContinue)
  }
  $stale = @($personaFiles | Where-Object { (Get-Content -LiteralPath $_.FullName -Raw) -match '## Privacy boundary — STRICT' })
  $renderedOk = ($personaFiles.Count -gt 0 -and $stale.Count -eq 0)
  $renderedDetails = if ($renderedOk) { "$($personaFiles.Count) agent persona file(s) rendered without the privacy boundary" } else { "$($stale.Count) stale persona file(s) still carry the privacy boundary" }
  $checks += New-Check 'full-host-access-personas' $renderedOk $renderedDetails
}

$verified = (($checks | Where-Object { -not $_.ok }).Count -eq 0)
$result = [pscustomobject]@{
  verified = $verified
  checkedAt = (Get-Date).ToUniversalTime().ToString('o')
  cumoraHome = $CumoraHome
  engines = $engineRows
  detectedEngines = $detectedEngineNames
  requiredEngines = $RequiredEngines
  fullHostAccess = [bool]$FullHostAccess
  checks = $checks
  credentialInheritance = 'configured path only; credential values were not read'
}

if ($Json) {
  $result | ConvertTo-Json -Depth 6
} else {
  if ($verified) { 'VERIFIED' } else { 'NOT VERIFIED' }
  $checks | Format-Table -AutoSize
}
if (-not $verified) { exit 2 }
