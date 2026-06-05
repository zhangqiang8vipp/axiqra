.PHONY: help up down restart logs ps clean health

SHELL := /bin/bash

# ===================== 帮助 =====================
help:
	@echo "axiom-infra: Axiqra 中间件管理"
	@echo ""
	@echo "  make up      启动所有中间件（CockroachDB/PostgreSQL/Redis/MinIO）"
	@echo "  make down    停止所有中间件"
	@echo "  make restart 重启所有中间件"
	@echo "  make logs    实时查看所有日志"
	@echo "  make ps      查看所有容器状态"
	@echo "  make clean   清理所有数据卷（数据将丢失）"
	@echo "  make health  检查所有服务健康状态"

# ===================== 启动/停止 =====================
up:
	@echo "启动 axiom-infra 中间件..."
	@cp .env.example .env 2>/dev/null || true
	docker compose up -d
	@echo ""
	@echo "等待 healthcheck..."
	@timeout 120 sh -c 'while ! docker compose ps --format json 2>/dev/null | python3 -c "import json,sys; svcs=json.load(sys.stdin) if isinstance(json.load(sys.stdin),list) else [json.load(sys.stdin)]; print(\"\\n\".join(f\"  {s[\"Service\"]:25} {s[\"State\"]}\" for s in svcs if s[\"Service\"] not in [\"axiqra_core\"]))" 2>/dev/null; [ "$$$$(docker compose ps axiqra_cockroachdb_primary --format json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)[\"Health\"])" 2>/dev/null) = "healthy" ]; do sleep 5; done' || echo "healthcheck 超时，请手动检查"

down:
	docker compose down

restart:
	docker compose restart

# ===================== 日志 =====================
logs:
	docker compose logs -f

logs-crdb:
	docker compose logs -f axiqra_cockroachdb_primary

logs-redis:
	docker compose logs -f axiqra_redis_cache

logs-pg:
	docker compose logs -f axiqra_postgres_audit

logs-minio:
	docker compose logs -f axiqra_minio_storage

# ===================== 状态 =====================
ps:
	docker compose ps

# ===================== 健康检查 =====================
health:
	@echo "检查 axiom-infra 服务健康状态..."
	@docker compose ps --format json 2>/dev/null | python3 -c "import json,sys; svcs=json.load(sys.stdin) if isinstance(json.load(sys.stdin),list) else [json.load(sys.stdin)]" 2>/dev/null || docker compose ps

# ===================== 清理 =====================
clean:
	docker compose down -v
	@echo "已清理所有数据卷，数据已删除"
