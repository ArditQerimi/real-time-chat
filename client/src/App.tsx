import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import ChatList from './components/ChatList';
import ChatPage from './components/ChatPage';
import LoginPage from './components/LoginPage';
import RoomPage from './components/RoomPage';

import './index.css';
import './App.css';

const App: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>('general');

  const handleLogin = (name: string) => {
    setUsername(name);
  };

  const handleLogout = () => {
    setUsername(null);
    setCurrentRoom(null);
    setSelectedChatId(null);

  };

  return (
      <Router>
        <Routes>
          <Route
              path="/"
              element={
                    <LoginPage handleLogin={handleLogin}/>
              }
          />

          <Route
              path="/rooms"
              element={<RoomPage/>}
          />

          <Route
              path="/chat/:roomId"
              element={

                    <div className="app">
                      <Header username={username!} onLogout={handleLogout} />
                      <div className="main-page">
                        <ChatList
                            onSelect={(chatId: string) => setSelectedChatId(chatId)}
                            selectedChatId={selectedChatId}
                            currentUsername={username!}
                            currentRoom={currentRoom!}
                        />
                        <ChatPage
                            chatId={selectedChatId}
                            currentUsername={username!}
                            currentRoom={currentRoom!}
                        />
                      </div>
                    </div>
              }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
  );
};

export default App;


