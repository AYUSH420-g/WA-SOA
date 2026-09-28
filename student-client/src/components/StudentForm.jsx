import React, { useState, useEffect } from 'react';

export default function StudentForm({ selectedStudent, onSubmitSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    semester: 1
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        name: selectedStudent.name || '',
        email: selectedStudent.email || '',
        course: selectedStudent.course || '',
        semester: selectedStudent.semester || 1
      });
    } else {
      setFormData({
        name: '',
        email: '',
        course: '',
        semester: 1
      });
    }
    setErrors({});
    setApiError(null);
  }, [selectedStudent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? parseInt(value, 10) || '' : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateClientSide = () => {
    const newErrors = {};
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Valid email address is required (e.g., student@example.com)';
    }

    if (!formData.course || !formData.course.trim()) {
      newErrors.course = 'Course is required';
    }

    const semNum = Number(formData.semester);
    if (!formData.semester || isNaN(semNum) || semNum < 1) {
      newErrors.semester = 'Semester must be a positive integer (e.g., 1, 2, 3...)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateClientSide()) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmitSuccess(formData, selectedStudent ? selectedStudent.id : null);
      setFormData({ name: '', email: '', course: '', semester: 1 });
      setErrors({});
    } catch (err) {
      if (err.status === 400 && err.details) {
        const backendErrors = {};
        err.details.forEach((d) => {
          backendErrors[d.field] = d.message;
        });
        setErrors(backendErrors);
        setApiError(err.message || 'Validation error from API server (400 Bad Request)');
      } else {
        setApiError(err.message || 'An error occurred while saving student.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-header">
        <h3>{selectedStudent ? '✏️ Edit Student' : '➕ Add New Student'}</h3>
      </div>
      <form onSubmit={handleSubmit} noValidate className="student-form">
        {apiError && (
          <div className="alert alert-error">
            <strong>HTTP Error:</strong> {apiError}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Aarav Patel"
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. aarav@example.com"
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-row">
          <div className="form-group col">
            <label htmlFor="course">Course *</label>
            <input
              type="text"
              id="course"
              name="course"
              value={formData.course}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              className={errors.course ? 'input-error' : ''}
            />
            {errors.course && <span className="error-text">{errors.course}</span>}
          </div>

          <div className="form-group col">
            <label htmlFor="semester">Semester *</label>
            <input
              type="number"
              id="semester"
              name="semester"
              min="1"
              max="12"
              value={formData.semester}
              onChange={handleChange}
              className={errors.semester ? 'input-error' : ''}
            />
            {errors.semester && <span className="error-text">{errors.semester}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : selectedStudent ? 'Update Student' : 'Add Student'}
          </button>
          {selectedStudent && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
