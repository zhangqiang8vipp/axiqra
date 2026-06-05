# Axiqra S1 核心 MVP 完整功能开发清单与闭环验收规格

版本：v0.1-S1完整文档母表  
日期：2026-06-05  
当前仓库：`D:\ai\axiqra`  
历史路径说明：`E:\ProjectMyNew\axiqra` 是历史交付 / 原整理路径，不作为当前开发和验收基准。  
对应 Excel：`docs/Axiqra_功能开发与验收明细.xlsx`，当前 v2.1 / 185 张表 / 50207 行。  
文档边界：本文件只写产品、开发、验收和闭环规格，不写业务代码。

## 1. 文档定位

本文件是 S1 核心 MVP 的完整文档母表。它的目标不是把 S1 做成小版本，而是把 S1 做成完整产品逻辑下的第一阶段真实闭环。

S1 不能只做一个搜索页、一个案例列表、一个简单 MCP 工具或一个提交表单。S1 必须从第一天保留完整架构边界，避免后续通过补丁和重构补救。S1 的完整性来自四条主链同时闭合：

1. 搜索系统真实实现。
2. AI 接入协议真实落地。
3. Engineering Trace 回传真实闭环。
4. 审核流程真实可跑。

S1 当前策略：

| 项目 | 判断 |
|---|---|
| 是否继续扩 S2/S3/S4 行数 | 暂停大面积扩写 |
| 是否继续写 S1 | 是，S1 必须继续写深 |
| 是否写代码 | 否，本文件只写文档 |
| 是否把 S1 做小 | 否 |
| 是否允许未来靠补丁补架构 | 否 |
| 文档语言 | 中文简体 |
| 开发规格风格 | 借鉴日本式开发：编号清楚、状态清楚、验收清楚、证据清楚、Gate 清楚 |

## 2. 阅读来源与继承关系

本文件继承以下文档口径。Excel 的 `v2.1文档阅读报告` 已逐文件标记是否真的读完。

| 来源文档 | 本文件继承内容 | 是否已读 | 对 S1 的约束 |
|---|---|---|---|
| `02-产品核心定位、阶段边界与设计原则.md` | Axiqra 是工程方案记忆层，不是知识库或提示词库 | 是 | S1 必须验证工程记忆闭环 |
| `04-MVP 实施范围与版本路线.md` | MVP 不是低配版，必须跑通搜索、接入、回传、审核 | 是 | S1 不能删对象、删协议、删治理边界 |
| `05-用户、AI Agent 与人类学习双主线流程.md` | AI 调用和人类学习双主线 | 是 | S1 搜索结果必须同时服务工具调用和人阅读 |
| `06-工程记忆对象模型与数据预留规范.md` | Case、Solution、Trace、Review、Feedback 等对象 | 是 | S1 数据模型必须从对象层完整预留 |
| `08-Solution 生命周期、状态机与验证等级.md` | Solution 状态和验证等级 | 是 | S1 审核发布必须能进入可召回 Solution |
| `09-AI工具接入、对话式自动接入、MCP、API、CLI与插件协议.md` | MCP、API、CLI、Trace 回传和 scope | 是 | `search_before_act` 和 `trace:write` 必须有协议契约 |
| `12-搜索、索引、推荐、排序与评测体系.md` | Search Before Act、权限预过滤、排序、MCP 限额 | 是 | 未登录、Web 登录、MCP 登录必须分离 |
| `13-权限、空间、数据隔离与企业空间方案.md` | 累加式权限、ABAC、空间隔离 | 是 | 高级身份不能替换普通用户基础入口 |
| `14-内容治理、审核、可信来源与污染隔离机制.md` | 审核、拒绝、隔离、申诉、官方审核留痕 | 是 | S1 发布公开内容必须先治理 |
| `18-开发任务拆解、验收标准、风险与文档维护机制.md` | 日本式开发编号、字段、Gate 和维护机制 | 是 | 每个功能点必须可追踪、可验收、可复验 |
| `S1-S4功能开发清单闭环状态.md` | v2.1 行数、状态、测试风险和 S1 优先级 | 是 | S1 继续优先，不再被 S2-S4 稀释 |

## 3. 当前总判断

| 判断项 | 当前状态 | 是否闭环 | 是否完整 | 是否齐全 | 说明 |
|---|---|---|---|---|---|
| S1 清单层 | 已有 v0.2-v0.5 主链、末级规格、终端验收和资产绑定 | 部分闭环 | 部分完整 | 部分齐全 | 可启动开发，但还不能证明生产级闭环 |
| S1 v2.1 文档/Excel 控制层 | 已新增 S1 四主链规则和 48 条关键验收场景 | 文档层闭环 | 控制层完整 | 控制层齐全 | 作为继续写 S1 的母表 |
| S1 实现层 | 曾创建参考实现和样例测试，但本轮按要求不继续写代码 | 未闭环 | 不完整 | 不齐全 | 仍缺真实服务、真实索引、真实 MCP server、真实 CI |
| S1 测试层 | 18 条本地测试执行，17 通过，1 失败 | 未闭环 | 不完整 | 不齐全 | 失败登记为风险，不在本文档阶段修代码 |
| S2-S4 清单层 | 已有大量预留与路径映射 | 清单层部分闭环 | 大框架完整 | 末级不齐 | 当前不继续抢 S1 资源 |

