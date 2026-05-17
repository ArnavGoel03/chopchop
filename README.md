# CHOP.

Indian D2C single-page storefront for a 5-blade kitchen chopper. Static HTML + vanilla JS. Razorpay + COD checkout, WhatsApp order capture, pincode delivery checker, referral program, Meta-ads-ready.

- **Live:** https://chopchop.vercel.app
- **Code:** https://github.com/ArnavGoel03/chopchop

## Workflow

Push to `main` and Vercel auto-deploys to production. Push any other branch and Vercel posts a preview URL.

```bash
# edit files
git add -A
git commit -m "your message"
git push                # → auto-deploys
```

To manually trigger a production deploy: `npx vercel --prod --yes`.

## Three placeholders to swap before scaling Meta ads

All near the top of `index.html`, lines 16-17:

```js
window.META_PIXEL_ID = '';              // paste Meta Pixel ID
window.BUSINESS_WHATSAPP = '919999999999';  // your WhatsApp Business number, no +
```

And in the `placeOrder()` function near the bottom:

```js
const KEY = window.RAZORPAY_KEY_ID || 'rzp_test_REPLACE_WITH_YOUR_KEY';
```

Replace the fallback with your Razorpay Key ID from https://dashboard.razorpay.com. Until you do, orders flow through WhatsApp instead — the site still works.

## Order flow

- **Online payment** (when Razorpay configured): standard Razorpay modal, webhook in `handler:` callback.
- **Online payment** (no Razorpay key): opens WhatsApp with order details + "share UPI ID" message.
- **COD**: opens WhatsApp with full order details for you to confirm and dispatch.

Every successful order also fires a Meta Pixel `Purchase` event (if Pixel ID is set) and stores the last order in localStorage.

## File map

- `index.html` — storefront (hero, demo, features, reviews, bundles, refer, FAQ, checkout modal)
- `track.html` — order tracking, deterministic mock based on order ID hash
- `privacy.html`, `terms.html`, `returns.html`, `shipping.html` — required for Meta ad approval
- `_shared.css` — shell stylesheet for the policy pages
- `vercel.json` — clean URLs + security headers
- `CLAUDE.md` — notes for future Claude sessions, defers to `~/Documents/Projects/DEVELOP_RULES.md`

## Production hardening (before serious ad spend)

- [ ] Razorpay key + server-side HMAC verification (Vercel function at `/api/verify`)
- [ ] WhatsApp Business number replaced everywhere (`grep 919999999999` to find)
- [ ] Meta Pixel ID active + Purchase event fires (test in Meta Events Manager)
- [ ] Custom domain (`vercel domains add yourdomain.in`)
- [ ] Real product photography swapped in for the SVG illustration
- [ ] Privacy / Terms reviewed by a lawyer (current copy is a reasonable starting point, not legal advice)
- [ ] Have a lawyer + CA confirm GST invoice fields and refund policy match your business setup
