package com.example.studentapi.service;

import com.example.studentapi.model.Student;
import com.example.studentapi.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Student Service Layer
 * Coordinates business logic between Controller and Repository layers.
 */
@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    /**
     * API 1 Service: Retrieve all students.
     */
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    /**
     * API 2 Service: Retrieve student by ID.
     */
    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, 
                        "Student with ID " + id + " not found"
                ));
    }

    /**
     * API 3 Service: Create new student.
     */
    public Student createStudent(Student student) {
        student.setId(null); // Ensure auto-generated ID
        return studentRepository.save(student);
    }
}
