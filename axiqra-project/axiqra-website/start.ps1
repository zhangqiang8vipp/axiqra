# Axiqra 宣传页一键启动脚本
# 用法: 右键 → 使用 PowerShell 运行（建议管理员权限）

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$LogFile = Join-Path $ProjectRoot "start.log"

function Write-Log($Msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Msg"
    $line | Tee-Object -FilePath $LogFile -Append
}

Write-Log "========== Axiqra 启动 =========="

# 1. 等待 Docker 就绪
Write-Log "等待 Docker Desktop..."
$retries = 0
while ($retries -lt 30) {
    try {
        docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { break }
    } catch {}
    Start-Sleep 2
    $retries++
}
if ($retries -ge 30) {
    Write-Log "ERROR: Docker Desktop 未就绪，请手动启动后重试"
    Read-Host "按回车退出"
    exit 1
}
Write-Log "Docker 就绪"

# 2. 启动容器
Write-Log "启动 Docker 容器..."
Push-Location $ProjectRoot
docker compose up -d 2>&1 | Tee-Object -FilePath $LogFile -Append
Pop-Location

if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: 容器启动失败"
    Read-Host "按回车退出"
    exit 1
}
Write-Log "容器启动完成"

# 3. 启动 Cloudflare Tunnel
Write-Log "启动 Cloudflare Tunnel..."
$existing = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($existing) {
    Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
    Start-Sleep 1
}
Start-Process -FilePath "C:\Program Files (x86)\cloudflared\cloudflared.exe" `
    -ArgumentList "tunnel","run","--protocol","http2","axiqra" `
    -WindowStyle Hidden
Start-Sleep 5

# 4. 验证
Write-Log "验证服务..."
$health = curl.exe -s --ssl-no-revoke http://localhost:8080/api/health 2>&1
Write-Log "本地 API: $health"

Write-Log "========== 启动完成 =========="
Write-Log "本地访问: http://localhost:8080"
Write-Log "公网访问: https://www.axiqra.com"
Write-Host ""
Write-Host "✅ 启动完成！" -ForegroundColor Green
Write-Host "   本地: http://localhost:8080"
Write-Host "   公网: https://www.axiqra.com"
Write-Host ""
Read-Host "按回车关闭此窗口（服务继续后台运行）"
