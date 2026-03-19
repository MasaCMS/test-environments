.PHONY: help start stop down clean \
	mysql mariadb postgres mssql \
	lucee-mysql lucee-mariadb lucee-postgres lucee-mssql \
	boxlang-mysql boxlang-mariadb boxlang-postgres boxlang-mssql \
	adobe-mysql adobe-mariadb adobe-postgres adobe-mssql

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
CYAN := \033[0;36m
NC := \033[0m # No Color

# Default target - interactive menu
.DEFAULT_GOAL := start

help: ## Show this help message
	@echo "$(CYAN)MasaCMS Test Environment Manager$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@echo "  make start          - Interactive menu to select DB and CF engine"
	@echo "  make stop           - Stop all running containers"
	@echo "  make down           - Stop and remove all containers"
	@echo "  make clean          - Remove all containers and volumes"
	@echo ""
	@echo "$(GREEN)Database-only targets:$(NC)"
	@echo "  make mysql          - Start MySQL database only"
	@echo "  make mariadb        - Start MariaDB database only"
	@echo "  make postgres       - Start PostgreSQL database only"
	@echo "  make mssql          - Start MSSQL database only"
	@echo ""
	@echo "$(GREEN)Combined targets (DB + CF Engine):$(NC)"
	@echo "  make lucee-mysql    - Start MySQL + Lucee"
	@echo "  make lucee-mariadb  - Start MariaDB + Lucee"
	@echo "  make lucee-postgres - Start PostgreSQL + Lucee"
	@echo "  make lucee-mssql    - Start MSSQL + Lucee"
	@echo ""
	@echo "  make boxlang-mysql    - Start MySQL + BoxLang"
	@echo "  make boxlang-mariadb  - Start MariaDB + BoxLang"
	@echo "  make boxlang-postgres - Start PostgreSQL + BoxLang"
	@echo "  make boxlang-mssql    - Start MSSQL + BoxLang"
	@echo ""
	@echo "  make adobe-mysql    - Start MySQL + Adobe ColdFusion (default: cf23)"
	@echo "  make adobe-mariadb  - Start MariaDB + Adobe ColdFusion (default: cf23)"
	@echo "  make adobe-postgres - Start PostgreSQL + Adobe ColdFusion (default: cf23)"
	@echo "  make adobe-mssql    - Start MSSQL + Adobe ColdFusion (default: cf23)"
	@echo ""
	@echo "$(GREEN)Adobe ColdFusion version selection:$(NC)"
	@echo "  CF_VERSION=cf21     - ColdFusion 2021"
	@echo "  CF_VERSION=cf23     - ColdFusion 2023 (default)"
	@echo "  CF_VERSION=cf25     - ColdFusion 2025"
	@echo "  CF_VERSION=latest   - Latest version"
	@echo "  Example: make adobe-mysql CF_VERSION=cf25"

# Interactive start menu
start:
	@echo "$(CYAN)╔════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║  MasaCMS Test Environment Setup        ║$(NC)"
	@echo "$(CYAN)╔════════════════════════════════════════╗$(NC)"
	@echo ""
	@echo "$(GREEN)Select Database:$(NC)"
	@echo "  1) MySQL"
	@echo "  2) MariaDB"
	@echo "  3) PostgreSQL"
	@echo "  4) MSSQL"
	@echo ""
	@read -p "Enter database choice (1-4): " db_choice; \
	case $$db_choice in \
		1) DB="mysql" ;; \
		2) DB="mariadb" ;; \
		3) DB="postgres" ;; \
		4) DB="mssql" ;; \
		*) echo "$(RED)Invalid choice$(NC)"; exit 1 ;; \
	esac; \
	echo ""; \
	echo "$(GREEN)Select ColdFusion Engine:$(NC)"; \
	echo "  1) Lucee"; \
	echo "  2) BoxLang"; \
	echo "  3) Adobe ColdFusion"; \
	echo ""; \
	read -p "Enter engine choice (1-3): " engine_choice; \
	case $$engine_choice in \
		1) ENGINE="lucee" ;; \
		2) ENGINE="boxlang" ;; \
		3) ENGINE="adobe"; \
		   echo ""; \
		   echo "$(GREEN)Select Adobe ColdFusion Version:$(NC)"; \
		   echo "  1) ColdFusion 2021"; \
		   echo "  2) ColdFusion 2023"; \
		   echo "  3) ColdFusion 2025"; \
		   echo "  4) Latest"; \
		   echo ""; \
		   read -p "Enter version choice (1-4): " version_choice; \
		   case $$version_choice in \
		       1) CF_VERSION="cf21" ;; \
		       2) CF_VERSION="cf23" ;; \
		       3) CF_VERSION="cf25" ;; \
		       4) CF_VERSION="latest" ;; \
		       *) echo "$(RED)Invalid choice$(NC)"; exit 1 ;; \
		   esac ;; \
		*) echo "$(RED)Invalid choice$(NC)"; exit 1 ;; \
	esac; \
	echo ""; \
	if [ "$$ENGINE" = "adobe" ]; then \
		echo "$(YELLOW)Starting $$DB database and Adobe ColdFusion $$CF_VERSION...$(NC)"; \
		$(MAKE) $$ENGINE-$$DB CF_VERSION=$$CF_VERSION; \
	else \
		echo "$(YELLOW)Starting $$DB database and $$ENGINE engine...$(NC)"; \
		$(MAKE) $$ENGINE-$$DB; \
	fi

