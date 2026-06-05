# Axiom Project

> Axiqra S1 MVP 开发项目仓库。

## 目录结构

```
axiom-project/
├── axiom-code/          # 后端代码（Maven 多模块，Spring Boot）
├── axiom-frontend/      # 前端代码（Vue 3 + Naive UI）
├── axiom-infra/         # Docker 基础设施（中间件编排）
├── axiom-docs/          # 开发文档（架构设计、API、编码规范、测试指南）
├── src/                 # S1 Core 原型实现（Node.js，用于逻辑验证）
├── tests/               # S1 Core 测试套件
└── fixtures/            # 测试 Fixture 数据
```

## 快速启动

### 1. 启动中间件

```bash
cd axiom-infra
cp .env.example .env
# 编辑 .env 填入真实密钥
docker compose up -d
```

### 2. 启动后端

```bash
cd axiom-code
mvn spring-boot:run
```

### 3. 启动前端

```bash
cd axiom-frontend
npm install
npm run dev
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Spring Boot 3.4.x + JDK 17+ |
| ORM | MyBatis-Flex 1.9+ |
| 数据库 | CockroachDB 24.x |
| 审计库 | PostgreSQL 16+ |
| 缓存 | Redis 7.x |
| 对象存储 | MinIO |
| 认证 | Sa-Token 1.42.x |
| 前端 | Vue 3 + TypeScript + Naive UI |

## 开发规范

- 严格遵循阿里巴巴 Java 开发手册（嵩山版 1.7.x）
- 所有算法必须走策略接口，禁硬编码
- 详见 `axiom-docs/` 下的开发文档

## 相关文档

产品需求文档请参考 [axiqra/docs/](../docs/)
