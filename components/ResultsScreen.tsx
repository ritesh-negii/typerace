'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { GameStats } from './BattleArena';

interface ResultsScreenProps {
  stats: GameStats;
  opponentWpm: number;
  opponentAccuracy: number;
}

export default function ResultsScreen({ stats, opponentWpm, opponentAccuracy }: ResultsScreenProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 text-center">
          <div className={`inline-block p-6 rounded-full mb-6 ${stats.won ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
            <Trophy className={`w-16 h-16 ${stats.won ? 'text-green-400' : 'text-red-400'}`} />
          </div>

          <h2 className={`text-4xl font-bold mb-2 ${stats.won ? 'text-green-400' : 'text-red-400'}`}>
            {stats.won ? 'Victory!' : 'Defeat'}
          </h2>
          <p className="text-gray-400 mb-8">
            {stats.won ? 'You won the typing battle!' : 'Better luck next time!'}
          </p>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-gray-400 text-sm mb-1">Your WPM</div>
                <div className="text-3xl font-bold text-blue-400">{stats.wpm}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Opponent WPM</div>
                <div className="text-3xl font-bold text-red-400">{opponentWpm}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Your Accuracy</div>
                <div className="text-2xl font-bold text-green-400">{stats.accuracy}%</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Opponent Accuracy</div>
                <div className="text-2xl font-bold text-yellow-400">{opponentAccuracy}%</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}