# Script để rebuild Judge0 sau khi cập nhật cấu hình
# Chạy script này trong PowerShell: .\rebuild-judge0.ps1

Write-Host "🔧 Rebuilding Judge0 với cấu hình mới..." -ForegroundColor Cyan
Write-Host ""

# Bước 1: Dừng containers
Write-Host "📦 Bước 1: Dừng containers hiện tại..." -ForegroundColor Yellow
docker-compose down
Write-Host "✅ Đã dừng containers" -ForegroundColor Green
Write-Host ""

# Bước 2: Xóa container cũ (nếu cần)
Write-Host "🗑️  Bước 2: Xóa container cũ..." -ForegroundColor Yellow
docker rm -f judge0 2>$null
Write-Host "✅ Đã xóa container cũ" -ForegroundColor Green
Write-Host ""

# Bước 3: Pull image mới nhất (nếu cần)
Write-Host "⬇️  Bước 3: Pull Judge0 image..." -ForegroundColor Yellow
docker pull judge0/judge0:1.13.0
Write-Host "✅ Đã pull image" -ForegroundColor Green
Write-Host ""

# Bước 4: Start lại containers
Write-Host "🚀 Bước 4: Khởi động containers..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✅ Đã khởi động containers" -ForegroundColor Green
Write-Host ""

# Bước 5: Đợi Judge0 khởi động
Write-Host "⏳ Đợi Judge0 khởi động (15 giây)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "✅ Đã đợi" -ForegroundColor Green
Write-Host ""

# Bước 6: Kiểm tra health
Write-Host "🏥 Bước 6: Kiểm tra Judge0 health..." -ForegroundColor Yellow
$healthCheck = try {
    $response = Invoke-RestMethod -Uri "http://localhost:2358/health" -Method Get -TimeoutSec 5
    $response.status
} catch {
    "ERROR"
}

if ($healthCheck -eq "OK") {
    Write-Host "✅ Judge0 đang hoạt động tốt!" -ForegroundColor Green
} else {
    Write-Host "❌ Judge0 chưa sẵn sàng. Kiểm tra logs:" -ForegroundColor Red
    Write-Host "   docker logs judge0 --tail 50" -ForegroundColor Yellow
}
Write-Host ""

# Bước 7: Hiển thị logs
Write-Host "📋 Logs của Judge0 (50 dòng cuối):" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
docker logs judge0 --tail 50
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Bước 8: Test submission
Write-Host "🧪 Bước 7: Test submission đơn giản..." -ForegroundColor Yellow
$testBody = @{
    source_code = "print('Hello World')"
    language_id = 71
    stdin = ""
} | ConvertTo-Json

try {
    $testResult = Invoke-RestMethod -Uri "http://localhost:2358/submissions?base64_encoded=false&wait=true" -Method Post -Body $testBody -ContentType "application/json"
    
    if ($testResult.status.id -eq 3) {
        Write-Host "✅ Test submission thành công! Status: Accepted" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Test submission có vấn đề. Status ID: $($testResult.status.id)" -ForegroundColor Yellow
        Write-Host "   Message: $($testResult.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Test submission thất bại: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "✨ Hoàn tất! Judge0 đã được rebuild với cấu hình mới." -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Lưu ý:" -ForegroundColor Yellow
Write-Host "   - Nếu vẫn còn lỗi, xem file FIX_JUDGE0_SCRIPT_ERROR.md" -ForegroundColor Yellow
Write-Host "   - Kiểm tra logs: docker logs judge0 -f" -ForegroundColor Yellow
Write-Host ""

