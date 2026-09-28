/**
 * Student Controller Layer
 * Receives incoming HTTP requests, interacts with StudentService, and returns RESTful responses.
 */

const studentService = require('../services/studentService');

class StudentController {
  /**
   * GET /students
   * List all students.
   */
  async getAllStudents(req, res, next) {
    try {
      const students = await studentService.getAllStudents();
      res.status(200).json({
        status: 200,
        message: 'Successfully retrieved all students',
        count: students.length,
        data: students
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /students/:id
   * Retrieve a specific student by ID.
   */
  async getStudentById(req, res, next) {
    try {
      const student = await studentService.getStudentById(req.params.id);
      res.status(200).json({
        status: 200,
        message: `Successfully retrieved student with ID ${req.params.id}`,
        data: student
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /students
   * Create a new student resource.
   */
  async createStudent(req, res, next) {
    try {
      const newStudent = await studentService.createStudent(req.body);
      res.status(201).json({
        status: 201,
        message: 'Student created successfully',
        data: newStudent
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /students/:id or PATCH /students/:id
   * Update an existing student resource.
   */
  async updateStudent(req, res, next) {
    try {
      const updatedStudent = await studentService.updateStudent(req.params.id, req.body);
      res.status(200).json({
        status: 200,
        message: `Student with ID ${req.params.id} updated successfully`,
        data: updatedStudent
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /students/:id
   * Remove a student resource.
   */
  async deleteStudent(req, res, next) {
    try {
      await studentService.deleteStudent(req.params.id);
      res.status(200).json({
        status: 200,
        message: `Student with ID ${req.params.id} was successfully deleted`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController();
