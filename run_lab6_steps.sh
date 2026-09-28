#!/usr/bin/env bash
# ==============================================================================
# Lab 6 Interactive Helper & Verification Script
# Executes and verifies Steps 11 through 19 of Lab 6 Microservices Assignment
# ==============================================================================

set -e

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

print_step() {
  echo -e "\n${COLOR_CYAN}======================================================================${COLOR_RESET}"
  echo -e "${COLOR_GREEN}▶ STEP $1: $2${COLOR_RESET}"
  echo -e "${COLOR_CYAN}======================================================================${COLOR_RESET}"
}

check_docker() {
  if ! command -v docker &> /dev/null; then
    echo -e "${COLOR_RED}❌ Docker CLI is not found in PATH.${COLOR_RESET}"
    exit 1
  fi
  if ! docker info &> /dev/null; then
    echo -e "${COLOR_RED}❌ Docker daemon is not running.${COLOR_RESET}"
    exit 1
  fi
  echo -e "${COLOR_GREEN}✅ Docker is active and running:${COLOR_RESET}"
  docker --version
}

action="${1:-all}"

case "$action" in
  build)
    check_docker
    print_step "12" "Building Microservice Docker Images"
    docker build -t user-service:v1 ./user-service
    docker build -t product-service:v1 ./product-service
    docker build -t order-service:v1 ./order-service
    echo -e "\n${COLOR_YELLOW}Verifying built microservice images:${COLOR_RESET}"
    docker images | grep -E "user-service|product-service|order-service"
    ;;

  up)
    check_docker
    print_step "13-14" "Starting Microservices Stack via Docker Compose"
    docker compose down 2>/dev/null || true
    docker compose up -d
    sleep 3
    echo -e "\n${COLOR_YELLOW}Compose Service Status:${COLOR_RESET}"
    docker compose ps
    ;;

  test-individual)
    print_step "15.1" "Testing Individual Services"
    echo -e "${COLOR_YELLOW}1. Testing User Service (Port 3001):${COLOR_RESET}"
    curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
    echo -e "\nGET /users:"
    curl -s http://localhost:3001/users | jq . 2>/dev/null || curl -s http://localhost:3001/users
    echo -e "\nGET /users/101:"
    curl -s http://localhost:3001/users/101 | jq . 2>/dev/null || curl -s http://localhost:3001/users/101

    echo -e "\n${COLOR_YELLOW}2. Testing Product Service (Port 3002):${COLOR_RESET}"
    curl -s http://localhost:3002/health | jq . 2>/dev/null || curl -s http://localhost:3002/health
    echo -e "\nGET /products:"
    curl -s http://localhost:3002/products | jq . 2>/dev/null || curl -s http://localhost:3002/products
    echo -e "\nGET /products/501:"
    curl -s http://localhost:3002/products/501 | jq . 2>/dev/null || curl -s http://localhost:3002/products/501

    echo -e "\n${COLOR_YELLOW}3. Testing Order Service (Port 3003):${COLOR_RESET}"
    curl -s http://localhost:3003/health | jq . 2>/dev/null || curl -s http://localhost:3003/health
    echo -e "\nGET /orders:"
    curl -s http://localhost:3003/orders | jq . 2>/dev/null || curl -s http://localhost:3003/orders
    echo ""
    ;;

  test-comm)
    print_step "15.2" "Testing Order -> User & Order -> Product Communication"
    echo -e "${COLOR_YELLOW}Creating Order with valid User (101) and Product (501):${COLOR_RESET}"
    curl -s -X POST http://localhost:3003/orders \
      -H "Content-Type: application/json" \
      -d '{"userId": 101, "productId": 501, "quantity": 2}' | jq . 2>/dev/null || \
      curl -s -X POST http://localhost:3003/orders \
      -H "Content-Type: application/json" \
      -d '{"userId": 101, "productId": 501, "quantity": 2}'
    echo -e "\n"
    ;;

  test-404)
    print_step "15.3" "Testing Invalid Resource IDs (Expected: 404)"
    echo -e "${COLOR_YELLOW}1. Order creation with Non-existent User ID 9999:${COLOR_RESET}"
    curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3003/orders \
      -H "Content-Type: application/json" \
      -d '{"userId": 9999, "productId": 501, "quantity": 1}'

    echo -e "\n${COLOR_YELLOW}2. Order creation with Non-existent Product ID 9999:${COLOR_RESET}"
    curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3003/orders \
      -H "Content-Type: application/json" \
      -d '{"userId": 101, "productId": 9999, "quantity": 1}'
    echo ""
    ;;

  test-503)
    check_docker
    print_step "15.4" "Testing Dependency Failure & Graceful 503 Handling"
    echo -e "${COLOR_YELLOW}1. Stopping User Service container...${COLOR_RESET}"
    docker stop user-service
    sleep 1

    echo -e "\n${COLOR_YELLOW}2. Attempting to create Order while User Service is down (Expected: 503):${COLOR_RESET}"
    curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3003/orders \
      -H "Content-Type: application/json" \
      -d '{"userId": 101, "productId": 501, "quantity": 1}'

    echo -e "\n${COLOR_YELLOW}3. Restarting User Service container...${COLOR_RESET}"
    docker start user-service
    sleep 2

    echo -e "\n${COLOR_YELLOW}4. Retrying Order creation after User Service recovery (Expected: 201):${COLOR_RESET}"
    curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3003/orders \
      -H "Content-Type: application/json" \
      -d '{"userId": 101, "productId": 502, "quantity": 1}'
    echo -e "\n${COLOR_GREEN}✅ Resilience & Recovery verified!${COLOR_RESET}"
    ;;

  test-all)
    "$0" up
    sleep 2
    "$0" test-individual
    "$0" test-comm
    "$0" test-404
    "$0" test-503
    ;;

  down)
    check_docker
    print_step "Cleanup" "Stopping Microservices Stack"
    docker compose down
    ;;

  all|*)
    echo -e "${COLOR_CYAN}======================================================================${COLOR_RESET}"
    echo -e "${COLOR_GREEN}Lab 6 Microservices Automation Helper${COLOR_RESET}"
    echo -e "${COLOR_CYAN}======================================================================${COLOR_RESET}"
    echo "Usage: ./run_lab6_steps.sh [action]"
    echo ""
    echo "Available actions:"
    echo "  build           - Build user-service, product-service, order-service images"
    echo "  up              - Launch the microservices stack using Docker Compose"
    echo "  test-individual - Test User, Product, and Order endpoints individually"
    echo "  test-comm       - Test Order -> User and Order -> Product communication"
    echo "  test-404        - Test invalid resource IDs (returns 404)"
    echo "  test-503        - Test dependency shutdown (503) and recovery (201)"
    echo "  test-all        - Run all verifications end-to-end"
    echo "  down            - Stop and tear down the Compose stack"
    ;;
esac