硬结论：

1. 50000+ 行里程碑已经跨过。
2. S1-S4 功能框架已经清楚。
3. S1 优先级仍然不够，必须继续把 S1 写深。
4. S1 不能靠“先小做，后补丁”推进。
5. 下一阶段文档工作应集中补 S1，而不是继续扩大 S2/S3/S4。

## 4. S1 四主链闭环地图

S1 的闭环不是一个单点功能，而是四条主链互相咬合。

```mermaid
flowchart LR
    A["用户 / AI 工具提出工程任务"] --> B["Search Before Act"]
    B --> C["公开 / 私有 / 授权范围内 Solution 召回"]
    C --> D["AI 工具执行工程任务"]
    D --> E["Engineering Trace Package 回传"]
    E --> F["脱敏、授权、证据校验"]
    F --> G["审核队列 / 风险分层 / 污染隔离"]
    G --> H["批准后发布为可复用 Solution"]
    H --> B
```

四主链总表：

| S1 主链 | 当前文档状态 | 当前实现状态 | 是否闭环 | 是否完整 | 是否齐全 | Excel v2.1 已用行 | S1 目标行数区间 | 下一步文档重点 |
|---|---|---|---|---|---|---:|---:|---|
| 搜索系统 | v2.1 已补 12 条验收和 12 条展开规则 | 参考实现层存在，生产未闭环 | 否 | 部分 | 部分 | 24 | 4200-6200 | 真实索引、排序、分页、解释、公开/私有隔离、评测 |
| AI/MCP 接入协议 | v2.1 已补 12 条验收和 12 条展开规则 | 参考语义存在，真实 MCP server 未闭环 | 否 | 部分 | 部分 | 24 | 3300-5200 | tool schema、token、scope、quota、错误 envelope、回退 |
| Engineering Trace 回传 | v2.1 已补 12 条验收和 12 条展开规则 | 参考提交存在，生产 schema / 证据未闭环 | 否 | 部分 | 部分 | 24 | 3300-5200 | Trace Package schema、幂等、脱敏、附件、授权、审计 |
| 审核发布与污染隔离 | v2.1 已补 12 条验收和 12 条展开规则 | 参考审核存在，生产队列未闭环 | 否 | 部分 | 部分 | 24 | 2600-4200 | 审核队列、拒绝、复核、撤回、隔离、申诉、审计导出 |
| 跨域质量 Gate | 分散在 D13/D14/D18 和 v2.1 策略中 | 生产 CI 未闭环 | 否 | 部分 | 部分 | 0 | 1800-3200 | 错误码、审计、证据、CI、缺陷、发布准入 |
| 合计 | 控制层已建立 | 生产未闭环 | 否 | 部分 | 部分 | 96 | 15200-24000 | S1 继续写深，不继续均摊给 S2-S4 |

说明：`Excel v2.1 已用行` 只统计 `v2.1 S1全量展开规则` 和 `v2.1 S1四主链验收` 中直接归属四主链的 96 行，不包含历史 S1 相关 7472 行。

## 5. S1 不可变原则

| 编号 | 原则 | 必须遵守的原因 | 违规后果 |
|---|---|---|---|
| S1-PRINCIPLE-001 | MVP 不是低配版 | S1 要验证工程记忆层是否成立 | 只做页面会变成普通知识库 |
| S1-PRINCIPLE-002 | S1 不删对象，只裁剪启用范围 | User、Trace、Case、Solution、Review、Audit 等对象后续都会用到 | 后续团队、企业、治理会补丁式重构 |
| S1-PRINCIPLE-003 | 搜索必须先做权限预过滤 | Search Before Act 会影响 AI 行动 | 私有数据泄漏风险 |
| S1-PRINCIPLE-004 | MCP 搜索和 Web 搜索必须分离 | MCP 是工具通道，有 token、scope 和 quota | 工具可绕过 Web 权限 |
| S1-PRINCIPLE-005 | 普通登录用户 MCP 默认每日 10 次 | D09、D12、D13 已固定该口径 | quota 无法验收 |
| S1-PRINCIPLE-006 | 高级身份不自动绕过 quota | 高级身份是能力叠加，不是无限权限 | 企业管理员、审核者可误越权 |
| S1-PRINCIPLE-007 | 角色不是互斥身份 | 用户可同时是普通用户、组织成员、审核者、Maintainer | 导航被错误替换 |
| S1-PRINCIPLE-008 | 导航按能力累加后 ABAC 裁剪 | D03、D13 已固定 | 高级身份丢失基础入口 |
| S1-PRINCIPLE-009 | Trace 必须结构化 | 回传不是聊天摘要 | 无法审核、复用、搜索和回滚 |
| S1-PRINCIPLE-010 | 公开发布必须先脱敏、授权、审核 | Axiqra 的公共记忆需要可信边界 | 污染公共 Solution 网络 |
| S1-PRINCIPLE-011 | 所有拒绝必须有 reason_code | 日本式开发要求可复验 | 用户和 QA 无法定位问题 |
| S1-PRINCIPLE-012 | 没有证据不能签收 | 文档、Excel、CI、截图、JSON、审计日志必须能追 | 假闭环 |

