.PHONY: help website-up website-down website-logs website-ps infra-up infra-down infra-restart infra-logs infra-ps infra-health infra-clean

help:
	@echo "Axiom Project"
	@echo ""
	@echo "官网:"
	@echo "  make website-up        启动官网（nginx + waitlist API）"
	@echo "  make website-down     停止官网"
	@echo "  make website-logs     实时查看官网日志"
	@echo "  make website-ps       查看官网容器状态"
	@echo ""
	@echo "基础设施:"
	@echo "  make infra-up         启动中间件"
	@echo "  make infra-down       停止中间件"
	@echo "  make infra-restart    重启中间件"
	@echo "  make infra-logs       实时查看中间件日志"
	@echo "  make infra-ps         查看容器状态"
	@echo "  make infra-health     健康检查"
	@echo "  make infra-clean      清理数据卷"

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

infra-up:
	cd axiom-infra && $(MAKE) up

infra-down:
	cd axiom-infra && $(MAKE) down

infra-restart:
	cd axiom-infra && $(MAKE) restart

infra-logs:
	cd axiom-infra && $(MAKE) logs

infra-ps:
	cd axiom-infra && $(MAKE) ps

infra-health:
	cd axiom-infra && $(MAKE) health

infra-clean:
	cd axiom-infra && $(MAKE) clean
