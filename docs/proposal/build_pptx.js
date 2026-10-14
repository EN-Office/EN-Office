#!/usr/bin/env node
/**
 * local_llm_proposal_v2.html → local_llm_proposal_v2.pptx
 *
 * HTML 側の規約（section.slide 1枚 = スライド1枚）:
 *   data-layout="title"   : 表紙（h1 / p.sub / p.tagline）
 *   data-layout="content" : header(.kicker / h1 / .sub) + 本文ブロック + p.note
 *   本文ブロック: table, .cards > .card, .cols > .col, .chat, .total, .steps, .effects, ul, p
 *
 * usage: node build_pptx.js [input.html] [output.pptx]
 */
const fs = require("fs");
const path = require("path");
const { parse } = require("node-html-parser");
const pptxgen = require("pptxgenjs");

const IN = process.argv[2] || path.join(__dirname, "local_llm_proposal_v2.html");
const OUT = process.argv[3] || path.join(__dirname, "local_llm_proposal_v2.pptx");

// ---------- theme ----------
const C = {
  navy: "14213D", navy2: "1F2F57", gold: "C98A2B", goldBg: "FBF3E4", goldText: "F3D9A6",
  ink: "1A1A1A", muted: "5A6270", line: "D9DCE3", bg: "F5F6F8", card: "FFFFFF", alt: "FAFBFC",
  ok: "2E7D32", warn: "B3261E", white: "FFFFFF", sub: "C9D2E6", chatUser: "EEF1F7", chatAiLine: "EAD7B0",
};
const FONT = "Meiryo";
const SLIDE_W = 13.333, SLIDE_H = 7.5, MX = 0.58, BODY_TOP = 1.72, BODY_BOTTOM = 6.95, NOTE_H = 0.5;

// ---------- helpers ----------
const text = (n) => n.text.replace(/\s+/g, " ").trim();
const cls = (n, c) => (n.getAttribute && (n.getAttribute("class") || "").split(/\s+/).includes(c));
const first = (n, sel) => n.querySelector(sel);

