@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Tunnel Midtrans - LMS Pesantren

set "CF_DIR=%LOCALAPPDATA%\cloudflared"
set "CF_EXE=%CF_DIR%\cloudflared.exe"
set "LOG=%CF_DIR%\tunnel.log"
set "URLFILE=%CF_DIR%\url.txt"

echo ============================================================
echo  Tunnel Cloudflare untuk webhook Midtrans
echo  (meneruskan https publik -^> http://localhost:3000)
echo ============================================================
echo.

if not exist "%CF_DIR%" mkdir "%CF_DIR%"

if not exist "%CF_EXE%" (
  echo [1/3] Mengunduh cloudflared ke %CF_EXE% ...
  powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CF_EXE%' -UseBasicParsing"
  if not exist "%CF_EXE%" (
    echo GAGAL mengunduh cloudflared. Periksa koneksi internet.
    pause
    exit /b 1
  )
) else (
  echo [1/3] cloudflared sudah tersedia.
)

echo [2/3] Menjalankan tunnel...
if exist "%LOG%" del "%LOG%"
if exist "%URLFILE%" del "%URLFILE%"
start "cloudflared" /min "%CF_EXE%" tunnel --url http://localhost:3000 --no-autoupdate --logfile "%LOG%"

set "URL="
for /l %%i in (1,1,40) do (
  if not defined URL (
    timeout /t 1 /nobreak >nul
    if exist "%LOG%" (
      powershell -NoProfile -Command "$m = Select-String -Path '%LOG%' -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -Last 1; if ($m) { [System.IO.File]::WriteAllText('%URLFILE%', $m.Matches.Value) }" >nul 2>&1
      if exist "%URLFILE%" set /p URL=<"%URLFILE%"
    )
  )
)

if not defined URL (
  echo.
  echo GAGAL membaca URL tunnel. Cek log: %LOG%
  pause
  exit /b 1
)

set "WEBHOOK=%URL%/api/webhooks/midtrans"
echo.
echo ============================================================
echo  URL webhook publik:
echo   !WEBHOOK!
echo ============================================================
echo.

echo [3/3] Memperbarui WEBHOOK_PUBLIC_URL di .env.local ...
powershell -NoProfile -Command "$p='.env.local'; if (Test-Path $p) { $lines = Get-Content $p -Encoding UTF8; if ($lines -match '^WEBHOOK_PUBLIC_URL=') { $lines = $lines -replace '^WEBHOOK_PUBLIC_URL=.*','WEBHOOK_PUBLIC_URL=!URL!' } else { $lines += 'WEBHOOK_PUBLIC_URL=!URL!' }; [System.IO.File]::WriteAllLines((Resolve-Path $p), $lines); Write-Host 'OK: .env.local diperbarui' } else { Write-Host 'PERINGATAN: .env.local tidak ditemukan' }"

echo.
echo Catatan:
echo  - Restart "npm run dev" bila sedang berjalan agar env baru terbaca.
echo  - Notification URL di dashboard Midtrans TIDAK perlu diubah: aplikasi
echo    mengirim header X-Override-Notification berisi URL tunnel ini.
echo  - Tutup jendela cloudflared (di taskbar) untuk mematikan tunnel.
echo.
pause
