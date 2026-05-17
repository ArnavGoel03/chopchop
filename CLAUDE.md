# CHOP — project notes

Defers to `~/Documents/Projects/DEVELOP_RULES.md` for all engineering and voice standards. No exceptions registered.

## What this is

A single-product D2C landing/store for a 5-blade Indian kitchen chopper. Primary target: Indian urban consumer. Traffic source: Meta ads. Brand: CHOP.

Built as a single static `index.html` (no framework, no build) so it deploys to Vercel in seconds and stays under 30KB on the wire.

## Stack

- Static HTML + CSS + vanilla JS
- Fraunces (display, italic accents) + Plus Jakarta Sans (body)
- Razorpay checkout.js for online payments
- COD flow currently `console.log`s — needs a backend before high-volume ads
- WhatsApp deep link to `+91 99999 99999` (replace before launch)

## Payment architecture

Razorpay client-side flow only. For production, add a Vercel serverless function (`/api/verify.js`) that HMAC-verifies `razorpay_signature` server-side with the Key Secret before fulfilling. Without that, a malicious user can forge a `handler()` payload — fine for soft-launch, not fine at ad-spend scale.

## Design language

Indian summer palette: cream paper (`#FBF1E1`), tomato sunset (`#C24A2D`), marigold (`#F2A93B`), watermelon pink (`#E2547A`), mint (`#6BA378`), deep ink. Fraunces italic for accents.

Per DEVELOP_RULES §9, voice is first-person, concrete, no "transformative" / "game-changing" / etc. Reviews are real-sounding and include one 4-star with a real con (bowl size).

## Open TODOs before scaling ad spend

- Razorpay Key ID replacement
- WhatsApp business number replacement
- Meta Pixel install + Purchase event firing in `showSuccess()`
- Server-side payment verification
- COD capture (Sheet or DB)
- Real product photography
- Custom domain on Vercel
- Privacy/Terms pages (footer links currently `#`)
