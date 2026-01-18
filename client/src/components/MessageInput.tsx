import React, { useState } from 'react';
import '../styles/MessageInput.css';

interface Props {
  onSend: (text: string) => void;
  onTyping?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const MessageInput: React.FC<Props> = ({ onSend, onTyping, placeholder }) => {
  const [text, setText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping?.(e);
  };

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="message-input">
      <input
        value={text}
        onChange={handleChange}
        onKeyDown={(e) => e.key === 'Enter' && send()}
        placeholder={placeholder || 'Type a message...'}

      />
      <button onClick={send}>Send</button>
    </div>
  );
};

export default MessageInput;