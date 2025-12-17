"use client";

import { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";

let socket: Socket;

interface Player {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  finished: boolean;
}

export default function Home() {
  const [gameState, setGameState] = useState<string>("lobby");
  const [playerName, setPlayerName] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [textToType, setTextToType] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [winner, setWinner] = useState<Player | null>(null);
  const [error, setError] = useState<string>("");
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    socketInitializer();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const socketInitializer = async () => {
    socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setSocketConnected(true);
    });

    socket.on(
      "room-created",
      ({
        roomCode,
        playerNumber,
        players,
      }: {
        roomCode: string;
        playerNumber: number;
        players: Player[];
      }) => {
        console.log("Room created event received:", {
          roomCode,
          playerNumber,
          players,
        });
        setRoomCode(roomCode);
        setPlayerNumber(playerNumber);
        setPlayers(players);
        setIsCreator(true);
        setGameState("waiting");
      }
    );

    socket.on(
      "player-joined",
      ({
        players,
        playerNumber: pNum,
        creator,
      }: {
        players: Player[];
        playerNumber: number;
        creator: string;
      }) => {
        setPlayers(players);
        if (!playerNumber) setPlayerNumber(pNum);
        if (socket.id === creator) setIsCreator(true);
        setGameState("waiting");
      }
    );

    socket.on("race-started", ({ textToType }: { textToType: string }) => {
      setTextToType(textToType);
      setUserInput("");
      setGameState("racing");
      setTimeout(() => inputRef.current?.focus(), 100);
    });

    socket.on("progress-update", ({ players }: { players: Player[] }) => {
      setPlayers(players);
    });

    socket.on(
      "race-finished",
      ({ winner, finalStats }: { winner: Player; finalStats: Player[] }) => {
        setWinner(winner);
        setPlayers(finalStats);
        setGameState("finished");
      }
    );

    socket.on("race-reset", ({ players }) => {
      setPlayers(players);
      setTextToType("");
      setUserInput("");
      setWinner(null);
      setGameState("waiting");
    });

    socket.on("player-left", ({ players }: { players: Player[] }) => {
      setPlayers(players);
      if (players.length < 2 && gameState === "racing") {
        setGameState("waiting");
      }
    });

    socket.on("error", ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(""), 3000);
    });
  };

  const createRoom = () => {
    if (!playerName.trim() || !socketConnected) {
      console.log("Cannot create room:", { playerName, socketConnected });
      return;
    }
    console.log("Creating room for:", playerName.trim());
    socket.emit("create-room", { playerName: playerName.trim() });
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomCode.trim() || !socketConnected) return;
    console.log("Joining room:", roomCode.trim().toUpperCase());
    socket.emit("join-room", {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    });
  };

  const startRace = () => {
    if (!players || players.length < 2) return;
    socket.emit("start-race", { roomCode });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);
    socket.emit("update-progress", { roomCode, input: value });
  };

  const getCharStatus = (index: number): string => {
    if (index >= userInput.length) return "untyped";
    return userInput[index] === textToType[index] ? "correct" : "incorrect";
  };

  const restartGame = () => {
    socket.emit("reset-race", { roomCode });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-6xl font-bold text-blue-400 mb-2">RaceType</h1>
          <p className="text-gray-400 text-lg">1v1 Competitive Typing Battle</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Lobby */}
        {gameState === "lobby" && (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">
                Join the Battle
              </h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createRoom()}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 mb-6 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={createRoom}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold mb-4 transition"
              >
                Create Room
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="text-gray-500 text-sm">OR</span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>

              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 mb-3 focus:outline-none focus:border-green-500"
              />
              <button
                onClick={joinRoom}
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
              >
                Join Room
              </button>
            </div>
          </div>
        )}

        {/* Waiting Room */}
        {gameState === "waiting" && (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
              <div className="text-4xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold mb-4">
                Room: <span className="text-blue-400">{roomCode}</span>
              </h2>
              <p className="text-gray-400 mb-6">
                Share this code with your opponent
              </p>

              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-3">
                  Players ({players?.length || 0}/2):
                </p>
                {players &&
                  players.map((player, i) => (
                    <div
                      key={i}
                      className="py-2 px-4 bg-gray-800 rounded mb-2 font-semibold"
                    >
                      {player.name}
                    </div>
                  ))}
              </div>

              {players && players.length === 2 && isCreator && (
                <button
                  onClick={startRace}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                >
                  Start Race 🏁
                </button>
              )}

              {players && players.length === 2 && !isCreator && (
                <p className="text-yellow-400 text-sm animate-pulse">
                  Waiting for host to start...
                </p>
              )}

              {(!players || players.length < 2) && (
                <p className="text-gray-500 text-sm animate-pulse">
                  Waiting for opponent...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Racing */}
        {gameState === "racing" && (
          <div className="space-y-6">
            {/* Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-4 border ${
                    player.id === socket.id
                      ? "bg-blue-900/30 border-blue-500"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">
                      {player.name}
                      {player.id === socket.id && (
                        <span className="ml-1 text-blue-400">(You)</span>
                      )}
                    </span>

                    <span className="text-sm text-gray-400">
                      {player.wpm} WPM
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        i === 0 ? "bg-blue-500" : "bg-green-500"
                      }`}
                      style={{ width: `${player.progress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-right mt-1 text-gray-400">
                    {Math.round(player.progress || 0)}%
                  </p>
                </div>
              ))}
            </div>

            {/* Text Display */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="text-2xl font-mono leading-relaxed mb-6 text-center">
                {textToType.split("").map((char, i) => {
                  const status = getCharStatus(i);
                  return (
                    <span
                      key={i}
                      className={
                        status === "correct"
                          ? "text-green-400"
                          : status === "incorrect"
                          ? "text-red-500 bg-red-500/20"
                          : "text-gray-500"
                      }
                    >
                      {char}
                    </span>
                  );
                })}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 font-mono text-lg focus:outline-none focus:border-blue-500"
                placeholder="Start typing..."
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Winner Screen */}
        {gameState === "finished" && winner && (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
              {winner.id === socket.id ? (
                <>
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-4xl font-bold mb-2 text-yellow-400">
                    Victory!
                  </h2>
                  <p className="text-2xl mb-6">You win 🎉</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">😢</div>
                  <h2 className="text-4xl font-bold mb-2 text-red-400">
                    Defeat
                  </h2>
                  <p className="text-2xl mb-6">{winner.name} wins</p>
                </>
              )}

              <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Final WPM:</span>
                  <span className="font-bold text-blue-400">{winner.wpm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="font-bold text-green-400">100%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completion:</span>
                  <span className="font-bold text-green-400">First!</span>
                </div>
              </div>

              <button
                onClick={restartGame}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
