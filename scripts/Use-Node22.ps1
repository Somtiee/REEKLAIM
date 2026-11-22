# Dot-source this file: . .\scripts\Use-Node22.ps1
# Changes PATH in the current PowerShell session only. No download/system installation.
$reeklaimPortableNode = Join-Path $env:TEMP 'reeklaim-phase1\node22\node-v22.23.5-win-x64'
if (Test-Path -LiteralPath (Join-Path $reeklaimPortableNode 'node.exe')) {
    $env:PATH = "$reeklaimPortableNode;$env:PATH"
}
$reeklaimNodeVersion = & node --version
if ($reeklaimNodeVersion -notmatch '^v22\.') {
    throw 'Use Node.js 22.22.2 or newer in the 22.x line. Install Node 22 from nodejs.org, reopen PowerShell and retry.'
}
Write-Host "ReeKlaim is using $reeklaimNodeVersion in this PowerShell session."
