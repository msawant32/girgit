# Deployment Guide

## Prerequisites
- GitHub account
- Cyclic account (sign up at cyclic.sh)
- Netlify account (sign up at netlify.com)

## Step 1: Push to GitHub

```bash
# Create a new repository on GitHub (github.com/new)
# Then push your code:

git remote add origin https://github.com/YOUR_USERNAME/chameleon-game.git
git push -u origin main
```

## Step 2: Deploy Backend to Cyclic

1. Go to [cyclic.sh](https://cyclic.sh)
2. Click "Deploy" or "Connect Repository"
3. Sign in with GitHub
4. Select your repository
5. Cyclic will auto-detect the Node.js app in `/server`
6. **Important:** Set root directory to `server` if prompted
7. Click "Deploy"

### Configure Environment Variables on Cyclic:
- Go to your app settings
- Add environment variable:
  - `NODE_ENV` = `production`
  - `CLIENT_URL` = `*` (or your Netlify domain later)

8. Copy your Cyclic app URL (e.g., `https://your-app.cyclic.app`)

## Step 3: Deploy Frontend to Netlify

1. Go to [netlify.com](https://www.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Configure build settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`

### Set Environment Variables on Netlify:
5. Go to Site settings → Environment variables
6. Add variable:
   - **Key:** `VITE_SOCKET_URL`
   - **Value:** Your Cyclic backend URL (from Step 2)

7. Click "Deploy site"

## Step 4: Update CORS Settings

After deployment, update the backend CORS settings:

1. Go to your Cyclic dashboard
2. Edit environment variables
3. Update `CLIENT_URL` to your Netlify domain:
   - `CLIENT_URL` = `https://your-app.netlify.app`
4. Redeploy if needed

## Step 5: Test Your Deployment

1. Open your Netlify URL
2. Create a room
3. Open another browser/device
4. Join the room with the code
5. Test the gameplay!

## Troubleshooting

### Socket Connection Errors
- Verify `VITE_SOCKET_URL` is set correctly on Netlify
- Check Cyclic backend is running (visit the /health endpoint)
- Check CORS settings on backend

### Backend Not Responding
- Check Cyclic logs in the dashboard
- Verify environment variables are set
- Check if PORT is being used correctly (Cyclic sets this automatically)

### Frontend Build Fails
- Check if all dependencies are in package.json
- Verify build command is correct
- Check Netlify build logs

## URLs After Deployment

- **Backend API:** `https://your-app.cyclic.app`
- **Frontend:** `https://your-app.netlify.app`
- **Health Check:** `https://your-app.cyclic.app/health`

## Cost

- Cyclic: **FREE** (with limits: 10,000 requests/month)
- Netlify: **FREE** (100GB bandwidth, 300 build minutes/month)

## Local Development

```bash
# Start backend
cd server
npm start

# Start frontend (in another terminal)
cd client
npm run dev
```

Backend: http://localhost:3001
Frontend: http://localhost:3000
