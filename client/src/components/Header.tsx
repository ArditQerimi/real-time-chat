import React from 'react';
import '../styles/Header.css';

interface HeaderProps {
  username: string;
  onLogout?: () => void; 
}

const Header: React.FC<HeaderProps> = ({ username }) => {

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">Real-time Chat</h1>
          <span className="user-greeting">
            Hi, <strong>{username}</strong>
          </span>
        </div>


      </div>
    </header>
  );
};

export default Header;