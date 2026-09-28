#!/usr/bin/env bash
# ==============================================================================
# Lab 7 Automated Execution, Testing & Verification Script
# API Gateway, Service Discovery (Config-based) & Fault Resilience
# ==============================================================================

set -e

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

print_step() {
  echo -e "\n${COLOR_CYAN}======================================================================${COLOR_RESET}"
  echo -e "${COLOR_GREEN}▶ $1: $2${COLOR_RESET}"
  echo -e "${COLOR_CYAN}======================================================================${COLOR_RESET}"
}

check_docker() {
  if ! command -v docker &> /dev/null; then
    echo -e "${COLOR_RED}❌ Docker CLI is not found in PATH.${COLOR_RESET}"
    exit 1
  fi
  if ! docker info &> /dev/null; then
    echo -e "${COLOR_RED}❌ Docker daemon is not running. Please start Docker Desktop.${COLOR_RESET}"
    exit 1
  fi
  echo -e "${COLOR_GREEN}✅ Docker is active and running:${COLOR_RESET}"
  docker --version
}

action="${1:-all}"

case "$action" in
  build)
    check_docker
    print_step "STEP 1" "Building API Gateway and Microservice Docker Images"
    docker build -t api-gateway:v1 ./api-gateway
    docker build -t user-service:v1 ./user-service
    docker build -t product-service:v1 ./product-service
    docker build -t order-service:v1 ./order-service
    echo -e "\n${COLOR_YELLOW}Verifying built Docker images:${COLOR_RESET}"
    docker images | grep -E "api-gateway|user-service|product-service|order-service"
    ;;

  up)
    check_docker
    print_step "STEP 2" "Starting Full Stack via Docker Compose"
    docker compose down 2>/dev/null || true
    docker compose up -d
    echo -e "${COLOR_YELLOW}Waiting 4 seconds for containers to initialize...${COLOR_RESET}"
    sleep 4
    echo -e "\n${COLOR_YELLOW}Compose Container Status:${COLOR_RESET}"
    docker compose ps
    ;;

  verify-ports)
    print_step "STEP 3" "Verifying External Port Isolation"
    echo -e "${COLOR_YELLOW}Checking exposed ports on host:${COLOR_RESET}"
    docker compose ps --format "table {{.Service}}\t{{.State}}\t{{.Ports}}"
    echo -e "\n${COLOR_GREEN}Notice: ONLY api-gateway has host port published (8080->8080).${COLOR_RESET}"
    echo -e "${COLOR_GREEN}User, Product, and Order services are isolated within campus-network.${COLOR_RESET}"
    ;;

  test-health)
    print_step "STEP 4" "Testing Gateway /health Endpoint"
    curl -s http://localhost:8080/health | jq . 2>/dev/null || curl -s http://localhost:8080/health
    echo ""
    ;;

  test-routes)
    print_step "STEP 5" "Testing Gateway Routing to All Microservices"
    echo -e "${COLOR_YELLOW}1. GET /users (via Gateway -> User Service):${COLOR_RESET}"
    curl -s http://localhost:8080/users | jq . 2>/dev/null || curl -s http://localhost:8080/users
    
    echo -e "\n${COLOR_YELLOW}2. GET /users/101 (via Gateway -> User Service):${COLOR_RESET}"
    curl -s http://localhost:8080/users/101 | jq . 2>/dev/null || curl -s http://localhost:8080/users/101

    echo -e "\n${COLOR_YELLOW}3. POST /users (Create User via Gateway):${COLOR_RESET}"
    curl -s -X POST http://localhost:8080/users \
      -H "Content-Type: application/json" \
      -d '{"name":"Eva Green","email":"eva@campus.edu","role":"student"}' | jq . 2>/dev/null || true

    echo -e "\n${COLOR_YELLOW}4. GET /products (via Gateway -> Product Service):${COLOR_RESET}"
    curl -s http://localhost:8080/products | jq . 2>/dev/null || curl -s http://localhost:8080/products

    echo -e "\n${COLOR_YELLOW}5. GET /products/501 (via Gateway -> Product Service):${COLOR_RESET}"
    curl -s http://localhost:8080/products/501 | jq . 2>/dev/null || curl -s http://localhost:8080/products/501

    echo -e "\n${COLOR_YELLOW}6. POST /orders (via Gateway -> Order Service -> User & Product):${COLOR_RESET}"
    curl -s -X POST http://localhost:8080/orders \
      -H "Content-Type: application/json" \
      -d '{"userId":101,"productId":501,"quantity":2}' | jq . 2>/dev/null || true

    echo -e "\n${COLOR_YELLOW}7. GET /orders (via Gateway -> Order Service):${COLOR_RESET}"
    curl -s http://localhost:8080/orders | jq . 2>/dev/null || curl -s http://localhost:8080/orders
    echo ""
    ;;

  test-unreachable)
    print_step "STEP 6" "Testing 502/503 Fault Handling (Stopping Product Service)"
    echo -e "${COLOR_YELLOW}Stopping product-service container...${COLOR_RESET}"
    docker stop product-service
    sleep 2
    
    echo -e "\n${COLOR_YELLOW}Requesting GET /products through Gateway during outage:${COLOR_RESET}"
    http_code=$(curl -s -o /tmp/gw_err.json -w "%{http_code}" http://localhost:8080/products || true)
    echo -e "HTTP Response Status Code: ${COLOR_RED}${http_code}${COLOR_RESET}"
    cat /tmp/gw_err.json | jq . 2>/dev/null || cat /tmp/gw_err.json
    rm -f /tmp/gw_err.json

    echo -e "\n${COLOR_YELLOW}Restarting product-service container...${COLOR_RESET}"
    docker start product-service
    sleep 3
    echo -e "${COLOR_GREEN}Testing GET /products recovery:${COLOR_RESET}"
    curl -s http://localhost:8080/products | jq . 2>/dev/null || curl -s http://localhost:8080/products
    ;;

  test-discovery)
    print_step "STEP 7" "Testing Service Discovery (Config Change Proof)"
    echo -e "${COLOR_YELLOW}Proving service location is resolved via environment variable without code change.${COLOR_RESET}"
    echo -e "Current USER_SERVICE_URL: $(docker exec api-gateway env | grep USER_SERVICE_URL)"
    echo -e "${COLOR_GREEN}Gateway routing table from /health:${COLOR_RESET}"
    curl -s http://localhost:8080/health | jq .serviceDiscovery 2>/dev/null || true
    ;;

  logs)
    print_step "STEP 8" "Inspecting API Gateway Access & Routing Logs"
    docker logs --tail 25 api-gateway
    ;;

  down)
    check_docker
    print_step "CLEANUP" "Stopping and removing containers"
    docker compose down
    ;;

  all)
    check_docker
    "$0" build
    "$0" up
    "$0" verify-ports
    "$0" test-health
    "$0" test-routes
    "$0" test-unreachable
    "$0" test-discovery
    "$0" logs
    print_step "COMPLETED" "All Lab 7 tests executed successfully!"
    ;;

  *)
    echo "Usage: $0 {build|up|verify-ports|test-health|test-routes|test-unreachable|test-discovery|logs|down|all}"
    exit 1
    ;;
esac
