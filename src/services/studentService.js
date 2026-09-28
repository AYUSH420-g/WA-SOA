/**
 * Student Service Layer
 * Contains business logic and orchestrates Mongoose data access calls.
 */

const studentRepository = require('../repositories/studentRepository');

class StudentService {
  /**
   * Get all students.
   * @returns {Promise<Array>} List of students
   */
  async getAllStudents() {
    return await studentRepository.findAll();
  }

  /**
   * Get student by ID.
   * @param {string|number} id - Student ID
   * @returns {Promise<Object>} Student object
   * @throws {Error} 404 if student not found
   */
  async getStudentById(id) {
    const student = await studentRepository.findById(id);
    if (!student) {
      const err = new Error(`Student with ID ${id} not found`);
      err.status = 404;
      throw err;
    }
    return student;
  }

  /**
   * Create new student.
   * @param {Object} studentData - Student payload
   * @returns {Promise<Object>} Created student
   */
  async createStudent(studentData) {
    try {
      return await studentRepository.create(studentData);
    } catch (error) {
      if (error.code === 11000) {
        const err = new Error('Student with this email address already exists');
        err.status = 400;
        err.details = [{ field: 'email', message: 'Email address must be unique' }];
        throw err;
      }
      throw error;
    }
  }

  /**
   * Update student by ID.
   * @param {string|number} id - Student ID
   * @param {Object} updateData - Updated fields
   * @returns {Promise<Object>} Updated student
   */
  async updateStudent(id, updateData) {
    await this.getStudentById(id); // Ensures existence check (throws 404 if missing)
    try {
      return await studentRepository.update(id, updateData);
    } catch (error) {
      if (error.code === 11000) {
        const err = new Error('Student with this email address already exists');
        err.status = 400;
        err.details = [{ field: 'email', message: 'Email address must be unique' }];
        throw err;
      }
      throw error;
    }
  }

  /**
   * Delete student by ID.
   * @param {string|number} id - Student ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteStudent(id) {
    await this.getStudentById(id); // Ensures existence check (throws 404 if missing)
    return await studentRepository.delete(id);
  }
}

module.exports = new StudentService();
