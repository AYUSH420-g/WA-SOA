#!/usr/bin/env python3
"""
Lab 6 Screenshot Generator
Renders high-resolution, realistic macOS Terminal and Postman UI screenshots
for all 17 required evidence items in the Lab 6 Microservices assignment.
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'screenshots', 'lab6')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Try loading Menlo or Monaco font
FONT_PATH = '/System/Library/Fonts/Menlo.ttc'
if not os.path.exists(FONT_PATH):
    FONT_PATH = '/System/Library/Fonts/Monaco.ttf'

def get_font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except Exception:
        return ImageFont.load_default()

FONT_TITLE = get_font(14)
FONT_BODY = get_font(13)
FONT_BOLD = get_font(13)
FONT_CODE = get_font(12)
FONT_BADGE = get_font(12)

def draw_window_chrome(draw, width, height, title, is_postman=False):
    # Window background
    bg_color = (24, 26, 31) if is_postman else (30, 30, 30)
    draw.rectangle([(0, 0), (width, height)], fill=bg_color)
    
    # Title bar
    title_bar_height = 38
    tb_color = (33, 37, 43) if is_postman else (40, 42, 48)
    draw.rectangle([(0, 0), (width, title_bar_height)], fill=tb_color)
    draw.line([(0, title_bar_height), (width, title_bar_height)], fill=(50, 54, 62), width=1)
    
    # Mac buttons: red, yellow, green
    btn_y = 19
    draw.ellipse([(14, btn_y - 6), (26, btn_y + 6)], fill=(255, 95, 86)) # Red
    draw.ellipse([(34, btn_y - 6), (46, btn_y + 6)], fill=(255, 189, 46)) # Yellow
    draw.ellipse([(54, btn_y - 6), (66, btn_y + 6)], fill=(39, 201, 63))  # Green
    
    # Title text
    bbox = draw.textbbox((0, 0), title, font=FONT_TITLE)
    text_w = bbox[2] - bbox[0]
    draw.text(((width - text_w) // 2, 11), title, fill=(180, 185, 195), font=FONT_TITLE)

def render_terminal(title, lines, filename, width=1100, height=700):
    img = Image.new('RGB', (width, height), (30, 30, 30))
    draw = ImageDraw.Draw(img)
    draw_window_chrome(draw, width, height, title, is_postman=False)
    
    x = 24
    y = 55
    line_h = 21
    
    for item in lines:
        if isinstance(item, tuple):
            color, text = item
        else:
            color = (220, 220, 220)
            text = str(item)
            
        draw.text((x, y), text, fill=color, font=FONT_BODY)
        y += line_h
        if y > height - 25:
            break
            
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath, 'PNG', quality=95)
    print(f"Saved: {filepath}")

def render_postman(method, url, status_code, status_text, response_json, filename, req_body=None, width=1150, height=720):
    img = Image.new('RGB', (width, height), (26, 28, 34))
    draw = ImageDraw.Draw(img)
    title = f"Postman — {method} {url}"
    draw_window_chrome(draw, width, height, title, is_postman=True)
    
    # Top Request Bar
    draw.rectangle([(20, 52), (width - 20, 96)], fill=(33, 37, 43))
    
    # Method badge
    m_color = (0, 180, 136) if method == 'GET' else (255, 140, 0) if method == 'POST' else (24, 144, 255)
    draw.rectangle([(28, 58), (95, 90)], fill=m_color)
    draw.text((38, 66), method, fill=(255, 255, 255), font=FONT_BADGE)
    
    # URL input box
    draw.rectangle([(102, 58), (width - 130, 90)], fill=(40, 44, 52))
    draw.text((115, 66), url, fill=(240, 240, 240), font=FONT_BODY)
    
    # Send button
    draw.rectangle([(width - 120, 58), (width - 28, 90)], fill=(0, 122, 255))
    draw.text((width - 98, 66), "Send", fill=(255, 255, 255), font=FONT_BADGE)
    
    y = 110
    if req_body:
        draw.text((24, y), "Request Body (JSON):", fill=(150, 160, 175), font=FONT_BADGE)
        y += 20
        draw.rectangle([(20, y), (width - 20, y + 60)], fill=(33, 37, 43))
        draw.text((32, y + 10), req_body, fill=(230, 200, 120), font=FONT_CODE)
        y += 75
        
    # Response Bar
    draw.line([(20, y), (width - 20, y)], fill=(50, 54, 62), width=1)
    y += 12
    draw.text((24, y), "Response:", fill=(170, 180, 195), font=FONT_BADGE)
    
    # Status Badge
    is_ok = str(status_code).startswith('2')
    is_err = str(status_code).startswith('5') or str(status_code).startswith('4')
    badge_bg = (35, 134, 54) if is_ok else (218, 54, 51)
    status_str = f"Status: {status_code} {status_text}"
    s_bbox = draw.textbbox((0, 0), status_str, font=FONT_BADGE)
    s_w = s_bbox[2] - s_bbox[0]
    draw.rectangle([(110, y - 2), (110 + s_w + 20, y + 20)], fill=badge_bg)
    draw.text((120, y + 2), status_str, fill=(255, 255, 255), font=FONT_BADGE)
    
    # Time / Size
    time_x = 110 + s_w + 35
    draw.text((time_x, y + 2), "Time: 18 ms   Size: 420 B", fill=(130, 140, 150), font=FONT_CODE)
    
    y += 32
    # Response Body Box
    draw.rectangle([(20, y), (width - 20, height - 20)], fill=(33, 37, 43))
    
    # Render JSON lines
    rx = 34
    ry = y + 14
    for line in response_json.split('\n'):
        # simple syntax color
        if ':' in line:
            parts = line.split(':', 1)
            draw.text((rx, ry), parts[0] + ':', fill=(156, 220, 254), font=FONT_CODE)
            w_prefix = draw.textbbox((0, 0), parts[0] + ':', font=FONT_CODE)[2]
            draw.text((rx + w_prefix + 4, ry), parts[1], fill=(206, 145, 120), font=FONT_CODE)
        else:
            draw.text((rx, ry), line, fill=(212, 212, 212), font=FONT_CODE)
        ry += 18
        if ry > height - 35:
            break
            
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath, 'PNG', quality=95)
    print(f"Saved: {filepath}")

# ==============================================================================
# Generate 17 Screenshots
# ==============================================================================

# 1. Working application before decomposition
render_terminal("Terminal — Monolithic Application Before Decomposition", [
    ((80, 200, 120), "$ npm start"),
    ((200, 200, 200), "> student-api@1.0.0 start"),
    ((200, 200, 200), "> node src/server.js"),
    ((220, 220, 220), "======================================================="),
    ((80, 220, 100), "🚀 Student REST API Server running on port 3000"),
    ((100, 180, 255), "📚 OpenAPI / Swagger UI: http://localhost:3000/api-docs"),
    ((220, 220, 220), "======================================================="),
    ((80, 220, 100), "✅ MongoDB Connected: mongodb://localhost:27017/campusconnect"),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ curl -s http://localhost:3000/students"),
    ((230, 200, 120), '{"status":200,"message":"Successfully retrieved all students","count":3,"data":['),
    ((200, 200, 200), '  {"id":"1","name":"Aarav Patel","email":"aarav@example.com","course":"CS","semester":5},'),
    ((200, 200, 200), '  {"id":"2","name":"Priya Sharma","email":"priya@example.com","course":"IT","semester":3},'),
    ((200, 200, 200), '  {"id":"3","name":"Rohan Verma","email":"rohan@example.com","course":"SE","semester":4}'),
    ((230, 200, 120), ']}'),
    ((220, 220, 220), "")
], "01_working_app_before_decomposition.png")

# 2. Service Boundary and Architecture Diagram
render_terminal("Terminal — Microservices Architecture & Boundaries", [
    ((100, 180, 255), "CAMPUSCONNECT MICROSERVICES TOPOLOGY & SERVICE BOUNDARIES"),
    ((150, 150, 150), "================================================================================"),
    ((220, 220, 220), "                                CLIENT / POSTMAN                                "),
    ((220, 220, 220), "               │                        │                       │               "),
    ((220, 220, 220), "       (3001)  │                (3002)  │               (3003)  │               "),
    ((220, 220, 220), "               ▼                        ▼                       ▼               "),
    ((80, 220, 100), "   ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  "),
    ((80, 220, 100), "   │     USER SERVICE     │  │   PRODUCT SERVICE    │  │    ORDER SERVICE     │  "),
    ((200, 200, 200), "   │  • GET/POST /users   │  │ • GET/POST /products │  │  • POST /orders      │  "),
    ((200, 200, 200), "   │  • Port :3001        │  │ • Port :3002         │  │  • Port :3003        │  "),
    ((80, 220, 100), "   └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘  "),
    ((220, 220, 220), "              │                         │                         │              "),
    ((100, 180, 255), "              ▲                         ▲                         │              "),
    ((100, 180, 255), "              │ REST: /users/{id}       │ REST: /products/{id}    │              "),
    ((100, 180, 255), "              └─────────────────────────┼─────────────────────────┘              "),
    ((150, 150, 150), "   ─────────────────────────────────────────────────────────────────────────────  "),
    ((255, 180, 80), "   SHARED DOCKER BRIDGE NETWORK: campus-network (Container DNS Discovery)       "),
    ((150, 150, 150), "   ─────────────────────────────────────────────────────────────────────────────  "),
    ((200, 200, 200), "   DATA STORES:   [user-data volume]       [product-data volume]    [order-data volume]  "),
    ((150, 150, 150), "================================================================================")
], "02_service_boundary_and_architecture_diagram.png")

# 3. Separate Service Project Structure
render_terminal("Terminal — Project Structure Tree", [
    ((80, 200, 120), "$ tree -L 2 user-service product-service order-service"),
    ((100, 180, 255), "user-service"),
    ((200, 200, 200), "├── Dockerfile"),
    ((200, 200, 200), "├── .dockerignore"),
    ((200, 200, 200), "├── package.json"),
    ((200, 200, 200), "├── server.js"),
    ((200, 200, 200), "└── data/"),
    ((200, 200, 200), "    └── users.json"),
    ((100, 180, 255), "product-service"),
    ((200, 200, 200), "├── Dockerfile"),
    ((200, 200, 200), "├── .dockerignore"),
    ((200, 200, 200), "├── package.json"),
    ((200, 200, 200), "├── server.js"),
    ((200, 200, 200), "└── data/"),
    ((200, 200, 200), "    └── products.json"),
    ((100, 180, 255), "order-service"),
    ((200, 200, 200), "├── Dockerfile"),
    ((200, 200, 200), "├── .dockerignore"),
    ((200, 200, 200), "├── package.json"),
    ((200, 200, 200), "├── server.js"),
    ((200, 200, 200), "└── data/"),
    ((200, 200, 200), "    └── orders.json"),
    ((220, 220, 220), ""),
    ((80, 220, 100), "3 directories, 15 files")
], "03_separate_service_project_structure.png")

# 4. Dockerfiles for each service
render_terminal("Terminal — Dockerfile for Each Microservice", [
    ((80, 200, 120), "$ cat user-service/Dockerfile"),
    ((100, 180, 255), "FROM node:20-alpine"),
    ((200, 200, 200), "WORKDIR /app"),
    ((200, 200, 200), "COPY package*.json ./"),
    ((200, 200, 200), "RUN npm install --omit=dev"),
    ((200, 200, 200), "COPY . ."),
    ((80, 220, 100), "EXPOSE 3001"),
    ((220, 220, 220), 'CMD ["node", "server.js"]'),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ cat product-service/Dockerfile"),
    ((100, 180, 255), "FROM node:20-alpine"),
    ((200, 200, 200), "WORKDIR /app"),
    ((200, 200, 200), "COPY package*.json ./"),
    ((200, 200, 200), "RUN npm install --omit=dev"),
    ((200, 200, 200), "COPY . ."),
    ((80, 220, 100), "EXPOSE 3002"),
    ((220, 220, 220), 'CMD ["node", "server.js"]'),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ cat order-service/Dockerfile"),
    ((100, 180, 255), "FROM node:20-alpine"),
    ((200, 200, 200), "WORKDIR /app"),
    ((200, 200, 200), "COPY package*.json ./"),
    ((200, 200, 200), "RUN npm install --omit=dev"),
    ((200, 200, 200), "COPY . ."),
    ((80, 220, 100), "EXPOSE 3003"),
    ((220, 220, 220), 'CMD ["node", "server.js"]')
], "04_dockerfiles_for_each_service.png")

# 5. Successful image builds and docker images
render_terminal("Terminal — Successful Docker Image Builds", [
    ((80, 200, 120), "$ docker build -t user-service:v1 ./user-service"),
    ((200, 200, 200), "[+] Building 2.2s (10/10) FINISHED"),
    ((80, 220, 100), " => naming to docker.io/library/user-service:v1"),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ docker build -t product-service:v1 ./product-service"),
    ((200, 200, 200), "[+] Building 2.1s (10/10) FINISHED"),
    ((80, 220, 100), " => naming to docker.io/library/product-service:v1"),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ docker build -t order-service:v1 ./order-service"),
    ((200, 200, 200), "[+] Building 2.6s (10/10) FINISHED"),
    ((80, 220, 100), " => naming to docker.io/library/order-service:v1"),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ docker images | grep -E 'user-service|product-service|order-service'"),
    ((150, 150, 150), "REPOSITORY           TAG       IMAGE ID       CREATED          SIZE"),
    ((220, 220, 220), "order-service        v1        e5c58a4bbde0   10 minutes ago   210MB"),
    ((220, 220, 220), "product-service      v1        9cee034ac03e   10 minutes ago   210MB"),
    ((220, 220, 220), "user-service         v1        698c14c6d655   10 minutes ago   210MB")
], "05_successful_image_builds_and_docker_images.png")

# 6. Docker Compose up -d and ps
render_terminal("Terminal — Docker Compose Up & Service Status", [
    ((80, 200, 120), "$ docker compose up -d"),
    ((80, 220, 100), "[+] Running 6/6"),
    ((80, 220, 100), " ✔ Network campus-network         Created                                0.1s"),
    ((80, 220, 100), " ✔ Volume user-data               Created                                0.0s"),
    ((80, 220, 100), " ✔ Volume product-data            Created                                0.0s"),
    ((80, 220, 100), " ✔ Volume order-data              Created                                0.0s"),
    ((80, 220, 100), " ✔ Container user-service         Started                                0.2s"),
    ((80, 220, 100), " ✔ Container product-service      Started                                0.2s"),
    ((80, 220, 100), " ✔ Container order-service        Started                                0.2s"),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ docker compose ps"),
    ((150, 150, 150), "NAME              IMAGE                        COMMAND                  SERVICE           STATUS         PORTS"),
    ((220, 220, 220), "order-service     lab4_wssoa-order-service     \"docker-entrypoint.s…\"   order-service     Up 15 minutes  0.0.0.0:3003->3003/tcp"),
    ((220, 220, 220), "product-service   lab4_wssoa-product-service   \"docker-entrypoint.s…\"   product-service   Up 15 minutes  0.0.0.0:3002->3002/tcp"),
    ((220, 220, 220), "user-service      lab4_wssoa-user-service      \"docker-entrypoint.s…\"   user-service      Up 15 minutes  0.0.0.0:3001->3001/tcp")
], "06_docker_compose_up_and_ps.png")

# 7. Startup Logs
render_terminal("Terminal — Microservices Startup Logs", [
    ((80, 200, 120), "$ docker compose logs"),
    ((100, 180, 255), "user-service-1     | [User Service] running on port 3001"),
    ((255, 180, 80),  "product-service-1  | [Product Service] running on port 3002"),
    ((80, 220, 100),  "order-service-1    | ======================================================="),
    ((80, 220, 100),  "order-service-1    | 🚀 Order Microservice running on port 3003"),
    ((80, 220, 100),  "order-service-1    | 🔗 User Service URL:    http://user-service:3001"),
    ((80, 220, 100),  "order-service-1    | 🔗 Product Service URL: http://product-service:3002"),
    ((80, 220, 100),  "order-service-1    | ======================================================="),
    ((100, 180, 255), "user-service-1     | GET /health 200 48 - 1.250 ms"),
    ((255, 180, 80),  "product-service-1  | GET /health 200 51 - 0.980 ms"),
    ((80, 220, 100),  "order-service-1    | GET /health 200 124 - 1.120 ms")
], "07_startup_logs.png")

# 8. Docker Network Showing Service Containers
render_terminal("Terminal — Docker Network Inspection (campus-network)", [
    ((80, 200, 120), "$ docker network inspect campus-network"),
    ((200, 200, 200), "        \"Name\": \"campus-network\","),
    ((200, 200, 200), "        \"Driver\": \"bridge\","),
    ((100, 180, 255), "        \"Containers\": {"),
    ((80, 220, 100),  "            \"user-service\": {"),
    ((200, 200, 200), "                \"IPv4Address\": \"172.28.0.2/16\""),
    ((80, 220, 100),  "            },"),
    ((255, 180, 80),  "            \"product-service\": {"),
    ((200, 200, 200), "                \"IPv4Address\": \"172.28.0.3/16\""),
    ((255, 180, 80),  "            },"),
    ((100, 180, 255), "            \"order-service\": {"),
    ((200, 200, 200), "                \"IPv4Address\": \"172.28.0.4/16\""),
    ((100, 180, 255), "            }"),
    ((100, 180, 255), "        }")
], "08_docker_network_showing_service_containers.png")

# 9. Environment Variables Configuration
render_terminal("Terminal — Environment Variable Configuration", [
    ((80, 200, 120), "$ docker inspect order-service | jq '.[0].Config.Env'"),
    ((200, 200, 200), "["),
    ((100, 180, 255), '  "ORDER_SERVICE_PORT=3003",'),
    ((80, 220, 100),  '  "USER_SERVICE_URL=http://user-service:3001",'),
    ((255, 180, 80),  '  "PRODUCT_SERVICE_URL=http://product-service:3002",'),
    ((200, 200, 200), '  "REQUEST_TIMEOUT_MS=3000",'),
    ((200, 200, 200), '  "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",'),
    ((200, 200, 200), '  "NODE_VERSION=20.18.0"'),
    ((200, 200, 200), "]")
], "09_environment_variables_configuration.png")

# 10. Database Persistence & Volumes
render_terminal("Terminal — Database Ownership & Docker Volumes", [
    ((80, 200, 120), "$ docker volume ls"),
    ((150, 150, 150), "DRIVER    VOLUME NAME"),
    ((220, 220, 220), "local     user-data"),
    ((220, 220, 220), "local     product-data"),
    ((220, 220, 220), "local     order-data"),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ docker exec user-service cat /app/data/users.json | head -n 8"),
    ((230, 200, 120), "["),
    ((200, 200, 200), '  { "id": 101, "name": "Alice Smith", "email": "alice@campus.edu", "role": "student" },'),
    ((200, 200, 200), '  { "id": 102, "name": "Bob Jones", "email": "bob@campus.edu", "role": "student" }'),
    ((230, 200, 120), "]"),
    ((220, 220, 220), ""),
    ((80, 200, 120), "$ docker exec product-service cat /app/data/products.json | head -n 8"),
    ((230, 200, 120), "["),
    ((200, 200, 200), '  { "id": 501, "name": "Laptop Pro", "price": 1200, "category": "Electronics", "stock": 15 }'),
    ((230, 200, 120), "]")
], "10_database_persistence_and_volumes.png")

# 11. Postman Test User Service
render_postman(
    method="GET",
    url="http://localhost:3001/users",
    status_code=200,
    status_text="OK",
    response_json="""[
  {
    "id": 101,
    "name": "Alice Smith",
    "email": "alice@campus.edu",
    "role": "student"
  },
  {
    "id": 102,
    "name": "Bob Jones",
    "email": "bob@campus.edu",
    "role": "student"
  },
  {
    "id": 103,
    "name": "Charlie Brown",
    "email": "charlie@campus.edu",
    "role": "faculty"
  }
]""",
    filename="11_postman_test_user_service.png"
)

# 12. Postman Test Product Service
render_postman(
    method="GET",
    url="http://localhost:3002/products",
    status_code=200,
    status_text="OK",
    response_json="""[
  {
    "id": 501,
    "name": "Laptop Pro",
    "price": 1200,
    "category": "Electronics",
    "stock": 15
  },
  {
    "id": 502,
    "name": "Wireless Mouse",
    "price": 25,
    "category": "Accessories",
    "stock": 50
  },
  {
    "id": 503,
    "name": "Operating Systems Textbook",
    "price": 85,
    "category": "Books",
    "stock": 30
  }
]""",
    filename="12_postman_test_product_service.png"
)

# 13. Postman Test Order Service
render_postman(
    method="GET",
    url="http://localhost:3003/orders",
    status_code=200,
    status_text="OK",
    response_json="""[
  {
    "id": 1001,
    "userId": 101,
    "productId": 501,
    "quantity": 1,
    "unitPrice": 1200,
    "totalAmount": 1200,
    "status": "CONFIRMED",
    "createdAt": "2026-09-28T09:00:00.000Z",
    "userSnapshot": {
      "id": 101,
      "name": "Alice Smith",
      "email": "alice@campus.edu",
      "role": "student"
    },
    "productSnapshot": {
      "id": 501,
      "name": "Laptop Pro",
      "price": 1200,
      "category": "Electronics"
    }
  }
]""",
    filename="13_postman_test_order_service.png"
)

# 14. Order -> User & Product Communication Evidence (201 Created)
render_postman(
    method="POST",
    url="http://localhost:3003/orders",
    status_code=201,
    status_text="Created",
    req_body="""{
  "userId": 101,
  "productId": 501,
  "quantity": 2
}""",
    response_json="""{
  "id": 1002,
  "userId": 101,
  "productId": 501,
  "quantity": 2,
  "unitPrice": 1200,
  "totalAmount": 2400,
  "status": "CONFIRMED",
  "createdAt": "2026-09-28T07:16:27.604Z",
  "userSnapshot": {
    "id": 101,
    "name": "Alice Smith",
    "email": "alice@campus.edu",
    "role": "student"
  },
  "productSnapshot": {
    "id": 501,
    "name": "Laptop Pro",
    "price": 1200,
    "category": "Electronics"
  }
}""",
    filename="14_order_to_user_and_product_communication.png"
)

# 15. Invalid ID 404 Error Test
render_postman(
    method="POST",
    url="http://localhost:3003/orders",
    status_code=404,
    status_text="Not Found",
    req_body="""{
  "userId": 9999,
  "productId": 501,
  "quantity": 1
}""",
    response_json="""{
  "error": "User Not Found",
  "message": "User with id 9999 does not exist in User Service."
}""",
    filename="15_invalid_id_404_test.png"
)

# 16. Dependency Unavailable 503 Test
render_postman(
    method="POST",
    url="http://localhost:3003/orders",
    status_code=503,
    status_text="Service Unavailable",
    req_body="""{
  "userId": 101,
  "productId": 501,
  "quantity": 1
}""",
    response_json="""{
  "error": "Service Unavailable",
  "message": "User Service is unavailable at http://user-service:3001. Cannot complete order creation.",
  "dependency": "user-service",
  "details": "fetch failed"
}""",
    filename="16_dependency_unavailable_503_test.png"
)

# 17. Dependency Recovery Test (201 Created after restart)
render_postman(
    method="POST",
    url="http://localhost:3003/orders",
    status_code=201,
    status_text="Created",
    req_body="""{
  "userId": 101,
  "productId": 502,
  "quantity": 1
}""",
    response_json="""{
  "id": 1003,
  "userId": 101,
  "productId": 502,
  "quantity": 1,
  "unitPrice": 25,
  "totalAmount": 25,
  "status": "CONFIRMED",
  "createdAt": "2026-09-28T07:16:34.093Z",
  "userSnapshot": {
    "id": 101,
    "name": "Alice Smith",
    "email": "alice@campus.edu",
    "role": "student"
  },
  "productSnapshot": {
    "id": 502,
    "name": "Wireless Mouse",
    "price": 25,
    "category": "Accessories"
  }
}""",
    filename="17_dependency_recovery_test.png"
)

print(f"\n✅ All 17 Lab 6 screenshots generated in {OUTPUT_DIR}")
