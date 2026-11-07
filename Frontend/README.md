# SubTrack frontend

React and Vite frontend for the SubTrack FastAPI backend.

## Configure

Copy `.env.example` to `.env` and set the Supabase project URL, its publishable/anon key, and the backend URL:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
VITE_API_URL=http://localhost:8000
```

The browser only needs the Supabase publishable/anon key. Never put the Supabase service-role key or database connection string in frontend environment variables.

## Run

Start the FastAPI backend, then run these commands from `Frontend/`:

```powershell
npm install
npm run dev
```

The app uses Supabase email/password authentication and sends the current access token to the API. It reads `/subs`, `/subs/price-history`, and `/alerts`, and creates, updates, and deletes subscriptions through `/subs` and `/subs/{subs_id}`. Subscription forms include `names`, `price`, `startd`, `duration`, and `category`; the duration is in days. Categories are selected from Entertainment, Productivity, Utilities, Education, Health & Fitness, Shopping, and Other.

Price history is recorded when a subscription is added and whenever its price or billing-cycle duration changes. The monthly chart compares monthly-equivalent amounts and does not estimate months before tracking begins. Apply `Supabase/schema.sql` to add the category and price history tables to an existing database before deploying the updated backend.

Use `npm run lint` and `npm run build` to check the frontend.