# Database-only targets
mysql:
	@echo "$(YELLOW)Starting MySQL database...$(NC)"
	@cd mysql && docker compose up -d
	@echo "$(GREEN)✓ MySQL is running on port 3306$(NC)"

mariadb:
	@echo "$(YELLOW)Starting MariaDB database...$(NC)"
	@cd mariadb && docker compose up -d
	@echo "$(GREEN)✓ MariaDB is running on port 3307$(NC)"

postgres:
	@echo "$(YELLOW)Starting PostgreSQL database...$(NC)"
	@cd postgres && docker compose up -d
	@echo "$(GREEN)✓ PostgreSQL is running on port 5432$(NC)"

mssql:
	@echo "$(YELLOW)Starting MSSQL database...$(NC)"
	@cd mssql && docker compose up -d
	@echo "$(GREEN)✓ MSSQL is running on port 1433$(NC)"

# Lucee targets
lucee-mysql: mysql
	@echo "$(YELLOW)Starting Lucee with MySQL...$(NC)"
	@cd lucee/mysql && docker compose up -d
	@echo "$(GREEN)✓ Lucee is running on http://localhost:18181$(NC)"

lucee-mariadb: mariadb
	@echo "$(YELLOW)Starting Lucee with MariaDB...$(NC)"
	@cd lucee/mariadb && docker compose up -d
	@echo "$(GREEN)✓ Lucee is running on http://localhost:18181$(NC)"

lucee-postgres: postgres
	@echo "$(YELLOW)Starting Lucee with PostgreSQL...$(NC)"
	@cd lucee/postgres && docker compose up -d
	@echo "$(GREEN)✓ Lucee is running on http://localhost:18181$(NC)"

lucee-mssql: mssql
	@echo "$(YELLOW)Starting Lucee with MSSQL...$(NC)"
	@cd lucee/mssql && docker compose up -d
	@echo "$(GREEN)✓ Lucee is running on http://localhost:18181$(NC)"

# BoxLang targets
boxlang-mysql: mysql
	@echo "$(YELLOW)Starting BoxLang with MySQL...$(NC)"
	@cd boxlang/mysql && docker compose up -d
	@echo "$(GREEN)✓ BoxLang is running on http://localhost:18281$(NC)"

boxlang-mariadb: mariadb
	@echo "$(YELLOW)Starting BoxLang with MariaDB...$(NC)"
	@cd boxlang/mariadb && docker compose up -d
	@echo "$(GREEN)✓ BoxLang is running on http://localhost:18281$(NC)"

boxlang-postgres: postgres
	@echo "$(YELLOW)Starting BoxLang with PostgreSQL...$(NC)"
	@cd boxlang/postgres && docker compose up -d
	@echo "$(GREEN)✓ BoxLang is running on http://localhost:18281$(NC)"

