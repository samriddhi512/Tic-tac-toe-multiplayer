# Tic-Tac-Toe Multiplayer

A server-authoritative multiplayer Tic-Tac-Toe game built with Node.js (WebSockets) and vanilla JavaScript.

<img width="1081" height="650" alt="image" src="https://github.com/user-attachments/assets/024a3f77-0d9f-4eb3-b0f4-4e8ab0774bd8" />

<img width="672" height="626" alt="image" src="https://github.com/user-attachments/assets/f2f41f17-ae48-46ed-b523-9a46a4ab0d44" />



## Features

- Real-time multiplayer gameplay via WebSockets
- Server-authoritative game state (prevents cheating)
- Simple matchmaking system
- Turn-based gameplay with automatic win detection

## Tech Stack

- **Backend**: Node.js + WebSocket (ws library)
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Protocol**: WebSocket for real-time communication

## Project Structure

tic-tac-toe/
├── server/
│ └── server.js # WebSocket server with game logic
├── client/
│ ├── index.html # Game UI
│ ├── app.js # Client-side WebSocket logic
│ └── styles.css # Styling
└── README.md

## Setup

1. **Install dependencies:**

   ```bash
   cd server
   npm init -y
   npm install ws
   ```

2. **Start the server:**

   ```bash
   node server.js
   ```

   Server will run on `ws://localhost:8080`

3. **Open the client:**
   - Open `client/index.html` in your browser (two tabs)
   - Or serve it with a local server:
     ```bash
     cd client
     npx serve -p 3000
     ```

## How to Play

1. Open the game in **two browser tabs** (or two different browsers)
2. Click **"Find Match"** in both tabs
3. Once matched, Player X goes first
4. Click on cells to make your move
5. Win by getting 3 in a row (horizontal, vertical, or diagonal)

## How It Works

- **Server-authoritative**: All game logic runs on the server
- **Matchmaking**: Simple FIFO queue pairs waiting players
- **Real-time updates**: WebSocket broadcasts game state to both players
- **Validation**: Server validates all moves before applying them

## Development

- Server listens on port `8080`
- Client connects to `ws://localhost:8080`
- Game state stored in memory (lost on server restart)

## Future Enhancements

- Persistent leaderboard
- Player authentication
- Multiple simultaneous games
- Game history/replay
- Database persistence

## License

-
