# FreeGateway Windows installer.
#
# Clones the repository, creates a .env with a fresh encryption key, and
# starts the Docker stack. Re-running it is safe: an existing .env and
# encryption key are preserved, and the database lives in a named volume.
$ErrorActionPreference = 'Stop'

$RepoUrl = 'https://github.com/adnane007al/freegateway.git'
$InstallDir = if ($env:FREEGATEWAY_HOME) { $env:FREEGATEWAY_HOME } else { Join-Path $HOME 'freegateway' }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is required. Install Docker Desktop, then re-run this script.'
}

docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
    throw "This script needs the 'docker compose' plugin (Docker Compose v2)."
}

if (Test-Path -LiteralPath (Join-Path $InstallDir '.git')) {
    Write-Host "Updating $InstallDir ..."
    git -C $InstallDir pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw 'git pull failed.' }
} else {
    Write-Host "Cloning into $InstallDir ..."
    git clone $RepoUrl $InstallDir
    if ($LASTEXITCODE -ne 0) { throw 'git clone failed.' }
}

Push-Location $InstallDir
try {
    $envFile = Join-Path $InstallDir '.env'
    if (-not (Test-Path -LiteralPath $envFile)) {
        Write-Host 'Creating .env with a new encryption key ...'
        $encryptionKey = (& node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))").Trim()
        if ($LASTEXITCODE -ne 0 -or $encryptionKey -notmatch '^[0-9a-f]{64}$') {
            throw 'Unable to generate ENCRYPTION_KEY.'
        }
        @(
            "ENCRYPTION_KEY=$encryptionKey"
            'PORT=3001'
        ) | Set-Content -LiteralPath $envFile -Encoding ascii
        Write-Host 'Created .env.'
    } else {
        Write-Host '.env already exists; leaving it unchanged.'
    }

    Write-Host 'Starting FreeGateway ...'
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed.' }
} finally {
    Pop-Location
}

Write-Host @'

FreeGateway is starting. When it is up:

  Dashboard     http://localhost:3001
  API           http://localhost:3001/v1

Add your provider keys on the Keys page, then copy the unified API key from
the same page's header.

Stop it with:  docker compose down
Logs:          docker compose logs -f
'@