## 6. 累加式权限和导航规则

S1 必须继续采用累加式权限渲染。角色不是互斥身份，而是能力来源。

能力合并公式：

```text
base_user_capabilities
+ membership_capabilities
+ granted_scope_capabilities
+ governance_capabilities
+ admin_capabilities
-> ABAC filter
-> final navigation and action set
```

| 主体 | 基础入口是否保留 | 空间入口是否叠加 | 高级入口是否叠加 | 是否自动绕过 MCP 10 次 | 判断 |
|---|---|---|---|---|---|
| 未登录用户 | 否，仅公开入口 | 否 | 否 | 否 | 只能公开搜索，不得 MCP |
| 普通登录用户 | 是 | 按成员关系 | 否 | 否 | 可 Web 搜索和默认 MCP quota |
| 团队成员 | 是 | 是 | 否 | 否 | 保留个人入口，叠加团队入口 |
| 企业成员 | 是 | 是 | 否 | 否 | 保留个人入口，叠加企业入口 |
| 审核者 | 是 | 按成员关系 | 审核队列 | 否 | 审核能力叠加，不替换普通入口 |
| Maintainer | 是 | 按成员关系 | 维护者工作台 | 否 | 维护能力叠加，不替换普通入口 |
| 企业管理员 | 是 | 是 | 企业管理台 | 否 | 管理能力叠加，不默认越权 |
| 官方审核人员 | 是 | 按授权范围 | 官方审核台 | 否 | 官方动作独立留痕 |

任何文档、Excel 或未来代码里出现“当前角色 = 管理员，所以只显示管理后台”的设计，都判定为错误。

## 7. S1 架构必须预留的边界

本节是文档规格，不是代码实现要求。后续代码阶段可以选择具体框架，但不得删除这些边界。

| 架构层 | S1 必须有的职责 | 是否当前闭环 | 完整度 | 齐全度 | 说明 |
|---|---|---|---|---|---|
| 页面与交互层 | 搜索、结果详情、接入引导、Trace 确认、审核队列、发布反馈 | 否 | 部分 | 部分 | 当前以文档定义为主 |
| API 层 | Web 搜索、MCP 搜索、Trace 提交、审核动作、证据查询 | 否 | 部分 | 部分 | 必须有稳定 request_id 和 error envelope |
| MCP / CLI / 接入层 | `axiqra.search_before_act`、接入包、doctor、自检、回退 | 否 | 部分 | 部分 | S1 至少真实跑通一条链路 |
| 应用服务层 | Search、MCP、Trace、Review、Authorization、Evidence | 否 | 部分 | 部分 | 不能揉成一个大函数 |
| 领域模型层 | Case、Solution、Trace、Review、Feedback、Invocation、Audit | 否 | 部分 | 部分 | 对象关系不能后补 |
| Policy / ABAC 层 | 登录态、空间、scope、授权、风险、quota、动作许可 | 否 | 部分 | 部分 | 累加后裁剪 |
| 数据层 | PostgreSQL、索引表、Trace 表、Review 表、Audit 表、Evidence 表 | 否 | 部分 | 部分 | S1 可轻量，但不能无迁移路径 |
| 搜索索引层 | 文本索引、结构化筛选、向量预留、排序特征、评测集 | 否 | 部分 | 部分 | pgvector 可用但不是终局锁死 |
| 审计证据层 | API JSON、审计日志、截图、CI 报告、签收记录 | 否 | 部分 | 部分 | 无证据不能签收 |
| CI / Gate 层 | contract、E2E、permission、audit、regression、release | 否 | 部分 | 部分 | 当前真实 CI 未闭环 |

## 8. 搜索系统完整功能清单

搜索系统是 S1 的第一根主梁。它决定 AI 工具行动前看到什么，也决定公开用户、登录用户、团队成员和企业成员看到什么。搜索必须先过权限，再排序，再展示。

