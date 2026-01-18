import React, { useEffect, useState } from 'react';
import { getSocket } from '../socket';
import '../styles/ChatList.css';
import {useParams} from "react-router-dom";

interface Props {
  onSelect: (id: string) => void;
  selectedChatId: string | null;
  currentUsername: string;
  currentRoom: string;
}

const ChatList: React.FC<Props> = ({
  onSelect,
  selectedChatId,
  currentUsername,
}) => {
  const params = useParams();
  const currentRoom = params.roomId;
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socket = getSocket();

  useEffect(() => {
    if (!socket || !currentRoom) return;

    const handleOnlineUsers = (users: string[]) => {
      const others = users.filter((u) => u !== currentUsername);

      setOnlineUsers(others);
    };

    socket.on('online_users', handleOnlineUsers);

    return () => {
      socket.off('online_users', handleOnlineUsers);
    };
  }, [socket, currentRoom, currentUsername]);

  const roomName = currentRoom!.charAt(0).toUpperCase() + currentRoom!.slice(1);

  const handleUserClick = (user: string) => {
    if (user === currentUsername) return;
    onSelect(`private:${user}`);
  };

  return (
    <div className="chat-list">
      <div
        className={`chat-item main-room ${selectedChatId === 'general' ? 'active' : ''}`}
        onClick={() => onSelect('general')}
      >
        <div className="avatar-container">
          <div className="room-avatar">{roomName[0]}</div>
        </div>
        <div className="chat-info">
          <h3>#{roomName}</h3>
          <div className="status">Online: {onlineUsers.length + 1}</div>
        </div>
      </div>

      <div className="online-users-section">
        <div className="section-title">
          Online in {roomName} ({onlineUsers.length + 1})
        </div>

        <div className="users-scroll">
          <div className="user-item me">
            {currentUsername} <span className="you-tag">(you)</span>
          </div>

          {onlineUsers.length === 0 ? (
            <div className="no-users">No one else here yet...</div>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user}
                className={`user-item ${selectedChatId === `private:${user}` ? 'active' : ''}`}
                onClick={() => handleUserClick(user)}
              >
                {user}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
