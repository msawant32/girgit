# 🦎 Girgit - Multiplayer Social Deduction Game

A real-time multiplayer web game inspired by the Girgit card game. Find the imposter among your friends in this exciting social deduction experience!

## 🎮 How to Play

1. **Create or Join a Room**: Enter your name and create a new room or join an existing one with a 6-digit code
2. **Wait for Players**: Minimum 3 players required to start the game
3. **Game Phases**:
   - **Setup** (5s): One player is secretly chosen as the Girgit
   - **Clue Phase** (60s): Each player gives a one-word clue related to the secret word
   - **Discussion** (30s): Players discuss and identify suspicious behavior
   - **Voting** (30s): Vote on who you think is the Girgit
   - **Resolution**: If caught, the Girgit can guess the word to redeem themselves!

## 🎯 Scoring

- **Girgit caught & guesses correctly**: Girgit gets 2 points
- **Girgit caught & guesses wrong**: Other players get 1 point each
- **Girgit not caught**: Girgit gets 3 points

## 🚀 Features

- ✅ No registration required
- ✅ Real-time multiplayer with Socket.io
- ✅ Chat functionality during gameplay
- ✅ Round timers for exciting gameplay
- ✅ Game history tracking
- ✅ Mobile-friendly responsive design
- ✅ 20 categories with 400+ words
- ✅ New Game button to restart with same players
- ✅ Automatic socket reconnection
- ✅ Host controls for game flow

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- Socket.io Client
- React Router

### Backend
- Node.js
- Express
- Socket.io
- In-memory storage

## 📦 Project Structure

```
Girgit/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js backend
│   ├── src/
│   │   ├── game/          # Game logic
│   │   ├── socket/        # Socket.io handlers
│   │   ├── database/      # Data storage
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🏃 Local Development

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Girgit
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:3001`

5. **Start the Frontend**
   Open a new terminal:
   ```bash
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:3000`

6. **Play the Game**
   - Open `http://localhost:3000` in multiple browser windows/tabs
   - Create a room in one window
   - Join with the room code in other windows
   - Start playing!

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Guide

**Backend: Cyclic**
1. Push code to GitHub
2. Go to [cyclic.sh](https://cyclic.sh)
3. Connect repository, set root to `server`
4. Deploy and copy URL

**Frontend: Netlify**
1. Go to [netlify.com](https://www.netlify.com)
2. Connect repository
3. Set base directory: `client`
4. Add env var: `VITE_SOCKET_URL` = Cyclic URL
5. Deploy

Both services offer **FREE** tiers!

## 🔧 Environment Variables

### Client (.env)
```env
VITE_SOCKET_URL=http://localhost:3001
```

For production, set this to your Railway backend URL.

### Server
No environment variables required. The server uses:
- `PORT` - Defaults to 3001 (Railway sets this automatically)
- `CLIENT_URL` - Defaults to `*` (allow all origins)

## 🎨 Customization

### Adding New Categories

Edit `server/src/game/words.js`:

```javascript
export const WORD_DATABASE = {
  "Your Category": [
    "Word1", "Word2", "Word3", ...
  ],
  // ... existing categories
};
```

### Adjusting Timers

Edit phase durations in `server/src/game/GameRoom.js`:
- Setup phase: Currently 5 seconds
- Clue phase: 60 seconds (line: `this.timerEndTime = Date.now() + 60000`)
- Discussion phase: 30 seconds
- Voting phase: 30 seconds

### Styling

The app uses TailwindCSS. Customize colors in `client/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* your colors */ },
      Girgit: { /* your colors */ }
    }
  }
}
```

## 🐛 Troubleshooting

### Connection Issues
- Ensure backend server is running
- Check `VITE_SOCKET_URL` is set correctly
- Verify CORS settings in `server/src/index.js`

### Game State Not Syncing
- Check browser console for errors
- Ensure Socket.io is connected (green indicator)
- Refresh page and rejoin room

### Deployment Issues
- Railway: Check logs in Railway dashboard
- Vercel: Check deployment logs in Vercel dashboard
- Ensure environment variables are set correctly

## 📱 Mobile Support

The game is fully responsive and works on mobile devices. For the best experience:
- Use landscape mode on small screens
- Ensure stable internet connection
- Use modern browsers (Chrome, Safari, Firefox)

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Add more game modes
- Implement user accounts and persistent stats
- Add voice chat support
- Create custom room settings
- Add animations and sound effects

## 📄 License

MIT License - feel free to use this project for learning or building your own version!

## 🙏 Credits

Inspired by the Girgit board game. Built with React, Node.js, and Socket.io.

## 📞 Support

For issues or questions:
- Create an issue in the GitHub repository
- Check existing issues for solutions

---

**Have fun finding the Girgit! 🦎🔍**
