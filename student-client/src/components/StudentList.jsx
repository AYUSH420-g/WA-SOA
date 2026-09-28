import React, { useState } from 'react';
import { fetchStudentById } from '../services/api';

export default function StudentList({ students, loading, error, onEdit, onDelete, onRetry }) {
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const idToFind = searchId.trim();
    if (!idToFind) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const student = await fetchStudentById(idToFind);
      setSearchResult(student);
    } catch (err) {
      if (err.status === 404) {
        setSearchError('Student not found');
      } else {
        setSearchError(err.message || 'Unable to load data. Please try again.');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchId('');
    setSearchResult(null);
    setSearchError(null);
  };

  if (loading) {
    return (
      <div className="card list-card">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading students from MongoDB API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card list-card">
        <div className="alert alert-error">
          <h4>❌ Connection Error</h4>
          <p>{error || 'Unable to load data. Please try again.'}</p>
          <button className="btn btn-secondary btn-sm mt-2" onClick={onRetry}>
            🔄 Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card list-card">
      <div className="card-header list-header">
        <div className="header-title-row">
          <h3>📋 Enrolled Students ({students.length})</h3>
        </div>
        {/* Search by ID form to exercise GET /students/{id} and test 404 states */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by Student ID (e.g. 999 or MongoDB _id)..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={searchLoading}>
            {searchLoading ? 'Searching...' : '🔍 Find'}
          </button>
          {(searchResult || searchError || searchId) && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearSearch}>
              Clear
            </button>
          )}
        </form>
      </div>

      {/* 404 Not Found & Other Search Feedback */}
      {searchError && (
        <div className="search-feedback alert alert-error">
          <strong>⚠️ {searchError}</strong> (HTTP 404 / Service Contract)
        </div>
      )}

      {/* Search Result Card when single student found */}
      {searchResult && (
        <div className="search-feedback search-result-card">
          <div className="result-header">
            <h4>✅ Student Record Found (GET /students/{searchResult.id})</h4>
            <button className="btn btn-edit btn-sm" onClick={() => onEdit(searchResult)}>
              ✏️ Edit
            </button>
          </div>
          <p><strong>Name:</strong> {searchResult.name}</p>
          <p><strong>Email:</strong> {searchResult.email}</p>
          <p><strong>Course:</strong> {searchResult.course} | <strong>Semester:</strong> Sem {searchResult.semester}</p>
          <small className="font-mono text-muted">ID: {searchResult.id}</small>
        </div>
      )}

      {students.length === 0 ? (
        <div className="empty-state">
          <p>No student records found in database.</p>
          <small>Use the form to add a new student record.</small>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="student-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Semester</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id || student._id}>
                  <td className="font-mono text-muted">{student.id || student._id}</td>
                  <td className="font-semibold">{student.name}</td>
                  <td>
                    <a href={`mailto:${student.email}`} className="email-link">
                      {student.email}
                    </a>
                  </td>
                  <td>
                    <span className="badge badge-course">{student.course}</span>
                  </td>
                  <td>
                    <span className="badge badge-sem">Sem {student.semester}</span>
                  </td>
                  <td className="text-center actions-cell">
                    <button
                      className="btn btn-edit btn-sm"
                      onClick={() => onEdit(student)}
                      title="Edit student record"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-delete btn-sm"
                      onClick={() => onDelete(student.id || student._id, student.name)}
                      title="Delete student record"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
