package com.example.studentapi.repository;

import com.example.studentapi.model.Student;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Student Repository Layer
 * Manages in-memory data storage for Student resources.
 */
@Repository
public class StudentRepository {

    private final ConcurrentHashMap<Long, Student> store = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public StudentRepository() {
        // Pre-seed initial student records
        save(new Student(null, "Aarav Patel", "aarav@example.com", "Computer Science", 5));
        save(new Student(null, "Priya Sharma", "priya@example.com", "Information Technology", 3));
        save(new Student(null, "Rohan Verma", "rohan@example.com", "Software Engineering", 4));
    }

    /**
     * Find all students.
     */
    public List<Student> findAll() {
        return new ArrayList<>(store.values());
    }

    /**
     * Find a student by ID.
     */
    public Optional<Student> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    /**
     * Save/create a student.
     */
    public Student save(Student student) {
        if (student.getId() == null) {
            student.setId(idGenerator.getAndIncrement());
        }
        store.put(student.getId(), student);
        return student;
    }
}
