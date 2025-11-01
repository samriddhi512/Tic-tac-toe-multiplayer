const WebSocket = require("ws");

// For node there is no native webSocket api so we import and use
// WebSocket.Server -> server or new WebSocket() as client
const wss = new WebSocket.Server({ port: 8080 });

const connections = new Map();
const waitingQueue = [];
const games = new Map();
let gameIdCounter = 0;

console.log("game server listening on port 8080");

wss.on("connection", (ws) => {
  // uniqueId for players
  const playerId = Math.random().toString(36).substring(7);

  connections.set(playerId, ws);
  ws.playerId = playerId;

  console.log(`Client ${playerId} connected`);
  console.log(`Total connections: ${connections.size}`);

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      console.log(`Player ${playerId} sent:`, message);
      handleMessage(ws, message);
    } catch (err) {
      console.error("Invalid JSON:", err);
    }
  });

  ws.on("close", () => {
    console.log(`Client ${playerId} disconnected`);
    connections.delete(playerId);
    console.log(`Total connections: ${connections.size}`);
    removePlayer(playerId);
  });
});

function removePlayer(playerId) {
  const index = waitingQueue.indexOf(playerId);
  if (index > -1) {
    waitingQueue.splice(index, 1);
    console.log("deleted player from q:", playerId);
  }
}

function handleMessage(ws, message) {
  switch (message.type) {
    case "findGame":
      findGame(ws);
      break;
    case "makeMove":
      handleMove(ws, message);
      break;
    case "ping":
      ws.send(JSON.stringify({ type: "pong" }));
      break;
    default:
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Unknown message type: ${message.type}`,
        })
      );
  }
}

function findGame(ws) {
  const playerId = ws.playerId;

  console.log(`Player ${playerId} is looking for a match...`);
  console.log(`Current queue:`, waitingQueue);
  console.log(`Current queue length:`, waitingQueue.length);

  // Remove player from queue if already waiting (prevent duplicates)
  const existingIndex = waitingQueue.indexOf(playerId);
  if (existingIndex > -1) {
    waitingQueue.splice(existingIndex, 1);
    console.log(`Removed ${playerId} from queue (was already waiting)`);
  }

  if (waitingQueue.length > 0) {
    const opponentId = waitingQueue.shift(); // pop first from q
    const opponentws = connections.get(opponentId);

    if (!opponentws) {
      // opponent disconnected, add current player back
      waitingQueue.push(playerId);
      console.log(`Opponent ${opponentId} disconnected, re-queued ${playerId}`);
      ws.send(
        JSON.stringify({
          type: "waiting",
          message: "Waiting for match, looking for opponent",
        })
      );
      return;
    }

    console.log(`✅ Match found: ${playerId} vs ${opponentId}`);
    createGame(playerId, opponentId);
  } else {
    waitingQueue.push(playerId);

    console.log(`Player ${playerId} added to queue`);
    console.log(`Queue now:`, waitingQueue);

    ws.send(
      JSON.stringify({
        type: "waiting",
        message: "Waiting for match, looking for opponent",
      })
    );
  }
}

function createGame(playerId1, playerId2) {
  const gameId = `game-${++gameIdCounter}`;

  const game = {
    id: gameId,
    playerX: playerId1,
    playerO: playerId2,
    board: Array(9).fill(null),
    turn: playerId1,
    status: "active",
  };

  games.set(gameId, game);

  console.log(
    `🎮 Game ${gameId} created: ${playerId1} (X) vs ${playerId2} (O)`
  );

  const player1 = connections.get(playerId1);
  const player2 = connections.get(playerId2);

  if (!player1) {
    console.error(`❌ Player1 ${playerId1} not found in connections!`);
    return;
  }

  if (!player2) {
    console.error(`❌ Player2 ${playerId2} not found in connections!`);
    return;
  }

  console.log(`📤 Sending gameStart to ${playerId1}`);
  player1.send(
    JSON.stringify({
      type: "gameStart",
      id: playerId1,
      gameId,
      side: "X",
      opponent: playerId2,
      message: "You are X, you go first",
    })
  );

  console.log(`📤 Sending gameStart to ${playerId2}`);
  player2.send(
    JSON.stringify({
      type: "gameStart",
      id: playerId2,
      gameId,
      side: "O",
      opponent: playerId1,
      message: "You are O, wait for X to play",
    })
  );

  broadcastGameState(gameId);
}

function handleMove(ws, message) {
  const { gameId, position } = message;
  const playerId = ws.playerId;

  const game = games.get(gameId);
  if (!game) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Game not found",
      })
    );
    return;
  }

  if (game.turn !== playerId) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Not your turn",
      })
    );
    return;
  }

  if (position < 0 || position > 8) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Invalid position",
      })
    );
    return;
  }

  if (game.board[position] !== null) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Cell already occupied",
      })
    );
    return;
  }

  const symbol = playerId === game.playerX ? "X" : "O";
  game.board[position] = symbol;

  console.log(`📊 Move: ${symbol} at position ${position}`);

  const winner = checkWinner(game.board);

  if (winner) {
    game.status = "finished";
    broadcastGameState(gameId);
    broadcastGameEnd(gameId, winner);
  } else {
    game.turn = game.turn === game.playerX ? game.playerO : game.playerX;
    broadcastGameState(gameId);
  }
}

function checkWinner(board) {
  const winLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let line of winLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }

  if (board.every((cell) => cell !== null)) {
    return "draw";
  }

  return null;
}

function broadcastGameState(gameId) {
  const game = games.get(gameId);
  if (!game) return;

  const gameState = {
    type: "gameState",
    gameId,
    board: game.board,
    turn: game.turn,
    status: game.status,
  };

  const playerX = connections.get(game.playerX);
  const playerO = connections.get(game.playerO);

  playerX?.send(JSON.stringify(gameState));
  playerO?.send(JSON.stringify(gameState));
}

function broadcastGameEnd(gameId, result) {
  const game = games.get(gameId);

  const playerX = connections.get(game.playerX);
  const playerO = connections.get(game.playerO);

  playerX?.send(
    JSON.stringify({
      type: "gameEnd",
      result: result,
      board: game.board,
    })
  );

  playerO?.send(
    JSON.stringify({
      type: "gameEnd",
      result: result,
      board: game.board,
    })
  );

  console.log(`🏁 Game ${gameId} ended: ${result}`);
}
