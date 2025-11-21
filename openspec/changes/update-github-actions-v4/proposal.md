# Change: 升级 GitHub Actions 到 v4 版本

## Why
当前的 GitHub Actions workflow 使用了已废弃的 `actions/upload-artifact@v3` 和 `actions/download-artifact@v3`，导致构建失败。根据 GitHub 官方通知（2024-04-16），v3 版本已被弃用，必须升级到 v4 以确保 CI/CD 流程正常运行。

## What Changes
- 将 `actions/upload-artifact` 从 v3 升级到 v4（所有平台：Linux、Windows、macOS）
- 将 `actions/download-artifact` 从 v3 升级到 v4（release job）
- 验证构建流程在所有平台上正常工作

## Impact
- Affected specs: `ci-cd` (新建)
- Affected code: `.github/workflows/build.yml`
- Breaking: 无
- Risk: 低（仅更新版本号，API 兼容）
