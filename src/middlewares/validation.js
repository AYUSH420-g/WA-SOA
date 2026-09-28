/**
 * Request Input Validation Middleware
 * Validates request payload against required schema rules.
 */

/**
 * Helper to validate email format using basic regex
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate POST request body for creating a student
 */
function validateCreateStudent(req, res, next) {
  const { name, email, course, semester } = req.body || {};
  const errors = [];

  // Validate Name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required and cannot be empty' });
  }

  // Validate Email
  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required (e.g., user@example.com)' });
  }

  // Validate Course
  if (!course || typeof course !== 'string' || course.trim() === '') {
    errors.push({ field: 'course', message: 'Course is required and cannot be empty' });
  }

  // Validate Semester
  const semNum = Number(semester);
  if (semester === undefined || semester === null || isNaN(semNum) || !Number.isInteger(semNum) || semNum < 1) {
    errors.push({ field: 'semester', message: 'Semester must be a positive integer (e.g., 1, 2, 3...)' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Validation failed for student creation payload',
      details: errors
    });
  }

  next();
}

/**
 * Validate PUT/PATCH request body for updating a student
 */
function validateUpdateStudent(req, res, next) {
  const { name, email, course, semester } = req.body || {};
  const errors = [];

  if (Object.keys(req.body || {}).length === 0) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Request body cannot be empty for update operation'
    });
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      errors.push({ field: 'name', message: 'Name cannot be empty if provided' });
    }
  }

  if (email !== undefined) {
    if (!isValidEmail(email)) {
      errors.push({ field: 'email', message: 'Provided email format is invalid' });
    }
  }

  if (course !== undefined) {
    if (typeof course !== 'string' || course.trim() === '') {
      errors.push({ field: 'course', message: 'Course cannot be empty if provided' });
    }
  }

  if (semester !== undefined) {
    const semNum = Number(semester);
    if (isNaN(semNum) || !Number.isInteger(semNum) || semNum < 1) {
      errors.push({ field: 'semester', message: 'Semester must be a positive integer (e.g., 1, 2, 3...)' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: 'Validation failed for student update payload',
      details: errors
    });
  }

  next();
}

module.exports = {
  validateCreateStudent,
  validateUpdateStudent
};
