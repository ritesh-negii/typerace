🏁 TypeRace – Real-Time Multiplayer Typing Game

TypeRace is a real-time 1v1 competitive typing game where two players race against each other to complete a typing challenge as fast and accurately as possible.
The application uses Socket.IO (WebSockets) to synchronize player progress, WPM, and race state instantly across connected clients.

This project demonstrates real-time communication, multiplayer state management, and server-side authorization.

🚀 Features

Real-time 1v1 multiplayer typing race

Room-based matchmaking using unique room codes

Host-controlled race start with server-side validation

Live progress and WPM tracking for both players

Personalized win/lose UI based on player identity

Rematch functionality without socket reconnection

Handles player join, leave, and race lifecycle events

🛠 Tech Stack

Frontend: Next.js, React, Tailwind CSS

Backend: Node.js, Socket.IO

Real-Time Communication: WebSockets (Socket.IO)

🧠 How It Works

A player creates a room and becomes the host.

Another player joins the room using the shared room code.

The host starts the typing race.

Player progress and WPM are updated in real time for both users.

The server determines the winner and broadcasts the result.

Players can start a rematch without leaving the room.

⚙️ Installation & Setup
1. Clone the repository
git clone https://github.com/your-username/racetype.git
cd racetype

2. Install dependencies
npm install

3. Run the application
npm run dev


Open in browser:

http://localhost:3000

🧪 How to Play

Enter your name and create a room.

Share the room code with your opponent.

Start the race once both players have joined.

Type the given text as fast and accurately as possible to win.

📌 Key Learnings

Implemented real-time multiplayer communication using Socket.IO

Managed synchronized game state across multiple clients

Enforced server-side authorization for host-controlled actions

Designed user-specific UI logic using socket identity comparison

Built rematch functionality without disconnecting sockets

🔮 Future Improvements

Support for more than two players

Spectator mode

Player reconnection handling

Global leaderboard and performance statistics

👤 Author

Ritesh Negi

GitHub: https://github.com/ritesh-negii

📄 License

This project is licensed under the MIT License.

