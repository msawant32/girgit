# 🦎 Chameleon - Multiplayer Social Deduction Game

A real-time multiplayer web game inspired by the Chameleon card game. Find the imposter among your friends in this exciting social deduction experience!

## 🎮 How to Play

1. **Create or Join a Room**: Enter your name and create a new room or join an existing one with a 6-digit code
2. **Wait for Players**: Minimum 3 players required to start the game
3. **Game Phases**:
   - **Setup** (5s): One player is secretly chosen as the Chameleon
   - **Clue Phase** (60s): Each player gives a one-word clue related to the secret word
   - **Discussion** (30s): Players discuss and identify suspicious behavior
   - **Voting** (30s): Vote on who you think is the Chameleon
   - **Resolution**: If caught, the Chameleon can guess the word to redeem themselves!

## 🎯 Scoring

- **Chameleon caught & guesses correctly**: Chameleon gets 2 points
- **Chameleon caught & guesses wrong**: Other players get 1 point each
- **Chameleon not caught**: Chameleon gets 3 points

## 🚀 Features

- ✅ No registration required
- ✅ Real-time multiplayer with Socket.io
- ✅ Chat functionality during gameplay
- ✅ Round timers for exciting gameplay
- ✅ Game history tracking
- ✅ Mobile-friendly responsive design
- ✅ 20 categories with 400+ words

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

### Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your Girgit repository
   - Set root directory to `/server`
   - Railway will auto-detect and deploy

3. **Configure Environment**
   - No environment variables needed for basic setup
   - Note your backend URL (e.g., `https://your-app.railway.app`)

4. **Configure CORS** (if needed)
   - The server already has CORS configured for all origins
   - For production, update `server/src/index.js` to whitelist specific domains

### Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New Project"
   - Import your Girgit repository
   - Configure:
     - Framework Preset: Vite
     - Root Directory: `client`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Set Environment Variables**
   - Add environment variable:
     - Name: `VITE_SOCKET_URL`
     - Value: Your Railway backend URL (e.g., `https://your-app.railway.app`)

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your game will be live at `https://your-app.vercel.app`

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
      chameleon: { /* your colors */ }
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

Inspired by the Chameleon board game. Built with React, Node.js, and Socket.io.

## 📞 Support

For issues or questions:
- Create an issue in the GitHub repository
- Check existing issues for solutions

---

**Have fun finding the Chameleon! 🦎🔍**