/** inline HTML → pptxgenjs runs (bold / br / .ok .warn) */
function runs(node, base) {
  const out = [];
  const walk = (n, opts) => {
    if (n.nodeType === 3) {
      const t = n.rawText.replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
      if (t.trim()) out.push({ text: t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"), options: { ...opts } });
      return;
    }
    const tag = n.tagName ? n.tagName.toLowerCase() : "";
    if (tag === "br") { out.push({ text: "", options: { ...opts, breakLine: true } }); return; }
    let o = { ...opts };
    if (tag === "b" || tag === "strong") o.bold = true;
    if (cls(n, "ok")) { o.color = C.ok; o.bold = true; }
    if (cls(n, "warn")) { o.color = C.warn; o.bold = true; }
    n.childNodes.forEach((ch) => walk(ch, o));
  };
  walk(node, base);
  // trim leading/trailing spaces of each run edge
  if (out.length) { out[0].text = out[0].text.replace(/^\s+/, ""); out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, ""); }
  return out;
}

/** rough text height (inches). CJK ≈ 1em wide, ASCII ≈ 0.55em. */
function lines(str, widthIn, pt) {
  const per = Math.max(1, (widthIn * 72) / (pt * 0.98));
  return str.split("\n").reduce((acc, ln) => {
    let w = 0; for (const ch of ln) w += ch.charCodeAt(0) > 0x2e7f ? 1 : 0.56;
    return acc + Math.max(1, Math.ceil(w / per));
  }, 0);
}
const textH = (str, widthIn, pt, lh = 1.4) => (lines(str, widthIn, pt) * pt * lh) / 72;

function plain(node) { // text with <br> → \n
  return node.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .split("\n").map((s) => s.replace(/\s+/g, " ").trim()).join("\n").trim();
}

// ---------- block renderers: each returns height used ----------
function addParagraph(slide, node, x, y, w, opts) {
  const pt = opts.fontSize, t = plain(node);
  const h = textH(t, w - 0.1, pt, 1.35) + 0.08;
  slide.addText(runs(node, { fontSize: pt, color: opts.color || C.ink, fontFace: FONT, bold: opts.bold }), {
    x, y, w, h, margin: 0.02, valign: "top", isTextBox: true, fontFace: FONT, paraSpaceAfter: 0,
  });
  return h;
}

function addList(slide, ul, x, y, w, opts) {
  const pt = opts.fontSize, items = ul.querySelectorAll(":scope > li");
  const all = [];
  let h = 0;
  items.forEach((li, i) => {
    const r = runs(li, { fontSize: pt, color: opts.color || C.ink, fontFace: FONT });
    if (r.length) { r[0].options.bullet = { indent: 12 }; r[0].options.paraSpaceAfter = 3; }
    if (i < items.length - 1) r[r.length - 1].options.breakLine = true;
    all.push(...r);
    h += textH(plain(li), w - 0.3, pt, 1.35) + 3 / 72;
  });
  slide.addText(all, { x, y, w, h: h + 0.05, margin: 0.02, valign: "top", isTextBox: true, fontFace: FONT });
  return h + 0.05;
}

/** generic vertical flow of child blocks inside (x,y,w). returns height used */
const F = (ctx) => ctx.compact ? { h3: 12.5, tag: 9, price: 20, p: 10.5, li: 10 } : { h3: 14, tag: 10, price: 24, p: 11.5, li: 11.5 };

function flow(slide, container, x, y, w, ctx) {
  let cy = y; const f = F(ctx);
  for (const ch of container.childNodes) {
    if (ch.nodeType !== 1) continue;
    const tag = ch.tagName.toLowerCase();
    const dark = ctx.dark;
    if (tag === "h3") { cy += addParagraph(slide, ch, x, cy, w, { fontSize: f.h3, bold: true, color: dark ? C.goldText : C.navy }) + 0.02; }
    else if (tag === "p" && cls(ch, "tag")) { cy += addParagraph(slide, ch, x, cy, w, { fontSize: f.tag, bold: true, color: dark ? C.goldText : C.gold }) + 0.04; }
    else if (tag === "div" && cls(ch, "price")) { cy += addParagraph(slide, ch, x, cy, w, { fontSize: f.price, bold: true, color: dark ? C.white : C.navy }) + 0.04; }
    else if (tag === "p" && cls(ch, "title")) { cy += addParagraph(slide, ch, x, cy, w, { fontSize: 9, color: C.muted }) + 0.04; }
    else if (tag === "p") { cy += addParagraph(slide, ch, x, cy, w, { fontSize: f.p, color: dark ? C.white : C.ink }) + 0.04; }
    else if (tag === "ul") { cy += addList(slide, ch, x, cy, w, { fontSize: f.li, color: dark ? C.white : C.ink }); }
    else if (tag === "div" && cls(ch, "msg")) { cy += addMsg(slide, ch, x, cy, w) + 0.1; }
    else if (tag === "div" && cls(ch, "card")) { cy += addCard(slide, ch, x, cy, w, null, { compact: true }) + 0.14; }
    else if (tag === "div" && cls(ch, "chat")) { cy += addChat(slide, ch, x, cy, w) + 0.14; }
    else if (tag === "div" && cls(ch, "num")) { /* handled by effect */ }
    else if (tag === "div") { cy += flow(slide, ch, x, cy, w, ctx); }
  }
  return cy - y;
}

function estimateFlowH(container, w, ctx = {}) {
  let h = 0; const f = F(ctx);
  for (const ch of container.childNodes) {
    if (ch.nodeType !== 1) continue;
    const tag = ch.tagName.toLowerCase();
    if (tag === "h3") h += textH(plain(ch), w - 0.1, f.h3, 1.35) + 0.1;
    else if (tag === "p" && cls(ch, "tag")) h += textH(plain(ch), w - 0.1, f.tag, 1.35) + 0.12;
    else if (tag === "div" && cls(ch, "price")) h += textH(plain(ch), w - 0.1, f.price, 1.35) + 0.12;
    else if (tag === "p" && cls(ch, "title")) h += textH(plain(ch), w - 0.1, 9, 1.35) + 0.12;
    else if (tag === "p") h += textH(plain(ch), w - 0.1, f.p, 1.35) + 0.12;
    else if (tag === "ul") { ch.querySelectorAll(":scope > li").forEach((li) => { h += textH(plain(li), w - 0.3, f.li, 1.35) + 3 / 72; }); h += 0.05; }
    else if (tag === "div" && cls(ch, "msg")) h += msgHeight(ch, w).h + 0.1;
    else if (tag === "div" && cls(ch, "card")) h += estimateFlowH(ch, w - 0.36, { compact: true }) + 0.36 + 0.14;
    else if (tag === "div" && cls(ch, "chat")) h += estimateFlowH(ch, w - 0.28, ctx) + 0.28 + 0.14;
    else if (tag === "div") h += estimateFlowH(ch, w, ctx);
  }
  return h;
}

function addCard(slide, card, x, y, w, fixedH, ctx = {}) {
  const dark = cls(card, "navy"), accent = cls(card, "accent");
  const pad = 0.18;
  const h = fixedH || estimateFlowH(card, w - pad * 2, ctx) + pad * 2;
  slide.addShape("roundRect", {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: dark ? C.navy2 : accent ? C.goldBg : C.card },
    line: { color: dark ? C.navy2 : accent ? C.gold : C.line, width: 0.75 },
    shadow: { type: "outer", color: "000000", opacity: 0.08, blur: 4, offset: 1, angle: 90 },
  });
  flow(slide, card, x + pad, y + pad, w - pad * 2, { ...ctx, dark });
  return h;
}

