# Fly.io Deployment Commands

## 1. Create persistent volume (one-time)
```bash
fly volumes create girgit_data --region iad --size 1
```

## 2. Set environment variables
```bash
fly secrets set SESSION_SECRET=$(openssl rand -base64 32)
```

## 3. Deploy
```bash
fly deploy
```

## 4. Check status
```bash
fly status
fly logs
```

## 5. Get app URL
```bash
fly apps list
```

Your server will be at: https://girgit.fly.dev

## Troubleshooting
- Check logs: `fly logs`
- SSH into machine: `fly ssh console`
- Check database: `ls -la /data` (from SSH)
