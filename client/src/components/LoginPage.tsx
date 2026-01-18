import React, { useState } from 'react';
import '../styles/LoginPage.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { initializeSocket } from '../socket';

const API_BASE = 'http://localhost:4000/api';

interface LoginPageProps {
  handleLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ handleLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) return setError('Username is required');
    if (trimmedUsername.length < 3) return setError('Username too short');
    if (!password) return setError('Password is required');

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
    const payload = { username: trimmedUsername, password };

    try {
      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      const { token } = res.data;

      localStorage.setItem('token', token);
      initializeSocket();
      handleLogin(username)
      navigate('/rooms', { state: { username: trimmedUsername } });
    } catch (err: any) {
     console.log('err', err)
      setError('Something went wrong');
    }
  };

  return (
      <div className="login-container">
        <div className="login-card">
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{mode === 'login' ? 'Sign in to start chatting' : 'Join our community'}</p>

          <div className="auth-toggle">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
          </div>

          <form onSubmit={handleAuth}>
            <input type="text" placeholder="Username" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} autoFocus className="login-input" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} className="login-input" />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="join-btn">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
          </form>
        </div>
      </div>
  );
};

export default LoginPage;


