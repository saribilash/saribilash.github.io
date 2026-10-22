// প্রতিটি শাড়ির জন্য আলাদা পেজ (saree/<id>.html) এবং sitemap.xml বানায়।
import { mkdirSync, writeFileSync, readdirSync, unlinkSync, existsSync } from "node:fs";

const SITE = "https://saribilash.github.io";
const SUPABASE_URL = "https://oahfxjoauyvbkrfgbuqi.supabase.co";
const SUPABASE_KEY = "sb_publishable_F0VLUllPcT6JQ1o0KxUJ1g_WV7-ccro";
const WHATSAPP = "8801628182808";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = id => encodeURIComponent(String(id));

const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`, {
  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
});
if (!res.ok) { console.error("Products load failed", res.status, await res.text()); process.exit(1); }
const all = await res.json();
const products = all.filter(p => p.active !== false);
console.log(`মোট ${all.length}টি, দেখানো হবে ${products.length}টি`);

mkdirSync("saree", { recursive: true });
const keep = new Set();

for (const p of products) {
  const file = `${slug(p.id)}.html`;
  keep.add(file);
  const url = `${SITE}/saree/${slug(p.id)}.html`;
  const orderUrl = `${SITE}/?p=${slug(p.id)}`;
  const imgs = Array.isArray(p.image_urls) ? p.image_urls.filter(Boolean) : [];
  const img = imgs[0] || `${SITE}/icon-192.png`;
  const price = Number(p.price || 0), reg = Number(p.regular_price || 0);
  const bits = [p.category, p.fabric, p.length_text && `দৈর্ঘ্য ${p.length_text}`].filter(Boolean).join(" · ");
  const descText = (p.description || "").replace(/\s+/g, " ").trim();
  const desc = `${p.name} — মাত্র ${price} টাকা।${bits ? " " + bits + "।" : ""} ${descText}`.trim().slice(0, 300) + " সারা বাংলাদেশে হোম ডেলিভারি।";
  const outOfStock = typeof p.stock === "number" && p.stock <= 0;
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, image: imgs.length ? imgs : [img],
    description: desc, brand: { "@type": "Brand", name: "শাড়ি বিলাশ" },
    offers: { "@type": "Offer", url, priceCurrency: "BDT", price, availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" }
  };
  const colors = Array.isArray(p.colors) && p.colors.length ? `<p><b>রং:</b> ${esc(p.colors.join(", "))}</p>` : "";
  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.name)} — শাড়ি বিলাশ</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(p.name)} — শাড়ি বিলাশ">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="শাড়ি বিলাশ">
<meta property="og:locale" content="bn_BD">
<link rel="icon" href="../favicon-32.png">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>
body{margin:0;font-family:system-ui,"Noto Sans Bengali",sans-serif;background:#faf7f0;color:#0f1c2e}
main{max-width:520px;margin:0 auto;padding:16px}
img.hero{width:100%;border-radius:14px;display:block;background:#eee}
h1{font-size:22px;margin:14px 0 6px}
.price{font-size:24px;font-weight:800;color:#065f46}.price s{font-size:16px;color:#888;font-weight:400;margin-left:8px}
.btn{display:block;text-align:center;margin:12px 0;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;font-size:17px}
.order{background:#0f1c2e;color:#f1e6c3}.wa{background:#16a34a;color:#fff}
.thumbs{display:flex;gap:8px;overflow-x:auto;margin-top:8px}.thumbs img{height:70px;border-radius:8px}
a.back{color:#0f1c2e}
</style>
</head>
<body>
<main>
<p><a class="back" href="../">← শাড়ি বিলাশ</a></p>
<img class="hero" src="${esc(img)}" alt="${esc(p.name)}">
${imgs.length > 1 ? `<div class="thumbs">${imgs.slice(1, 6).map(u => `<img src="${esc(u)}" alt="${esc(p.name)}" loading="lazy">`).join("")}</div>` : ""}
<h1>${esc(p.name)}</h1>
<div class="price">${price}/- টাকা${reg > price ? `<s>${reg}/-</s>` : ""}</div>
${bits ? `<p>${esc(bits)}</p>` : ""}
${colors}
${p.blouse_free ? "<p>🧵 ব্লাউজ পিস ফ্রি</p>" : ""}
${descText ? `<p>${esc(descText)}</p>` : ""}
${outOfStock ? "<p><b>⚠️ এই মুহূর্তে স্টক শেষ</b></p>" : ""}
<a class="btn order" href="${esc(orderUrl)}">🛍️ অর্ডার করুন</a>
<a class="btn wa" href="https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${encodeURIComponent(`হ্যালো শাড়ি বিলাশ! আমি এই শাড়িটি সম্পর্কে জানতে চাই: ${p.name}\n${url}`)}">💬 WhatsApp-এ মেসেজ করুন</a>
</main>
</body>
</html>
`;
  writeFileSync(`saree/${file}`, html);
}

// মুছে ফেলা/বন্ধ করা শাড়ির পুরনো পেজ সরানো
for (const f of readdirSync("saree")) if (f.endsWith(".html") && !keep.has(f)) unlinkSync(`saree/${f}`);

const today = new Date().toISOString().slice(0, 10);
const urls = [`  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`];
for (const p of products) {
  const lm = (p.created_at || today).slice(0, 10);
  urls.push(`  <url>\n    <loc>${SITE}/saree/${slug(p.id)}.html</loc>\n    <lastmod>${lm}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
}
writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
console.log("সম্পন্ন");
