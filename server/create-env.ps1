# Script tạo file .env từ .env.example
# Chạy: .\create-env.ps1

$envExamplePath = Join-Path $PSScriptRoot ".env.example"
$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envExamplePath) {
    if (-not (Test-Path $envPath)) {
        Copy-Item $envExamplePath $envPath
        Write-Host "✅ Đã tạo file .env thành công!" -ForegroundColor Green
        Write-Host "📁 File location: $envPath" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ File .env đã tồn tại!" -ForegroundColor Yellow
        Write-Host "💡 Nếu muốn tạo lại, xóa file .env trước" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Không tìm thấy file .env.example!" -ForegroundColor Red
    Write-Host "📁 Đang tạo file .env.example..." -ForegroundColor Yellow
    
    $content = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bughunter

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# OAuth Configuration (Optional - chỉ cần nếu dùng OAuth)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Client Configuration
CLIENT_URL=http://localhost:3000

# Judge0 Self-hosted (Docker)
# Self-hosted không cần API key, chỉ cần URL
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=

# Gemini Pro API (Optional - chỉ cần nếu muốn dùng AI analysis với Gemini)
GEMINI_API_KEY=

# Admin Configuration
ADMIN_EMAIL=admin@bughunter.com
"@
    
    $content | Out-File -FilePath $envExamplePath -Encoding utf8
    Copy-Item $envExamplePath $envPath
    Write-Host "✅ Đã tạo cả .env.example và .env!" -ForegroundColor Green
}

