/**
 * REST API Service Client
 * Handles HTTP requests to Express.js / MongoDB backend.
 * Uses configurable API_BASE_URL constant.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function fetchAllStudents() {
  const response = await fetch(`${API_BASE_URL}/students`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch students from API');
  }
  return data.data || [];
}

export async function fetchStudentById(id) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`);
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Student not found');
    error.status = response.status;
    error.details = data.details;
    throw error;
  }
  return data.data;
}

export async function createStudent(studentData) {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(studentData)
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to create student');
    error.status = response.status;
    error.details = data.details || [];
    throw error;
  }
  return data.data;
}

export async function updateStudent(id, studentData) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(studentData)
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update student');
    error.status = response.status;
    error.details = data.details || [];
    throw error;
  }
  return data.data;
}

export async function deleteStudent(id) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: 'DELETE'
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to delete student');
    error.status = response.status;
    throw error;
  }
  return data;
}

export { API_BASE_URL };
