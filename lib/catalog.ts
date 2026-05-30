import type { Category, Product, ProductCategory } from "./types";

// Prices are integer minor units: INR paise, USD cents.
// in: 99900 = ₹999    intl: 1499 = $14.99

export const CATEGORIES: Category[] = [
  { id: "choppers", label: "Choppers", blurb: "Pull-cord and press choppers that do the prep for you." },
  { id: "prep", label: "Prep Tools", blurb: "Peelers, slicers and grinders that earn their drawer space." },
  { id: "cookware", label: "Cookware", blurb: "Pans and pots built for everyday Indian cooking." },
  { id: "storage", label: "Storage", blurb: "Keep it fresh, keep it sorted." },
  { id: "bundles", label: "Bundles", blurb: "Curated sets that save you more." },
];

export const PRODUCTS: Product[] = [
  {
    slug: "5-blade-chopper",
    name: "CHOP. 5-Blade Chopper",
    tagline: "Pull. Chop. Done. Onions to chutneys in ten seconds.",
    category: "choppers",
    price: { in: 99900, intl: 1499 },
    compareAt: { in: 199900, intl: 2999 },
    badges: ["Bestseller", "No electricity", "5 steel blades"],
    description: [
      "The 5-blade chopper that does pyaaz, tamatar, dhaniya and salad in under ten seconds. No electricity, no tears, no knife skills needed.",
      "Five cross-arranged Japanese stainless blades spin at 1,000 rpm on a single firm pull of the cord. Three pulls gives you restaurant-grade uniform pieces straight into the bowl that doubles as your prep dish.",
    ],
    features: [
      { icon: "knife", title: "5 Japanese steel blades", body: "Cross-arranged for uniform chopping. Stays sharp through 50,000+ pulls." },
      { icon: "leaf", title: "BPA-free body", body: "Food-grade, tested to IS 14625. Safe for hot and cold prep." },
      { icon: "droplet", title: "Dishwasher safe", body: "Detaches in three parts. Rinse-and-go in under thirty seconds." },
      { icon: "zap", title: "No electricity", body: "Manual cord-pull. Works during load-shedding, in the garden, anywhere." },
      { icon: "hand", title: "Non-slip base", body: "Silicone ring grips the counter so it doesn't chase you around the slab." },
      { icon: "shield", title: "1-year warranty", body: "Free replacement for any manufacturing defect. No-questions returns." },
    ],
    specs: {
      Capacity: "900 ml bowl",
      Blades: "5 × 420-grade stainless steel",
      Material: "BPA-free ABS + silicone base",
      "Cord life": "50,000+ pulls rated",
      Warranty: "1 year",
      "In the box": "Bowl, blade unit, lid, whisk attachment",
    },
    variants: [
      { id: "single", label: "Single", sku: "CHOP-CHP-1", price: { in: 99900, intl: 1499 }, compareAt: { in: 199900, intl: 2999 }, inventory: 480, note: "One chopper, for yourself." },
      { id: "family", label: "Family Pack", sku: "CHOP-CHP-2", price: { in: 179900, intl: 2699 }, compareAt: { in: 399800, intl: 5998 }, inventory: 260, note: "Two units — one for amma." },
      { id: "combo", label: "Kitchen Combo", sku: "CHOP-CHP-C", price: { in: 149900, intl: 2299 }, compareAt: { in: 299800, intl: 4498 }, inventory: 180, note: "Chopper + matching peeler." },
    ],
    reviews: [
      { author: "Ananya R.", location: "Mumbai", rating: 5, verified: true, body: "Bought one for my mother in Pune. She used to cry every time she made biryani. Now her prep takes five minutes — I ordered a second for myself." },
      { author: "Karthik S.", location: "Bengaluru", rating: 5, verified: true, body: "As a bachelor who can barely cook, this saved me. Salad for lunch is actually possible on a Tuesday." },
      { author: "Meera D.", location: "Delhi NCR", rating: 4, verified: true, body: "Solid build, sharp blades, easy to clean. I wish the bowl was a touch bigger — but for the price with COD, no complaints." },
    ],
    rating: 4.8,
    reviewCount: 2417,
    accent: "tomato",
    featured: true,
  },
  {
    slug: "rapid-peeler",
    name: "CHOP. Rapid Peeler",
    tagline: "Y-grip peeler with a julienne edge. Ribbons in one stroke.",
    category: "prep",
    price: { in: 29900, intl: 699 },
    compareAt: { in: 49900, intl: 999 },
    badges: ["Dual edge", "Razor sharp"],
    description: [
      "A Y-grip peeler with two edges — a straight blade for skins and a julienne comb for carrot and cucumber ribbons. Ceramic-coated stainless that doesn't brown your aloo.",
      "Soft non-slip handle, hanging loop, and a thumb guard that actually keeps your thumb. Dishwasher safe.",
    ],
    features: [
      { icon: "knife", title: "Dual ceramic-coat edge", body: "Straight + julienne in one tool. No browning, no rust." },
      { icon: "hand", title: "Soft Y-grip", body: "Ergonomic handle that doesn't slip when wet." },
      { icon: "shield", title: "Thumb guard", body: "Recessed guard keeps fingers clear of the blade." },
      { icon: "droplet", title: "Dishwasher safe", body: "Top-rack safe. Rinses clean instantly." },
    ],
    specs: { Blade: "Ceramic-coated stainless", Edges: "Straight + julienne", Handle: "TPR non-slip", Warranty: "6 months" },
    variants: [
      { id: "single", label: "Single", sku: "CHOP-PEL-1", price: { in: 29900, intl: 699 }, compareAt: { in: 49900, intl: 999 }, inventory: 600 },
      { id: "pair", label: "Pair", sku: "CHOP-PEL-2", price: { in: 49900, intl: 1199 }, compareAt: { in: 99800, intl: 1998 }, inventory: 300, note: "One for the kitchen, one spare." },
    ],
    reviews: [
      { author: "Sneha P.", location: "Ahmedabad", rating: 5, verified: true, body: "The julienne side is genius. Carrot salad in seconds." },
      { author: "Rohan K.", location: "Pune", rating: 5, verified: true, body: "Sharp out of the box and still sharp after months." },
      { author: "Divya S.", location: "Hyderabad", rating: 4, verified: true, body: "Works exactly as advertised. My one gripe: the julienne teeth are small enough that I have to rinse carefully or bits of carrot get stuck. Takes an extra thirty seconds. Otherwise great peeler." },
    ],
    rating: 4.7,
    reviewCount: 843,
    accent: "mint",
    featured: true,
  },
  {
    slug: "mandoline-slicer",
    name: "CHOP. Adjustable Mandoline",
    tagline: "Five thicknesses, one dial. Wafer chips to thick fries.",
    category: "prep",
    price: { in: 79900, intl: 1299 },
    compareAt: { in: 149900, intl: 2199 },
    badges: ["5 thickness settings", "Finger guard included"],
    description: [
      "A foldable mandoline with a thumb-dial that sets five thicknesses — from 1mm wafer chips to 7mm potato fries. Surgical stainless blade, fold-flat frame for the drawer.",
      "Comes with a locking hand guard so your knuckles stay yours. Non-slip feet on the catch end.",
    ],
    features: [
      { icon: "knife", title: "Surgical stainless blade", body: "Glides through potato, beetroot, cabbage, paneer." },
      { icon: "zap", title: "5-setting dial", body: "1mm to 7mm with a single thumb turn." },
      { icon: "shield", title: "Locking hand guard", body: "Spiked holder keeps fingers off the blade." },
      { icon: "hand", title: "Fold-flat frame", body: "Collapses thin for drawer storage." },
    ],
    specs: { Blade: "Japanese surgical stainless", Settings: "1 / 2 / 4 / 5 / 7 mm", Frame: "Fold-flat ABS", Warranty: "1 year" },
    variants: [
      { id: "single", label: "Single", sku: "CHOP-MND-1", price: { in: 79900, intl: 1299 }, compareAt: { in: 149900, intl: 2199 }, inventory: 220 },
    ],
    reviews: [
      { author: "Vikram J.", location: "Kolkata", rating: 5, verified: true, body: "Chips night is a whole new thing now. The guard is sturdy." },
      { author: "Nisha T.", location: "Jaipur", rating: 4, verified: true, body: "Very sharp — respect it. The dial is precise." },
    ],
    rating: 4.6,
    reviewCount: 531,
    accent: "marigold",
    featured: false,
  },
  {
    slug: "spice-grinder",
    name: "CHOP. Hand Spice Grinder",
    tagline: "Pull-cord masala grinder. Fresh garam masala, no power.",
    category: "prep",
    price: { in: 59900, intl: 999 },
    compareAt: { in: 99900, intl: 1599 },
    badges: ["Manual", "Coarse to fine"],
    description: [
      "The same trusted cord mechanism, tuned for dry spices. Grind jeera, dhaniya, black pepper and whole garam masala fresh, with a coarseness you control by pull count.",
      "Sealed grinding chamber keeps the aroma in and your counter clean.",
    ],
    features: [
      { icon: "zap", title: "Cord-pull grind", body: "No batteries, no charging. Pull to grind." },
      { icon: "knife", title: "Hardened steel burr", body: "Handles peppercorns and dry whole spices." },
      { icon: "leaf", title: "Sealed chamber", body: "Aroma stays in, mess stays out." },
      { icon: "droplet", title: "Easy clean", body: "Splits apart for a quick brush-out." },
    ],
    specs: { Mechanism: "Cord-pull burr", Capacity: "120 ml", Material: "Steel burr + BPA-free body", Warranty: "1 year" },
    variants: [
      { id: "single", label: "Single", sku: "CHOP-GRD-1", price: { in: 59900, intl: 999 }, compareAt: { in: 99900, intl: 1599 }, inventory: 340 },
    ],
    reviews: [
      { author: "Aditya N.", location: "Chennai", rating: 5, verified: true, body: "Fresh pepper at the table. Worth every rupee." },
      { author: "Manjunath R.", location: "Bengaluru", rating: 4, verified: true, body: "Grinds jeera and pepper beautifully. The 120ml chamber fills up fast when I'm making masala for a big batch — I have to stop and empty it halfway. Not a dealbreaker, just something to know upfront." },
    ],
    rating: 4.5,
    reviewCount: 319,
    accent: "tomato",
    featured: false,
  },
  {
    slug: "nonstick-kadhai",
    name: "CHOP. Everyday Kadhai",
    tagline: "2.5L granite non-stick kadhai. Induction + gas ready.",
    category: "cookware",
    price: { in: 129900, intl: 2499 },
    compareAt: { in: 219900, intl: 3999 },
    badges: ["Induction ready", "PFOA-free"],
    description: [
      "A 2.5-litre kadhai with a 5-layer granite non-stick coating that needs barely a spoon of oil. Stay-cool bakelite handles and a glass lid with a steam vent.",
      "Flat-bottomed for induction and works on gas just the same. PFOA-free coating rated for metal-free utensils.",
    ],
    features: [
      { icon: "leaf", title: "5-layer granite coat", body: "PFOA-free, scratch-resistant, low-oil cooking." },
      { icon: "zap", title: "Induction + gas", body: "Flat base heats evenly on any hob." },
      { icon: "hand", title: "Stay-cool handles", body: "Bakelite grips you can hold mid-cook." },
      { icon: "droplet", title: "Glass lid + vent", body: "Watch it cook, let the steam out." },
    ],
    specs: { Capacity: "2.5 L", Coating: "5-layer granite, PFOA-free", Base: "Induction-compatible", Warranty: "1 year" },
    variants: [
      { id: "single", label: "2.5L", sku: "CHOP-KDH-25", price: { in: 129900, intl: 2499 }, compareAt: { in: 219900, intl: 3999 }, inventory: 140 },
      { id: "large", label: "3.5L", sku: "CHOP-KDH-35", price: { in: 159900, intl: 2999 }, compareAt: { in: 259900, intl: 4799 }, inventory: 90, note: "For bigger families." },
    ],
    reviews: [
      { author: "Priya M.", location: "Delhi NCR", rating: 5, verified: true, body: "Nothing sticks, even dosa-adjacent experiments. Handles stay cool." },
      { author: "Samir B.", location: "Surat", rating: 4, verified: true, body: "Excellent non-stick — even paneer doesn't catch. I'd give it five stars except the glass lid rattles a little on high heat. Functional, just slightly annoying in an otherwise quiet kitchen." },
    ],
    rating: 4.6,
    reviewCount: 275,
    accent: "ink",
    featured: true,
  },
  {
    slug: "airtight-canister-set",
    name: "CHOP. Airtight Canister Set",
    tagline: "Six stackable jars with click-lock lids. Pantry, sorted.",
    category: "storage",
    price: { in: 89900, intl: 1899 },
    compareAt: { in: 149900, intl: 2999 },
    badges: ["Set of 6", "Click-lock seal"],
    description: [
      "Six modular borosilicate-look canisters with four-side click-lock lids and silicone gaskets. Keeps atta, dal, sugar and spices dry through monsoon.",
      "Stackable footprint, wipe-clean bodies, and a write-on label panel for each jar.",
    ],
    features: [
      { icon: "shield", title: "Click-lock seal", body: "Four-side latch with silicone gasket. Truly airtight." },
      { icon: "hand", title: "Stackable", body: "Modular footprint that uses shelf height, not width." },
      { icon: "leaf", title: "BPA-free", body: "Food-grade bodies, safe for daily staples." },
      { icon: "droplet", title: "Wipe clean", body: "Smooth bodies, removable gaskets for deep cleans." },
    ],
    specs: { Pieces: "6 (2 × 1.2L, 2 × 800ml, 2 × 500ml)", Seal: "4-side click-lock + gasket", Material: "BPA-free, SAN", Warranty: "6 months" },
    variants: [
      { id: "set6", label: "Set of 6", sku: "CHOP-CAN-6", price: { in: 89900, intl: 1899 }, compareAt: { in: 149900, intl: 2999 }, inventory: 200 },
      { id: "set12", label: "Set of 12", sku: "CHOP-CAN-12", price: { in: 159900, intl: 3399 }, compareAt: { in: 299800, intl: 5998 }, inventory: 110, note: "Whole-pantry refit." },
    ],
    reviews: [
      { author: "Nisha T.", location: "Jaipur", rating: 5, verified: true, body: "Monsoon-proof at last. The lock is genuinely airtight." },
      { author: "Kavitha L.", location: "Chennai", rating: 4, verified: true, body: "Really solid set — the smaller 500ml jars are perfect for spices. My only note is the write-on label panel doesn't take a regular marker cleanly; you need a fine-tip whiteboard pen. Wish they'd included even a small sticker sheet." },
    ],
    rating: 4.7,
    reviewCount: 197,
    accent: "melon",
    featured: false,
  },
];

// ── Accessors ────────────────────────────────────────────────────────────────

const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return BY_SLUG.get(slug);
}

export function allProducts(): Product[] {
  return PRODUCTS;
}

export function featuredProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured);
}

export function productsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getCategory(id: ProductCategory): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getVariant(product: Product, variantId: string) {
  return product.variants.find((v) => v.id === variantId) ?? product.variants[0];
}

export function relatedProducts(slug: string, limit = 4): Product[] {
  const p = getProduct(slug);
  if (!p) return PRODUCTS.slice(0, limit);
  return PRODUCTS.filter((x) => x.slug !== slug && x.category === p.category)
    .concat(PRODUCTS.filter((x) => x.slug !== slug && x.category !== p.category))
    .slice(0, limit);
}
