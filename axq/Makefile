.PHONY: help axq-website-up axq-website-down axq-website-logs axq-website-ps infra-up infra-down infra-restart infra-logs infra-ps infra-health infra-clean

help:
	@echo "Axiqra Project"
	@echo ""
	@echo "官网:"
	@echo "  make axq-website-up        启动官网（nginx + waitlist API）"
	@echo "  make axq-website-down     停止官网"
	@echo "  make axq-website-logs     实时查看官网日志"
	@echo "  make axq-website-ps       查看官网容器状态"
	@echo ""
	@echo "基础设施:"
	@echo "  make infra-up         启动中间件"
	@echo "  make infra-down       停止中间件"
	@echo "  make infra-restart    重启中间件"
	@echo "  make infra-logs       实时查看中间件日志"
	@echo "  make infra-ps         查看容器状态"
	@echo "  make infra-health     健康检查"
	@echo "  make infra-clean      清理数据卷"

axq-website-up:
	cd axq-website && docker compose up -d
	@echo "官网已启动: http://127.0.0.1:8080"

axq-website-down:
	cd axq-website && docker compose down

axq-website-restart:
	cd axq-website && docker compose restart

axq-website-logs:
	cd axq-website && docker compose logs -f

axq-website-ps:
	cd axq-website && docker compose ps

infra-up:
	cd axq-infra && $(MAKE) up

infra-down:
	cd axq-infra && $(MAKE) down

infra-restart:
	cd axq-infra && $(MAKE) restart

infra-logs:
	cd axq-infra && $(MAKE) logs

infra-ps:
	cd axq-infra && $(MAKE) ps

infra-health:
	cd axq-infra && $(MAKE) health

infra-clean:
	cd axq-infra && $(MAKE) clean
