/**
 * Student Repository Layer
 * Interacts with MongoDB Atlas via Mongoose models.
 * Includes in-memory fallback when database is not connected.
 */

const mongoose = require('mongoose');
const Student = require('../models/studentModel');

// In-memory fallback data store for testing when offline/dummy URI
let inMemoryStudents = [
  {
    id: "1",
    name: "Aarav Patel",
    email: "aarav@example.com",
    course: "Computer Science",
    semester: 5
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya@example.com",
    course: "Information Technology",
    semester: 3
  },
  {
    id: "3",
    name: "Rohan Verma",
    email: "rohan@example.com",
    course: "Software Engineering",
    semester: 4
  }
];
let nextFallbackId = 4;

class StudentRepository {
  /**
   * Check if MongoDB is currently connected
   */
  isDbConnected() {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Fetch all students from MongoDB.
   * @returns {Promise<Array>} List of all student documents.
   */
  async findAll() {
    if (this.isDbConnected()) {
      return await Student.find({}).sort({ createdAt: -1 });
    }
    return inMemoryStudents;
  }

  /**
   * Find a student by unique ID.
   * @param {string|number} id - Student ID or ObjectId
   * @returns {Promise<Object|null>} Student document or null if not found
   */
  async findById(id) {
    if (this.isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      return await Student.findById(id);
    }
    const student = inMemoryStudents.find(s => String(s.id) === String(id));
    return student || null;
  }

  /**
   * Create a new student in MongoDB.
   * @param {Object} studentData - Data for new student
   * @returns {Promise<Object>} Newly created student document
   */
  async create(studentData) {
    if (this.isDbConnected()) {
      const student = new Student({
        name: studentData.name.trim(),
        email: studentData.email.trim(),
        course: studentData.course.trim(),
        semester: parseInt(studentData.semester, 10)
      });
      return await student.save();
    }

    // Duplicate email check for in-memory fallback
    const exists = inMemoryStudents.some(s => s.email.toLowerCase() === studentData.email.trim().toLowerCase());
    if (exists) {
      const err = new Error('E11000 duplicate key error collection: students index: email_1 dup key');
      err.code = 11000;
      throw err;
    }

    const newStudent = {
      id: String(nextFallbackId++),
      name: studentData.name.trim(),
      email: studentData.email.trim(),
      course: studentData.course.trim(),
      semester: parseInt(studentData.semester, 10)
    };
    inMemoryStudents.push(newStudent);
    return newStudent;
  }

  /**
   * Update an existing student by ID.
   * @param {string|number} id - Student ID
   * @param {Object} updateData - Updated attributes
   * @returns {Promise<Object|null>} Updated student document or null if not found
   */
  async update(id, updateData) {
    if (this.isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const fieldsToUpdate = {};
      if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name.trim();
      if (updateData.email !== undefined) fieldsToUpdate.email = updateData.email.trim();
      if (updateData.course !== undefined) fieldsToUpdate.course = updateData.course.trim();
      if (updateData.semester !== undefined) fieldsToUpdate.semester = parseInt(updateData.semester, 10);

      return await Student.findByIdAndUpdate(id, fieldsToUpdate, {
        returnDocument: 'after',
        runValidators: true
      });
    }

    const index = inMemoryStudents.findIndex(s => String(s.id) === String(id));
    if (index === -1) return null;

    const existing = inMemoryStudents[index];
    inMemoryStudents[index] = {
      ...existing,
      name: updateData.name !== undefined ? updateData.name.trim() : existing.name,
      email: updateData.email !== undefined ? updateData.email.trim() : existing.email,
      course: updateData.course !== undefined ? updateData.course.trim() : existing.course,
      semester: updateData.semester !== undefined ? parseInt(updateData.semester, 10) : existing.semester
    };

    return inMemoryStudents[index];
  }

  /**
   * Delete a student by ID.
   * @param {string|number} id - Student ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    if (this.isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const result = await Student.findByIdAndDelete(id);
      return result !== null;
    }

    const index = inMemoryStudents.findIndex(s => String(s.id) === String(id));
    if (index === -1) return false;
    inMemoryStudents.splice(index, 1);
    return true;
  }
}

module.exports = new StudentRepository();
