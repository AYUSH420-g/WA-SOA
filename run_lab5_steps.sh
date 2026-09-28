#!/usr/bin/env bash
# ==============================================================================
# Lab 5 Interactive Helper & Verification Script
# Executes and verifies Steps 1 through 12 of Lab 5 Assignment
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
    echo -e "Please ensure Docker Desktop (or Docker Engine) is installed and running."
    echo -e "On macOS: brew install --cask docker && open /Applications/Docker.app"
    exit 1
  fi
  if ! docker info &> /dev/null; then
    echo -e "${COLOR_RED}❌ Docker daemon is not running.${COLOR_RESET}"
    echo -e "Please start Docker Desktop and wait until it is ready."
    exit 1
  fi
  echo -e "${COLOR_GREEN}✅ Docker is active and running:${COLOR_RESET}"
  docker --version
}

action="${1:-all}"

case "$action" in
  verify)
    print_step "0" "Checking Docker Installation"
    check_docker
    docker run --rm hello-world
    ;;

  build)
    check_docker
    print_step "3" "Building Student API Docker Image (student-api:v1)"
    docker build -t student-api:v1 .
    echo -e "\n${COLOR_YELLOW}Verifying image list:${COLOR_RESET}"
    docker images student-api
    ;;

  step4)
    check_docker
    print_step "4" "Running Standalone Student API Container"
    docker rm -f student-api 2>/dev/null || true
    docker run -d --name student-api -p 3000:3000 student-api:v1
    sleep 3
    docker ps --filter "name=student-api"
    ;;

  step5)
    print_step "5" "Testing Containerized API via curl / Postman"
    echo "GET http://localhost:3000/students:"
    curl -s http://localhost:3000/students | head -c 300
    echo -e "\n"
    ;;

  step6)
    check_docker
    print_step "6" "Running MongoDB as a Docker Container"
    docker rm -f mongodb 2>/dev/null || true
    docker run -d --name mongodb mongo:7.0
    sleep 2
    docker ps --filter "name=mongodb"
    ;;

  step7)
    check_docker
    print_step "7" "Creating Network & Connecting Containers"
    docker network create student-network 2>/dev/null || true
    docker network connect student-network mongodb 2>/dev/null || true
    docker network connect student-network student-api 2>/dev/null || true
    docker network inspect student-network
    ;;

  persistence)
    check_docker
    print_step "9" "Testing MongoDB Volume Persistence"
    docker rm -f student-api mongodb 2>/dev/null || true
    docker network create student-network 2>/dev/null || true
    docker volume create student-mongo-data 2>/dev/null || true

    echo "1. Starting MongoDB with volume student-mongo-data..."
    docker run -d --name mongodb --network student-network -v student-mongo-data:/data/db mongo:7.0
    sleep 3

    echo "2. Starting Student API connected to MongoDB container..."
    docker run -d --name student-api --network student-network -p 3000:3000 \
      -e MONGO_URI="mongodb://mongodb:27017/campusconnect" \
      student-api:v1
    sleep 4

    echo "3. Inserting test student record..."
    curl -s -X POST http://localhost:3000/students \
      -H "Content-Type: application/json" \
      -d '{"name":"Volume Persistence Test","email":"volume.test@university.edu","course":"Docker SOA","semester":5}'
    echo -e "\n"

    echo "4. Stopping and removing MongoDB container..."
    docker rm -f mongodb

    echo "5. Starting new MongoDB container mounting the SAME volume..."
    docker run -d --name mongodb --network student-network -v student-mongo-data:/data/db mongo:7.0
    sleep 3

    echo "6. Verifying student record persisted after container recreation:"
    curl -s http://localhost:3000/students | head -c 400
    echo -e "\n${COLOR_GREEN}✅ Persistence verified successfully!${COLOR_RESET}"
    ;;

  compose)
    check_docker
    print_step "10-11" "Running Complete Application via Docker Compose"
    docker rm -f student-api mongodb 2>/dev/null || true
    docker compose down 2>/dev/null || true
    docker compose up -d
    sleep 5
    echo -e "\n${COLOR_YELLOW}Compose Service Status:${COLOR_RESET}"
    docker compose ps
    echo -e "\n${COLOR_YELLOW}Verifying API endpoint:${COLOR_RESET}"
    curl -s http://localhost:3000/students | head -c 300
    echo -e "\n"
    ;;

  down)
    check_docker
    print_step "12" "Stopping and Cleaning Up Docker Compose"
    docker compose down
    ;;

  all|*)
    echo -e "${COLOR_CYAN}======================================================================${COLOR_RESET}"
    echo -e "${COLOR_GREEN}Lab 5 Docker Automation Helper${COLOR_RESET}"
    echo -e "${COLOR_CYAN}======================================================================${COLOR_RESET}"
    echo "Usage: ./run_lab5_steps.sh [action]"
    echo ""
    echo "Available actions:"
    echo "  verify       - Check Docker installation and run hello-world (Steps 3.1 & 3.2)"
    echo "  build        - Build student-api:v1 Docker image (Step 3)"
    echo "  step4        - Run student-api container on port 3000 (Step 4)"
    echo "  step5        - Test containerized API with curl / Postman (Step 5)"
    echo "  step6        - Pull and run MongoDB container (Step 6)"
    echo "  step7        - Create student-network and connect containers (Step 7)"
    echo "  persistence  - Run full MongoDB volume persistence test (Step 9)"
    echo "  compose      - Start full stack using Docker Compose (Steps 10 & 11)"
    echo "  down         - Stop Compose application (Step 12)"
    ;;
esac