| 编号 | 功能点 | 状态 | 是否闭环 | 是否完整 | 是否齐全 | Excel 目标行数 | 必验点 |
|---|---|---|---|---|---|---:|---|
| S1-SEARCH-001 | 未登录公开搜索 | 规格补强中 | 否 | 部分 | 部分 | 260 | 只返回 public、已脱敏、允许公开展示内容 |
| S1-SEARCH-002 | 未登录私有隔离反查 | 规格补强中 | 否 | 部分 | 部分 | 220 | 搜私有标题、路径、客户名不得泄露 |
| S1-SEARCH-003 | 登录 Web 搜索 | 规格补强中 | 否 | 部分 | 部分 | 240 | 返回公开 + 本人 + 授权范围内内容 |
| S1-SEARCH-004 | 空间优先级搜索 | 规格补强中 | 否 | 部分 | 部分 | 260 | 自己、项目、小组、团队、企业、公开的优先级 |
| S1-SEARCH-005 | MCP Search Before Act 搜索 | 规格补强中 | 否 | 部分 | 部分 | 300 | token scope、quota、ABAC 同时生效 |
| S1-SEARCH-006 | 查询解析与归一化 | 待展开 | 否 | 否 | 否 | 220 | task_goal、context、risk_hint 结构化 |
| S1-SEARCH-007 | 权限预过滤 | 待展开 | 否 | 否 | 否 | 320 | 查询前先裁剪候选空间 |
| S1-SEARCH-008 | 排序公式 v1 | 待展开 | 否 | 否 | 否 | 260 | 可信度、相似度、风险、时效、空间优先级 |
| S1-SEARCH-009 | 排序解释 | 待展开 | 否 | 否 | 否 | 220 | 每条结果说明为什么召回 |
| S1-SEARCH-010 | 分页稳定性 | 待展开 | 否 | 否 | 否 | 180 | 翻页不重复、不丢失、不越权 |
| S1-SEARCH-011 | 结果脱敏展示 | 规格补强中 | 否 | 部分 | 部分 | 260 | 标题、摘要、路径、日志、代码片段脱敏 |
| S1-SEARCH-012 | 低可信结果隔离 | 待展开 | 否 | 否 | 否 | 220 | rejected/quarantined 不展示 |
| S1-SEARCH-013 | 搜索审计事件 | 待展开 | 否 | 部分 | 部分 | 240 | actor、object、decision、query_hash、trace_id |
| S1-SEARCH-014 | 搜索评测集 | 待展开 | 否 | 否 | 否 | 260 | 命中率、误召回、私有泄漏、排序回归 |
| S1-SEARCH-015 | 索引刷新与回滚 | 待展开 | 否 | 否 | 否 | 260 | 发布、撤回、隔离后索引一致 |
| S1-SEARCH-016 | 空结果和 CTA | 待展开 | 否 | 否 | 否 | 160 | 登录 CTA、创建 Trace、反馈入口 |
| S1-SEARCH-017 | 恶意查询防护 | 待展开 | 否 | 否 | 否 | 180 | 超长、注入、枚举、批量探测 |
| S1-SEARCH-018 | 搜索证据包 | 待展开 | 否 | 否 | 否 | 220 | API JSON、截图、审计、CI 报告 |
| S1-SEARCH-019 | 搜索降级策略 | 待展开 | 否 | 否 | 否 | 180 | 索引不可用时安全降级 |
| S1-SEARCH-020 | 搜索发布 Gate | 待展开 | 否 | 否 | 否 | 200 | 权限、私有隔离、quota、审计回归全过 |

搜索系统 DoD：

1. 未登录搜索无法看到任何个人、团队、小组、企业、Project Case 或私有 Trace。
2. MCP 搜索第 11 次返回 429 / `QUOTA_LIMITED`，不执行召回。
3. 企业管理员、审核者、Maintainer 不因高级身份默认绕过 quota。
4. 搜索结果必须有可解释排序依据。
5. 发布、撤回、隔离会影响索引和搜索结果。
6. 所有搜索动作必须可审计。

## 9. AI / MCP 接入协议完整功能清单

AI 接入不是“给用户复制一段提示词”。S1 必须让外部工具能在动手前调用 Axiqra，也能在完成后回传工程轨迹。

| 编号 | 功能点 | 状态 | 是否闭环 | 是否完整 | 是否齐全 | Excel 目标行数 | 必验点 |
|---|---|---|---|---|---|---:|---|
| S1-MCP-001 | 对话式接入引导 | 规格补强中 | 否 | 部分 | 部分 | 220 | 用户能选择工具和接入方式 |
| S1-MCP-002 | 接入包 manifest | 待展开 | 否 | 否 | 否 | 200 | tool、scope、endpoint、fallback、version |
| S1-MCP-003 | MCP tool schema | 规格补强中 | 否 | 部分 | 部分 | 260 | input/output/error schema 固定 |
| S1-MCP-004 | `axiqra.search_before_act` | 规格补强中 | 否 | 部分 | 部分 | 320 | task_goal、context、workspace_id、risk_hint |
| S1-MCP-005 | MCP 登录和 token | 待展开 | 否 | 否 | 否 | 260 | token 生命周期、撤销、过期、scope |
| S1-MCP-006 | scope 裁剪 | 待展开 | 否 | 否 | 否 | 240 | scope 只能缩小不能扩大权限 |
| S1-MCP-007 | 每日 10 次 quota | 规格补强中 | 否 | 部分 | 部分 | 280 | 第 1、第 10、第 11 次边界 |
| S1-MCP-008 | quota 重置和并发 | 待展开 | 否 | 否 | 否 | 240 | calendar_day、并发一致性 |
| S1-MCP-009 | 错误 envelope | 待展开 | 否 | 否 | 否 | 220 | request_id、error_code、repair_hint |
| S1-MCP-010 | CLI 回退路径 | 待展开 | 否 | 否 | 否 | 180 | MCP 不可用时可 CLI/API |
| S1-MCP-011 | REST API 回退路径 | 待展开 | 否 | 否 | 否 | 200 | 与 MCP 语义一致 |
| S1-MCP-012 | doctor 自检 | 待展开 | 否 | 否 | 否 | 220 | 配置、网络、token、scope、quota |
| S1-MCP-013 | 工具兼容矩阵 | 待展开 | 否 | 否 | 否 | 180 | Codex、Cursor、Claude Code、通用 MCP |
| S1-MCP-014 | 工具调用审计 | 待展开 | 否 | 否 | 否 | 220 | tool、subject、scope、quota、decision |
| S1-MCP-015 | 本地缓存策略 | 待展开 | 否 | 否 | 否 | 180 | 缓存不得扩大权限或绕过撤销 |
| S1-MCP-016 | 接入撤销 | 待展开 | 否 | 否 | 否 | 180 | 撤销后 token 和工具不可继续调用 |
| S1-MCP-017 | 接入证据包 | 待展开 | 否 | 否 | 否 | 200 | MCP JSON、doctor 日志、截图 |
| S1-MCP-018 | 接入发布 Gate | 待展开 | 否 | 否 | 否 | 200 | scope、quota、错误码、审计、回退全过 |

