'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket, initSocket, disconnectSocket } from '@/lib/socket';
import WaitingRoom from '@/components/WaitingRoom';
import BattleArena from '@/components/BattleArena';
import ResultsScreen from '@/components/ResultsScreen';
import { GameStats } from '@/components/BattleArena';

export default function BattlePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomId as string;
  
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [targetText, setTargetText] = useState('');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [opponentWpm, setOpponentWpm] = useState(0);
  const [opponentAccuracy, setOpponentAccuracy] = useState(100);

  useEffect(() => {
    const socket = getSocket() || initSocket();

    // Listen for game start
    const handleGameStart = (data: any) => {
      setTargetText(data.text);
      setGameState('playing');
    };

    // CRITICAL FIX: Listen for game-over to get opponent stats
    const handleGameOver = (data: any) => {
      const opponent = data.players.find((p: any) => p.id !== socket.id);

      if (opponent) {
        setOpponentWpm(opponent.wpm);
        setOpponentAccuracy(opponent.accuracy);
      }
    };

    // Listen for opponent left
    const handleOpponentLeft = () => {
      alert('Opponent left the game');
      disconnectSocket(); // ADDED: Clean disconnect
      router.push('/');
    };

    socket.on('game-start', handleGameStart);
    socket.on('game-over', handleGameOver); // CRITICAL: Added this
    socket.on('opponent-left', handleOpponentLeft);

    return () => {
      socket.off('game-start', handleGameStart);
      socket.off('game-over', handleGameOver); // CRITICAL: Cleanup
      socket.off('opponent-left', handleOpponentLeft);
    };
  }, [router]);

  const handleFinish = (gameStats: GameStats) => {
    setStats(gameStats);
    setGameState('finished');
  };

  const socket = getSocket();

  if (!socket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return <WaitingRoom roomCode={roomCode} socket={socket} />;
  }

  if (gameState === 'playing') {
    return (
      <BattleArena
        roomCode={roomCode}
        targetText={targetText}
        socket={socket}
        onFinish={handleFinish}
      />
    );
  }

  if (gameState === 'finished' && stats) {
    return (
      <ResultsScreen
        stats={stats}
        opponentWpm={opponentWpm}
        opponentAccuracy={opponentAccuracy}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}