# Deployment Guide

## Prerequisites
- GitHub account
- Render account (sign up at render.com)
- Netlify account (sign up at netlify.com)

## Step 1: Push to GitHub

```bash
# Create a new repository on GitHub (github.com/new)
# Then push your code:

git remote add origin https://github.com/YOUR_USERNAME/chameleon-game.git
git push -u origin main
```

## Step 2: Deploy Backend to Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Sign in with GitHub and select your repository
4. Configure the service:
   - **Name:** chameleon-backend
   - **Region:** Oregon (or closest to you)
   - **Branch:** main
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. **Environment Variables:**
   - Click "Advanced" → Add:
   - `NODE_ENV` = `production`

6. Click "Create Web Service"
7. Wait 3-5 minutes for deployment
8. Copy your Render URL (e.g., `https://chameleon-backend.onrender.com`)

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
   - **Value:** Your Render backend URL (from Step 2)

7. Click "Deploy site"

## Step 4: Update CORS Settings

After deployment, update the backend CORS settings:

1. Go to your Render dashboard
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
- Check Render backend is running (visit the /health endpoint)
- Check CORS settings on backend
- Render free tier sleeps after 15min inactivity - first request may be slow

### Backend Not Responding
- Check Render logs in the dashboard
- Verify environment variables are set
- Render free tier may take 30-60 seconds to wake up from sleep
- Check if PORT is being used correctly (Render sets this automatically)

### Frontend Build Fails
- Check if all dependencies are in package.json
- Verify build command is correct
- Check Netlify build logs

## URLs After Deployment

- **Backend API:** `https://chameleon-backend.onrender.com`
- **Frontend:** `https://your-app.netlify.app`
- **Health Check:** `https://chameleon-backend.onrender.com/health`

## Cost

- Render: **FREE** (with limits: 10,000 requests/month)
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
