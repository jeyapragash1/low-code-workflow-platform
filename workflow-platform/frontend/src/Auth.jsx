// frontend/src/Auth.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;

    try {
      const response = await axios.post(url, { username, password });
      if (isLogin) {
        onLoginSuccess(response.data.token);
      } else {
        alert('Registration successful! Please log in.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred.');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>{isLogin ? 'Login' : 'Register'}</h1>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="submit-btn">
          {isLogin ? 'Login' : 'Register'}
        </button>
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </form>
    </div>
  );
};

export default Auth;