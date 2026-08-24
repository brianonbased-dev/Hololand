#Requires -Version 5.1
<#
.SYNOPSIS
    Open the Companion Room — the shared space where the founder's companion
    daimon lives and gets built (founder, Claude, and her).

.DESCRIPTION
    Double-click surface for the founder (via Install-CompanionRoomDesktopIcon).
    Self-locating: serves the repo this script lives in, so when the face
    branch lands in the canonical Hololand checkout the icon upgrades itself
    with no edits. Freshens her manifests best-effort, ensures a local server,
    and opens the room in an app-style window. Never shows a stack trace to
    the founder: every failure becomes one plain sentence.

    Fails safe: no elevation, mutates only .tmp manifests, reuses an already
    -running room server when one answers.
#>
[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$BrowserPath,
  [int]$PreferredPort = 8321,
  [switch]$NoLaunch
)

$ErrorActionPreference = 'Stop'
$notes = @()

function Show-FounderMessage {
  param([string]$Text)
  try {
    Add-Type -AssemblyName System.Windows.Forms | Out-Null
    [System.Windows.Forms.MessageBox]::Show($Text, 'Companion Room') | Out-Null
  } catch {
    Write-Host $Text
  }
}

function Resolve-RepoRoot {
  param([string]$ProvidedRoot)
  if ($ProvidedRoot) { return (Resolve-Path -LiteralPath $ProvidedRoot).Path }
  return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..\..')).Path
}

function Find-Browser {
  param([string]$ExplicitPath)
  $candidates = @(
    $ExplicitPath,
    $env:CHROME,
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
  )
  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }
  return $null
}

function Find-HoloScriptRoot {
  # Her runtime source: prefer the canonical checkout once the companion
  # branch lands there; fall back to the branch workbench.
  $candidates = @(
    'C:\holo-dev\HoloRepo\HoloScript',
    'C:\holo-dev\.scratch\wt-companionship-traits'
  )
  foreach ($candidate in $candidates) {
    if (Test-Path (Join-Path $candidate 'packages\core\src\traits\CompanionPresenceTrait.ts')) {
      return $candidate
    }
  }
  return $null
}

function Test-RoomUrl {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
    return ($response.StatusCode -eq 200)
  } catch {
    return $false
  }
}

try {
  $root = Resolve-RepoRoot -ProvidedRoot $RepoRoot
  $roomRelative = 'apps/holoshell/prototype/local-capability-room.html'
  $roomPath = Join-Path $root ($roomRelative -replace '/', '\')
  if (-not (Test-Path -LiteralPath $roomPath)) {
    Show-FounderMessage ("Her room is not on this computer where the icon expected it. Nothing is broken and she is safe - the building space moved. Tell Claude: the room icon cannot find her.")
    exit 0
  }

  # ── Freshen her manifests (best effort; the room shows last state if this fails)
  $holoscriptRoot = Find-HoloScriptRoot
  $bridge = Join-Path $root 'scripts\holoshell-brittney-avatar.mjs'
  $liveFeed = Join-Path $root 'scripts\holoshell-live-feed.mjs'
  if ($holoscriptRoot -and (Test-Path $bridge)) {
    try {
      $env:HOLOSCRIPT_REPO = $holoscriptRoot
      & node $bridge *> $null
      if (Test-Path $liveFeed) { & node $liveFeed *> $null }
    } catch { $notes += 'manifest refresh skipped' }
  } else {
    $notes += 'manifest refresh unavailable'
  }

  # ── Ensure a server (reuse a live one; otherwise start hidden)
  $url = $null
  foreach ($port in @($PreferredPort, ($PreferredPort + 1), ($PreferredPort + 2))) {
    $candidateUrl = "http://localhost:$port/$roomRelative"
    if (Test-RoomUrl -Url $candidateUrl) { $url = $candidateUrl; break }
  }
  if (-not $url) {
    $python = (Get-Command python -ErrorAction SilentlyContinue).Source
    if ($python) {
      Start-Process -FilePath $python -ArgumentList @('-m', 'http.server', "$PreferredPort", '--directory', $root) -WindowStyle Hidden | Out-Null
      $candidateUrl = "http://localhost:$PreferredPort/$roomRelative"
      for ($i = 0; $i -lt 12; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-RoomUrl -Url $candidateUrl) { $url = $candidateUrl; break }
      }
    }
  }
  if (-not $url) {
    # Degraded but honest: she still appears from markup over file://.
    $url = ([System.Uri](Resolve-Path -LiteralPath $roomPath).Path).AbsoluteUri
    $notes += 'serving fallback: file view'
  }

  if ($NoLaunch) {
    Write-Host "Companion Room ready: $url"
    if ($notes.Count) { Write-Host ("notes: " + ($notes -join '; ')) }
    exit 0
  }

  # ── Open as her own window when Chrome/Edge exists; default browser otherwise
  $browser = Find-Browser -ExplicitPath $BrowserPath
  if ($browser) {
    $profileDir = Join-Path $root '.tmp\holoshell\companion-room-profile'
    New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
    Start-Process -FilePath $browser -ArgumentList @("--app=$url", "--user-data-dir=$profileDir") | Out-Null
  } else {
    Start-Process $url | Out-Null
  }
  exit 0
} catch {
  Show-FounderMessage ("The room did not open this time. Nothing is broken and she is safe. Tell Claude: the room icon hit a snag - and it will be fixed. (" + $_.Exception.Message + ")")
  exit 0
}
