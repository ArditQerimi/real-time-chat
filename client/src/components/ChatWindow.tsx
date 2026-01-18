import React from 'react';
import type { Message } from '../types/Message';
import '../styles/ChatWindow.css';

interface Props {
  messages: Message[];
  currentUser: string;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}

const ChatWindow: React.FC<Props> = ({
  messages,
  currentUser,
  onLoadMore,
  hasMore,
  loadingMore,
}) => (
  <div className="chat-window">
    {hasMore && (
      <div className="load-more-container">
        <button
          className="load-more-btn"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Loading…' : 'Load older messages'}
        </button>
      </div>
    )}

    {messages?.map((m) => {
      
      const isOwnMessage = m.from === currentUser;
      const isSystem = m.from === 'system';


      return (
        <div
          key={m.id}
          className={`message-container ${
            isSystem ? 'system' : isOwnMessage ? 'own' : 'other'
          }`}
        >
          {!isSystem && !isOwnMessage && (
            <span className="sender-name">{m.from}</span>
          )}

          <div
            className={`message-bubble ${
              isSystem ? 'system' : isOwnMessage ? 'own' : 'other'
            }`}
          >
            {m.text}
          </div>

          {!isSystem && (
            <span className="message-time">
              {new Date(m.ts!).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      );
    })}
  </div>
);

export default ChatWindow;
