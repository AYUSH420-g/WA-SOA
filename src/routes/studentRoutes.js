/**
 * Student Express Router
 * Maps REST verbs and endpoints to validation middlewares and controller methods.
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateCreateStudent, validateUpdateStudent } = require('../middlewares/validation');

// GET /students - List all students
router.get('/', studentController.getAllStudents);

// GET /students/:id - Get student by ID
router.get('/:id', studentController.getStudentById);

// POST /students - Create a new student
router.post('/', validateCreateStudent, studentController.createStudent);

// PUT /students/:id - Replace / Update student by ID
router.put('/:id', validateUpdateStudent, studentController.updateStudent);

// PATCH /students/:id - Partially update student by ID
router.patch('/:id', validateUpdateStudent, studentController.updateStudent);

// DELETE /students/:id - Delete student by ID
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
