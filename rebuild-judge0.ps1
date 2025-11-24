# Script de rebuild Judge0 sau khi cap nhat cau hinh
# Chay script nay trong PowerShell: .\rebuild-judge0.ps1

Write-Host "Rebuilding Judge0 voi cau hinh moi..." -ForegroundColor Cyan
Write-Host ""

# Buoc 1: Dung containers
Write-Host "Buoc 1: Dung containers hien tai..." -ForegroundColor Yellow
docker-compose down
Write-Host "Da dung containers" -ForegroundColor Green
Write-Host ""

# Buoc 2: Xoa container cu (neu can)
Write-Host "Buoc 2: Xoa container cu..." -ForegroundColor Yellow
docker rm -f judge0 2>$null
Write-Host "Da xoa container cu" -ForegroundColor Green
Write-Host ""

# Buoc 3: Pull image moi nhat (neu can)
Write-Host "Buoc 3: Pull Judge0 image..." -ForegroundColor Yellow
docker pull judge0/judge0:1.13.0
Write-Host "Da pull image" -ForegroundColor Green
Write-Host ""

# Buoc 4: Start lai containers
Write-Host "Buoc 4: Khoi dong containers..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "Da khoi dong containers" -ForegroundColor Green
Write-Host ""

# Buoc 5: Doi Judge0 khoi dong
Write-Host "Buoc 5: Doi Judge0 khoi dong (15 giay)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "Da doi" -ForegroundColor Green
Write-Host ""

# Buoc 6: Kiem tra health
Write-Host "Buoc 6: Kiem tra Judge0 health..." -ForegroundColor Yellow
$healthCheck = try {
    # Judge0 khong co endpoint /health, dung /languages thay the
    $response = Invoke-RestMethod -Uri "http://localhost:2358/languages" -Method Get -TimeoutSec 5
    if ($response -and $response.Count -gt 0) {
        "OK"
    } else {
        "ERROR"
    }
} catch {
    "ERROR"
}

if ($healthCheck -eq "OK") {
    Write-Host "Judge0 dang hoat dong tot!" -ForegroundColor Green
} else {
    Write-Host "Judge0 chua san sang. Kiem tra logs:" -ForegroundColor Red
    Write-Host "   docker logs judge0 --tail 50" -ForegroundColor Yellow
}
Write-Host ""

# Buoc 7: Hien thi logs
Write-Host "Logs cua Judge0 (50 dong cuoi):" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
docker logs judge0 --tail 50
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Buoc 8: Test submission
Write-Host "Buoc 8: Test submission don gian..." -ForegroundColor Yellow

# Tao request body voi format dung (snake_case va day du cac truong)
$testBodyObj = @{
    source_code = "print('Hello World')"
    language_id = 71
    stdin = ""
    cpu_time_limit = 2
    memory_limit = 128000
}

# Convert sang JSON voi depth de dam bao format dung
$testBody = $testBodyObj | ConvertTo-Json -Depth 10

Write-Host "Request body: $testBody" -ForegroundColor Gray

try {
    $testUrl = "http://localhost:2358/submissions?base64_encoded=false&wait=true"
    $testResult = Invoke-RestMethod -Uri $testUrl -Method Post -Body $testBody -ContentType "application/json"
    
    if ($testResult.status.id -eq 3) {
        Write-Host "Test submission thanh cong! Status: Accepted" -ForegroundColor Green
        Write-Host "   Output: $($testResult.stdout)" -ForegroundColor Green
    } else {
        Write-Host "Test submission co van de. Status ID: $($testResult.status.id)" -ForegroundColor Yellow
        Write-Host "   Status: $($testResult.status.description)" -ForegroundColor Yellow
        if ($testResult.message) {
            Write-Host "   Message: $($testResult.message)" -ForegroundColor Yellow
        }
        if ($testResult.stderr) {
            Write-Host "   Stderr: $($testResult.stderr)" -ForegroundColor Yellow
        }
        if ($testResult.compile_output) {
            Write-Host "   Compile output: $($testResult.compile_output)" -ForegroundColor Yellow
        }
    }
} catch {
    $errorDetails = $_.Exception
    Write-Host "Test submission that bai: $($errorDetails.Message)" -ForegroundColor Red
    
    # Neu co response body, hien thi
    if ($errorDetails.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($errorDetails.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response body: $responseBody" -ForegroundColor Red
        } catch {
            # Ignore neu khong doc duoc
        }
    }
}
Write-Host ""

Write-Host "Hoan tat! Judge0 da duoc rebuild voi cau hinh moi." -ForegroundColor Cyan
Write-Host ""
Write-Host "Luu y:" -ForegroundColor Yellow
Write-Host "   - Neu van con loi, xem file FIX_JUDGE0_SCRIPT_ERROR.md" -ForegroundColor Yellow
Write-Host "   - Kiem tra logs: docker logs judge0 -f" -ForegroundColor Yellow
Write-Host ""

