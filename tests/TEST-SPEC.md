# Axiqra S1 Core 测试规范

> 本规范定义 Axiqra 项目测试的命名、结构、覆盖要求和执行标准。所有测试必须遵循本文档。

---

## 1. 技术栈

- **测试框架**：Node.js 内置 `node:test`（无需额外依赖）
- **断言库**：`node:assert/strict`
- **运行命令**：`node --test tests/**/*.test.mjs`
- **ESM 模块**：所有文件使用 `.mjs` 扩展名

---

## 2. 目录结构

```
tests/
├── s1-core/                    # 核心服务单元测试（直接测试 S1Core 及各 Service）
│   ├── helpers.mjs             # 共享测试数据构造器
│   ├── s1_core.test.mjs        # S1Core 顶层集成测试（闭环测试）
│   ├── s1_service_boundaries.test.mjs  # 服务边界与路由测试
│   ├── policy.test.mjs         # Policy 鉴权测试
│   ├── search_service.test.mjs # 搜索服务测试
│   ├── mcp_service.test.mjs    # MCP 服务配额测试
│   ├── trace_service.test.mjs  # Trace 提交/幂等测试
│   ├── review_service.test.mjs # Review 审核测试
│   ├── audit.test.mjs          # 审计日志测试
│   ├── redaction.test.mjs      # 数据脱敏测试
│   └── errors.test.mjs         # 错误定义与处理测试
├── api/                        # API 适配层测试
│   └── api_adapter.test.mjs     # HTTP 路由、请求/响应封套
├── mcp/                        # MCP 适配层测试
│   └── mcp_adapter.test.mjs    # MCP 工具调用、协议封套
├── authz/                      # 鉴权与权限矩阵测试
│   └── permission_matrix.test.mjs  # 多主体权限覆盖表
├── store/                      # 存储层测试
│   ├── s1_store.test.mjs       # 内存存储基础测试
│   └── json_store.test.mjs     # JSON 持久化测试
├── e2e/                        # 端到端场景测试
│   └── closed_loop.test.mjs    # 完整用户旅程
└── fixtures/                   # Fixture 数据（JSON 文件，可被测试读取）
    └── v2.0/
        ├── mcp/
        ├── accounts/
        └── search/
```

---

## 3. 文件命名规范

| 类型 | 命名模式 | 示例 |
|------|---------|------|
| 测试文件 | `{module}.test.mjs` | `policy.test.mjs` |
| Fixture JSON | `{scenario}_response.json` | `base_1_response.json` |
| 共享工具 | `helpers.mjs` | `helpers.mjs` |
| 帮助函数 | `make{Entity}` | `makeTracePackage()` |

---

## 4. 测试用例命名规范

### 格式

```
test('{场景} → {期望行为}', () => { ... })
test('{组件} {条件} {结果}', () => { ... })
```

### 命名规则

1. **必须**以动词开头（`rejects`, `allows`, `returns`, `throws`, `emits`）
2. **必须**包含被测组件或方法名
3. **必须**描述前置条件和期望结果
4. **禁止**使用模糊命名如 `test1`、`test_basic`

### 好/坏对照

| 不好 | 好 |
|------|-----|
| `test('test1')` | `test('rejects unauthenticated MCP search with 401')` |
| `test('basic test')` | `test('allows authenticated user with search:read scope')` |
| `test('quota')` | `test('denies search at 11th call with QUOTA_LIMITED')` |
| `test('search works')` | `test('returns only public desensitized results for anonymous')` |

---

## 5. Fixture 数据规范

### 来源

Fixture JSON 文件存放于 `fixtures/v2.0/` 和 `docs/evidence/v2.0/`，测试中通过 `readJson()` 辅助函数加载。

### 命名

```
{service}_{scenario}_{index}.json
```

示例：
- `mcp/base_1_response.json` — 第 1 次配额调用
- `mcp/quota_10_response.json` — 第 10 次配额调用
- `audit/mcp_quota_exceeded.json` — 配额超限事件

### 用途分类

| 路径 | 用途 |
|------|------|
| `fixtures/v2.0/` | 测试输入数据（主体定义、策略配置等）|
| `docs/evidence/v2.0/` | 期望输出数据（API 响应、审计事件等）|

---

## 6. 断言规范

### 必须使用的断言方法

