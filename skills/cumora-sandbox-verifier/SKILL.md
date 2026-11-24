---
name: cumora-sandbox-verifier
description: Windows Cumora 本地 agent 沙盒的查询校验与完全解除。默认流程只读查询并校验 supervisor、daemon、workspace、日志、引擎与主机文件读取探针，输出 VERIFIED 或 NOT VERIFIED。当用户说“解除沙盒限制”“解除沙盒”“完全解除沙盒”“去掉所有 agent 的隐私边界”“让任意 agent 读取本机所有目录/所有文件”时，触发词本身就是授权，不再询问，直接执行完全解除流程：备份并幂等修改本地 daemon bundle 与 supervisor，去掉 PERSONA_HEADER 与常驻提示词中的隐私边界，确保 CUMORA_BYOA_ALLOW_UNSANDBOXED=1（同时让 daemon 广告所有已安装 agent CLI），重启 daemon，并用 verify_cumora.ps1 -FullHostAccess 验收，输出 FULL HOST ACCESS ENABLED。技能只有两个流程，没有第三种中间状态。不得打印 device token、API key、环境凭证或完整环境变量。
compatibility: Windows PowerShell 5.1+; Cumora desktop/daemon 0.18.x or compatible; requires local access to %USERPROFILE%\\.cumora
---

# Cumora sandbox verifier

技能只有两个流程：**默认查询并校验**，以及说出触发词后的**完全解除沙盒限制**。没有第三种中间状态，也不要把完全解除描述成部分调整。

## 触发判定

- **默认**：用户没有明确要求解除沙盒时，一律走流程一。只读，不改文件、不杀进程、不重启 daemon。
- **完全解除**：用户说“解除沙盒限制”“解除沙盒”“完全解除沙盒”“去掉所有 agent 的隐私边界”“让任意 agent 读取本机所有目录/所有文件”或等价表述时，立即走流程二。
- 触发词出现即视为明确授权：**不再追问、不再要求额外确认、不输出“请确认”**。主机级访问的风险只作为一句告知，不作为问题。
- 区分：只问“为什么读不到某个目录”“诊断一下”“校验沙盒”属于流程一；只有明确要求解除限制才走流程二。

## 规则

1. 流程一默认只读。没有触发词时，不写文件、不杀进程、不重启。
2. 流程二会修改 `%LOCALAPPDATA%\npm-cache\_npx\*\node_modules\cumora\dist\cli.js` 与 `daemon-supervisor.ps1`。执行前必须备份两者；改动必须幂等，重复执行不重复追加。
3. `CUMORA_BYOA_ALLOW_UNSANDBOXED=1` 同时负责两件事：把本地引擎切到主机级权限，并让 daemon 广告所有已安装的 agent CLI。它不会自动移除 agent persona/常驻提示词里的隐私边界；流程二必须同时处理这三处。
4. 不把“文件已改完”当作成功。流程一以 `verify_cumora.ps1 -Json` 的 `verified=true` 为准；流程二以 `verify_cumora.ps1 -FullHostAccess -Json` 的 `verified=true` 为准。
5. `control-stream connected` 是 server 连通性证据，不另设验证进程侧的 HTTP 网络探针；HEAD/GET 会因认证、405、代理或 TLS 误报。
6. 工作区、server 或 daemon 版本变化后，清除旧结论重新验收。`npx cumora@latest` 升级可能覆盖补丁，升级后重新执行流程二并验收。
7. 凭证值本身不读取，只报告“继承路径已配置，凭证值未读取”。

## 流程一：查询并校验（默认）

```powershell
$verify = Join-Path $SkillRoot 'scripts\verify_cumora.ps1'
& $verify -Json
```

读取 JSON，先看 `verified`。同时满足下列条件才算通过：

- 自动发现 daemon PATH 中实际存在的 agent CLI；未安装的工具只作信息，除非用 `-RequiredEngines` 指定，否则不算失败；
- supervisor 包含 `CUMORA_BYOA_ALLOW_UNSANDBOXED=1`；
- `running.json` 的 daemon PID 存活，无无法解释的重复 daemon；
- `computer.json` 有当前 `computerId` 和 `serverUrl`，最新日志有当前 computer 的 `starting ... (engines: ...)` 与 `control-stream connected`，且无设备令牌失效、engine snapshot 失败等阻断错误；
- 验证进程的主机文件读取探针通过。

输出：

```text
VERIFIED
引擎发现：<实际检测到的 CLI；可能为空>
沙盒：CUMORA_BYOA_ALLOW_UNSANDBOXED=1 已由 supervisor 生效
daemon：当前 PID 存活，workspace/server 与最新启动日志一致
能力探针：验证进程主机文件读取通过（不代表 Cumora agent 可访问任意路径）；daemon 控制流已连接（server 连通证据）；凭证继承路径已配置（未读取凭证值）
```

失败输出：

```text
NOT VERIFIED
- <失败检查>
- <证据或路径>
- <下一步动作>
```

流程一的 `VERIFIED` 只说明 supervisor、daemon、日志和验证进程探针合格，**不等于** Cumora agent 能读取主机上任意目录。不要因为下拉框里出现或消失某个引擎名称就输出成功；没有安装任何已知 agent 时也要明确写“未检测到 agent CLI”。

## 流程二：完全解除沙盒限制

用户说出触发词后直接执行，不再询问：

```powershell
$enable = Join-Path $SkillRoot 'scripts\enable_full_host_access.ps1'
& $enable -Json
```

脚本会：

1. 备份 npm-cache 中实际运行的 `cumora/dist/cli.js` 与 `daemon-supervisor.ps1`，备份路径写进结果；
2. 幂等替换 `PERSONA_HEADER` 的 `## Privacy boundary — STRICT` 块为 `## Host access — OPERATOR AUTHORIZED`，并替换 `standingPrompt()` 里的 Privacy 行；这两处是 daemon 本地生成到每个 agent 的 `AGENTS.md`/`CLAUDE.md` 和常驻提示词的来源；
3. 幂等确保 supervisor 含 `CUMORA_BYOA_ALLOW_UNSANDBOXED=1`；该开关同时让 daemon 广告所有已安装 agent CLI，无需另改引擎清单；
4. 只停止 `running.json` 指向的 daemon PID，让 supervisor 拉起新进程；新 runner 启动时重写各 agent persona 文件；
5. 调用 `scripts/verify_cumora.ps1 -FullHostAccess -Json` 验收，新增检查为 `full-host-access-patch` 和 `full-host-access-personas`。

告知用户一句：这会让所有本地 agent 获得主机级文件访问，建议只在可信本机或 VM/容器中使用；这不是需要回答的问题。

全部通过时输出：

```text
FULL HOST ACCESS ENABLED
引擎发现：<已安装并广告的所有 CLI>
沙盒：CUMORA_BYOA_ALLOW_UNSANDBOXED=1 已由 supervisor 生效
agent 边界：persona/常驻提示词已改为 operator 授权的主机级访问
验收：full-host-access-patch / full-host-access-personas 均为 true
```

失败时输出：

```text
NOT FULLY ENABLED
- <失败阶段>
- <备份路径>
- <下一步动作>
```

失败时不得说已经解除。流程二完成后，如果仍需要证明某个具体 agent 真的读到了某个路径，让该 agent 实际读取一个临时标记文件并回传内容；不要拿验证进程的 `host-file-read` 代替这项证明。
