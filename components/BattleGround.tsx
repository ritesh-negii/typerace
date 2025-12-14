'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface BattleArenaProps {
  roomCode: string;
  targetText: string;
  socket: Socket;
  onFinish: (stats: GameStats) => void;
}

export interface GameStats {
  wpm: number;
  accuracy: number;
  progress: number;
  won: boolean;
}

export default function BattleArena({ roomCode, targetText, socket, onFinish }: BattleArenaProps) {
  const [typedText, setTypedText] = useState('');
  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [opponentWpm, setOpponentWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [opponentAccuracy, setOpponentAccuracy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();

  
    const handleOpponentUpdate = (data: any) => {
      setOpponentProgress(data.progress);
      setOpponentWpm(data.wpm);
      setOpponentAccuracy(data.accuracy);
    };

  
    const handlePlayerFinished = (data: any) => {
      if (data.playerId === socket.id && !finishedRef.current) {
        finishedRef.current = true;
        onFinish({
          wpm: data.stats.wpm,
          accuracy: data.stats.accuracy,
          progress: data.stats.progress,
          won: true // Will be updated by game-over if needed
        });
      }
    };

   
    const handleGameOver = (data: any) => {
      const won = data.winner === socket.id;
      const myStats = data.players.find((p: any) => p.id === socket.id);
      
      if (myStats && !finishedRef.current) {
        finishedRef.current = true;
        onFinish({
          wpm: myStats.wpm,
          accuracy: myStats.accuracy,
          progress: 100,
          won
        });
      }
    };

    socket.on('opponent-update', handleOpponentUpdate);
    socket.on('player-finished', handlePlayerFinished);
    socket.on('game-over', handleGameOver);

    return () => {
      socket.off('opponent-update', handleOpponentUpdate);
      socket.off('player-finished', handlePlayerFinished);
      socket.off('game-over', handleGameOver);
    };
  }, [socket, onFinish]);

  const calculateLocalWPM = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = 1 / 60; // Assume 1 second for instant feedback
    return Math.round(words / minutes) || 0;
  };

  const calculateLocalAccuracy = (typed: string) => {
    if (!typed) return 100;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === targetText[i]) correct++;
    }
    return Math.round((correct / typed.length) * 100);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (finishedRef.current) return;
    
    const value = e.target.value;
    setTypedText(value);

   
    const progress = (value.length / targetText.length) * 100;
    setMyProgress(Math.min(progress, 100));
    setWpm(calculateLocalWPM(value));
    setAccuracy(calculateLocalAccuracy(value));

   
    socket.emit('update-progress', {
      roomCode,
      typedText: value // ONLY send typed text, server calculates rest
    });
  };

  const renderText = () => {
    return targetText.split('').map((char, idx) => {
      let className = 'text-gray-500';
      
      if (idx < typedText.length) {
        className = typedText[idx] === char ? 'text-green-400' : 'text-red-400 bg-red-900/30';
      }
      
      if (idx === typedText.length) {
        className = 'text-white bg-blue-500/30 border-b-2 border-blue-500';
      }

      return (
        <span key={idx} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 mb-2">
            <span className="text-gray-400">Room:</span>
            <span className="text-purple-400 font-bold ml-2">{roomCode}</span>
          </div>
        </div>

        {/* Players Progress */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">You</span>
              <span className="text-blue-400 font-bold">{wpm} WPM</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${myProgress}%` }}
              ></div>
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">
              {Math.round(myProgress)}% • {accuracy}% accuracy
            </div>
          </div>

          <div className="bg-red-900/30 backdrop-blur-sm rounded-xl p-4 border border-red-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">Opponent</span>
              <span className="text-red-400 font-bold">{opponentWpm} WPM</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${opponentProgress}%` }}
              ></div>
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">
              {Math.round(opponentProgress)}% • {opponentAccuracy}% accuracy
            </div>
          </div>
        </div>

        {/* Text to type */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 mb-6">
          <div className="text-2xl leading-relaxed font-mono mb-6">
            {renderText()}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={handleTyping}
            className="w-full px-6 py-4 bg-gray-900 border-2 border-purple-500 rounded-lg text-white text-xl font-mono focus:outline-none focus:border-purple-400"
            placeholder="Start typing..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            disabled={finishedRef.current}
          />

          <div className="flex justify-between items-center mt-4">
            <div className="text-gray-400">
              Accuracy: <span className={accuracy >= 95 ? 'text-green-400' : accuracy >= 80 ? 'text-yellow-400' : 'text-red-400'}>{accuracy}%</span>
            </div>
            <div className="text-gray-400">
              {typedText.length} / {targetText.length} characters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}