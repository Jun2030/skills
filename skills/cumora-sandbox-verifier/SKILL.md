---
name: cumora-sandbox-verifier
description: Windows Cumora 本地 agent 发现、沙盒诊断、修复和验收。用户提到 Cumora 沙盒、BYOA、daemon-supervisor、CUMORA_BYOA_ALLOW_UNSANDBOXED、切换 workplace 后能力变化或本地文件/网络访问时使用。先发现 daemon PATH 中实际存在的 agent CLI；agent 是否安装只作信息，除非用户明确指定必需引擎，否则不把 Claude、Codex、OpenCode 或其他工具当成固定前置条件。只有用户明确授权放宽本地引擎沙盒后才修改 supervisor 或创建 shim，并在重启后验证 supervisor、daemon、workspace、日志与本地文件读取探针，以 daemon 控制流连接日志确认 server 连通。只有全部沙盒检查通过才输出 VERIFIED，否则输出 NOT VERIFIED。不要打印 device token、API key、环境凭证或完整环境变量。
compatibility: Windows PowerShell 5.1+; Cumora desktop/daemon 0.18.x or compatible; requires local access to %USERPROFILE%\\.cumora
---

# Cumora sandbox verifier

这个技能处理的是“Cumora 的本地引擎和主机能力是否按预期暴露”的完整闭环。换 workplace、切 server 或重新安装 desktop 后，之前的成功状态都必须重新验证。

## 规则

1. 先诊断，默认只读。用户没有明确说“修复/启用 OpenCode/放宽沙盒/允许 unsandboxed”时，不写文件、不杀进程、不改计划任务。
2. 放宽沙盒是高影响设置。只有用户明确授权后，才允许把下面的 opt-in 注入 `C:\Users\<user>\.cumora\daemon-supervisor.ps1`：

   ```powershell
   $env:CUMORA_BYOA_ALLOW_UNSANDBOXED = '1'
   ```

   它允许本地引擎更广泛地读取主机文件、继承启动环境并访问网络；不要把它写进项目 `.env`，也不要把凭证复制到日志或报告。
3. 每次修复前保留 supervisor 备份；改动必须幂等，避免重复追加同一行。
4. OpenCode 桌面版常只安装 `opencode-cli.exe`。如果 daemon 的 PATH 找不到 `opencode`，先在 `%APPDATA%\ai.opencode.desktop\cli\*\opencode-cli.exe` 中选择最新版本，按需创建 `%USERPROFILE%\.local\bin\opencode.cmd` 转发 shim；创建前说明这是可逆的本地兼容层。
5. 不把“文件已修改”当作成功。必须运行 `scripts/verify_cumora.ps1`，并同时满足：
   - 自动发现实际存在的 agent CLI；只有 `-RequiredEngines` 指定的工具才是必需项；没有安装 OpenCode 不得被当作沙盒失败；
   - supervisor 明确包含 `CUMORA_BYOA_ALLOW_UNSANDBOXED=1`；
   - `running.json` 的 daemon PID 仍存活，且没有无法解释的重复 Cumora daemon；
   - `computer.json` 有当前 `computerId` 和 `serverUrl`；最新相关日志包含当前 computer 的 `starting ... (engines: claude, codex, opencode)` 与 `control-stream connected`；`control-stream connected` 就是 server 连通性证据，不另设验证进程的 HTTP 网络探针；
   - 最近日志没有 `401 invalid or revoked device token`、`engine snapshot report failed` 等阻断错误；
   - 主机文件读取探针通过。文件探针证明验证进程能访问主机文件；若要证明 Cumora agent 本身也能访问，必须让 Cumora agent 实际读取一个临时标记文件并把结果作为额外证据。不要对 `serverUrl` 做验证进程侧的 HEAD/GET 探针：认证要求、405、代理或 TLS 设置都会让它误报，而它测的也不是 daemon/agent。凭证值本身不读取，只报告“继承路径已配置，凭证值未读取”。
6. 工作区或 server 发生变化时，清除旧结论，按当前 `computer.json`、`running.json` 和最新日志重新验收。

## 执行流程

### A. 只读诊断

```powershell
$verify = Join-Path $SkillRoot 'scripts\verify_cumora.ps1'
& $verify -Json
```

读取 JSON 结果，先看 `verified`。`verified=false` 时输出 `NOT VERIFIED`，列出失败检查和下一步，不得说“已经修复”。

### B. 用户已明确授权修复时

按最小改动执行：

1. 备份 `daemon-supervisor.ps1`。
2. 在 `$env:CUMORA_SUPERVISED = '1'` 后幂等写入 unsandboxed opt-in。
3. 如果 `opencode --version` 在 daemon PATH 中失败，且能找到 `opencode-cli.exe`，创建或更新 `opencode.cmd` shim，并把 shim 所在目录加入 supervisor PATH；不要覆盖用户已有的有效 shim。
4. 只重启 Cumora daemon。优先停止 `running.json` 指向的 PID，让现有 supervisor/计划任务拉起新进程；不要重启整台电脑，不要删除 `.cumora` 数据。
5. 等待新 `running.json` 和日志出现后重新运行验证脚本。

### C. 输出结论

成功格式：

```text
VERIFIED
引擎发现：<实际检测到的 CLI；可能为空>
沙盒：CUMORA_BYOA_ALLOW_UNSANDBOXED=1 已由 supervisor 生效
daemon：当前 PID 存活，workspace/server 与最新启动日志一致
能力探针：主机文件读取通过；daemon 控制流已连接（server 连通证据）；凭证继承路径已配置（未读取凭证值）
```

失败格式：

```text
NOT VERIFIED
- <失败检查>
- <证据或路径>
- <下一步动作>
```

不要只因为某个下拉框出现或消失 `Claude Code`、`OpenCode` 等名称就输出成功；必须以脚本的 `verified=true` 为准。没有安装任何已知 agent 时，也可以验证 Cumora 沙盒配置，但应明确写出“未检测到 agent CLI”。
