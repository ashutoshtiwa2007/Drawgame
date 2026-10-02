const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");

const statusBar = document.getElementById("status-bar");
const timerBadge = document.getElementById("timer");
const toolbar = document.getElementById("toolbar");
const messageList = document.getElementById("messages");
const guessInput = document.getElementById("guessInput");
const sendBtn = document.getElementById("sendBtn");

let ws = null;
let myRole = null;
let lastX = -1;
let lastY = -1;

function hexToRgb(hex) {
  const num = parseInt(hex.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function appendMessage(text, className = "msg-chat") {
  const li = document.createElement("li");
  li.className = className;
  li.textContent = text;
  messageList.appendChild(li);
  messageList.scrollTop = messageList.scrollHeight;
}

function connect() {
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host; 
  ws = new WebSocket(`${protocol}//${host}`);
  ws.binaryType = "arraybuffer";

  ws.onopen = () => {
    console.log("Connected to server!");
  };

  ws.onmessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(event.data);
      if (bytes.length === 12288) {
        drawFullBoard(bytes);
      } else if (bytes.length === 5) {
        drawSinglePixel(bytes);
      }
      return;
    }

    const msg = JSON.parse(event.data);

    if (msg.type === "WAITING") {
      statusBar.textContent = msg.message;
      toolbar.style.display = "none";
      guessInput.disabled = true;
      sendBtn.disabled = true;
    } else if (msg.type === "ROUND_START") {
      myRole = msg.role;
      if (myRole === "DRAWER") {
        statusBar.textContent = `YOU R DRAWR! word is: "${msg.word}|"`;
        toolbar.style.display = "flex";
        guessInput.disabled = true;
        sendBtn.disabled = true;
        canvas.style.cursor = "crosshair";
      } else {
        statusBar.textContent = `You r guessing! Word: ${msg.hint}`;
        toolbar.style.display = "none";
        guessInput.disabled = false;
        sendBtn.disabled = false;
        canvas.style.cursor = "not-allowed";
      }
    } else if (msg.type === "TIMER_TICK") {
      if (timerBadge) timerBadge.textContent = `${msg.timeLeft}s`;
    } else if (msg.type === "ROUND_TIMEOUT") {
      appendMessage(msg.message, "msg-system");
      statusBar.textContent = msg.message;
    } else if (msg.type === "CORRECT_GUESS") {
      appendMessage(msg.message, "msg-system");
      statusBar.textContent = msg.message;
    } else if (msg.type === "CHAT_MESSAGE") {
      appendMessage(`${msg.sender}: ${msg.text}`);
    }
  };

  ws.onclose = () => {
    statusBar.textContent = "Disconnected! Retrying in 2 sec";
    setTimeout(connect, 2000);
  };

  ws.onerror = () => {
    ws.close();
  };
}

connect();

function drawSinglePixel(bytes) {
  const x = bytes[0];
  const y = bytes[1];
  const r = bytes[2];
  const g = bytes[3];
  const b = bytes[4];
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x, y, 1, 1);
}

function drawFullBoard(bytes) {
  const imgData = ctx.createImageData(64, 64);
  let serverIndex = 0;
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = bytes[serverIndex];
    imgData.data[i + 1] = bytes[serverIndex + 1];
    imgData.data[i + 2] = bytes[serverIndex + 2];
    imgData.data[i + 3] = 255;
    serverIndex += 3;
  }
  ctx.putImageData(imgData, 0, 0);
}

function sendPixel(x, y) {
  if (!ws || ws.readyState !== 1 || myRole !== "DRAWER") {
    return;
  }
  const { r, g, b } = hexToRgb(colorPicker.value);
  const packet = new Uint8Array(5);
  packet[0] = x;
  packet[1] = y;
  packet[2] = r;
  packet[3] = g;
  packet[4] = b;
  ws.send(packet);
}

canvas.addEventListener("mousedown", (e) => {
  const scale = 512 / 64;
  const x = Math.floor(e.offsetX / scale);
  const y = Math.floor(e.offsetY / scale);
  lastX = x;
  lastY = y;
  sendPixel(x, y);
});

canvas.addEventListener("mousemove", (e) => {
  if (e.buttons === 1) {
    const scale = 512 / 64;
    const x = Math.floor(e.offsetX / scale);
    const y = Math.floor(e.offsetY / scale);

    if (x === lastX && y === lastY) return;

    lastX = x;
    lastY = y;
    sendPixel(x, y);
  }
});

window.addEventListener("mouseup", () => {
  lastX = -1;
  lastY = -1;
});

function submitGuess() {
  const text = guessInput.value.trim();
  if (!text || !ws || ws.readyState !== 1) return;

  ws.send(JSON.stringify({ type: "GUESS", text }));
  guessInput.value = "";
}

sendBtn.addEventListener("click", submitGuess);
guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitGuess();
});