AI / MCP DoD：

1. 至少一条接入链路真实可安装、可自检、可撤销、可回退。
2. MCP 工具响应必须能被自动化脚本断言。
3. scope 缺失不消耗 quota。
4. 超额不召回，不静默降级成无限 Web 搜索。
5. 所有工具调用都能回查审计。

## 10. Engineering Trace 回传完整功能清单

Engineering Trace Package 是 Axiqra 的核心资产。它不是聊天记录，也不是一段总结，而是可审核、可脱敏、可复用、可回滚的工程轨迹。

| 编号 | 功能点 | 状态 | 是否闭环 | 是否完整 | 是否齐全 | Excel 目标行数 | 必验点 |
|---|---|---|---|---|---|---:|---|
| S1-TRACE-001 | Trace Package schema v1 | 规格补强中 | 否 | 部分 | 部分 | 320 | schema_version、task_goal、context、paths、evidence |
| S1-TRACE-002 | Trace 提交 API | 规格补强中 | 否 | 部分 | 部分 | 260 | `trace:write`、request_id、错误 envelope |
| S1-TRACE-003 | 幂等提交 | 待展开 | 否 | 否 | 否 | 220 | idempotency_key 重试不重复 |
| S1-TRACE-004 | 敏感信息脱敏 | 规格补强中 | 否 | 部分 | 部分 | 320 | token、路径、客户名、日志、代码片段 |
| S1-TRACE-005 | worked / failed 结构 | 待展开 | 否 | 否 | 否 | 240 | 正向路径和失败路径都保留 |
| S1-TRACE-006 | 决策记录 | 待展开 | 否 | 否 | 否 | 200 | 为什么选择此方案、拒绝哪些方案 |
| S1-TRACE-007 | 证据附件 | 待展开 | 否 | 否 | 否 | 260 | 测试、日志、截图、commit、CI |
| S1-TRACE-008 | 授权与可见范围 | 待展开 | 否 | 否 | 否 | 240 | private/team/enterprise/public_candidate |
| S1-TRACE-009 | 版本和修订 | 待展开 | 否 | 否 | 否 | 200 | 修正后保留历史版本 |
| S1-TRACE-010 | Trace 到 Project Case | 待展开 | 否 | 否 | 否 | 220 | 用户确认后沉淀到私有工程记忆 |
| S1-TRACE-011 | Trace 到 Public Candidate | 待展开 | 否 | 否 | 否 | 240 | 脱敏、授权、审核前不得公开 |
| S1-TRACE-012 | Trace 审计事件 | 待展开 | 否 | 否 | 否 | 220 | submitted、redacted、review_requested |
| S1-TRACE-013 | Trace 查询和回放 | 待展开 | 否 | 否 | 否 | 220 | 按 id 读取、证据可复验 |
| S1-TRACE-014 | Trace 拒绝和修复 | 待展开 | 否 | 否 | 否 | 200 | schema_invalid、sensitive_blocked、scope_denied |
| S1-TRACE-015 | Trace 质量评分 | 待展开 | 否 | 否 | 否 | 180 | 完整度、证据、复用价值、风险 |
| S1-TRACE-016 | Trace 证据包 | 待展开 | 否 | 否 | 否 | 220 | API JSON、脱敏前后摘要、审计日志 |
| S1-TRACE-017 | Trace 发布 Gate | 待展开 | 否 | 否 | 否 | 220 | schema、脱敏、授权、证据、审核全过 |

Engineering Trace DoD：

1. 缺 schema 必填字段时必须 422，不得入库。
2. 同一幂等 key 重试不得生成重复 Trace。
3. 敏感字段必须在进入审核前被遮蔽或阻断。
4. 用户授权范围必须固化，不能默认公开。
5. Trace 必须能进入审核候选，但不能绕过审核直接发布。

