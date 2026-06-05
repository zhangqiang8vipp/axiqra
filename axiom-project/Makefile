.PHONY: help infra-up infra-down infra-restart infra-logs infra-logs-error infra-logs-info infra-logs-trace test test-unit test-integration clean

SHELL := /bin/bash

# ===================== 帮助 =====================
help:
	@echo "Axiom Project Makefile"
	@echo ""
	@echo "中间件（axiom-infra）:"
	@echo "  make infra-up          启动所有中间件（CockroachDB/PostgreSQL/Redis/MinIO）"
	@echo "  make infra-down        停止所有中间件"
	@echo "  make infra-restart     重启中间件"
	@echo "  make infra-logs        实时查看所有中间件日志"
	@echo "  make infra-logs-error  实时查看 error 日志"
	@echo "  make infra-logs-info   实时查看 info 日志"
	@echo ""
	@echo "测试:"
	@echo "  make test              运行全部测试"
	@echo "  make test-unit         运行单元测试"
	@echo "  make test-integration   运行集成测试"
	@echo ""
	@echo "清理:"
	@echo "  make clean             清理构建产物"

# ===================== axiom-infra 中间件 =====================
infra-up:
	cd axiom-infra && docker compose up -d
	@echo "等待所有服务 healthcheck 通过..."
	@cd axiom-infra && docker compose ps

infra-down:
	cd axiom-infra && docker compose down

infra-restart:
	cd axiom-infra && docker compose restart

infra-logs:
	cd axiom-infra && docker compose logs -f

infra-logs-error:
	cd axiom-infra && docker compose logs -f axiqra_core | grep ERROR

infra-logs-info:
	cd axiom-infra && docker compose logs -f | grep -E "(INFO| WARN|ERROR)"

infra-logs-trace:
	@echo "请设置 TRACE_ID 环境变量，例如: TRACE_ID=abc123 make infra-logs-trace"
	cd axiom-infra && docker compose exec axiqra_core grep -r $(TRACE_ID) /var/log/axiqra/

# ===================== 测试 =====================
test:
	node --test tests/**/*.test.mjs

test-unit:
	node --test tests/s1-core/*.test.mjs

test-integration:
	node --test tests/api/*.test.mjs tests/e2e/*.test.mjs

# ===================== 清理 =====================
clean:
	cd axiom-infra && docker compose down -v
	@echo "已清理 axiom-infra 数据卷（数据将被删除）"
