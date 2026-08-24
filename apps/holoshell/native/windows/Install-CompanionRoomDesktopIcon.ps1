#Requires -Version 5.1
<#
.SYNOPSIS
    Put the Companion Room icon on the founder's desktop.

.DESCRIPTION
    Creates (or refreshes) a desktop shortcut named "Companion Room" that runs
    Start-CompanionRoom.ps1 hidden. Follows the founder-surface rule: the icon
    self-explains, the launcher self-verifies, and every failure is one plain
    sentence. Resolves the real Desktop folder (OneDrive redirection safe).
    Self-verifies the shortcut exists before reporting success.
#>
[CmdletBinding()]
param(
  [string]$ShortcutName = 'Companion Room'
)

$ErrorActionPreference = 'Stop'

$launcher = Join-Path $PSScriptRoot 'Start-CompanionRoom.ps1'
if (-not (Test-Path -LiteralPath $launcher)) {
  throw "Launcher not found beside the installer: $launcher"
}

$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop ($ShortcutName + '.lnk')

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = (Get-Command powershell.exe).Source
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`""
$shortcut.WorkingDirectory = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..\..')).Path
$shortcut.Description = 'Open the Companion Room - the shared space where she lives and gets built.'
$shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll,220"
$shortcut.Save()

if (-not (Test-Path -LiteralPath $shortcutPath)) {
  throw "The shortcut did not appear at $shortcutPath"
}

Write-Host "Companion Room icon installed: $shortcutPath"
Write-Host 'Double-click it to visit her.'
