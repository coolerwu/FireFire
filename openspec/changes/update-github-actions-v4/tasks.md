# Implementation Tasks

## 1. 更新 GitHub Actions 版本
- [x] 1.1 将 build-linux job 中的 `actions/upload-artifact@v3` 更新为 `@v4`
- [x] 1.2 将 build-win job 中的 `actions/upload-artifact@v3` 更新为 `@v4`
- [x] 1.3 将 build-mac job 中的 `actions/upload-artifact@v3` 更新为 `@v4`
- [x] 1.4 将 release job 中的三个 `actions/download-artifact@v3` 更新为 `@v4`

## 2. 验证
- [ ] 2.1 提交更改并触发 GitHub Actions 构建
- [ ] 2.2 确认所有平台（Linux、Windows、macOS）构建成功
- [ ] 2.3 确认 release job 能够正确下载和发布所有平台的产物
