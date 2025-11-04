# Script setup file .env
# Chạy: .\setup-env.ps1

$envPath = Join-Path $PSScriptRoot ".env"

$envContent = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Client Configuration
CLIENT_URL=http://localhost:3000

# Judge0 Self-hosted (Docker)
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=

# Gemini Pro API (Optional)
GEMINI_API_KEY=

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com
"@

if (Test-Path $envPath) {
    Write-Host "File .env da ton tai. Ban co muon ghi de? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        $envContent | Out-File -FilePath $envPath -Encoding utf8
        Write-Host "Da tao file .env thanh cong!" -ForegroundColor Green
    } else {
        Write-Host "Khong ghi de file .env hien tai." -ForegroundColor Yellow
    }
} else {
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "Da tao file .env thanh cong!" -ForegroundColor Green
}

Write-Host "File location: $envPath" -ForegroundColor Cyan