| 方法 | 适用场景 |
|------|---------|
| `assert.equal(a, b)` | 原始值相等（字符串、数字、布尔）|
| `assert.deepEqual(a, b)` | 对象/数组结构相等 |
| `assert.ok(value)` | 值真值（对象非 null、非零）|
| `assert.throws(fn, /ERROR_CODE/)` | 函数抛出指定错误 |
| `assert.rejects(async fn)` | 异步函数拒绝 |
| `assert.fail('message')` | 主动失败 |

### 禁止

- 禁止使用 `==` 代替 `assert.equal`
- 禁止使用 `!=` 代替否定断言
- 禁止使用 `if (!x) assert.fail()` 而应使用 `assert.ok(x)`

### 响应封套断言顺序

```javascript
test('returns correct envelope shape', () => {
  assert.equal(response.schema_version, 's1.api.v1');  // schema first
  assert.equal(response.http_status, 200);              // status second
  assert.equal(response.request_id, 'req_1');          // request id third
  // ... then business fields
  assert.equal(response.quota_remaining, 9);
});
```

---

## 7. 隔离与清理

### 每个测试必须独立

- **不依赖**其他测试的状态
- **不共享**可变全局变量
- **不修改**共享的 store 实例

### Fixture 数据只读

Fixture JSON 文件为只读数据源，不得在测试中修改。如需变体，通过 `overrides` 参数传入：

```javascript
const trace = makeTracePackage({
  id: 'my_trace',
  writeback_meta: { source_tool: 'cursor', idempotency_key: 'idem_custom' },
});
```

### 临时文件清理

`JsonS1Store` 测试使用 `os.tmpdir()` + `fs.mkdtemp()`，测试结束 Node.js 自动清理。

---

## 8. 测试数据构造器（helpers.mjs）

所有测试数据通过 `helpers.mjs` 中的工厂函数构造。禁止在测试体内硬编码 trace payload。

### 必须实现的构造器

| 构造器 | 用途 |
|--------|------|
| `makeTracePackage(overrides)` | 构造合规的 Engineering Trace Package |
| `makeSubject(key, overrides)` | 构造 Subject 主体配置 |
| `makeSearchResult(overrides)` | 构造搜索结果条目 |

---

## 9. 覆盖要求

### 必须覆盖的场景

#### 9.1 正常路径（Happy Path）
- [ ] 认证用户搜索返回结果
- [ ] 提交合规 trace 成功
- [ ] 审核通过后内容可被公开搜索到
- [ ] MCP 调用返回正确配额

#### 9.2 边界条件（Boundary）
- [ ] 配额用尽（第 11 次调用返回 429）
- [ ] 空查询搜索返回空结果
- [ ] trace schema 缺少必填字段返回 422
- [ ] 幂等 key 重复提交返回 `idempotent_replay: true`

#### 9.3 权限与隔离（Authorization & Isolation）
- [ ] 匿名用户不能调用 MCP（401）
- [ ] 匿名用户搜索不到私有内容（0 结果）
- [ ] 无 `search:read` scope 被拒绝（403）
- [ ] 无 `review:write` 不能审核（403）
- [ ] `BASE_USER` 不能审核自己提交的 trace

#### 9.4 错误与异常（Error Handling）
- [ ] 未知路由返回 404
- [ ] trace 缺失必填字段抛出 `TRACE_SCHEMA_INVALID`
- [ ] 审核不存在的 trace 抛出 `TRACE_NOT_FOUND`

#### 9.5 数据脱敏（Redaction）
- [ ] trace 中包含 `api_key=xxx` 被脱敏为 `api_key=[REDACTED]`
- [ ] trace 中包含 `password:xxx` 被脱敏为 `password:[REDACTED]`
- [ ] 数组中嵌套对象也正确脱敏

#### 9.6 持久化（Persistence）
- [ ] JsonS1Store 重启后数据恢复
- [ ] 配额计数器持久化
- [ ] trace 幂等索引持久化

---

## 10. 测试用例模板

### 正常路径

```javascript
test('{组件} {操作} → {期望结果}', () => {
  // Arrange: 构造输入
  const core = new S1Core();
  const trace = makeTracePackage({ id: 'my_trace' });

  // Act: 执行操作
  const result = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace,
  });

  // Assert: 验证结果
  assert.equal(result.id, 'my_trace');
  assert.equal(result.status, 'submitted');
  assert.equal(result.public_candidate, true);
});
```

### 异常路径

