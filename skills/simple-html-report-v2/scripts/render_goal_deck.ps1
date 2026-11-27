[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$GoalSpec,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$OutputHtml
)

$ErrorActionPreference = 'Stop'

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command $($Arguments -join ' ')"
    }
}

function Resolve-CallerPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathValue,

        [Parameter(Mandatory = $true)]
        [string]$CallerDirectory
    )

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return [System.IO.Path]::GetFullPath($PathValue)
    }

    return [System.IO.Path]::GetFullPath((Join-Path $CallerDirectory $PathValue))
}

$callerDirectory = (Get-Location).Path
$scriptDirectory = Split-Path -Parent $PSCommandPath
$defaultProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptDirectory '..\project'))
$projectRoot = if ($env:DASHI_PPT_PROJECT_ROOT) {
    [System.IO.Path]::GetFullPath($env:DASHI_PPT_PROJECT_ROOT)
} else {
    $defaultProjectRoot
}

$goalPath = Resolve-CallerPath -PathValue $GoalSpec -CallerDirectory $callerDirectory
$outputPath = Resolve-CallerPath -PathValue $OutputHtml -CallerDirectory $callerDirectory

if (-not (Test-Path -LiteralPath $goalPath -PathType Leaf)) {
    throw "Goal spec not found: $goalPath"
}

if (-not (Test-Path -LiteralPath $projectRoot -PathType Container)) {
    throw "Dashi PPT project not found: $projectRoot"
}

$node = (Get-Command node.exe -ErrorAction Stop).Source
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source

Push-Location $projectRoot
try {
    # 运行依赖默认装在技能目录之外(~/.dashi-ppt/deps/<依赖指纹>/),project\node_modules 只是 junction;
    # DASHI_PPT_DEPS_MODE=external 连 junction 也不放,=local 就地安装(旧做法)。已就绪时秒过;
    # 也负责 .npmrc 重建、npm 源探测和无头浏览器安装。详见 project\scripts\prepare-deps.mjs。
    Invoke-Native $node 'scripts\prepare-deps.mjs'

    $outputDirectory = Split-Path -Parent $outputPath
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

    Invoke-Native $npm 'run' 'props:safe' '--' '--goal' $goalPath '--write'
    Invoke-Native $npm 'run' 'validate:goal-spec' '--' $goalPath
    Invoke-Native $npm 'run' 'render:goal' '--' $goalPath $outputPath
    Invoke-Native $npm 'run' 'validate:swiss' '--' $outputPath
    Invoke-Native $npm 'run' 'validate:goal-copy' '--' $goalPath $outputPath

    # 缺省端口落在 SKILL.md 约定的 5200-5999 段(4178/4300/4400 为用户保留端口)。
    $previewPort = if ($env:DASHI_PPT_PREVIEW_PORT) { $env:DASHI_PPT_PREVIEW_PORT } else { '5200' }
    Invoke-Native $npm 'run' 'preview:start' '--' $outputDirectory $previewPort
} finally {
    Pop-Location
}
