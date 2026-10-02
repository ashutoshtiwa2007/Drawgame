## Drawgame
 it is basically a 2 player duel game where ones guesses what the othe is drawing on 64x 64 tile sheet

## What it does
- 64x64 Pixel Canvas
- Turn-based Duel
- Real-time Chat & Validation the guesser types what the drawer is trying to draw
- Anti cheating the packets send by guesser are ignored by the server
- Binary networking use of a 5 length array
- Auto loop after the game is lost or won

## Dev log
# Learned first 1 hour
- Learned how to make a *** Websocket *** server and how does it respond 
- learned how to receive and return 
- made a 64x 64 board in html and wrote a script that makes changes on it



# Learned second hour
- ![Project Logo](./img/Screenshot%202026-10-02%20193406.png)

- first run now it i can color it and other persons who join this can also see what i have clicked and the color use 

- ![Project Logo](./img/Screenshot%202026-10-02%20200231.png)

-now click and hover works 

- ![Project Logo](./img/Screenshot%202026-10-02%20203253.png)

- solved the thunderheard problem of if thousand of people join the game 

# 3rd hour
- adding a chat box inorder to make a guess by the guesser
- added a chat where you can guess what the thing is;
- trying to stop the guesset for making its move until he is a drawer

# 4 th hour
- started with 2 player game design one being the drawer and the other guesse
- addes a chat section which validates if the guess was corrrect or not.
- checked if the players are enough to play.
- checked for typos.
- made sure the guesser cannot cheat

# 5th hour
- trying to make a thing so anyone can run it not just me i mean seting up automatically dtect the host
- integrated websocket with http server so it can run on anydevice which clones it.

# 6TH 
- stuck with tunneling local and cloudflare but could not make it instead uploaded it to render
- best as it is fast 

## Tech Stack
- Client: HTML5 Canvas, Vanilla JavaScript, CSS
- Server: Node.js, http, ws
- Hosting: Render

## How to run it
- Clone the repo:

Bash
``` git clone https://github.com/ashutoshtiwa2007/Drawgame.git
cd Drawgame
- Install dependencies:

Bash
npm install
Start the server:

Bash
node server.js
Open http://localhost:8000 in two separate browser windows to test the game loop.