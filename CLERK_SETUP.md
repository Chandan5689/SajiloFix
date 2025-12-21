# Environment Variables Setup

## Required Environment Variables

Add these to your environment or create a `.env` file in `Backend/backend/`:

```bash
# Clerk Settings
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Database
DB_NAME=sajilofixdb
DB_USER=postgres
DB_PASSWORD=admin
DB_HOST=localhost
DB_PORT=5432

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
```

## How to Get Clerk Secret Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to **API Keys** in the left sidebar
4. Copy the **Secret Key** (starts with `sk_test_...` or `sk_live_...`)
5. Add it to your `.env` file or environment variables

## Testing Without .env File

For quick testing, you can temporarily add the key directly to `settings.py`:

```python
CLERK_SECRET_KEY = 'sk_test_your_actual_key_here'
```

**⚠️ Never commit real keys to version control!**

## Restart Backend After Changes

After adding the secret key:

```powershell
cd E:\SajiloFix\Backend\backend
py manage.py runserver
```