boxlang-mssql: mssql
	@echo "$(YELLOW)Starting BoxLang with MSSQL...$(NC)"
	@cd boxlang/mssql && docker compose up -d
	@echo "$(GREEN)✓ BoxLang is running on http://localhost:18281$(NC)"

# Adobe ColdFusion targets
# CF_VERSION can be: cf21, cf23 (default), cf25, latest
CF_VERSION ?= cf23

adobe-mysql: mysql
	@echo "$(YELLOW)Starting Adobe ColdFusion $(CF_VERSION) with MySQL...$(NC)"
	@cd adobe/mysql && sed -i.bak 's/target: .*/target: $(CF_VERSION)/' docker-compose.yml && docker compose build && docker compose up -d && mv docker-compose.yml.bak docker-compose.yml 2>/dev/null || true
	@echo "$(GREEN)✓ Adobe ColdFusion $(CF_VERSION) is running on http://localhost:18081$(NC)"

adobe-mariadb: mariadb
	@echo "$(YELLOW)Starting Adobe ColdFusion $(CF_VERSION) with MariaDB...$(NC)"
	@cd adobe/mariadb && sed -i.bak 's/target: .*/target: $(CF_VERSION)/' docker-compose.yml && docker compose build && docker compose up -d && mv docker-compose.yml.bak docker-compose.yml 2>/dev/null || true
	@echo "$(GREEN)✓ Adobe ColdFusion $(CF_VERSION) is running on http://localhost:18081$(NC)"

adobe-postgres: postgres
	@echo "$(YELLOW)Starting Adobe ColdFusion $(CF_VERSION) with PostgreSQL...$(NC)"
	@cd adobe/postgres && sed -i.bak 's/target: .*/target: $(CF_VERSION)/' docker-compose.yml && docker compose build && docker compose up -d && mv docker-compose.yml.bak docker-compose.yml 2>/dev/null || true
	@echo "$(GREEN)✓ Adobe ColdFusion $(CF_VERSION) is running on http://localhost:18081$(NC)"

adobe-mssql: mssql
	@echo "$(YELLOW)Starting Adobe ColdFusion $(CF_VERSION) with MSSQL...$(NC)"
	@cd adobe/mssql && sed -i.bak 's/target: .*/target: $(CF_VERSION)/' docker-compose.yml && docker compose build && docker compose up -d && mv docker-compose.yml.bak docker-compose.yml 2>/dev/null || true
	@echo "$(GREEN)✓ Adobe ColdFusion $(CF_VERSION) is running on http://localhost:18081$(NC)"

# Stop all containers
stop:
	@echo "$(YELLOW)Stopping all containers...$(NC)"
	@for dir in mysql mariadb postgres mssql; do \
		if [ -d "$$dir" ]; then \
			cd $$dir && docker compose stop 2>/dev/null || true; \
			cd ..; \
		fi \
	done
	@for engine in lucee boxlang adobe; do \
		for db in mysql mariadb postgres mssql; do \
			if [ -d "$$engine/$$db" ]; then \
				cd $$engine/$$db && docker compose stop 2>/dev/null || true; \
				cd ../..; \
			fi \
		done \
	done
	@echo "$(GREEN)✓ All containers stopped$(NC)"

# Stop and remove all containers
down:
	@echo "$(YELLOW)Stopping and removing all containers...$(NC)"
	@for dir in mysql mariadb postgres mssql; do \
		if [ -d "$$dir" ]; then \
			cd $$dir && docker compose down 2>/dev/null || true; \
			cd ..; \
		fi \
	done
	@for engine in lucee boxlang adobe; do \
		for db in mysql mariadb postgres mssql; do \
			if [ -d "$$engine/$$db" ]; then \
				cd $$engine/$$db && docker compose down 2>/dev/null || true; \
				cd ../..; \
			fi \
		done \
	done
	@echo "$(GREEN)✓ All containers removed$(NC)"

# Clean everything including volumes
clean: down
	@echo "$(YELLOW)Removing volumes...$(NC)"
	@for dir in mysql mariadb postgres mssql; do \
		if [ -d "$$dir" ]; then \
			cd $$dir && docker compose down -v 2>/dev/null || true; \
			cd ..; \
		fi \
	done
	@echo "$(GREEN)✓ Cleanup complete$(NC)"
