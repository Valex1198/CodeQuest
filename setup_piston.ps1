# Setup Piston Languages for CodeQuest using API
# Run this after docker-compose up -d

Write-Host "Waiting for Piston API to be ready..." -ForegroundColor Cyan
$maxRetries = 10
$retryCount = 0
$pistonReady = $false

while (-not $pistonReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-RestMethod -Method Get -Uri "http://localhost:2000/" -ErrorAction SilentlyContinue
        if ($response.message -match "Piston") {
            $pistonReady = $true
        }
    } catch {
        $retryCount++
        Start-Sleep -Seconds 2
    }
}

if (-not $pistonReady) {
    Write-Host "Error: Piston API is not responding on http://localhost:2000" -ForegroundColor Red
    exit 1
}

Write-Host "Installing Python, Java, and C++ via Piston API..." -ForegroundColor Cyan

$packages = @(
    @{ language = "python"; version = "3.10.0" },
    @{ language = "java"; version = "15.0.2" },
    @{ language = "gcc"; version = "10.2.0" }
)

foreach ($pkg in $packages) {
    Write-Host "Installing $($pkg.language) $($pkg.version)..." -NoNewline
    try {
        $body = @{ language = $pkg.language; version = $pkg.version } | ConvertTo-Json
        $result = Invoke-RestMethod -Method Post -Uri "http://localhost:2000/api/v2/packages" -ContentType "application/json" -Body $body
        Write-Host " Done!" -ForegroundColor Green
    } catch {
        $err = $_.Exception.Message
        if ($err -match "Already installed") {
            Write-Host " Already installed." -ForegroundColor Yellow
        } else {
            Write-Host " Failed: $err" -ForegroundColor Red
        }
    }
}

Write-Host "`nPiston setup complete!" -ForegroundColor Green
