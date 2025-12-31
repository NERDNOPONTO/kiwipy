# Welcome to InfoPay

## Project info

A complete SaaS platform for selling digital products (infoprodutos) in Angola, integrated with EMIS payment gateway.

## How can I edit this code?

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd kiwipy

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Auth, Database, Edge Functions)

## Deploying to Vercel

1. Import this repository into Vercel.
2. Configure the following **Environment Variables** in Vercel (Settings -> Environment Variables):
   - `VITE_SUPABASE_URL`: Your Supabase URL (e.g., `https://xyz.supabase.co`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon Key

3. Deploy!

### Supabase Edge Functions Configuration

For payment callbacks to work correctly with your Vercel deployment, you must set the `FRONTEND_URL` secret in Supabase. This ensures the payment gateway redirects users back to your correct domain.

Run this command locally (if you have Supabase CLI installed) or set it in the Supabase Dashboard (Settings -> Edge Functions -> Secrets):

```bash
supabase secrets set FRONTEND_URL="https://seu-projeto.vercel.app"
```

*Note: Replace `https://seu-projeto.vercel.app` with your actual Vercel domain.*