```javascript
test('{组件} {条件} → {抛出错误}', () => {
  const core = new S1Core();

  assert.throws(
    () => core.reviewTrace({
      subjectKey: 'BASE_USER',  // BASE_USER 没有 review:write
      traceId: 'trace_1',
      decision: 'approve',
    }),
    /REVIEW_WRITE_DENIED/,
  );
});
```

### 配额边界

```javascript
test('{组件} {条件} → {配额耗尽行为}', () => {
  const core = new S1Core({ quotaLimit: 3 });

  // 前 3 次成功
  for (let i = 0; i < 3; i++) {
    const r = core.searchBeforeAct({
      subjectKey: 'BASE_USER',
      query: 'test',
      now: new Date('2026-06-05T10:00:00Z'),
    });
    assert.equal(r.http_status, 200);
    assert.equal(r.quota_remaining, 2 - i);
  }

  // 第 4 次失败
  const denied = core.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'test',
    now: new Date('2026-06-05T10:01:00Z'),
  });
  assert.equal(denied.http_status, 429);
  assert.equal(denied.error_code, 'QUOTA_LIMITED');
  assert.equal(denied.no_recall_performed, true);
  assert.deepEqual(denied.results, []);
});
```

---

## 11. CI 执行规范

### 执行命令

```bash
node --test tests/**/*.test.mjs
```

### CI 失败策略

| 测试类型 | CI 行为 |
|---------|--------|
| `tests/s1-core/` | **必须通过** — Block Merge |
| `tests/api/` | **必须通过** — Block Merge |
| `tests/mcp/` | **必须通过** — Block Merge |
| `tests/authz/` | **必须通过** — Block Merge |
| `tests/store/` | **必须通过** — Block Merge |
| `tests/e2e/` | **必须通过** — Block Merge |
| `tests/audit/` | **必须通过**（fixture 验证）|
| `tests/fixtures/` | **建议通过**（文档同步检查）|

### sample 测试处理

`*.sample.test.mjs` 文件为**示例/模板测试**，在核心测试完善后：
- 如果对应核心测试已覆盖相同场景 → 删除 sample 文件
- 如果 fixture 已验证 → 保留作为文档同步验证

---

## 12. 审查清单

新增测试用例时自检：

- [ ] 命名是否以动词开头、包含组件名和期望结果？
- [ ] 是否包含 Arrange / Act / Assert 三段式？
- [ ] 是否覆盖了边界条件（空值、极值、第一个/最后一个）？
- [ ] 断言消息是否清晰（`assert.equal(actual, expected)` 而非 `assert.ok()`）？
- [ ] 是否在 `helpers.mjs` 中复用测试数据构造器？
- [ ] 是否有对应的 CI 断言验证？
- [ ] 是否在本文档的覆盖表中打勾？

---

## 13. 相关文件索引

| 文件 | 说明 |
|------|------|
| `src/s1-core/index.mjs` | S1Core 主类，测试的核心入口 |
| `src/s1-core/api-adapter.mjs` | API 路由，被 `api_adapter.test.mjs` 测试 |
| `src/s1-core/mcp-adapter.mjs` | MCP 协议封套，被 `mcp_adapter.test.mjs` 测试 |
| `src/s1-core/search-service.mjs` | 搜索逻辑，被 `search_service.test.mjs` 测试 |
| `src/s1-core/mcp-service.mjs` | MCP 配额管理，被 `mcp_service.test.mjs` 测试 |
| `src/s1-core/trace-service.mjs` | Trace 提交与幂等，被 `trace_service.test.mjs` 测试 |
| `src/s1-core/review-service.mjs` | Review 审核与发布，被 `review_service.test.mjs` 测试 |
| `src/s1-core/policy.mjs` | 鉴权策略，被 `policy.test.mjs` 测试 |
| `src/s1-core/store.mjs` | 内存存储，被 `s1_store.test.mjs` 测试 |
| `src/s1-core/json-store.mjs` | JSON 持久化，被 `json_store.test.mjs` 测试 |
| `src/s1-core/audit.mjs` | 审计日志，被 `audit.test.mjs` 测试 |
| `src/s1-core/redaction.mjs` | 数据脱敏，被 `redaction.test.mjs` 测试 |
| `src/s1-core/errors.mjs` | 错误定义，被 `errors.test.mjs` 测试 |
| `src/s1-core/trace-schema.mjs` | Schema 校验，被 `trace_service.test.mjs` 覆盖 |
