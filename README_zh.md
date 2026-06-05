# Axiqra

面向 AI 编程工具和开源维护者的 Agent-ready engineering memory。

官网: https://www.axiqra.com/

## 概述

Axiqra 是一个早期基础设施项目，目标是把真实工程任务沉淀为可复用、可审核、可被 AI Agent 调用的工程记忆。

它希望让 Codex、Cursor、Claude Code、Gemini CLI、企业自研 Agent 等 AI 编程工具，在动手修改代码之前先检索已有工程方案，在任务完成之后再回写结构化工程轨迹。

一句话：

```text
不要让 AI 编程 Agent 每次都从零推理已经被真实验证过的工程路径。
```

## 为什么需要 Axiqra

开源维护者和工程团队经常反复处理同类问题：

- 重复 issue 和 bug 模式
- PR review 中反复出现的判断
- 迁移、发布、回滚和兼容性问题
- 项目特有的实现约定
- 已经失败、但后来又被重复尝试的方案
- 只存在于评论、聊天、本地笔记或维护者记忆里的排障路径

Axiqra 希望把这些知识沉淀为结构化的 Case、Solution、证据、适用边界、回滚说明和 worked/failed 反馈。

## 开源范围

Axiqra 目前不是一个成熟、广泛使用的传统 OSS 库。它仍处于产品、协议和生态组件设计阶段。

这个仓库首先开放面向生态的部分：

- Case、Public Case、Solution、Invocation、Feedback 等概念
- Engineering Trace Package 格式
- MCP/API/CLI 接入设计
- 面向 Codex 的维护者工作流
- 治理、审核、脱敏和可信来源规则
- 面向贡献者和审核者的公开文档

更完整说明见 [OPEN_SOURCE_SCOPE.md](OPEN_SOURCE_SCOPE_zh.md)。

## 仓库结构

```text
axiqra-project/
  .github/          GitHub 工作流和自动化脚本
  axiqra-website/   官网和候补名单 API
  axiqra-infra/     本地开发中间件（CockroachDB、PostgreSQL、Redis、MinIO）
logo/               Axiqra logo 资产
```

## 当前状态

Axiqra 处于早期公开设计阶段。

当前仓库重点包括：

- 产品和协议规格
- 对象模型和生命周期设计
- 维护者和社区治理
- AI 工具接入流程
- 官网与候补名单

下一步计划推进开放协议组件、MCP 集成、CLI 工作流和参考样例。

## Axiqra 与 Codex

Axiqra 设计上适合接入 Codex 风格的工程流程：

1. 修改代码前，先检索历史 Solution 和 Public Case。
2. 根据证据、边界、风险说明和回滚路径判断方案是否适用。
3. 在目标仓库中执行工程任务。
4. 任务完成后回写 Engineering Trace Package，记录 worked、failed 和可复用部分。
5. 由维护者审核、改进并发布可复用工程记忆。

这可以服务 issue triage、PR review、release notes、迁移、排障、新贡献者 onboarding 和仓库自动化等 OSS 场景。

## 贡献

欢迎贡献：

- 开放 schema 和术语改进
- MCP/API/CLI 工作流设计评审
- 开源维护者工作流样例
- 脱敏、安全和授权规则改进
- 文档修订和翻译
- 不清楚概念或缺失 OSS 场景的 issue

请先阅读 [CONTRIBUTING.md](CONTRIBUTING_zh.md)。

## 安全

Axiqra 处理的工程轨迹可能意外包含代码、日志、密钥、私有路径、客户名或内部基础设施信息。

报告敏感问题前请阅读 [SECURITY.md](SECURITY_zh.md)。

## 许可证

本仓库采用 Apache License 2.0，见 [LICENSE](LICENSE)。