function msgHeight(msg, w) {
  const pad = 0.12, who = first(msg, ".who");
  const body = msg.innerHTML.replace(/<span class="who">[\s\S]*?<\/span>/, "");
  const bodyText = parse(`<div>${body}</div>`).firstChild.text.split("\n").map((s) => s.trim()).filter(Boolean).join("\n");
  return { h: textH(bodyText, w - pad * 2, 9.5, 1.35) + (who ? 0.22 : 0) + pad * 2, bodyText, who, pad };
}

function addMsg(slide, msg, x, y, w) {
  const user = cls(msg, "user");
  const { h, bodyText, who, pad } = msgHeight(msg, w);
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, fill: { color: user ? C.chatUser : C.goldBg }, line: { color: user ? C.chatUser : C.chatAiLine, width: 0.75 } });
  const r = [];
  if (who) r.push({ text: text(who), options: { bold: true, color: C.navy, fontSize: 9.5, breakLine: true } });
  bodyText.split("\n").forEach((ln, i, a) => r.push({ text: ln, options: { fontSize: 9.5, color: C.ink, breakLine: i < a.length - 1 } }));
  slide.addText(r, { x: x + pad, y: y + pad, w: w - pad * 2, h: h - pad * 2, margin: 0, valign: "top", isTextBox: true, fontFace: FONT });
  return h;
}

function addChat(slide, chat, x, y, w) {
  const pad = 0.14;
  const h = estimateFlowH(chat, w - pad * 2) + pad * 2;
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
  flow(slide, chat, x + pad, y + pad, w - pad * 2, {});
  return h;
}

function addTable(slide, table, x, y, w) {
  const ths = table.querySelectorAll("thead th");
  const n = ths.length;
  let colW = ths.map((th) => { const m = /width:\s*([\d.]+)%/.exec(th.getAttribute("style") || ""); return m ? parseFloat(m[1]) : null; });
  const rest = colW.filter((v) => v == null).length, used = colW.reduce((a, v) => a + (v || 0), 0);
  colW = colW.map((v) => ((v == null ? (100 - used) / rest : v) / 100) * w);
  const pt = 10.5;
  const rows = [];
  const rowH = [];
  rows.push(ths.map((th) => ({ text: text(th), options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: pt, valign: "middle" } })));
  rowH.push(0.36);
  table.querySelectorAll("tbody tr").forEach((tr, ri) => {
    const tds = tr.querySelectorAll("td");
    let maxL = 1;
    rows.push(tds.map((td, ci) => {
      maxL = Math.max(maxL, lines(plain(td), colW[ci] - 0.16, pt));
      return { text: runs(td, { fontSize: pt, color: C.ink }), options: { fill: { color: ri % 2 ? C.alt : C.card }, valign: "top" } };
    }));
    rowH.push((maxL * pt * 1.45) / 72 + 0.2);
  });
  const h = rowH.reduce((a, b) => a + b, 0);
  slide.addTable(rows, {
    x, y, w, colW, rowH, fontFace: FONT, fontSize: pt, margin: 0.06,
    border: { type: "solid", color: C.line, pt: 0.5 }, autoPage: false,
  });
  return h;
}

