package com.example.studentapi.controller;

import com.example.studentapi.model.Student;
import com.example.studentapi.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Student REST Controller Layer
 * Implements 3 core RESTful API endpoints for the Student resource.
 */
@RestController
@RequestMapping("/students")
@Tag(name = "Student Controller", description = "Endpoints for managing student resources")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    /**
     * API 1: List all students
     * HTTP GET /students -> 200 OK
     */
    @GetMapping
    @Operation(summary = "List all students", description = "Retrieves a complete list of student records.")
    public ResponseEntity<List<Student>> getAllStudents() {
        List<Student> students = studentService.getAllStudents();
        return ResponseEntity.ok(students);
    }

    /**
     * API 2: Get student by ID
     * HTTP GET /students/{id} -> 200 OK / 404 Not Found
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get student by ID", description = "Retrieves a single student record matching the specified ID.")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        Student student = studentService.getStudentById(id);
        return ResponseEntity.ok(student);
    }

    /**
     * API 3: Create a new student
     * HTTP POST /students -> 201 Created / 400 Bad Request
     */
    @PostMapping
    @Operation(summary = "Create a new student", description = "Validates JSON payload and creates a new student resource.")
    public ResponseEntity<Student> createStudent(@Valid @RequestBody Student student) {
        Student createdStudent = studentService.createStudent(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdStudent);
    }
}
