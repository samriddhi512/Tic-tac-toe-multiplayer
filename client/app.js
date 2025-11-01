const WS_URL = "ws://localhost:8080";

const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");
const boardEl = document.getElementById("board");
const cells = [...boardEl.querySelectorAll(".cell")];
const findBtn = document.getElementById("findBtn");
const rematchBtn = document.getElementById("rematchBtn");

let ws = null;
let gameId = null;
let mySide = null;
let board = Array(9).fill(null);
let gameActive = false;
let currentTurn = null;

function connect() {
  ws = new WebSocket(WS_URL);

  ws.onopen = (event) => {
    console.log("✅ Connected to server");
    updateStatus("Connected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data || "{}");
      console.log("📨 Received:", data);

      switch (data.type) {
        case "waiting":
          updateStatus(data.message);
          break;

        case "gameStart":
          gameId = data.gameId;
          mySide = data.side;
          gameActive = true;
          updateStatus(data.message);
          enableCells();
          break;

        case "gameState":
          gameActive = data.status === "active";
          currentTurn = data.turn;
          renderBoard(data.board);
          enableCells();
          updateStatus(getStatusText());
          break;

        case "gameEnd":
          gameActive = false;
          renderBoard(data.board);
          let resultMsg =
            data.result === "draw"
              ? "Draw!"
              : data.result === mySide
              ? "You won! 🎉"
              : "You lost! 😢";
          updateStatus(resultMsg);
          enableCells();
          break;

        case "error":
          updateStatus(`Error: ${data.message}`);
          console.error("❌ Server error:", data.message);
          break;
      }
    } catch (err) {
      console.error("❌ Parse error:", err);
    }
  };

  ws.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
    updateStatus("Connection error");
  };

  ws.onclose = () => {
    console.log("⚫ Disconnected from server");
    updateStatus("Disconnected");
  };
}

function renderBoard(newBoard) {
  board = newBoard.slice();
  cells.forEach((btn, i) => {
    const val = board[i];
    btn.textContent = val ? val : "";
    btn.classList.toggle("x", val === "X");
    btn.classList.toggle("o", val === "O");
  });
}

function updateStatus(status) {
  statusEl.textContent = status;
}

function isMyTurn() {
  if (!gameActive || !mySide) return false;

  // Infer turn from board: if X count == O count, it's X's turn
  const xCount = board.filter((c) => c === "X").length;
  const oCount = board.filter((c) => c === "O").length;
  const nextTurn = xCount === oCount ? "X" : "O";

  return nextTurn === mySide;
}

function getStatusText() {
  if (!gameActive) return "Game finished";
  return isMyTurn() ? "Your turn" : "Opponent's turn";
}

function enableCells() {
  const myTurn = isMyTurn();
  cells.forEach((btn, i) => {
    btn.disabled = !myTurn || board[i] !== null;
  });
}

function handleFindGame() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    updateStatus("Not connected");
    return;
  }

  console.log("🔍 Sending findGame...");
  const message = {
    type: "findGame",
  };
  ws.send(JSON.stringify(message));
  updateStatus("Looking for match...");
}

function handleMove(position) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    updateStatus("Not connected");
    return;
  }

  if (!gameActive || !gameId) {
    updateStatus("Not in a game");
    return;
  }

  if (!isMyTurn()) {
    updateStatus("Not your turn");
    return;
  }

  if (board[position] !== null) {
    updateStatus("Cell already occupied");
    return;
  }

  console.log(`📤 Sending move at position ${position}`);
  ws.send(
    JSON.stringify({
      type: "makeMove",
      gameId: gameId,
      position: position,
    })
  );

  // Temporarily disable all cells while waiting for server response
  cells.forEach((btn) => (btn.disabled = true));
}

connect();

// Add click handlers to all cells
cells.forEach((btn, i) => {
  btn.addEventListener("click", () => {
    handleMove(i);
  });
});

findBtn.addEventListener("click", handleFindGame);
