@echo off
cd /d "%~dp0"
git tag v0.5.19
git push origin v0.5.19
if %ERRORLEVEL% EQU 0 (
    echo v0.5.19 tag pushed! GitHub Actions will build and release.
) else (
    echo Tag push failed.
    pause
)
