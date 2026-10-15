// Shared helpers: load listing.json and turn it into text, QR codes and images.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isPlaceholder = (s) => /\[[^\]]*\]/.test(String(s ?? ""));
// Strip the [brackets] for display so unfinished fields still read naturally.
const clean = (s) => String(s ?? "").replace(/\[([^\]]*)\]/g, "$1");

async function loadListing() {
  const res = await fetch("listing.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("Could not load listing.json");
  return res.json();
}

function siteUrl(L) {
  if (L.site_url && !isPlaceholder(L.site_url)) return L.site_url;
  return location.href.replace(/[^/]*([?#].*)?$/, "");
}

function fullAddress(L) {
  const a = L.address;
  return clean(`${a.street}, ${a.unit}, ${a.city}, ${a.state} ${a.zip}`);
}

function bedBath(L) {
  return clean(`${L.bedrooms} bd · ${L.bathrooms} ba · ${L.sqft} sq ft`);
}

// The photo marked "floorplan": true (falls back to one with "floor" in its name).
function floorPlan(L) {
  const photos = L.photos || [];
  return photos.find((p) => p.floorplan) || photos.find((p) => /floor/i.test(`${p.src} ${p.caption}`));
}

// " (discounted from $1,100/mo)" when an original price is set.
const discount = (L) => (L.rent_original ? ` (discounted from ${clean(L.rent_original)})` : "");
const dollars = (s) => Number(clean(s).replace(/[^\d.]/g, "").replace(/\.$/, ""));
const savings = (L) => "$" + (dollars(wasPrice(L)) - dollars(clean(L.rent).replace(/\/mo.*$/, ""))).toLocaleString();
const wasPrice = (L) => clean(L.rent_original || "").replace(/\/mo.*$/, "");

function telHref(phone) { return "tel:" + clean(phone).replace(/[^\d+]/g, ""); }
function smsHref(phone, body) { return "sms:" + clean(phone).replace(/[^\d+]/g, "") + "?&body=" + encodeURIComponent(body); }

// Every field still containing [placeholder] text, as readable paths.
function placeholders(obj, path = "") {
  const out = [];
  if (typeof obj === "string") { if (isPlaceholder(obj)) out.push({ path, value: obj }); }
  else if (Array.isArray(obj)) obj.forEach((v, i) => out.push(...placeholders(v, `${path}[${i}]`)));
  else if (obj && typeof obj === "object")
    for (const [k, v] of Object.entries(obj)) if (!k.startsWith("_")) out.push(...placeholders(v, path ? `${path}.${k}` : k));
  return out;
}

/* ---------- Copy-ready text ---------- */

const bullets = (arr, mark = "•") => (arr || []).map((x) => `${mark} ${clean(x)}`).join("\n");
const pairs = (arr, mark = "•") => (arr || []).map((x) => `${mark} ${clean(x.label)}: ${clean(x.value)}`).join("\n");

const texts = {
  marketplace(L) {
    return clean(
`${L.headline}
💵 ${L.rent}${discount(L)}

📍 ${L.address.street}, ${L.address.city} (${L.address.neighborhood})
🛏 ${L.bedrooms} bed · 🛁 ${L.bathrooms} bath · ${L.sqft} sq ft
🚌 ${L.commute}
📅 Available ${L.available} · lease runs through ${L.lease_ends}

${L.star_feature ? `🧺 ${L.star_feature}

` : ""}${L.tagline}

✨ Highlights
${bullets(L.highlights)}

💵 Costs
${pairs(L.costs)}

✅ Included: ${(L.included || []).map(clean).join(", ")}

📋 Policies
${pairs(L.policies)}

📸 All photos, FAQ & details: ${siteUrl(L)}

This is a ${L.listing_type.toLowerCase()}. You'd be approved by the landlord and take over the lease. Message me here or text ${L.contact.phone}!`);
  },

  short(L) {
    return clean(`🏡 ${L.bedrooms}BR/${L.bathrooms}BA at ${L.address.street}, ${L.address.city}: ${L.rent}${discount(L)}. Available ${L.available} (lease through ${L.lease_ends}). ${L.commute}.${L.star_feature ? " " + L.star_feature : ""} Photos & details: ${siteUrl(L)}`);
  },

  craigslist(L) {
    return clean(
`${L.headline}

${L.tagline}
${L.star_feature ? `
★ ${L.star_feature}
` : ""}
THE BASICS
- Address: ${fullAddress(L)}
- Rent: ${L.rent}${discount(L)}
- Size: ${L.bedrooms} bed / ${L.bathrooms} bath / ${L.sqft} sq ft, ${L.furnished} (no roommates)
- Commute: ${L.commute}
- Available: ${L.available}
- Lease ends: ${L.lease_ends} (${L.listing_type})

HIGHLIGHTS
${bullets(L.highlights, "-")}

COSTS
${pairs(L.costs, "-")}

INCLUDED: ${(L.included || []).map(clean).join(", ")}
AMENITIES: ${(L.amenities || []).map(clean).join(", ")}

POLICIES
${pairs(L.policies, "-")}

HOW IT WORKS
${(L.how_it_works || []).map((s, i) => `${i + 1}. ${clean(s)}`).join("\n")}

Photos, FAQ and everything else: ${siteUrl(L)}
Contact ${L.contact.name}: ${L.contact.phone} / ${L.contact.email} (${L.contact.preferred})`);
  },

  reply(L) {
    return clean(
`Hi! Thanks for reaching out about ${L.address.street}. Yes, it's still available.

Quick rundown: it's your own ${L.bedrooms} bed / ${L.bathrooms} bath (no roommates), ${L.furnished.toLowerCase()}, ${L.rent} for the whole place${discount(L)}, ${L.commute.charAt(0).toLowerCase() + L.commute.slice(1)}, available ${L.available}, and the lease runs through ${L.lease_ends}. You'd apply with the property manager and take over the lease.

Everything (photos, costs, FAQ) is here: ${siteUrl(L)}

Would you like to set up a tour? I'm happy to do in person or a video walkthrough. When works for you?

- ${L.contact.name}`);
  },

  ai(L) {
    const s = (t, body) => (body && body.trim() ? `## ${t}\n${body}\n\n` : "");
    return (
`# Apartment relet: ${clean(L.title)}
Source of truth: ${siteUrl(L)}listing.json · Website: ${siteUrl(L)}

## Key facts
- Type: ${clean(L.listing_type)}
- Address: ${fullAddress(L)} (${clean(L.address.neighborhood)})
- Rent: ${clean(L.rent)}${discount(L)}
- Available: ${clean(L.available)}
- Lease ends: ${clean(L.lease_ends)}
- Size: ${bedBath(L)}, ${clean(L.furnished)}, no roommates
- Commute: ${clean(L.commute)}
- Headline: ${clean(L.headline)}
- Summary: ${clean(L.tagline)}
- Standout feature: ${clean(L.star_feature)}

` +
      s("Highlights", bullets(L.highlights, "-")) +
      s("Costs", pairs(L.costs, "-")) +
      s("Included in rent", bullets(L.included, "-")) +
      s("Amenities", bullets(L.amenities, "-")) +
      s("Policies", pairs(L.policies, "-")) +
      s("Neighborhood", bullets(L.neighborhood, "-")) +
      s("How the relet works", (L.how_it_works || []).map((x, i) => `${i + 1}. ${clean(x)}`).join("\n")) +
      s("FAQ", (L.faq || []).map((f) => `Q: ${clean(f.q)}\nA: ${clean(f.a)}`).join("\n\n")) +
      s("Floor plan", floorPlan(L) ? `- ${siteUrl(L)}${floorPlan(L).src}` : "") +
      s("Photos", (L.photos || []).filter((p) => p !== floorPlan(L)).map((p) => `- ${siteUrl(L)}${p.src}${p.caption ? ` (${p.caption})` : ""}`).join("\n")) +
`## Contact
- ${clean(L.contact.name)}: ${clean(L.contact.phone)}, ${clean(L.contact.email)}
- ${clean(L.contact.preferred)}. ${clean(L.contact.hours)}

## Instructions for AI
${clean(L.notes_for_ai)}
`);
  },
};

/* ---------- QR + image export ---------- */

function renderQR(el, text, size = 256) {
  el.innerHTML = "";
  new QRCode(el, { text, width: size, height: size, colorDark: "#1d2b25", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function qrPng(text, size = 1200) {
  const box = document.createElement("div");
  renderQR(box, text, size);
  const canvas = box.querySelector("canvas");
  // Add a quiet-zone border so scanners read it reliably.
  const pad = Math.round(size * 0.08);
  const out = document.createElement("canvas");
  out.width = out.height = size + pad * 2;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, pad, pad);
  return out.toDataURL("image/png");
}

// Renders an element at its true pixel size (off-screen) and saves it as PNG.
async function exportPng(node, filename, scale = 1) {
  const stage = document.createElement("div");
  stage.style.cssText = "position:fixed;left:-20000px;top:0;";
  const clone = node.cloneNode(true);
  clone.style.transform = "none";
  stage.appendChild(clone);
  document.body.appendChild(stage);
  await Promise.all($$("img", clone).map((img) => (img.complete ? 0 : new Promise((r) => (img.onload = img.onerror = r)))));
  if (document.fonts) await document.fonts.ready;
  try {
    const canvas = await html2canvas(clone, { scale, useCORS: true, backgroundColor: null });
    downloadDataUrl(canvas.toDataURL("image/png"), filename);
  } finally {
    stage.remove();
  }
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
  }
  if (btn) {
    const old = btn.textContent;
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = old), 1600);
  }
}