## 11. 审核发布与污染隔离完整功能清单

审核流程是 S1 的安全阀。没有审核，Axiqra 会把未验证、未授权、未脱敏或错误的工程路径放进公共记忆网络。

| 编号 | 功能点 | 状态 | 是否闭环 | 是否完整 | 是否齐全 | Excel 目标行数 | 必验点 |
|---|---|---|---|---|---|---:|---|
| S1-REVIEW-001 | 审核队列 | 规格补强中 | 否 | 部分 | 部分 | 260 | reviewer 可见待审项，普通用户不可见 |
| S1-REVIEW-002 | 审核权限 | 规格补强中 | 否 | 部分 | 部分 | 260 | `review:write`、授权范围、ABAC |
| S1-REVIEW-003 | AI 初审 | 待展开 | 否 | 否 | 否 | 220 | 低风险建议，不得黑箱终判高风险 |
| S1-REVIEW-004 | 人工审核 | 待展开 | 否 | 否 | 否 | 240 | approve/reject/request_changes |
| S1-REVIEW-005 | 拒绝原因 | 待展开 | 否 | 否 | 否 | 200 | reason_code、说明、可修复建议 |
| S1-REVIEW-006 | 要求补充 | 待展开 | 否 | 否 | 否 | 180 | 用户补证据后重新进入队列 |
| S1-REVIEW-007 | 批准发布 | 规格补强中 | 否 | 部分 | 部分 | 260 | 发布为 Public Solution / Public Case |
| S1-REVIEW-008 | 发布撤回 | 待展开 | 否 | 否 | 否 | 220 | 索引、缓存、召回同步撤回 |
| S1-REVIEW-009 | 污染隔离 | 待展开 | 否 | 否 | 否 | 260 | suspected / quarantined / blocked |
| S1-REVIEW-010 | 申诉和复核 | 待展开 | 否 | 否 | 否 | 240 | 原审核者不能单独最终复核 |
| S1-REVIEW-011 | 多人复核预留 | 待展开 | 否 | 否 | 否 | 200 | R3/R4 至少认证审核参与 |
| S1-REVIEW-012 | 官方审核留痕 | 待展开 | 否 | 否 | 否 | 200 | official_review_flag、组织、决策 |
| S1-REVIEW-013 | 审核审计导出 | 待展开 | 否 | 否 | 否 | 220 | actor、target、decision、reason、time |
| S1-REVIEW-014 | 审核指标 | 待展开 | 否 | 否 | 否 | 180 | auto_pass_rate、latency、appeal_rate |
| S1-REVIEW-015 | 审核证据包 | 待展开 | 否 | 否 | 否 | 220 | 队列截图、决策 JSON、审计日志 |
| S1-REVIEW-016 | 审核发布 Gate | 待展开 | 否 | 否 | 否 | 220 | 权限、脱敏、证据、污染、撤回回归 |

审核发布 DoD：

1. 普通用户不能审核。
2. 审核者只能审核授权范围内内容。
3. 拒绝、隔离、撤回必须有 reason_code。
4. 发布后必须能被公开搜索召回，撤回后必须不能再召回。
5. 审核链路必须保留审计，不能物理删除。

## 12. S1 状态机总表

| 对象 | 状态 | 可进入条件 | 可退出动作 | 不能发生的事 |
|---|---|---|---|---|
| Search Request | received | 用户或工具发起搜索 | normalize / deny | 未经权限预过滤直接召回 |
| Search Request | denied | 未登录调用 MCP、scope 缺失、quota 超额 | 返回错误 envelope | 静默降级或部分召回 |
| Search Request | recalled | 权限预过滤通过 | rank / return | 返回未授权对象 |
| Trace Package | draft | AI 或用户生成草稿 | submit | 默认公开 |
| Trace Package | submitted | schema、scope 基本通过 | redact / reject / review | 缺 schema 入库 |
| Trace Package | redaction_blocked | 发现敏感信息不可自动脱敏 | fix / reject | 带敏感信息进入公开审核 |
| Trace Package | review_requested | 用户授权进入审核 | approve / reject / request_changes | 未审核发布 |
| Review | pending | 内容进入审核队列 | decide / escalate | 普通用户查看队列 |
| Review | approved | 审核通过 | publish | 跳过证据校验 |
| Review | rejected | 审核拒绝 | resubmit / appeal | 无 reason_code |
| Public Solution | published | 审核批准且索引刷新 | revoke / quarantine | 私有字段出现在公开结果 |
| Public Solution | revoked | 撤回或污染确认 | archive / appeal | 继续被公开召回 |

## 13. 错误码和响应约束

