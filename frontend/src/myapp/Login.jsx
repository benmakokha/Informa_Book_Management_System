import React, { useState } from 'react';

// Get API URL from environment variables
//const API_URL = process.env.REACT_APP_API_URL;

function Login({ onLoginSuccess, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setIsSuccess(false);

    try {
        const response = await fetch('http://localhost:5000/login', {
     // const response = await fetch(`${API_URL}/login`, { // Use API_URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        localStorage.setItem('token', data.token);
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token);
        }
        setEmail('');
        setPassword('');
      } else {
        setMessage(data.message || 'Login failed. Please check your credentials.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('Network error. Could not connect to the server.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card p-5 shadow-lg rounded-4 border-0" style={{ maxWidth: '450px', width: '100%' }}>
        <h2 className="card-title text-center mb-5 text-success fw-bold display-6">
          Welcome Back!
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="form-label text-secondary fw-semibold">Email address</label>
            <input
              type="email"
              className="form-control rounded-pill px-4 py-2 border-success border-opacity-25"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="password" className="form-label text-secondary fw-semibold">Password</label>
            <input
              type="password"
              className="form-control rounded-pill px-4 py-2 border-success border-opacity-25"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-success w-100 rounded-pill py-3 fw-bold text-uppercase shadow-sm"
            style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
          >
            Login
          </button>
        </form>

        {message && (
          <div
            className={`alert mt-4 text-center rounded-pill ${isSuccess ? 'alert-success' : 'alert-danger'}`}
            role="alert"
          >
            {message}
          </div>
        )}

        <p className="text-center mt-4 mb-0 text-secondary">
          Don't have an account?{' '}
          <a
            href="#"
            onClick={() => onNavigate('register')}
            className="text-success fw-bold text-decoration-none"
          >
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;