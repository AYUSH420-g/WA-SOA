# LAB 5 ASSIGNMENT: Docker & Containerization – Dockerizing the Lab 4 Student REST API
**Course:** Web Services and SOA  
**Technology Stack:** Docker, Docker Compose, Node.js / Express.js, MongoDB, Mongoose, Postman  
**Architecture:** Containerized Service-Oriented Architecture (Multi-Container Microservices)

---

## 📋 Table of Contents
1. [Project Overview & Relation to Lab 4](#1-project-overview--relation-to-lab-4)
2. [Architecture & Container Topology](#2-architecture--container-topology)
3. [Docker Installation & Verification](#3-docker-installation--verification)
4. [Dockerfile & .dockerignore Explanation](#4-dockerfile---dockerignore-explanation)
5. [Docker Network & Service Discovery (`localhost` vs `mongodb`)](#5-docker-network--service-discovery-localhost-vs-mongodb)
6. [Environment Variables & Configuration](#6-environment-variables--configuration)
7. [Data Persistence with Docker Volumes](#7-data-persistence-with-docker-volumes)
8. [Multi-Container Orchestration with Docker Compose](#8-multi-container-orchestration-with-docker-compose)
9. [Step-by-Step Execution & Verification Guide](#9-step-by-step-execution--verification-guide)
10. [Docker Commands Reference Guide](#10-docker-commands-reference-guide)
11. [Troubleshooting & Issues Encountered](#11-troubleshooting--issues-encountered)
12. [Lab 5 Submission Evidence & Screenshot Checklist (22–39)](#12-lab-5-submission-evidence--screenshot-checklist-2239)
13. [Lab 4 Full-Stack Integration Archive](#13-lab-4-full-stack-integration-archive)

---

## 1. Project Overview & Relation to Lab 4

In **Lab 4**, we developed a full-stack Service-Oriented Architecture (SOA) consisting of:
- A Node.js/Express.js **Student REST API** (`src/server.js`) implementing CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`).
- **MongoDB Atlas** persistence using Mongoose models and validation schemas.
- Multi-client consumers: **React Web Client** (`student-client`) and **Android Kotlin Client** (`student-android`).

In **Lab 5**, we transition the application from a host-dependent execution model to a fully **containerized multi-container environment** using Docker and Docker Compose:
- The Student REST API is packaged into a self-contained, reproducible Docker image (`student-api:v1`).
- The cloud/local MongoDB instance is replaced with an isolated official MongoDB container (`mongo:latest`).
- Containers communicate securely over an isolated user-defined Docker bridge network (`student-network`).
- MongoDB data persistence is decoupled from container lifecycle using a dedicated Docker volume (`student-mongo-data`).
- The entire multi-container stack is orchestrated declaratively via `compose.yaml`.

---

## 2. Architecture & Container Topology

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 HOST MACHINE                                     │
│                                                                                  │
│   ┌──────────────────────────────┐              ┌────────────────────────────┐   │
│   │   Postman / REST Client      │              │     React Web Client       │   │
│   │   http://localhost:3000      │              │   http://localhost:5173    │   │
│   └──────────────┬───────────────┘              └─────────────┬──────────────┘   │
└──────────────────┼────────────────────────────────────────────┼──────────────────┘
                   │ Host Port Mapping (-p 3000:3000)           │
                   ▼                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      DOCKER ENGINE / student-network (Bridge)                    │
│                                                                                  │
│   ┌────────────────────────────────────────┐                                     │
│   │  Container: student-api                │                                     │
│   │  Image: student-api:v1                 │                                     │
│   │  Port: 3000 (Internal)                 │                                     │
│   │  Env: PORT=3000                        │                                     │
│   │       MONGO_URI=mongodb://mongodb:27017│                                     │
│   └───────────────────┬────────────────────┘                                     │
│                       │ DNS Service Lookup: "mongodb:27017"                      │
│                       ▼                                                          │
│   ┌────────────────────────────────────────┐                                     │
│   │  Container: mongodb                    │                                     │
│   │  Image: mongo:latest                   │                                     │
│   │  Internal Port: 27017                  │                                     │
│   └───────────────────┬────────────────────┘                                     │
└───────────────────────┼──────────────────────────────────────────────────────────┘
                        │ Volume Mount: /data/db
                        ▼
            ┌───────────────────────┐
            │     Docker Volume     │
            │  student-mongo-data   │
            │ (Host Managed Disk)   │
            └───────────────────────┘
```

---

## 3. Docker Installation & Verification

### 3.1 Verification Commands
Before starting containerization, verify Docker Engine and CLI installation:

```bash
# Check Docker CLI version
docker --version

# Check Docker Compose version
docker compose version

# Run Hello-World container to verify container execution
docker run hello-world
```

### 3.2 Platform-Specific Setup
- **macOS:** Install **Docker Desktop for Mac** (Apple Silicon `arm64` or Intel `x86_64`) via official installer or Homebrew:
  ```bash
  brew install --cask docker
  open /Applications/Docker.app
  ```
- **Windows:** Download **Docker Desktop for Windows** and enable WSL 2 backend.
- **Linux:** Install `docker-ce` and `docker-compose-plugin` using distribution package manager (`apt`, `dnf`, `pacman`).

---

## 4. Dockerfile & .dockerignore Explanation

### 4.1 `Dockerfile`
Located in the project root:

```dockerfile
# Step 1: Base Image (Node.js LTS runtime)
FROM node:20

# Step 2: Set working directory inside container
WORKDIR /app

# Step 3: Copy dependency specifications first to leverage Docker layer caching
COPY package*.json ./

# Step 4: Install runtime and dev dependencies inside container
RUN npm install

# Step 5: Copy application source code into container
COPY . .

# Step 6: Inform Docker that container listens on port 3000
EXPOSE 3000

# Step 7: Define default container startup command
CMD ["npm", "start"]
```

#### Layer Caching Rationale:
- In Node.js projects, dependencies in `package.json` change far less frequently than application code in `src/`.
- By copying `package*.json` and running `npm install` **before** copying the rest of the application files (`COPY . .`), Docker caches the expensive `npm install` layer. Subsequent code edits rebuild instantly without redownloading npm packages.

### 4.2 `.dockerignore`
Prevents unnecessary or sensitive files from entering the Docker build context:

```text
node_modules
npm-debug.log*
.git
.gitignore
.DS_Store
.env
.env.local
student-client
student-android
springboot-student-api
screenshots
postman
*.md
```

- **Excluding `node_modules`**: Ensures clean, architecture-compatible binaries built inside the target container environment rather than copying host machine binaries.
- **Excluding `.env`**: Enforces security by preventing secrets or sensitive connection strings from being baked into the Docker image layers.
- **Excluding client folders**: Significantly reduces Docker build context size from several hundred megabytes to under 2 MB.

---

## 5. Docker Network & Service Discovery (`localhost` vs `mongodb`)

### 5.1 The `localhost` Trap
Inside a Docker container, `localhost` (or `127.0.0.1`) refers **strictly to the container's own isolated network namespace (loopback interface)**.
- If `student-api` attempts to connect to `mongodb://localhost:27017`, it looks for a MongoDB process running inside the `student-api` container itself, resulting in `ECONNREFUSED`.
- The MongoDB process actually runs in a separate, isolated container.

### 5.2 Container DNS Service Discovery
When containers are joined to a user-defined bridge network (`student-network`):
1. Docker automatically runs an embedded DNS server at `127.0.0.11`.
2. Containers resolve other containers on the same network using their **container name** or **Compose service name**.
3. Therefore, `student-api` connects to MongoDB using:
   ```text
   mongodb://mongodb:27017/campusconnect
   ```
   Where `mongodb` is the hostname resolved by Docker's internal DNS.

---

## 6. Environment Variables & Configuration

Following the **12-Factor App** methodology, environment configuration is separated from code:

### 6.1 Environment Variables
| Variable | Description | Value in Docker | Local Fallback |
| :--- | :--- | :--- | :--- |
| `PORT` | API server listening port | `3000` | `3000` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://mongodb:27017/campusconnect` | Atlas / `mongodb://localhost:27017` |
| `NODE_ENV` | Application environment | `production` / `development` | `development` |

### 6.2 Application Code Updates (`src/config/db.js`)
Updated to support both `MONGO_URI` (Lab 5 specification) and `MONGODB_URI` (Lab 4 backward compatibility), with exponential retry logic to handle container startup latency:

```javascript
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  const maxRetries = 5;
  const retryDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (mongoURI) {
        const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      }
    } catch (error) {
      console.error(`❌ MongoDB Connection Attempt ${attempt}/${maxRetries} Error: ${error.message}`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
};
```

---

## 7. Data Persistence with Docker Volumes

Containers have an ephemeral writable layer. Any data stored inside `/data/db` within a container is lost when the container is deleted.

To achieve persistent storage:
1. We create a Docker managed named volume: `student-mongo-data`.
2. We mount the volume to MongoDB's storage path:
   ```text
   -v student-mongo-data:/data/db
   ```
3. Docker stores this data outside the container lifecycle on host storage. Even if the MongoDB container is stopped and removed (`docker rm -f mongodb`), a newly launched MongoDB container mounting `student-mongo-data` immediately has all prior student records.

---

## 8. Multi-Container Orchestration with Docker Compose

The `compose.yaml` (and `docker-compose.yml`) file defines the multi-container topology:

```yaml
services:
  api:
    build: .
    container_name: student-api
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      MONGO_URI: mongodb://mongodb:27017/campusconnect
    depends_on:
      - mongodb
    networks:
      - student-network
    restart: unless-stopped

  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - student-mongo-data:/data/db
    networks:
      - student-network
    restart: unless-stopped

volumes:
  student-mongo-data:
    name: student-mongo-data

networks:
  student-network:
    name: student-network
    driver: bridge
```

---

## 9. Step-by-Step Execution & Verification Guide

Follow these steps in exact order to reproduce and verify the lab:

### Step 1: Prepare and Verify Lab 4 Student REST API (No Docker)
1. Start MongoDB (local or Atlas cluster via `.env`).
2. Run the application directly on host:
   ```bash
   npm start
   ```
3. Confirm API responds:
   ```bash
   curl http://localhost:3000/students
   ```

### Step 2: Create Dockerfile & .dockerignore
Verify files exist in project root:
```bash
cat Dockerfile
cat .dockerignore
```

### Step 3: Build the Student API Docker Image
```bash
docker build -t student-api:v1 .
```
Verify the image is created:
```bash
docker images
```
*Expected: `student-api` with tag `v1` listed.*

### Step 4: Run the Student API Container
Map host port 3000 to container port 3000:
```bash
docker run -d --name student-api -p 3000:3000 student-api:v1
docker ps
```
*Expected: `student-api` status `Up`, port `0.0.0.0:3000->3000/tcp`.*

### Step 5: Test Containerized REST API with Postman / cURL
Send sample requests against `http://localhost:3000`:

```bash
# 1. GET /students
curl -X GET http://localhost:3000/students

# 2. POST /students
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav Patel","email":"aarav.docker@campus.edu","course":"Computer Science","semester":5}'

# 3. GET /students/:id
curl -X GET http://localhost:3000/students/<student_id>
```

### Step 6: Run Standalone MongoDB Container
Clean up single container first, then start MongoDB:
```bash
docker stop student-api && docker rm student-api

docker pull mongo
docker run -d --name mongodb mongo
docker ps
```

### Step 7: Create Docker Network & Connect Containers
```bash
# Create dedicated bridge network
docker network create student-network

# Connect MongoDB container to network
docker network connect student-network mongodb

# Start Student API attached to student-network with MONGO_URI
docker run -d --name student-api \
  --network student-network \
  -p 3000:3000 \
  -e PORT=3000 \
  -e MONGO_URI=mongodb://mongodb:27017/campusconnect \
  student-api:v1

# Inspect network to confirm both containers are attached
docker network inspect student-network
```

### Step 8: Configure Environment Variables
Verified in Step 7 and in Compose configuration:
```bash
docker exec -it student-api env | grep MONGO_URI
```
*Expected: `MONGO_URI=mongodb://mongodb:27017/campusconnect`*

### Step 9: Add MongoDB Volume & Verify Persistence
```bash
# Clean up existing containers
docker stop student-api mongodb
docker rm student-api mongodb

# Create Docker volume
docker volume create student-mongo-data

# Run MongoDB mounting the volume
docker run -d --name mongodb \
  --network student-network \
  -v student-mongo-data:/data/db \
  mongo

# Run Student API
docker run -d --name student-api \
  --network student-network \
  -p 3000:3000 \
  -e MONGO_URI=mongodb://mongodb:27017/campusconnect \
  student-api:v1

# Persistence Test:
# 1. Insert student record
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Persistence Student","email":"persist@campus.edu","course":"Cybersecurity","semester":6}'

# 2. Stop and remove MongoDB container
docker stop mongodb && docker rm mongodb

# 3. Start brand new MongoDB container reusing the same volume
docker run -d --name mongodb \
  --network student-network \
  -v student-mongo-data:/data/db \
  mongo

# 4. Fetch students again - record is intact!
curl -X GET http://localhost:3000/students
```

### Step 10 & 11: Run Complete Application Using Docker Compose
Stop any standalone test containers:
```bash
docker rm -f student-api mongodb 2>/dev/null || true
```

Start the multi-container stack:
```bash
# Start all services in detached mode
docker compose up -d

# Verify running services
docker compose ps

# View unified service logs
docker compose logs -f

# Verify API via Postman or cURL
curl http://localhost:3000/students
```

### Step 12: Stop and Clean Up
```bash
# Stop containers and network (preserves volume)
docker compose down

# Optional: Stop and remove volume only when doing full reset
# docker compose down -v
```

---

## 10. Docker Commands Reference Guide

| Command | Purpose |
| :--- | :--- |
| `docker --version` | Display installed Docker engine version |
| `docker run hello-world` | Verify container creation and daemon communication |
| `docker build -t student-api:v1 .` | Build Docker image from `Dockerfile` in current directory |
| `docker images` | List local Docker images |
| `docker run --name student-api -p 3000:3000 student-api:v1` | Run image as container with host port 3000 mapped |
| `docker ps` | List all currently running containers |
| `docker ps -a` | List all containers (running and stopped) |
| `docker stop <container>` | Gracefully stop a running container |
| `docker start <container>` | Start an existing stopped container |
| `docker restart <container>` | Restart a container |
| `docker logs <container>` | View stdout/stderr logs for a container |
| `docker network ls` | List Docker networks |
| `docker network create <name>` | Create a user-defined network |
| `docker network inspect <name>` | Inspect network configuration and attached container IPs |
| `docker volume ls` | List Docker storage volumes |
| `docker volume create <name>` | Create a named storage volume |
| `docker compose up -d` | Build, create, and start multi-container application in background |
| `docker compose ps` | View status of Compose services |
| `docker compose logs` | View logs from all services in Compose |
| `docker compose down` | Stop and remove Compose containers, networks, and internal resources |

---

## 11. Troubleshooting & Issues Encountered

| Issue Encountered | Root Cause | Resolution |
| :--- | :--- | :--- |
| **Port Conflict (`EADDRINUSE: 3000`)** | Another process (e.g., local `node src/server.js`) was occupying host port 3000. | Identified and stopped process using `lsof -i :3000` and `kill -9 <PID>`, or stopped running container using `docker stop student-api`. |
| **Connection Refused (`ECONNREFUSED 127.0.0.1:27017`)** | `student-api` container attempted to connect to `localhost:27017`. Inside container, `localhost` points to itself, not MongoDB. | Configured `MONGO_URI=mongodb://mongodb:27017/campusconnect` and attached both containers to `student-network`. |
| **MongoDB Connection Latency on Boot** | Node.js container starts faster than MongoDB engine initializes sockets. | Added retry loop with 2-second backoff in `src/config/db.js` (`maxRetries = 5`) and `depends_on: - mongodb` in `compose.yaml`. |
| **Large Docker Build Context & Slow Builds** | Copying local `node_modules` and frontend build artifacts into Docker daemon context. | Created `.dockerignore` ignoring `node_modules`, `student-client`, `student-android`, and logs. |
| **Database Wiped on Container Recreation** | Without a named volume, MongoDB writes to ephemeral container layer `/data/db`. | Created and mounted persistent volume `student-mongo-data:/data/db` in container run and `compose.yaml`. |

---

## 12. Lab 5 Submission Evidence & Screenshot Checklist (22–39)

The following table maps all required submission evidence items (points 22 to 39) to the exact commands and expected outputs:

| Item # | Required Screenshot / Evidence | Command to Execute | Expected Verification Output |
| :---: | :--- | :--- | :--- |
| **22** | Docker installation / version | `docker --version` | `Docker version 27.x.x, build ...` |
| **23** | Lab 4 Student REST API running before Dockerization | `npm start` | `🚀 Student REST API Server running on port 3000` |
| **24** | Dockerfile contents | `cat Dockerfile` | Displays 7-step Dockerfile (`FROM node:20`, `WORKDIR`, `COPY`, etc.) |
| **25** | Successful `student-api:v1` image build | `docker build -t student-api:v1 .` | Build completed with layers cached / tagged `student-api:v1` |
| **26** | `docker images` output | `docker images` | Shows repository `student-api`, tag `v1`, IMAGE ID, size |
| **27** | Running Student API container using `docker ps` | `docker ps` | Container `student-api` running with `0.0.0.0:3000->3000/tcp` |
| **28** | Postman testing of containerized Student REST API | Postman / cURL `GET /students` | `200 OK` response with student JSON data |
| **29** | MongoDB container running | `docker ps` | Container `mongodb` running with image `mongo` |
| **30** | Docker network showing API and MongoDB containers | `docker network inspect student-network` | Shows IPv4 addresses for both `student-api` and `mongodb` |
| **31** | Configuration showing `MONGO_URI` using service name | `cat compose.yaml` or `env` in container | `MONGO_URI=mongodb://mongodb:27017/campusconnect` |
| **32** | Environment-variable configuration | `cat .env.example` or `docker inspect` | Shows `PORT=3000` and `MONGO_URI` variables |
| **33** | MongoDB volume creation / mounting | `docker volume ls` | Lists `student-mongo-data` volume |
| **34** | Persistence test showing data remains after DB recreation | `curl http://localhost:3000/students` | Records remain intact after stopping, deleting & recreating DB container |
| **35** | Compose configuration | `cat compose.yaml` | Complete Compose file defining `api`, `mongodb`, `volumes`, `networks` |
| **36** | Successful `docker compose up` | `docker compose up -d` | `[+] Running 4/4: Network student-network Created`, `Volume student-mongo-data Created`, `Container mongodb Started`, `Container student-api Started` |
| **37** | `docker compose ps` output | `docker compose ps` | Both `student-api` and `mongodb` showing `Up (healthy/running)` |
| **38** | Postman testing of complete Compose-based application | Postman `POST` & `GET /students` | Complete CRUD lifecycle working against compose stack |
| **39** | Docker / Compose logs where relevant | `docker compose logs` | Shows Express listening and MongoDB connection logs |

---

## 13. Lab 4 Full-Stack Integration Archive

<details>
<summary>Click to expand Lab 4 Full-Stack & Architecture Documentation</summary>

### Multi-Client / SOA Architecture
- **React Web Client (`student-client`)**: Vite + React SPA consuming REST endpoints on port 3000 with CORS.
- **Android Mobile Client (`student-android`)**: Kotlin + Retrofit native Android app consuming endpoints via `10.0.2.2:3000`.
- **Express Backend (`src/server.js`)**: Controller-Service-Repository pattern with Mongoose ODM models.

### API Service Contract & Status Codes
| Operation | Method | Endpoint | Used By | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| List students | `GET` | `/students` | React, Android, Postman | `200 OK` |
| Get student | `GET` | `/students/:id` | React, Postman | `200 OK` / `404 Not Found` |
| Create student | `POST` | `/students` | React, Android, Postman | `201 Created` / `400 Bad Request` |
| Update student | `PUT` | `/students/:id` | React, Postman | `200 OK` / `400` / `404` |
| Delete student | `DELETE` | `/students/:id` | React, Postman | `200 OK` / `404` |

</details>
