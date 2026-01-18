import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { getSocket } from '../socket';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import '../styles/ChatPage.css';

import type { Message } from '../types/Message';
import axios from 'axios';
import {useParams} from "react-router-dom";
import {decrypt} from "../helpers/crypto.ts";

const BASE_API = import.meta.env.VITE_BASE_URL ?? 'http://localhost:4000/api';
interface Props {
  chatId: string | null;          
  currentUsername: string;
  currentRoom: string;            
}

const ChatPage: React.FC<Props> = ({ 
  chatId, 
  currentUsername, 
}) => {
  const params = useParams()

  const currentRoom = params.roomId
  const [groupMessages, setGroupMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Record<string, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  const isPrivate = chatId?.startsWith('private:') ?? false;
  const targetUser = isPrivate ? chatId!.replace('private:', '') : null;

  const privateChatKey = useMemo(() => {
    if (!targetUser) return '';
    return `private:${[currentUsername, targetUser].sort().join('-')}`;
  }, [currentUsername, targetUser]);

  const updatedMessage = (msg:any): Message => ({
    id: msg.id,
    from: msg.from,
    text: decrypt(msg.content || msg.text),
    ts: msg.createdAt || msg.ts,
    ...(msg.room && { room: msg.room }),
    ...(msg.to && { to: msg.to }),
  });

  const fetchHistory = useCallback(async (pageToFetch: number = 0, append = false) => {
    if (!chatId) return;
    setLoadingMore(pageToFetch > 0);
    setIsLoading(pageToFetch === 0);

    try {
      let url = '';
      if (isPrivate && targetUser) {
        const [user1, user2] = [currentUsername, targetUser].sort();
        url = `${BASE_API}/history/pm/${user1}/${user2}?page=${pageToFetch}&size=10`;
      } else if (currentRoom) {
        url = `${BASE_API}/history/${currentRoom}?page=${pageToFetch}&size=10`;
      }
      const res = await axios.get<Message[]>(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });


      const newMessages = res?.data?.map(updatedMessage);

      if (isPrivate) {
        setPrivateMessages(prev => {
          const key = privateChatKey;
          const existing = prev[key] || [];
          const updated = append 
            ? [...newMessages.reverse(), ...existing]
            : [...newMessages.reverse()]; 
          return { ...prev, [key]: updated };
        });
      } else {
        setGroupMessages(prev => {
          return append 
            ? [...newMessages.reverse(), ...prev] 
            : [...newMessages.reverse()];
        });
      }

      setHasMore(newMessages.length === 10);

    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [chatId, isPrivate, currentRoom, targetUser, currentUsername, privateChatKey]);

  useEffect(() => {
    if (!socket || !chatId) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      if (isPrivate && targetUser) {
        socket.emit('join_private', { with: targetUser });
      } else if (currentRoom) {
        socket.emit('join_room', { room: currentRoom });
      }

      fetchHistory(0, false);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

   
    socket.on('message', (msg) => {
      if (!isPrivate && msg.room?.toLowerCase() === currentRoom?.toLowerCase()) {
        setGroupMessages(prev => [...prev, updatedMessage(msg)]);
      }
    });

    socket.on('private_message', (msg) => {
      const key = `private:${[msg.from, msg.to].sort().join('-')}`;
      if (key === privateChatKey) {
        setPrivateMessages(prev => {
          const existing = prev[key] || [];
          if (existing.some(m => m.id === msg.id)) return prev;
          return { ...prev, [key]: [...existing, updatedMessage(msg)] };
        });
      }
    });

      socket.on('typing', ({ username, isTyping }: { username: string; isTyping: boolean }) => {
         if (username === currentUsername) return;

          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            if (isTyping) {
              newSet.add(username);
            } else {
              newSet.delete(username);
            }
            return newSet;
          });
        });


    socket.on('system', (text: string) => {
      setGroupMessages((prev) => [
        ...prev,
        updatedMessage({
          id: Date.now(),
          from: 'system',
          content: text,
          createdAt: new Date().toISOString(),
        }),
      ]);
    });

 
    socket.on('error', ({ message }: { message: string }) => {
      console.error('Socket error:', message);
      alert(message);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('message');
      socket.off('private_message');
      socket.off('typing');
      socket.off('system');
      socket.off('error');
     
    };
  }, [socket, chatId, currentRoom, isPrivate, targetUser, currentUsername, privateChatKey, fetchHistory]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, privateMessages, privateChatKey]);

  const handleSend = (text: string) => {
    if (!text.trim() || !socket) return;
    if (isPrivate && targetUser) {
      socket.emit('private_message', {
        to: targetUser,
        text,
      });
    } else if (currentRoom) {
      socket.emit('message', {
        room: currentRoom,
        text
      });
    }
    socket.emit('typing', {
      room: currentRoom,
      isTyping: false
    });
  };
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!socket) return;
    const isTypingNow = e.target.value.trim().length > 0;
    if (isPrivate) {
      socket.emit('typing', {
        to: targetUser,
        isTyping: isTypingNow
      });
    } else {
      socket.emit('typing', {
        room: currentRoom,
        isTyping: isTypingNow
      });
    }
  };

  const currentMessages = isPrivate 
    ? (privateMessages[privateChatKey] || []) 
    : groupMessages;

  return (
    <div className="chat-page">
      <div className="chat-header">
        {isPrivate ? (
          <h2>Chat with {targetUser}</h2>
        ) : (
          <h2>#{currentRoom}</h2>
        )}
      </div>

      <div className="chat-container">
        {isLoading && <div className="loading">Loading messages...</div>}

        <ChatWindow
          messages={currentMessages}
          currentUser={currentUsername}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />

        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            {Array.from(typingUsers).join(', ')}{' '}
            {typingUsers.size === 1 ? 'is' : 'are'} typing…
          </div>
        )}
      </div>

      <MessageInput 
        onSend={handleSend} 
        onTyping={handleTyping} 
        placeholder={isPrivate ? `Message @${targetUser}...` : "Type a message..."}
      />

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatPage;