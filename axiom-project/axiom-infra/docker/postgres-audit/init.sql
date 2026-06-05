-- axiom-project/axiom-infra/docker/postgres-audit/init.sql
-- PostgreSQL 审计库建表脚本（append-only）
-- 独立部署，仅存储 append-only 审计日志

-- 创建审计日志表（禁止 UPDATE 和 DELETE）
CREATE TABLE IF NOT EXISTS axq_audit_log (
    id              BIGSERIAL        PRIMARY KEY,
    gmt_create      TIMESTAMPTZ      NOT NULL DEFAULT NOW() COMMENT '发生时间',
    event_name      VARCHAR(100)     NOT NULL COMMENT '事件名称',
    actor_id        BIGINT           NULL COMMENT '操作者用户ID',
    actor_type      VARCHAR(30)      NULL COMMENT '操作者类型：user/system/ai_tool',
    object_type     VARCHAR(50)      NULL COMMENT '对象类型',
    object_id       BIGINT           NULL COMMENT '对象ID',
    action_type     VARCHAR(50)      NOT NULL COMMENT '动作类型：create/read/update/delete/publish/revoke',
    decision        VARCHAR(50)      NULL COMMENT '决策结果：allow/deny/quota_exceeded',
    reason_code     VARCHAR(50)      NULL COMMENT '原因码',
    payload         JSONB            NULL COMMENT '附加数据',
    ip_address      VARCHAR(64)      NULL COMMENT 'IP地址',
    user_agent      VARCHAR(500)    NULL COMMENT 'User-Agent',
    request_id      VARCHAR(64)     NULL COMMENT '请求追踪ID（与日志 traceId 一致）',
    tenant_id       BIGINT          NULL COMMENT '租户ID'
);

-- 禁止 UPDATE 和 DELETE（PostgreSQL 行级安全策略强制）
ALTER TABLE axq_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_no_update ON axq_audit_log FOR UPDATE USING (false);
CREATE POLICY audit_no_delete ON axq_audit_log FOR DELETE USING (false);

-- 索引
CREATE INDEX IF NOT EXISTS idx_audit_event_name ON axq_audit_log (event_name);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON axq_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_object_id ON axq_audit_log (object_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON axq_audit_log (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_request_id ON axq_audit_log (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_gmt_create ON axq_audit_log (gmt_create);

COMMENT ON TABLE axq_audit_log IS '审计日志表（append-only，禁止更新和删除，通过 PostgreSQL RLS 强制）';
