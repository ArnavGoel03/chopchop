# CHOP.

Single-page D2C store for a 5-blade Indian kitchen chopper. Static HTML, Razorpay client-side checkout, COD flow, WhatsApp deep link, referral section.

## Run locally

Just open `index.html` in a browser. No build step.

## Go live on Vercel

```bash
cd ~/Documents/Projects/chop
npx vercel --prod --yes
```

First run prompts a one-time login (browser opens). Subsequent deploys are silent.

## Razorpay setup

1. Sign up at https://dashboard.razorpay.com
2. Get your **Key ID** from Settings → API Keys (use `rzp_test_...` while testing, `rzp_live_...` for production)
3. Replace `rzp_test_REPLACE_WITH_YOUR_KEY` in `index.html` (search for it — single occurrence in the `<script>` block)

For production-grade payments you also need to verify the HMAC signature server-side. To add that, drop an `/api/verify.js` Vercel serverless function that hashes `razorpay_order_id|razorpay_payment_id` with your Key Secret and compares to `razorpay_signature`. The current site is fine for soft-launch and Meta-ads testing.

## COD orders

Right now COD submissions just `console.log`. To capture them:
- Easiest: swap `console.log('COD order'...)` for a `fetch()` to a Google Apps Script web app writing to a Sheet, OR
- Better: a Vercel `/api/cod.js` function that writes to a database (Vercel Postgres, Supabase) and emails you

## What to change before launching ads

- [ ] Razorpay key (`rzp_test_REPLACE_WITH_YOUR_KEY` in `index.html`)
- [ ] WhatsApp number (`919999999999` in `index.html` — search and replace)
- [ ] Meta Pixel — add the standard snippet inside `<head>` and fire `Purchase` events from `showSuccess()`
- [ ] Product photos — currently illustrated SVGs; swap for real product shots when you have them
- [ ] Domain — `vercel domains add chopindia.in` (or whatever you buy) and add via the dashboard

## Files

- `index.html` — the entire storefront
- `README.md` — this file
- `CLAUDE.md` — project notes for future Claude sessions
