'use client';

import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, UserPlus } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface WaitingRoomProps {
  roomCode: string;
  socket: Socket;
}

export default function WaitingRoom({ roomCode, socket }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);

  useEffect(() => {
    // Listen for game start (means opponent joined)
    const handleGameStart = () => {
      setOpponentJoined(true);
    };

    socket.on('game-start', handleGameStart);

    return () => {
      socket.off('game-start', handleGameStart);
    };
  }, [socket]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <div className="mb-6">
            <div className={`inline-block p-4 rounded-full mb-4 transition-all ${
              opponentJoined ? 'bg-green-600/20' : 'bg-purple-600/20'
            }`}>
              {opponentJoined ? (
                <UserPlus className="w-12 h-12 text-green-400" />
              ) : (
                <Users className="w-12 h-12 text-purple-400 animate-pulse" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {opponentJoined ? 'Opponent Joined!' : 'Waiting for opponent...'}
            </h2>
            
            <p className="text-gray-400">
              {opponentJoined ? 'Game starting...' : 'Share this code with your friend'}
            </p>

            {/* FIXED: Derive player count from opponentJoined */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-900 rounded-full">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-white font-semibold">
                  {opponentJoined ? '2/2' : '1/2'}
                </span>
              </div>
            </div>
          </div>

          {!opponentJoined && (
            <>
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <div className="text-5xl font-bold text-purple-400 tracking-widest mb-2">
                  {roomCode}
                </div>
                <button
                  onClick={copyRoomCode}
                  className="flex items-center justify-center gap-2 mx-auto text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy code'}
                </button>
              </div>

              <div className="flex justify-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </>
          )}

          {opponentJoined && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
              <p className="text-green-400 font-semibold">Get ready to type!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}