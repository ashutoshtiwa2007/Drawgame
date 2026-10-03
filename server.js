const http = require("http");
const fs = require("fs");
const path = require("path");

const { WebSocketServer } = require("ws");

const WIDTH = 64;
const HEIGHT = 64;
const BYTES_PER_PIXEL = 3;
const BOARD_SIZE = WIDTH * HEIGHT * BYTES_PER_PIXEL;

const masterBoard = Buffer.alloc(BOARD_SIZE);
masterBoard.fill(255);

const WORDS = ["CAT", "SUN", "TREE", "CAR", "HOUSE", "FISH", "STAR"];
let players = [];
let currentDrawer = null;
let currentWord = "";

const server = http.createServer((req, res) => {

  let safePath = req.url === "/" ? "index.html" : req.url.replace(/^\/+/, "");
  let filePath = path.join(__dirname, safePath);
  const ext = path.extname(filePath);

  let contentType = "text/html";
  if (ext === ".js") contentType = "application/javascript";
  if (ext === ".css") contentType = "text/css";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

const wss = new WebSocketServer({ server });
console.log("WebSocket server running");

let roundTimer = null;
let timeLeft = 60;
function startNewRound() {
  if (players.length < 2) return;
  if (roundTimer) clearInterval(roundTimer);
  masterBoard.fill(255);
  currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  currentDrawer = currentDrawer === players[0] ? players[1] : players[0];
  timeLeft = 60;
  players.forEach((socket) => {
    socket.send(masterBoard);
    if (socket === currentDrawer) {
      socket.send(
        JSON.stringify({
          type: "ROUND_START",
          role: "DRAWER",
          word: currentWord,
          timeLeft: timeLeft,
        }),
      );
    } else {
      const hint = "_ ".repeat(currentWord.length).trim();
      socket.send(
        JSON.stringify({
          type: "ROUND_START",
          role: "GUESSER",
          hint: hint,
          timeLeft: timeLeft,
        }),
      );
    }
  });
roundTimer = setInterval(() => {
    timeLeft--;
    for (const client of players) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: "TIMER_TICK", timeLeft }));
      }
    }

    if (timeLeft <= 0) {
      clearInterval(roundTimer);
      for (const client of players) {
        client.send(
          JSON.stringify({
            type: "ROUND_TIMEOUT",
            message: `TIMES UP thing was "${currentWord}" NEXT GAME IN 10S`,
            winner: "DRAWER",
            word: currentWord
          }),
        );
      }
      setTimeout(startNewRound, 10000);
    }
  }, 1000);
}
wss.on("connection", (socket) => {
  if (players.length >= 2) {
    socket.send(JSON.stringify({ type: "ERROR", message: "Game is full" }));
    socket.close();
    return;
  }
  players.push(socket);
  console.log(`player connected count: ${players.length / 2}`);
  socket.send(masterBoard);
  if (players.length === 2) {
    startNewRound();
  } else {
    socket.send(
      JSON.stringify({
        type: "WAITING",
        message: "Waitn for bro",
      }),
    );
  }

  socket.on("message", (data, isBinary) => {
    if (isBinary) {
      if (socket !== currentDrawer) return;
      if (data.length !== 5) return;
      const x = data[0];
      const y = data[1];
      const r = data[2];
      const g = data[3];
      const b = data[4];

      if (x >= WIDTH || y >= HEIGHT) return;

      const offset = (y * WIDTH + x) * BYTES_PER_PIXEL;
      masterBoard[offset] = r;
      masterBoard[offset + 1] = g;
      masterBoard[offset + 2] = b;

      for (const client of players) {
        if (client.readyState === 1) {
          client.send(data);
        }
      }
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "GUESS") {
        const guess = msg.text.trim().toUpperCase();

        if (socket !== currentDrawer && guess === currentWord) {
          clearInterval(roundTimer);
          for (const client of players) {
            client.send(
              JSON.stringify({
                type: "CORRECT_GUESS",
                message: `CONGOOOOOO the word was "${currentWord}"! Next round in 10s...`,
                winner: "GUESSER",
                word: currentWord
              }),
            );
          }
          setTimeout(startNewRound, 10000);
        }else {
          
          for (const client of players) {
            client.send(
              JSON.stringify({
                type: "CHAT_MESSAGE",
                sender: socket === currentDrawer ? "Drawer" : "Guesser",
                text: msg.text,
              }),
            );
          }
         
          if (socket !== currentDrawer && currentWord) {
            for (const client of players) {
              if (client.readyState === 1) {
                client.send(
                  JSON.stringify({
                    type: "WRONG_GUESS",
                    message: `bruhh that was wron "${msg.text}" is incorrect! try again you have time`,
                  }),
                );
              }
            }
          }
        }
      }
        }catch (err) {
      console.error("Malformed JSON received:", err);
    }
  });

  socket.on("close", () => {
    players = players.filter((p) => p !== socket);
    console.log(`Player disconnected`);
    if (players.length < 2) {
      if (roundTimer) clearInterval(roundTimer);
      currentDrawer = null;
      for (const client of players) {
        client.send(
          JSON.stringify({
            type: "WAITING",
            message: "opponet left waitign forplayer",
          }),
        );
      }
    }
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Game server running on port ${PORT}`);
});
