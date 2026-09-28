import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import { fetchAllStudents, createStudent, updateStudent, deleteStudent } from './services/api';
import './App.css';

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err.message || 'Unable to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleFormSubmit = async (formData, studentId) => {
    if (studentId) {
      // Edit existing student (PUT /students/:id)
      const updated = await updateStudent(studentId, formData);
      showNotification(`Student "${updated.name}" updated successfully!`, 'success');
      setSelectedStudent(null);
    } else {
      // Create new student (POST /students)
      const created = await createStudent(formData);
      showNotification(`Student "${created.name}" created successfully!`, 'success');
    }
    await loadStudents(); // Refresh from DB
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to delete student "${studentName}"?`)) {
      try {
        await deleteStudent(studentId);
        showNotification(`Student "${studentName}" was successfully deleted.`, 'success');
        if (selectedStudent && selectedStudent.id === studentId) {
          setSelectedStudent(null);
        }
        await loadStudents(); // Refresh from DB
      } catch (err) {
        showNotification(err.message || 'Failed to delete student', 'error');
      }
    }
  };

  const handleCancelEdit = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="app-container">
      <Navbar studentCount={students.length} />

      <main className="content-container">
        {notification && (
          <div className={`toast toast-${notification.type}`}>
            {notification.type === 'success' ? '✅' : '❌'} {notification.message}
          </div>
        )}

        <div className="grid-layout">
          <div className="form-column">
            <StudentForm
              selectedStudent={selectedStudent}
              onSubmitSuccess={handleFormSubmit}
              onCancel={handleCancelEdit}
            />
          </div>

          <div className="list-column">
            <StudentList
              students={students}
              loading={loading}
              error={error}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onRetry={loadStudents}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Lab 4 Multi-Client SOA Architecture — React Client ↔ Node Express API ↔ MongoDB Atlas</p>
      </footer>
    </div>
  );
}
