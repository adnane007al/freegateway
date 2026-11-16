[CmdletBinding()]
param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'

function Get-CommandVersion {
    param(
        [string]$Command,
        [string]$Argument
    )

    $version = (& $Command $Argument).Trim().TrimStart('v')
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($version)) {
        throw "Unable to determine $Command version."
    }

    return [Version]$version
}

function Get-LockHash {
    param([string]$Path)

    # .NET directly rather than Get-FileHash: Windows PowerShell 5.1 started
    # from a PowerShell 7 shell inherits PS7's PSModulePath and cannot load its
    # own Microsoft.PowerShell.Utility, so Get-FileHash is "not recognized" (#1392).
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = $sha256.ComputeHash([System.IO.File]::ReadAllBytes($Path))
    } finally {
        $sha256.Dispose()
    }
    return ([System.BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$packageJson = Join-Path $ProjectRoot 'package.json'
$nodeModules = Join-Path $ProjectRoot 'node_modules'
$lockStamp = Join-Path $nodeModules '.freegateway-bootstrap-lock'
$envFile = Join-Path $ProjectRoot '.env'

if (-not (Test-Path -LiteralPath $packageJson)) {
    throw "Project root must contain a package.json: $ProjectRoot"
}

# Pick the package manager from the lockfile that is actually committed.
#
# This repository ships pnpm-lock.yaml, but the npm path is kept working so a
# checkout that carries a package-lock.json instead still bootstraps. Without
# this, a repo that ships only pnpm-lock.yaml made the script throw
# "Project root must contain package.json and package-lock.json".
$pnpmLockfile = Join-Path $ProjectRoot 'pnpm-lock.yaml'
$npmLockfile = Join-Path $ProjectRoot 'package-lock.json'
if (Test-Path -LiteralPath $pnpmLockfile) {
    $packageManager = 'pnpm'
    $lockfile = $pnpmLockfile
    $installArgs = @('install', '--frozen-lockfile')
    $minimumManagerVersion = [Version]'9.0.0'
} elseif (Test-Path -LiteralPath $npmLockfile) {
    $packageManager = 'npm'
    $lockfile = $npmLockfile
    $installArgs = @('install')
    $minimumManagerVersion = [Version]'10.0.0'
} else {
    throw "Project root must contain a lockfile (pnpm-lock.yaml or package-lock.json): $ProjectRoot"
}

$nodeVersion = Get-CommandVersion -Command 'node' -Argument '--version'
if ($nodeVersion -lt [Version]'20.18.0' -or $nodeVersion -ge [Version]'25.0.0') {
    throw "Node.js >=20.18.0 and <25.0.0 is required; found $nodeVersion."
}

$managerVersion = Get-CommandVersion -Command $packageManager -Argument '--version'
if ($managerVersion -lt $minimumManagerVersion) {
    throw "$packageManager >=$minimumManagerVersion is required; found $managerVersion."
}

$lockHash = Get-LockHash -Path $lockfile
$installedLockHash = if (Test-Path -LiteralPath $lockStamp) {
    (Get-Content -LiteralPath $lockStamp -Raw).Trim().ToLowerInvariant()
} else {
    ''
}

Push-Location $ProjectRoot
try {
    if (-not (Test-Path -LiteralPath $nodeModules) -or $installedLockHash -ne $lockHash) {
        Write-Host 'Installing dependencies...'
        & $packageManager @installArgs
        if ($LASTEXITCODE -ne 0) {
            throw "$packageManager install failed with exit code $LASTEXITCODE."
        }

        $lockHash = Get-LockHash -Path $lockfile
        # pnpm manages node_modules itself and can leave no directory at all
        # when there is nothing to install, so the stamp's parent may not
        # exist yet.
        New-Item -ItemType Directory -Force -Path $nodeModules | Out-Null
        Set-Content -LiteralPath $lockStamp -Value $lockHash -NoNewline -Encoding ascii
    } else {
        Write-Host "Dependencies already match $(Split-Path -Leaf $lockfile)."
    }

    if (-not (Test-Path -LiteralPath $envFile)) {
        $encryptionKey = (& node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))").Trim()
        if ($LASTEXITCODE -ne 0 -or $encryptionKey -notmatch '^[0-9a-f]{64}$') {
            throw 'Unable to generate ENCRYPTION_KEY.'
        }

        @(
            "ENCRYPTION_KEY=$encryptionKey"
            'PORT=3001'
        ) | Set-Content -LiteralPath $envFile -Encoding ascii
        Write-Host 'Created .env with a new ENCRYPTION_KEY.'
    } else {
        Write-Host '.env already exists; leaving it unchanged.'
    }
} finally {
    Pop-Location
}

Write-Host 'Bootstrap complete. Start development with: npm run dev'
