# Releasing

这个文件用于记录当前公开二开版发布到 GitHub 的推荐流程。

## 发布前检查

1. 确认 `README.md`、`LICENSE`、`THIRD_PARTY_NOTICES.md` 已更新
2. 确认 Release 文案已整理完成，并放在 `docs/releases/` 留档
3. 确认 `manifest.json`、侧边栏标题和版本展示文案与目标版本号一致
4. 检查代码、截图、默认配置里没有真实密钥、代理、手机号、邮箱、Cookie、回调地址
5. 确认 `docs/images` 中的 README 图片可正常显示
6. 运行测试或至少完成关键功能自测
7. 检查发布包内容，确认没有把 `_metadata`、`config.json`、运行历史、日志、本地临时文件带上

## 当前版本建议

- 当前待发布版本：`v0.1.4`
- 当前扩展版本号：`0.1.4`
- Release 文案文件：`docs/releases/v0.1.4.md`
- GitHub Release 正文可直接复制 `docs/releases/v0.1.4.md`

## 公开版定位建议

发布页建议明确写清：

- 这是二开公开版，不是上游作者的官方续作
- 维护者是学生，更新节奏不保证
- 本人没有开打赏，纯公益
- 如果上游路线仍然可用，后续会视情况继续跟进
- 提醒用户优先阅读 README 的安装和配置教程
- 明显提示用户给仓库点 Star

## 首次发布

1. 创建新的 GitHub 仓库
2. 设置默认分支为 `main`
3. 推送当前代码
4. 检查仓库首页 README、图片、许可证识别是否正常
5. 创建首个 Release，例如 `v0.1.4`
6. 上传打包好的扩展压缩包

## 建议忽略的本地文件

公开仓库不应包含这些内容：

- `config.json`
- `_metadata/`
- `release-artifacts/`
- `data/account-run-history.txt`
- `data/account-run-history.json`
- `.DS_Store`
- `ZeroOmegaOptions.bak`
- 任何包含真实账号、Token、Cookie、代理的临时文件

## Git 初始化与推送示例

```bash
git init
git status
git add .
git commit -m "Initial public release"
git branch -M main
git remote add origin https://github.com/<your-name>/<your-repo>.git
git push -u origin main
```

## 打标签与发版示例

```bash
git status
git add README.md RELEASING.md docs/releases/v0.1.4.md manifest.json sidepanel/sidepanel.html background/duckduckgo-mail-provider.js tests/duckduckgo-mail-provider.test.js .gitignore
git commit -m "Prepare v0.1.4 public release"
git tag -a v0.1.4 -m "GuJumpgate v0.1.4"
git push origin main
git push origin v0.1.4
```
