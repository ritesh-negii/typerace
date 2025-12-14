'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Users } from 'lucide-react';
import { initSocket } from '@/lib/socket';

export default function HomeScreen() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    const socket = initSocket();
    const roomCode = generateRoomCode();

    socket.emit('create-room', { roomCode, playerName });

    socket.once('room-created', () => {
      localStorage.setItem('playerName', playerName);
      router.push(`/battle/${roomCode}`);
    });

    socket.once('error', (data) => {
      setError(data.message);
      setLoading(false);
    });
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!inputRoomCode.trim()) {
      setError('Please enter room code');
      return;
    }

    setLoading(true);
    setError('');

    const socket = initSocket();

    socket.emit('join-room', { 
      roomCode: inputRoomCode.toUpperCase(), 
      playerName 
    });

    socket.once('game-start', () => {
      localStorage.setItem('playerName', playerName);
      router.push(`/battle/${inputRoomCode.toUpperCase()}`);
    });

    socket.once('error', (data) => {
      setError(data.message);
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">TypeRace</h1>
          </div>
          <p className="text-gray-400">Real-time 1v1 typing speed battle</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createRoom()}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-6"
            disabled={loading}
          />

          <button
            onClick={createRoom}
            disabled={!playerName.trim() || loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4 flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            {loading ? 'Creating...' : 'Create Room'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800/50 text-gray-400">OR</span>
            </div>
          </div>

          <input
            type="text"
            placeholder="Enter room code"
            value={inputRoomCode}
            onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-4"
            disabled={loading}
            maxLength={6}
          />

          <button
            onClick={joinRoom}
            disabled={!playerName.trim() || !inputRoomCode.trim() || loading}
            className="w-full py-4 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
}