function addTotal(slide, node, x, y, w) {
  const h = 0.62;
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addText([
    { text: text(first(node, ".label")) + "    ", options: { fontSize: 10, color: C.sub } },
    { text: text(first(node, ".value")), options: { fontSize: 17, bold: true, color: C.white } },
  ], { x: x + 0.2, y, w: w - 0.4, h, margin: 0, valign: "middle", isTextBox: true, fontFace: FONT });
  return h;
}

function addSteps(slide, node, x, y, w, hFixed) {
  const steps = node.querySelectorAll(":scope > .step"), gap = 0.12;
  const sw = (w - gap * (steps.length - 1)) / steps.length;
  let h = hFixed || 0;
  if (!h) steps.forEach((s) => { h = Math.max(h, textH(plain(s), sw - 0.2, 9.5, 1.35) + 0.42); });
  steps.forEach((s, i) => {
    const sx = x + i * (sw + gap);
    slide.addShape("roundRect", { x: sx, y, w: sw, h, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
    const b = first(s, "b");
    const body = s.innerHTML.replace(/<b>[\s\S]*?<\/b>/, "").replace(/<[^>]+>/g, "").trim();
    slide.addText([
      { text: text(b), options: { bold: true, color: C.gold, fontSize: 10, breakLine: true } },
      { text: body, options: { fontSize: 9.5, color: C.ink } },
    ], { x: sx + 0.1, y: y + 0.08, w: sw - 0.2, h: h - 0.16, margin: 0, valign: "top", isTextBox: true, fontFace: FONT });
  });
  return h;
}

function addEffects(slide, node, x, y, w, availH) {
  const items = node.querySelectorAll(":scope > .effect"), gap = 0.16;
  const h = (availH - gap * (items.length - 1)) / items.length;
  items.forEach((ef, i) => {
    const ey = y + i * (h + gap);
    slide.addShape("roundRect", { x, y: ey, w, h, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line, width: 0.75 } });
    slide.addShape("ellipse", { x: x + 0.22, y: ey + (h - 0.5) / 2, w: 0.5, h: 0.5, fill: { color: C.navy }, line: { color: C.navy } });
    slide.addText(text(first(ef, ".num")), { x: x + 0.22, y: ey + (h - 0.5) / 2, w: 0.5, h: 0.5, align: "center", valign: "middle", bold: true, fontSize: 16, color: C.white, margin: 0, isTextBox: true, fontFace: FONT });
    const body = ef.querySelectorAll(":scope > div")[1];
    const bx = x + 0.95, bw = w - 1.15;
    const ch = estimateFlowH(body, bw);
    flow(slide, body, bx, ey + Math.max(0.1, (h - ch) / 2), bw, {});
  });
  return availH;
}

// ---------- slide builders ----------
function titleSlide(pres, sec) {
  pres.addSection({ title: "表紙" });
  const s = pres.addSlide({ sectionTitle: "表紙" });
  s.background = { color: C.navy };
  s.addText(plain(first(sec, "h1")), { x: MX, y: 1.9, w: SLIDE_W - MX * 2, h: 1.3, align: "center", fontSize: 30, valign: "middle", bold: true, color: C.white, isTextBox: true, fontFace: FONT });
  s.addText(text(first(sec, ".sub")), { x: MX, y: 3.3, w: SLIDE_W - MX * 2, h: 0.5, align: "center", fontSize: 17, color: "E8DCC3", isTextBox: true, fontFace: FONT });
  s.addShape("line", { x: 3.5, y: 4.25, w: SLIDE_W - 7, h: 0, line: { color: "3A4A75", width: 1 } });
  s.addText(text(first(sec, ".tagline")), { x: MX, y: 4.4, w: SLIDE_W - MX * 2, h: 0.5, align: "center", fontSize: 12, color: C.sub, isTextBox: true, fontFace: FONT });
  s.addNotes(text(first(sec, "h1")));
}

function contentSlide(pres, sec, idx) {
  const kicker = text(first(sec, ".kicker")), h1 = text(first(sec, "header h1")), sub = first(sec, "header .sub");
  pres.addSection({ title: kicker });
  const s = pres.addSlide({ sectionTitle: kicker });
  s.background = { color: C.bg };
  const W = SLIDE_W - MX * 2;
  s.addText(kicker, { x: MX, y: 0.32, w: W, h: 0.3, fontSize: 10.5, bold: true, color: C.gold, margin: 0, isTextBox: true, fontFace: FONT });
  s.addText(h1, { x: MX, y: 0.6, w: W, h: 0.55, fontSize: 22, bold: true, color: C.navy, margin: 0, isTextBox: true, fontFace: FONT, fit: "shrink" });
  if (sub) s.addText(text(sub), { x: MX, y: 1.17, w: W, h: 0.42, fontSize: 11, color: C.muted, margin: 0, isTextBox: true, fontFace: FONT, valign: "top" });
  s.addText(String(idx), { x: SLIDE_W - 1.0, y: SLIDE_H - 0.42, w: 0.5, h: 0.3, fontSize: 9, color: C.muted, align: "right", margin: 0, isTextBox: true, fontFace: FONT });

  const note = first(sec, ":scope > p.note");
  const bottom = note ? BODY_BOTTOM - NOTE_H : BODY_BOTTOM;
  if (note) s.addText(runs(note, { fontSize: 9, color: C.muted }), { x: MX, y: BODY_BOTTOM - NOTE_H + 0.05, w: W, h: NOTE_H, margin: 0, valign: "top", isTextBox: true, fontFace: FONT });

  // body blocks (top-level children except header/note)
  const blocks = sec.childNodes.filter((n) => n.nodeType === 1 && n.tagName.toLowerCase() !== "header" && !cls(n, "note"));
  let y = BODY_TOP;
  blocks.forEach((b, bi) => {
    const last = bi === blocks.length - 1;
    const tag = b.tagName.toLowerCase();
    const remain = bottom - y;
    if (tag === "table") y += addTable(s, b, MX, y, W) + 0.2;
    else if (cls(b, "cards")) {
      const cards = b.querySelectorAll(":scope > .card"), gap = 0.22;
      const cw = (W - gap * (cards.length - 1)) / cards.length;
      let ch = 0;
      cards.forEach((c) => { ch = Math.max(ch, estimateFlowH(c, cw - 0.36) + 0.36); });
      if (last) ch = Math.min(remain, Math.max(ch, remain * 0.7));
      cards.forEach((c, i) => addCard(s, c, MX + i * (cw + gap), y, cw, ch));
      y += ch + 0.2;
    } else if (cls(b, "cols")) {
      const cols = b.querySelectorAll(":scope > .col"), gap = 0.25;
      const cw = (W - gap * (cols.length - 1)) / cols.length;
      let maxH = 0;
      cols.forEach((c, i) => { maxH = Math.max(maxH, flow(s, c, MX + i * (cw + gap), y, cw, {})); });
      y += maxH + 0.2;
    } else if (cls(b, "total")) y += addTotal(s, b, MX, y, W) + 0.18;
    else if (cls(b, "steps")) y += addSteps(s, b, MX, y, W, last ? Math.min(remain, 1.1) : 0) + 0.18;
    else if (cls(b, "effects")) y += addEffects(s, b, MX, y, W, remain) + 0.1;
    else if (tag === "ul") y += addList(s, b, MX, y, W, { fontSize: 11 }) + 0.1;
    else if (tag === "p") y += addParagraph(s, b, MX, y, W, { fontSize: 11 }) + 0.1;
    else if (tag === "div") y += flow(s, b, MX, y, W, {}) + 0.1;
  });
  if (y - 0.2 > bottom + 0.05) console.warn(`[warn] slide ${idx}: content ${((y - 0.2) - bottom).toFixed(2)}in over the bottom limit`);
  s.addNotes(h1);
}

// ---------- main ----------
(async () => {
  const html = fs.readFileSync(IN, "utf8");
  const root = parse(html);
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  pres.title = text(root.querySelector("title"));
  pres.lang = "ja-JP";
  const slides = root.querySelectorAll("section.slide");
  slides.forEach((sec, i) => {
    if (sec.getAttribute("data-layout") === "title") titleSlide(pres, sec);
    else contentSlide(pres, sec, i + 1);
  });
  await pres.writeFile({ fileName: OUT });
  console.log(`wrote ${OUT} (${slides.length} slides)`);
})().catch((e) => { console.error(e); process.exit(1); });
