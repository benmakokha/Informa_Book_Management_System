import React, { useState, useEffect, useCallback } from 'react';

//  API URL
const API_URL = 'http://localhost:5000';

function Dashboard({ user, token, onLogout }) {
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('view');
  const [newBook, setNewBook] = useState({ title: '', author: '', recommendation: '', published_year: '' }); // Changed from isbn
  const [editingBook, setEditingBook] = useState(null); // State to hold the book being edited
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Helper function to set authorization headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Function to fetch books from the backend
  const fetchBooks = useCallback(async () => {
    setMessage('');
    setIsSuccess(false);
    try {
      const response = await fetch(`${API_URL}/books`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (response.ok) {
        setBooks(data);
      } else if (response.status === 401 || response.status === 403) {
        setMessage('Session expired or unauthorized. Please log in again.');
        setIsSuccess(false);
        setTimeout(onLogout, 2000);
      } else {
        setMessage(data.message || 'Failed to fetch books.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setMessage('Network error. Could not fetch books.');
      setIsSuccess(false);
    }
  }, [token, onLogout]);

  // Fetch books when the component mounts or token changes
  useEffect(() => {
    if (token) {
      fetchBooks();
    }
  }, [token, fetchBooks]);

  // Handle input changes for the Add Book form
  const handleNewBookChange = (e) => {
    const { name, value } = e.target;
    setNewBook(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding a new book
  const handleAddBook = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    try {
      const response = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newBook, added_by_user_id: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        setNewBook({ title: '', author: '', recommendation: '', published_year: '' }); // Changed from isbn
        fetchBooks();
        setActiveTab('view');
      } else if (response.status === 401 || response.status === 403) {
        setMessage('Session expired or unauthorized. Please log in again.');
        setIsSuccess(false);
        setTimeout(onLogout, 2000);
      } else {
        setMessage(data.message || 'Failed to add book.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      setMessage('Network error. Could not add book.');
      setIsSuccess(false);
    }
  };

  // Handle click on 'Edit' button
  const handleEditClick = (book) => {
    setEditingBook({ ...book }); // Set the book data to the editing state
    setActiveTab('view'); // Stay on view tab, but show edit form
    setMessage('');
    setIsSuccess(false);
  };

  // Handle changes in the Edit Book form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingBook(prev => ({ ...prev, [name]: value }));
  };

  // Handle updating the book
  const handleUpdateBook = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (!editingBook || !editingBook.id) {
      setMessage('No book selected for editing.');
      setIsSuccess(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/books/${editingBook.id}`, {
        method: 'PUT', // Use PUT for updates
        headers: getAuthHeaders(),
        body: JSON.stringify(editingBook),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        setEditingBook(null); // Clear editing state
        fetchBooks(); // Refresh book list
      } else if (response.status === 401 || response.status === 403) {
        setMessage('Session expired or unauthorized. Please log in again.');
        setIsSuccess(false);
        setTimeout(onLogout, 2000);
      } else {
        setMessage(data.message || 'Failed to update book.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      setMessage('Network error. Could not update book.');
      setIsSuccess(false);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingBook(null);
    setMessage('');
    setIsSuccess(false);
  };

  // Handle deleting a book
  const handleDeleteBook = async (bookId) => {
    setMessage('');
    setIsSuccess(false);

    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        fetchBooks();
      } else if (response.status === 401 || response.status === 403) {
        setMessage('Session expired or unauthorized. Please log in again.');
        setIsSuccess(false);
        setTimeout(onLogout, 2000);
      } else {
        setMessage(data.message || 'Failed to delete book.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      setMessage('Network error. Could not delete book.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      {/* Dashboard Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark rounded-pill shadow-sm mb-4 mx-auto" style={{ maxWidth: '90%' }}>
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-warning ms-3" href="#">Employee Books Dashboard</a>
          <div className="d-flex align-items-center me-3">
            {user && (
              <span className="navbar-text text-white me-3 fw-semibold">
                Welcome back, <span className="text-info">@{user.username}</span>!
              </span>
            )}
            <button
              onClick={onLogout}
              className="btn btn-outline-light rounded-pill px-3 py-2"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="row justify-content-center">
        <div className="col-lg-10 col-md-12">
          <div className="card shadow-lg rounded-4 border-0 p-4">
            {/* Navigation Tabs */}
            <ul className="nav nav-pills nav-fill mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link rounded-pill fw-bold ${activeTab === 'view' ? 'active bg-primary text-white' : 'text-secondary'}`}
                  onClick={() => { setActiveTab('view'); setEditingBook(null); }} // Clear editing state on tab change
                >
                  View Books
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link rounded-pill fw-bold ${activeTab === 'add' ? 'active bg-success text-white' : 'text-secondary'}`}
                  onClick={() => { setActiveTab('add'); setEditingBook(null); }} // Clear editing state on tab change
                >
                  Add New Book
                </button>
              </li>
            </ul>

            {/* Message Display */}
            {message && (
              <div
                className={`alert mt-3 text-center rounded-pill ${isSuccess ? 'alert-success' : 'alert-danger'}`}
                role="alert"
              >
                {message}
              </div>
            )}

            {/* Conditional Rendering of Content */}
            {activeTab === 'view' && (
              <div className="view-books-section">
                <h3 className="mb-4 text-primary text-center">Available Books</h3>
                {editingBook && (
                  <div className="edit-book-form-section mb-5 p-4 border rounded-3 bg-light">
                    <h4 className="mb-4 text-warning text-center">Edit Book: {editingBook.title}</h4>
                    <form onSubmit={handleUpdateBook}>
                      <div className="mb-3">
                        <label htmlFor="editTitle" className="form-label">Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-pill px-3"
                          id="editTitle"
                          name="title"
                          value={editingBook.title || ''}
                          onChange={handleEditChange}
                          required
                          placeholder="e.g., The Great Gatsby"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="editAuthor" className="form-label">Author <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-pill px-3"
                          id="editAuthor"
                          name="author"
                          value={editingBook.author || ''}
                          onChange={handleEditChange}
                          required
                          placeholder="e.g., F. Scott Fitzgerald"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="editRecommendation" className="form-label">Recommendation (Optional)</label> {/* Changed label */}
                        <input
                          type="text"
                          className="form-control rounded-pill px-3"
                          id="editRecommendation"
                          name="recommendation" // Changed name
                          value={editingBook.recommendation || ''} // Changed from isbn
                          onChange={handleEditChange}
                          placeholder="e.g., 978-0743273565"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="editPublishedYear" className="form-label">Published Year (Optional)</label>
                        <input
                          type="number"
                          className="form-control rounded-pill px-3"
                          id="editPublishedYear"
                          name="published_year"
                          value={editingBook.published_year || ''}
                          onChange={handleEditChange}
                          placeholder="e.g., 1925"
                        />
                      </div>
                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className="btn btn-secondary rounded-pill py-2 px-4 fw-bold shadow-sm me-2"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-warning rounded-pill py-2 px-4 fw-bold shadow-sm"
                        >
                          Update Book
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                {books.length === 0 ? (
                  <p className="text-center text-muted">No books found. Add some!</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover table-striped align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Title</th>
                          <th scope="col">Author</th>
                          <th scope="col">Recommendation</th> {/* Changed header */}
                          <th scope="col">Year</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map((book, index) => (
                          <tr key={book.id}>
                            <th scope="row">{index + 1}</th>
                            <td>{book.title}</td>
                            <td>{book.author}</td>
                            <td>{book.recommendation || 'N/A'}</td> {/* Changed from isbn */}
                            <td>{book.published_year || 'N/A'}</td>
                            <td>
                              <button
                                className="btn btn-warning btn-sm rounded-pill px-3 shadow-sm me-2"
                                onClick={() => handleEditClick(book)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm rounded-pill px-3 shadow-sm"
                                onClick={() => handleDeleteBook(book.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'add' && (
              <div className="add-books-section">
                <h3 className="mb-4 text-success text-center">Add New Book</h3>
                <form onSubmit={handleAddBook}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control rounded-pill px-3"
                      id="title"
                      name="title"
                      value={newBook.title}
                      onChange={handleNewBookChange}
                      required
                      placeholder="e.g., The Great Gatsby"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="author" className="form-label">Author <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control rounded-pill px-3"
                      id="author"
                      name="author"
                      value={newBook.author}
                      onChange={handleNewBookChange}
                      required
                      placeholder="e.g., F. Scott Fitzgerald"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="recommendation" className="form-label">Recommendation (Optional)</label> {/* Changed label */}
                    <input
                      type="text"
                      className="form-control rounded-pill px-3"
                      id="recommendation"
                      name="recommendation" // Changed name
                      value={newBook.recommendation} // Changed from isbn
                      onChange={handleNewBookChange}
                      placeholder="e.g., A must-read classic"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="published_year" className="form-label">Published Year (Optional)</label>
                    <input
                      type="number"
                      className="form-control rounded-pill px-3"
                      id="published_year"
                      name="published_year"
                      value={newBook.published_year}
                      onChange={handleNewBookChange}
                      placeholder="e.g., 1925"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-success w-100 rounded-pill py-2 fw-bold shadow-sm"
                  >
                    Add Book
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;