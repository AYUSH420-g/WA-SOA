# Spring Boot Equivalent Student REST API (Lab 3 Part B)

**Folder Location:** `/Users/ayush/Desktop/lab3/springboot-student-api`  
**Technology Stack:** Java 17, Spring Boot 3.2.3, Maven, Springdoc OpenAPI (Swagger UI)  
**Architecture Pattern:** `@RestController` → `@Service` → `@Repository`

---

## 🎯 Project Overview

This subfolder contains a complete Spring Boot application implementing Part B of the Lab 3 Assignment. It demonstrates how the equivalent **Controller → Service → Repository** architecture is constructed in Spring Boot to expose 3 core RESTful APIs.

### 🚀 3 Implemented APIs

| API # | HTTP Method | Endpoint | Description | Success Status | Error Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API 1** | `GET` | `/students` | List all student records | `200 OK` | `500` |
| **API 2** | `GET` | `/students/{id}` | Retrieve student by ID | `200 OK` | `404 Not Found` |
| **API 3** | `POST` | `/students` | Create new student resource | `201 Created` | `400 Bad Request` |

---

## 🏗️ Architecture & Component Trace

```text
HTTP Request  ──►  StudentController (@RestController)
                          │
                          ▼
                   StudentService (@Service)
                          │
                          ▼
                   StudentRepository (@Repository) ──► ConcurrentHashMap (In-Memory)
```

1. **`StudentController.java` (`@RestController`)**: Handles HTTP requests, maps routes (`@GetMapping`, `@PostMapping`), and validates input body payloads (`@Valid`).
2. **`StudentService.java` (`@Service`)**: Contains core business logic and throws `ResponseStatusException` (e.g. 404 if student does not exist).
3. **`StudentRepository.java` (`@Repository`)**: In-memory data store using `ConcurrentHashMap` with seeded mock data.
4. **`GlobalExceptionHandler.java` (`@RestControllerAdvice`)**: Captures validation exceptions (`MethodArgumentNotValidException`) and transforms them into clean JSON `400 Bad Request` responses.

---

## 💻 How to Run (Maven & Java 17)

1. **Navigate to the folder:**
   ```bash
   cd /Users/ayush/Desktop/lab3/springboot-student-api
   ```
2. **Build the project:**
   ```bash
   mvn clean package
   ```
3. **Run the Spring Boot application:**
   ```bash
   mvn spring-boot:run
   ```
   *or run the JAR:*
   ```bash
   java -jar target/student-api-1.0.0.jar
   ```
4. **Access the application:**
   - Base API URL: `http://localhost:8080`
   - Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`

---

## 🧪 Sample cURL Commands

### 1. API 1: List all students (GET `/students`)
```bash
curl -X GET http://localhost:8080/students
```
**Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "name": "Aarav Patel",
    "email": "aarav@example.com",
    "course": "Computer Science",
    "semester": 5
  },
  {
    "id": 2,
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "course": "Information Technology",
    "semester": 3
  }
]
```

### 2. API 2: Get student by ID (GET `/students/1`)
```bash
curl -X GET http://localhost:8080/students/1
```
**Response (`200 OK`):**
```json
{
  "id": 1,
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "course": "Computer Science",
  "semester": 5
}
```

### 3. API 3: Create student (POST `/students`)
```bash
curl -X POST http://localhost:8080/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aarav Patel",
    "email": "aarav@example.com",
    "course": "Computer Science",
    "semester": 5
  }'
```
**Response (`201 Created`):**
```json
{
  "id": 4,
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "course": "Computer Science",
  "semester": 5
}
```

### 4. Negative Test: Invalid POST payload (POST `/students`)
```bash
curl -X POST http://localhost:8080/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "invalid-email",
    "semester": -2
  }'
```
**Response (`400 Bad Request`):**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for request payload",
  "details": [
    "name: Name is required and cannot be empty",
    "email: A valid email address is required (e.g., user@example.com)",
    "semester: Semester must be a positive integer >= 1"
  ]
}
```
