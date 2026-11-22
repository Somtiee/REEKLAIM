$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    . .\scripts\Use-Node22.ps1
    $previousOrigin = $env:APP_ORIGIN
    $env:APP_ORIGIN = 'http://127.0.0.1:5173'
    try {
        npm.cmd run db:setup
        if ($LASTEXITCODE) { throw 'ReeKlaim could not start its dedicated local PostgreSQL service.' }
        Write-Host 'Open http://127.0.0.1:5173 in the browser where QoreX is installed.'
        npm.cmd run dev
        if ($LASTEXITCODE) { throw 'ReeKlaim could not start its local application server.' }
    } finally {
        $env:APP_ORIGIN = $previousOrigin
    }
} finally {
    Pop-Location
}
