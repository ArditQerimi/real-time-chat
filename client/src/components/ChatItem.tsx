import type { Chat } from "../types/Chat";
import '../styles/ChatItem.css';

interface Props {
  chat: Chat;
  onSelect: (id: number) => void;
  isSelected?: boolean;
}

const ChatItem: React.FC<Props> = ({ chat, onSelect, isSelected }) => (
  <div
    className={`chat-item ${isSelected ? 'active' : ''}`}
    onClick={() => onSelect(chat.id)}
  >
    <div className="avatar-container">
      {chat.online && <div className="online-indicator" />}
    </div>

    <div className="chat-info">
      <div className="chat-header">
        <h3 className="chat-name">{chat.name}</h3>
        <span className="timestamp">{chat.timestamp}</span>
      </div>

      <div className="chat-preview">
        {chat.typing && (
          <span className="typing-indicator">typing...</span>
        )}
      </div>
    </div>

  </div>
);
export default ChatItem;