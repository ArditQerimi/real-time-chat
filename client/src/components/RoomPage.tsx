import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSocket } from '../socket';
import '../styles/RoomPage.css';

interface Room {
    id: string;
    name: string;
    desc?: string;
}

const API_BASE = import.meta.env.VITE_BASE_URL ?? 'http://localhost:4000/api';

const RoomPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const username = (location.state as any)?.username || '';

    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [newRoomName, setNewRoomName] = useState('');

    const socket = getSocket();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await axios.get(`${API_BASE}/rooms`);
                setRooms(res.data);
                if (res.data.length > 0) setSelectedRoom(res.data[0].name);
            } catch (err) {
                console.error(err);
            }
        };

        fetchRooms();

        socket.on('room_created', (newRoom: Room) => {
            setRooms(prev => {
                if (prev.some(r => r.name === newRoom.name)) return prev;
                return [...prev, newRoom];
            });
        });

        return () => { socket.off('room_created'); };
    }, [socket, username, navigate]);

    const handleCreateRoom = async () => {
        const trimmed = newRoomName.trim();
        if (!trimmed) return alert('Room name cannot be empty');

        const slug = trimmed.toLowerCase().replace(/\s+/g, '-');
        if (rooms.some(r => r.id === slug)) return alert('Room already exists');

        try {
            const res = await axios.post(`${API_BASE}/rooms`, { name: trimmed, slug });
            setRooms(prev => [...prev, res.data]);
            setSelectedRoom(res.data.name || slug);
            setNewRoomName('');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create room');
        }
    };

    const handleJoin = () => {
        if (!selectedRoom) return alert('Select a room first');
        navigate(`/chat/${selectedRoom}`, { state: { username, room: selectedRoom } });
    };

    return (
        <div className="room-container">
            <h1>Welcome, {username}!</h1>

            <div className="room-selection">
                <label>Select a room:</label>
                <div className="room-options">
                    {rooms.length === 0 ? <p>No rooms yet...</p> :
                        rooms.map(room => (
                            <label key={room.id} className={`room-option ${selectedRoom === room.name ? 'selected' : ''}`}>
                                <input type="radio" checked={selectedRoom === room.name} onChange={() => setSelectedRoom(room.name)} />
                                <strong>{room.name}</strong>
                            </label>
                        ))
                    }
                </div>
            </div>

            <div className="create-room">
                <input type="text" placeholder="Create new room..." value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                <button type="button" onClick={handleCreateRoom}>Create</button>
            </div>

            <button className="join-btn" onClick={handleJoin}>Join Room</button>
        </div>
    );
};

export default RoomPage;