| 错误码 | HTTP | 适用链路 | 触发条件 | 必须返回字段 |
|---|---:|---|---|---|
| LOGIN_REQUIRED | 401 | MCP / Trace / Review | 未登录或 token 缺失 | request_id、error_code、repair_hint |
| SCOPE_DENIED | 403 | MCP / Trace / Review | token 缺少 scope | required_scope、current_scope |
| QUOTA_LIMITED | 429 | MCP | 普通登录用户第 11 次调用 | quota_limit、quota_used、quota_remaining、quota_window |
| ABAC_DENIED | 403 | Search / Review | 对象或空间不可见 | policy_code、object_type |
| TRACE_SCHEMA_INVALID | 422 | Trace | Trace Package 缺必填字段 | missing_fields、schema_version |
| SENSITIVE_DATA_BLOCKED | 422 | Trace / Review | 无法自动脱敏 | sensitive_type、repair_hint |
| REVIEW_WRITE_DENIED | 403 | Review | 非审核者或越权审核 | required_capability、subject |
| REVIEW_REASON_REQUIRED | 422 | Review | 拒绝、隔离、撤回缺 reason | allowed_reason_codes |
| CONTENT_QUARANTINED | 423 | Search / Review | 内容处于隔离态 | quarantine_reason、appeal_available |
| ROUTE_NOT_FOUND | 404 | API / MCP | 未知 route/tool | method、path/tool |

错误响应必须结构化，不能只返回一句中文文本。中文 message 可以存在，但机器断言以 `error_code` 为准。

## 14. 审计事件清单

| 事件名 | 链路 | 必填字段 | 说明 |
|---|---|---|---|
| search.performed | Search | actor_id、query_hash、channel、result_count、request_id | 搜索成功 |
| search.denied | Search | actor_id、channel、error_code、policy_code、request_id | 搜索被拒绝 |
| mcp.search.quota_checked | MCP | user_id、quota_limit、quota_used、quota_remaining、calendar_day | MCP quota 检查 |
| mcp.search.quota_exceeded | MCP | user_id、quota_limit、quota_used、request_id | 第 11 次拒绝 |
| trace.submitted | Trace | trace_id、actor_id、source_tool、schema_version | Trace 提交 |
| trace.redacted | Trace | trace_id、redaction_summary、policy_version | 脱敏完成 |
| trace.rejected | Trace | trace_id、error_code、reason_code | Trace 被拒绝 |
| review.created | Review | review_id、target_id、risk_level、queue | 进入审核 |
| review.decided | Review | review_id、reviewer_id、decision、reason_code | 审核决策 |
| content.published | Review | content_id、source_trace_id、visibility_scope | 发布 |
| content.revoked | Review | content_id、actor_id、reason_code | 撤回 |
| content.quarantined | Review | content_id、risk_level、reason_code | 污染隔离 |
| permission.denied | Cross | subject_id、action、object_id、policy_code | 权限拒绝 |
| evidence.attached | Cross | evidence_id、target_id、evidence_type | 证据登记 |

## 15. 证据包要求

每个 S1 验收项至少要能对应一种证据。高风险项必须有多种证据。

| 证据类型 | 最小要求 | 适用链路 | 是否必需 |
|---|---|---|---|
| API JSON | 请求、响应、状态码、request_id | Search、Trace、Review | 是 |
| MCP JSON | tool input、tool output、error envelope | MCP | 是 |
| 审计日志 | actor、object、decision、reason、trace | 全链路 | 是 |
| 页面截图 | 入口、详情、拒绝、空态、审核队列 | Web / Review | 是 |
| CI 报告 | contract、E2E、permission、audit、regression | 发布 Gate | 是 |
| Fixture | 账号、空间、权限、quota、内容状态 | 权限 / quota | 是 |
| 签收记录 | 产品、后端、前端、QA、安全、运维 | 发布 | 是 |
| 回滚记录 | 撤回、隔离、索引回滚、缓存刷新 | Review / Search | 高风险必需 |

无证据的功能点只能标为“规格已写”，不能标为“闭环”。

## 16. S1 Excel 后续展开规划

当前 Excel 已到 50207 行，但 S1 真正要写深，下一轮不应该继续均摊 S2-S4，而应该按下面的 S1 专项表继续推进。

| 计划工作表 | 目标行数 | 用途 | 优先级 |
|---|---:|---|---|
| S1搜索系统生产级功能清单 | 400-600 | 搜索 20 个功能点继续拆页面、API、权限、数据、状态 | P0 |
| S1搜索系统验收与反向测试 | 800-1200 | 未登录、登录、MCP、私有隔离、排序、分页、审计 | P0 |
| S1 MCP接入协议详表 | 600-900 | tool schema、token、scope、quota、错误、回退 | P0 |
| S1 Trace Package字段与schema | 800-1200 | 字段、枚举、必填、脱敏、幂等、证据、授权 | P0 |
| S1审核发布状态机与队列 | 700-1000 | 审核、拒绝、补充、撤回、隔离、申诉、官方审核 | P0 |
| S1权限累加与ABAC矩阵 | 800-1200 | 未登录、普通、团队、企业、审核者、Maintainer、管理员 | P0 |
| S1错误码与审计事件字典 | 500-800 | 错误码、HTTP、repair_hint、审计事件字段 | P0 |
| S1证据与CI Gate矩阵 | 700-1000 | API、MCP、截图、审计、fixture、CI、签收 | P0 |
| S1缺陷回流和发布准入 | 400-700 | P0/P1 阻断、复验、回滚、风险签收 | P1 |
| S1统计与闭环状态 | 80-160 | 每个大类行数、闭环、完整、齐全状态 | P1 |

