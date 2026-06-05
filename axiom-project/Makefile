.PHONY: help website-up website-down website-logs website-ps infra-up infra-down infra-restart infra-logs infra-ps infra-health infra-clean all-up all-down all-logs

SHELL := /bin/bash

# ===================== 帮助 =====================
help:
	@echo "Axiom Project Makefile"
	@echo ""
	@echo "官网（website）:"
	@echo "  make website-up        启动官网（nginx + waitlist API）"
	@echo "  make website-down      停止官网"
	@echo "  make website-logs      实时查看官网日志"
	@echo "  make website-ps        查看官网容器状态"
	@echo ""
	@echo "基础设施（axiom-infra）:"
	@echo "  make infra-up         启动所有中间件（CockroachDB/PostgreSQL/Redis/MinIO）"
	@echo "  make infra-down       停止所有中间件"
	@echo "  make infra-restart    重启所有中间件"
	@echo "  make infra-logs       实时查看中间件日志"
	@echo "  make infra-ps         查看中间件容器状态"
	@echo "  make infra-health     检查中间件健康状态"
	@echo "  make infra-clean      清理中间件数据卷（数据将丢失）"
	@echo ""
	@echo "全量:"
	@echo "  make all-up           启动所有服务（基础设施 + 官网）"
	@echo "  make all-down         停止所有服务"
	@echo "  make all-logs         实时查看所有日志"

# ===================== 官网（website） =====================
website-up:
	cd website && docker compose up -d
	@echo "官网已启动: http://127.0.0.1:8080"

website-down:
	cd website && docker compose down

website-restart:
	cd website && docker compose restart

website-logs:
	cd website && docker compose logs -f

website-ps:
	cd website && docker compose ps

# ===================== 基础设施（axiom-infra） =====================
infra-up:
	cd axiom-infra && make up

infra-down:
	cd axiom-infra && make down

infra-restart:
	cd axiom-infra && make restart

infra-logs:
	cd axiom-infra && make logs

infra-ps:
	cd axiom-infra && make ps

infra-health:
	cd axiom-infra && make health

infra-clean:
	cd axiom-infra && make clean

# ===================== 全量 =====================
all-up:
	$(MAKE) infra-up
	$(MAKE) website-up

all-down:
	$(MAKE) website-down
	$(MAKE) infra-down

all-logs:
	cd website && docker compose logs -f &
	cd axiom-infra && docker compose logs -f &
	wait