下一轮 S1 Excel 专项建议目标：约 5800-8760 行。  
S1 最终生产级规格建议目标：约 15200-24000 行。

## 17. 功能状态定义

| 状态 | 含义 | 能否签收 |
|---|---|---|
| 待展开 | 只有方向，缺末级功能、验收、证据 | 否 |
| 规格补强中 | 已有文档和部分 Excel 行，仍缺字段、反向测试、证据 | 否 |
| 文档层闭环 | 文档、Excel、验收、风险、证据路径已写齐 | 只能签文档，不签实现 |
| 样例闭环 | 有样例代码或样例测试证明一个窄路径 | 不能当生产签收 |
| 生产闭环 | 真实代码、真实数据、真实测试、真实 CI、真实证据、签收齐全 | 可以签收 |
| 回归闭环 | 生产闭环后持续纳入回归和发布 Gate | 可以持续发布 |

本文件中大多数 S1 功能点仍是“规格补强中”或“待展开”。这不是失败，而是为了避免把样例闭环误写成生产闭环。

## 18. 发布准入 Gate

S1 任何功能进入“生产闭环”前，必须同时满足以下 Gate。

| Gate | 要求 | 失败处理 |
|---|---|---|
| G-S1-001 文档 Gate | 来源、功能、字段、状态、权限、错误码、审计、证据写清 | 不进入开发签收 |
| G-S1-002 API / MCP Gate | request / response / error envelope 可断言 | 阻断发布 |
| G-S1-003 权限 Gate | 累加式权限、ABAC、私有隔离、scope、quota 全通过 | P0 阻断 |
| G-S1-004 Trace Gate | schema、幂等、脱敏、证据、授权通过 | P0 阻断 |
| G-S1-005 审核 Gate | 拒绝、补充、批准、撤回、隔离、申诉路径可跑 | P0/P1 视风险阻断 |
| G-S1-006 审计 Gate | 关键事件有 actor、object、decision、reason、trace | 阻断签收 |
| G-S1-007 证据 Gate | API JSON、MCP JSON、截图、日志、CI 报告齐全 | 阻断签收 |
| G-S1-008 回归 Gate | 搜索、MCP、Trace、Review 核心回归通过 | 阻断发布 |
| G-S1-009 安全 Gate | 敏感信息、跨租户、越权、污染隔离验证通过 | P0 阻断 |
| G-S1-010 签收 Gate | 产品、后端、前端、QA、安全、运维签收 | 不准发布 |

## 19. 当前风险清单

| 风险编号 | 风险 | 严重度 | 当前状态 | 文档处理 |
|---|---|---|---|---|
| R-S1-001 | S1 资源被 S2-S4 稀释 | 高 | 已识别 | 本文固定 S1 优先 |
| R-S1-002 | 把 MVP 做成低配搜索页 | 高 | 已识别 | 本文固定四主链 |
| R-S1-003 | 累加式权限被角色替换 | 高 | 已识别 | 本文固定能力累加公式 |
| R-S1-004 | MCP quota 被高级身份绕过 | 高 | 已识别 | 本文固定默认不绕过 |
| R-S1-005 | Trace 被写成普通文本摘要 | 高 | 已识别 | 本文固定 schema 和证据 |
| R-S1-006 | 审核流程太薄，污染公开记忆 | 高 | 已识别 | 本文固定审核、撤回、隔离 |
| R-S1-007 | 样例测试被误当生产闭环 | 中 | 已识别 | 本文区分样例闭环和生产闭环 |
| R-S1-008 | 当前 18 条测试有 1 个失败 | 中 | 已登记 | 本文只登记，代码阶段处理 |
| R-S1-009 | Excel 行数过多但不可维护 | 中 | 已识别 | 本文采用主控 + 末级 + 模板引用 |
| R-S1-010 | 无证据签收 | 高 | 已识别 | 本文固定证据 Gate |

## 20. 下一步文档工作

下一步仍然只写文档时，建议按以下顺序推进：

1. 先写 `S1搜索系统生产级功能清单`，把搜索 20 个功能点拆到页面、API、数据、权限、状态、错误码、审计、证据。
2. 再写 `S1 MCP接入协议详表`，把 `search_before_act`、token、scope、quota、错误 envelope 和回退路径写到可测。
3. 再写 `S1 Trace Package字段与schema`，把 Trace 的字段、枚举、幂等、脱敏、授权、证据写完整。
4. 再写 `S1审核发布状态机与队列`，把审核、拒绝、补充、撤回、隔离、申诉和审计导出写完整。
5. 最后回填 Excel 专项表和 `S1-S4功能开发清单闭环状态.md` 的闭环状态。

当前本文只能证明 S1 完整文档母表已经建立，不能证明 S1 生产闭环已经完成。
