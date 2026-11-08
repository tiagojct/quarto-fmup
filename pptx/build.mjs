// Build the FMUP PowerPoint template (.potx) and the example deck (.pptx).
// Tokens mirror _extensions/fmup/fmup-variables.scss. Run: npm run build.
import pptxgen from "pptxgenjs";
import JSZip from "jszip";
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = HERE;
const LOGO = (f) => join(HERE, "..", "logos", f);

// ---- Tokens (keep in sync with fmup-variables.scss) ----
const C = {
  yellow: "FFCD00",
  ink: "1A1A1A",
  muted: "5B6470",
  mutedOnDark: "A0A8B0",
  bg: "FFFFFF",
  surface: "F7F7F7",
  surfaceStrong: "F0F0F0",
  border: "E0E0E0",
  dark2: "242424",
  chart: ["1A1A1A", "FFCD00", "0072B2", "D55E00", "56B4E9", "CC79A7"],
};
const SANS = "Inter";
const MONO = "Geist Mono";
const W = 13.333;
const H = 7.5;
const M = 0.7; // outer margin
const CW = W - 2 * M; // content width
const LOGO_ALT = "Logótipo da Faculdade de Medicina da Universidade do Porto";
const LOGO_RATIO = 2419 / 1161; // official horizontal lockup

// ---- Helpers ----
const tile = (x, y, s = 0.42) => ({
  rect: { x, y, w: s, h: s, fill: { color: C.yellow }, line: { type: "none" } },
});
// Footer band, after the FMUP template: logo left, institution name and page number right.
// `dark` swaps to the white logo and a dark band. `fill` overrides the band colour.
const BAND_Y = 6.95;
const BAND_H = H - BAND_Y;
const GERAL_RATIO = 1793 / 1158; // official vertical U.Porto + FMUP lockup
const footer = (dark = false, fill) => {
  const ink = dark ? "FFFFFF" : C.ink;
  const sub = dark ? C.mutedOnDark : C.muted;
  const tileW = 0.5;
  const tileH = 0.36;
  const logoH = 0.42;
  return [
    { rect: { x: 0, y: BAND_Y, w: W, h: BAND_H, fill: { color: fill ?? (dark ? C.dark2 : C.surface) }, line: { type: "none" } } },
    {
      image: {
        path: LOGO(dark ? "logoFMUP_geral_branco.png" : "logoFMUP_geral.png"),
        x: M, y: BAND_Y + (BAND_H - logoH) / 2, w: logoH * GERAL_RATIO, h: logoH, altText: LOGO_ALT,
      },
    },
    ...[["FACULDADE DE MEDICINA", true, ink, -0.2], ["UNIVERSIDADE DO PORTO", false, sub, 0.0]].map(([t, bold, color, dy]) => ({
      text: {
        text: t,
        options: {
          x: W - M - tileW - 0.3 - 3.2, y: BAND_Y + BAND_H / 2 + dy, w: 3.2, h: 0.2,
          fontFace: SANS, fontSize: 8, bold, color, charSpacing: 1, align: "right", valign: "middle", margin: 0,
        },
      },
    })),
    { rect: { x: W - M - tileW, y: BAND_Y + (BAND_H - tileH) / 2, w: tileW, h: tileH, fill: { color: C.yellow }, line: { type: "none" } } },
  ];
};
// Official lockup, top left, on the dark opening and closing layouts.
const headLogo = () => ({
  image: { path: LOGO("logoFMUP_UP_branco.png"), x: M, y: 0.6, w: 1.2 * LOGO_RATIO, h: 1.2, altText: LOGO_ALT },
});
const slideNo = {
  x: W - M - 0.5, y: BAND_Y + (BAND_H - 0.36) / 2, w: 0.5, h: 0.36,
  fontFace: SANS, fontSize: 11, bold: true, color: C.ink, align: "center", valign: "middle",
};

const title = (o = {}) => ({
  placeholder: {
    options: {
      name: "title", type: "title",
      x: M, y: 0.5, w: CW, h: 1.0,
      fontFace: SANS, fontSize: 36, bold: true, color: C.ink,
      align: "left", valign: "middle", margin: 0, ...o,
    },
    text: "Clique para editar o título",
  },
});
// Content-slide heading: yellow tile (as in fmup-revealjs) and a top-aligned title.
const heading = (o = {}) => [
  tile(M, (o.y ?? 0.5) + 0.1, 0.4),
  title({ x: M + 0.7, w: CW - 0.7, h: 1.1, valign: "top", ...o }),
];
const body = (name, text, o = {}) => ({
  placeholder: {
    options: {
      name, type: "body",
      x: M, y: 1.8, w: CW, h: 4.6,
      fontFace: SANS, fontSize: 24, color: C.ink,
      align: "left", valign: "top", margin: 0, ...o,
    },
    text,
  },
});
// Bulleted body placeholder: the bullet lives in the layout, so new text inherits it.
const list = (name, text, o = {}) => body(name, text, { bullet: { indent: 28 }, ...o });
const pic = (name, o) => ({
  placeholder: {
    // No fill: an empty picture placeholder must not paint over the slide.
    options: { name, type: "image", ...o },
    text: "Clique para inserir uma imagem",
  },
});
// Large tile cropped by the slide corner: the scaled-up FMUP tile motif.
const bleedTile = () => ({
  rect: { x: W - 2.3, y: H - 2.3, w: 3.2, h: 3.2, fill: { color: C.yellow }, line: { type: "none" } },
});

function defineMasters(pres) {
  pres.defineSlideMaster({
    title: "FMUP Título",
    background: { color: C.ink },
    objects: [
      headLogo(),
      bleedTile(),
      title({ y: 2.3, h: 2.5, fontSize: 54, color: "FFFFFF", valign: "bottom", w: 10.8 }),
      body("subtitle", "Subtítulo", { y: 5.0, h: 0.9, w: 9.4, fontSize: 22, color: C.mutedOnDark }),
      body("author", "Autor e data", { y: 6.3, h: 0.6, w: 9.4, fontSize: 14, color: "FFFFFF" }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Título claro",
    background: { color: C.bg },
    objects: [
      { image: { path: LOGO("logoFMUP_UP.png"), x: M, y: 0.6, w: 1.2 * LOGO_RATIO, h: 1.2, altText: LOGO_ALT } },
      bleedTile(),
      title({ y: 2.3, h: 2.5, fontSize: 54, valign: "bottom", w: 10.8 }),
      body("subtitle", "Subtítulo", { y: 5.0, h: 0.9, w: 9.4, fontSize: 22, color: C.muted }),
      body("author", "Autor e data", { y: 6.3, h: 0.6, w: 9.4, fontSize: 14 }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Secção",
    background: { color: C.ink },
    slideNumber: slideNo,
    objects: [
      ...footer(true),
      body("number", "01", { y: 1.6, h: 2.6, w: 6, fontSize: 150, bold: true, color: C.yellow, valign: "bottom" }),
      title({ y: 4.4, h: 1.3, w: 10.8, fontSize: 44, color: "FFFFFF", valign: "top" }),
      body("lead", "Descrição curta da secção", { y: 5.6, h: 0.9, w: 9, fontSize: 18, color: C.mutedOnDark }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Título e conteúdo",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [...footer(), ...heading(), list("content", "Clique para editar o texto")],
  });

  pres.defineSlideMaster({
    title: "FMUP Só título",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [...footer(), ...heading()],
  });

  const colW = 5.8;
  pres.defineSlideMaster({
    title: "FMUP Dois conteúdos",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      list("left", "Coluna esquerda", { w: colW }),
      list("right", "Coluna direita", { x: W - M - colW, w: colW }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Conteúdo e imagem",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(),
      ...heading({ y: 0.7, w: 5.1, h: 1.5 }),
      list("content", "Clique para editar o texto", { y: 2.4, w: 5.6, h: 4.0 }),
      pic("picture", { x: 7.0, y: 0.7, w: W - M - 7.0, h: 5.7 }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Número em destaque",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      { rect: { x: M, y: 1.9, w: 6.0, h: 3.6, fill: { color: C.yellow }, line: { type: "none" } } },
      body("number", "72%", { x: M + 0.3, y: 2.0, w: 5.4, h: 3.4, fontSize: 130, bold: true, valign: "middle", align: "left" }),
      body("content", "Explicação do número", { x: 7.3, y: 2.3, w: W - M - 7.3, h: 2.8, fontSize: 24, valign: "middle" }),
    ],
  });

  const cardW = 5.8;
  const card = (x) => ({
    rect: { x, y: 1.8, w: cardW, h: 4.4, fill: { color: C.surface }, line: { color: C.border, width: 0.75 }, rectRadius: 0.08 },
  });
  pres.defineSlideMaster({
    title: "FMUP Comparação",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      card(M), card(W - M - cardW),
      body("left-head", "Opção A", { x: M + 0.4, y: 2.15, w: cardW - 0.8, h: 0.6, fontSize: 24, bold: true }),
      list("left", "Texto da opção A", { x: M + 0.4, y: 2.95, w: cardW - 0.8, h: 3.2, fontSize: 20 }),
      body("right-head", "Opção B", { x: W - M - cardW + 0.4, y: 2.15, w: cardW - 0.8, h: 0.6, fontSize: 24, bold: true }),
      list("right", "Texto da opção B", { x: W - M - cardW + 0.4, y: 2.95, w: cardW - 0.8, h: 3.2, fontSize: 20 }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Código",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      { rect: { x: M, y: 1.8, w: CW, h: 4.6, fill: { color: C.surfaceStrong }, line: { color: C.border, width: 0.75 }, rectRadius: 0.08 } },
      body("code", "Cole o código aqui", { x: M + 0.35, y: 2.05, w: CW - 0.7, h: 4.1, fontFace: MONO, fontSize: 20 }),
    ],
  });

  const cols3W = (CW - 2 * 0.5) / 3;
  const cx = (i) => M + i * (cols3W + 0.5);
  pres.defineSlideMaster({
    title: "FMUP Três colunas",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      ...[0, 1, 2].flatMap((i) => [
        { rect: { x: cx(i), y: 1.8, w: cols3W, h: 3.9, fill: { color: C.surface }, line: { color: C.border, width: 0.75 }, rectRadius: 0.08 } },
        body(`col${i + 1}-head`, `Título ${i + 1}`, { x: cx(i) + 0.35, y: 2.1, w: cols3W - 0.7, h: 0.6, fontSize: 22, bold: true }),
        list(`col${i + 1}`, `Texto ${i + 1}`, { x: cx(i) + 0.35, y: 2.85, w: cols3W - 0.7, h: 2.6, fontSize: 18 }),
      ]),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Passos",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      ...[0, 1, 2].flatMap((i) => [
        { rect: { x: cx(i), y: 1.9, w: 0.75, h: 0.75, fill: { color: C.yellow }, line: { type: "none" } } },
        { text: { text: String(i + 1), options: { x: cx(i), y: 1.9, w: 0.75, h: 0.75, fontFace: SANS, fontSize: 28, bold: true, color: C.ink, align: "center", valign: "middle", margin: 0 } } },
        body(`step${i + 1}-head`, `Passo ${i + 1}`, { x: cx(i), y: 2.95, w: cols3W, h: 0.7, fontSize: 24, bold: true }),
        body(`step${i + 1}`, "Descrição do passo", { x: cx(i), y: 3.75, w: cols3W, h: 2.5, fontSize: 20 }),
      ]),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Referências",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      body("refs", "Autor, A. (ano). Título. Revista, volume(número), páginas.", { y: 1.7, h: 4.8, fontSize: 14, color: C.ink }),
    ],
  });

  // Audience question (voting, quiz): four lettered options.
  const optW = (CW - 0.4) / 2;
  const optH = 1.6;
  const optPos = [[M, 2.7], [M + optW + 0.4, 2.7], [M, 2.7 + optH + 0.2], [M + optW + 0.4, 2.7 + optH + 0.2]];
  pres.defineSlideMaster({
    title: "FMUP Pergunta",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading({ h: 1.9, fontSize: 36 }),
      ...optPos.flatMap(([x, y], i) => [
        { rect: { x, y, w: optW, h: optH, fill: { color: C.surface }, line: { color: C.border, width: 0.75 }, rectRadius: 0.08 } },
        { rect: { x: x + 0.3, y: y + (optH - 0.8) / 2, w: 0.8, h: 0.8, fill: { color: C.yellow }, line: { type: "none" } } },
        { text: { text: "ABCD"[i], options: { x: x + 0.3, y: y + (optH - 0.8) / 2, w: 0.8, h: 0.8, fontFace: SANS, fontSize: 28, bold: true, color: C.ink, align: "center", valign: "middle", margin: 0 } } },
        body(`option-${"abcd"[i]}`, `Opção ${"ABCD"[i]}`, { x: x + 1.4, y, w: optW - 1.7, h: optH, fontSize: 22, valign: "middle" }),
      ]),
    ],
  });

  // Three headline numbers.
  pres.defineSlideMaster({
    title: "FMUP Três números",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      ...[0, 1, 2].flatMap((i) => [
        { rect: { x: cx(i), y: 1.9, w: cols3W, h: 3.9, fill: { color: C.surface }, line: { color: C.border, width: 0.75 }, rectRadius: 0.08 } },
        tile(cx(i) + 0.35, 2.25, 0.3),
        body(`stat${i + 1}`, "00%", { x: cx(i) + 0.35, y: 2.8, w: cols3W - 0.7, h: 1.5, fontSize: 60, bold: true, valign: "middle" }),
        body(`stat${i + 1}-label`, "O que o número mede", { x: cx(i) + 0.35, y: 4.4, w: cols3W - 0.7, h: 1.2, fontSize: 20, color: C.muted }),
      ]),
    ],
  });

  // Timeline: four milestones on one line.
  const tlW = CW / 4;
  pres.defineSlideMaster({
    title: "FMUP Linha temporal",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(), ...heading(),
      { rect: { x: M, y: 3.7, w: CW, h: 0.03, fill: { color: C.ink }, line: { type: "none" } } },
      ...[0, 1, 2, 3].flatMap((i) => [
        tile(M + i * tlW, 3.57, 0.28),
        body(`when${i + 1}`, "2026", { x: M + i * tlW, y: 2.85, w: tlW - 0.3, h: 0.6, fontSize: 28, bold: true, valign: "bottom" }),
        body(`what${i + 1}`, "Marco do projeto", { x: M + i * tlW, y: 4.25, w: tlW - 0.3, h: 2.2, fontSize: 20 }),
      ]),
    ],
  });

  // Speaker: portrait, name, role, short bio.
  pres.defineSlideMaster({
    title: "FMUP Orador",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      ...footer(),
      pic("portrait", { x: M, y: 0.7, w: 4.2, h: 5.8 }),
      tile(5.5, 0.9, 0.4),
      title({ x: 6.2, y: 0.7, w: W - M - 6.2, h: 0.8, fontSize: 40, valign: "top" }),
      body("role", "Cargo e afiliação", { x: 5.5, y: 1.7, w: W - M - 5.5, h: 0.7, fontSize: 20, color: C.muted }),
      list("bio", "Percurso em poucas linhas", { x: 5.5, y: 2.7, w: W - M - 5.5, h: 3.0, fontSize: 20 }),
      body("contact", "Contactos", { x: 5.5, y: 5.9, w: W - M - 5.5, h: 0.6, fontSize: 16, color: C.muted, valign: "bottom" }),
    ],
  });

  // Key message on a dark page, for the one idea the audience must keep.
  pres.defineSlideMaster({
    title: "FMUP Mensagem-chave",
    background: { color: C.ink },
    slideNumber: slideNo,
    objects: [
      ...footer(true),
      tile(M, 1.2, 0.6),
      body("message", "A mensagem que a audiência deve levar", { y: 2.2, h: 3.0, w: 10.8, fontSize: 48, bold: true, color: "FFFFFF" }),
      body("support", "Frase de apoio ou fonte", { y: 5.3, h: 0.9, w: 10.8, fontSize: 20, color: C.mutedOnDark }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Frase em destaque",
    background: { color: C.surface },
    slideNumber: slideNo,
    objects: [
      ...footer(false, "FFFFFF"),
      tile(1.2, 1.2, 0.5),
      body("quote", "Frase ou mensagem principal", { x: 1.2, y: 1.9, w: 10.9, h: 2.8, fontSize: 44, bold: true, valign: "bottom" }),
      body("source", "Fonte ou autor", { x: 1.2, y: 4.95, w: 10.9, h: 0.6, fontSize: 16, color: C.muted }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Imagem total",
    background: { color: C.ink },
    objects: [
      pic("picture", { x: 0, y: 0, w: W, h: H }),
      {
        placeholder: {
          options: {
            name: "title", type: "title",
            x: M, y: 5.0, w: 8.4, h: 1.5,
            fontFace: SANS, fontSize: 32, bold: true, color: "FFFFFF",
            fill: { color: C.ink }, align: "left", valign: "middle", margin: [22, 0, 0, 22],
          },
          text: "Título sobre a imagem",
        },
      },
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Final",
    background: { color: C.ink },
    objects: [
      headLogo(),
      bleedTile(),
      title({ y: 2.3, h: 1.8, w: 10.8, fontSize: 66, color: "FFFFFF", valign: "bottom" }),
      { text: { text: "Alameda Prof. Hernâni Monteiro, 4200-319 Porto  |  www.med.up.pt", options: { x: M, y: 6.75, w: 9.4, h: 0.4, fontFace: SANS, fontSize: 12, color: C.mutedOnDark, align: "left", valign: "middle", margin: 0 } } },
      body("contacts", "Contactos", { y: 4.5, h: 1.8, w: 9.4, fontSize: 20, color: C.mutedOnDark }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Em branco",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [...footer()],
  });
}

function newPres() {
  const pres = new pptxgen();
  pres.defineLayout({ name: "FMUP16x9", width: W, height: H });
  pres.layout = "FMUP16x9";
  pres.title = "Modelo FMUP";
  pres.author = "Tiago Jacinto";
  pres.company = "Faculdade de Medicina da Universidade do Porto";
  pres.theme = { headFontFace: SANS, bodyFontFace: SANS };
  defineMasters(pres);
  return pres;
}

// ---- Package post-processing ----
const THEME_COLORS = {
  dk1: C.ink, lt1: "FFFFFF", dk2: C.muted, lt2: C.surface,
  accent1: C.chart[0], accent2: C.chart[1], accent3: C.chart[2],
  accent4: C.chart[3], accent5: C.chart[4], accent6: C.chart[5],
  hlink: C.ink, folHlink: C.muted,
};
const NO_BULLET_LAYOUTS = /number|subtitle|author|title|quote|source|code|head|lead|contacts|logo|picture/i;

async function postProcess(buf, { template }) {
  const zip = await JSZip.loadAsync(buf);
  const names = Object.keys(zip.files);

  // Theme: FMUP colour scheme and Inter as theme font.
  for (const n of names.filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n))) {
    let x = await zip.file(n).async("string");
    x = x.replace(/<a:clrScheme name="[^"]*">[\s\S]*?<\/a:clrScheme>/, () => {
      const el = (k, v) => `<a:${k}><a:srgbClr val="${v}"/></a:${k}>`;
      return `<a:clrScheme name="FMUP">${Object.entries(THEME_COLORS).map(([k, v]) => el(k, v)).join("")}</a:clrScheme>`;
    });
    x = x.replace(/(<a:(?:major|minor)Font>\s*<a:latin typeface=")[^"]*(")/g, `$1${SANS}$2`);
    zip.file(n, x);
  }

  // pptxgenjs stores one copy of the logo per layout. Keep one file per image.
  const seen = {};
  const dupes = {};
  for (const n of names.filter((n) => n.startsWith("ppt/media/") && !zip.files[n].dir)) {
    const h = createHash("sha1").update(await zip.file(n).async("nodebuffer")).digest("hex");
    if (seen[h]) dupes[n.split("/").pop()] = seen[h];
    else seen[h] = n.split("/").pop();
  }
  for (const n of names.filter((n) => n.endsWith(".rels"))) {
    let x = await zip.file(n).async("string");
    let changed = false;
    for (const [dup, keep] of Object.entries(dupes)) {
      if (x.includes(`media/${dup}"`)) { x = x.replace(new RegExp(`media/${dup.replace(".", "\\.")}"`, "g"), `media/${keep}"`); changed = true; }
    }
    if (changed) zip.file(n, x);
  }
  for (const dup of Object.keys(dupes)) zip.remove(`ppt/media/${dup}`);

  // Language: European Portuguese for proofing.
  for (const n of names.filter((n) => /^ppt\/(slideMasters|slideLayouts|slides)\/[^/]+\.xml$/.test(n))) {
    let x = await zip.file(n).async("string");
    x = x.replace(/lang="en-US"/g, 'lang="pt-PT"');
    x = x.replace('<p:cSld name="DEFAULT">', '<p:cSld name="FMUP Vazio">');
    zip.file(n, x);
  }

  // pptxgenjs ignores margin: 0 on placeholders, so PowerPoint would apply its
  // default 0.1 in inset and text would sit off the tile and footer edge.
  for (const n of names.filter((n) => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(n))) {
    let x = await zip.file(n).async("string");
    const inset = x.includes('name="FMUP Imagem total"') ? 274320 : 0;
    x = x.replace(/<a:bodyPr wrap="square" rtlCol="0">/g, `<a:bodyPr wrap="square" lIns="${inset}" tIns="0" rIns="${inset}" bIns="0" rtlCol="0">`);
    zip.file(n, x);
  }

  // Slides inherit the layout inset only in PowerPoint; LibreOffice and some
  // viewers read the slide's own bodyPr. Mirror the layout inset on slides.
  const layoutNames = {};
  for (const n of names.filter((n) => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(n))) {
    layoutNames[n.split("/").pop()] = (await zip.file(n).async("string")).match(/<p:cSld name="([^"]*)"/)?.[1];
  }
  for (const n of names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    const rels = await zip.file(n.replace("slides/", "slides/_rels/") + ".rels").async("string");
    const layout = rels.match(/slideLayouts\/(slideLayout\d+\.xml)/)?.[1];
    const inset = layoutNames[layout] === "FMUP Imagem total" ? 274320 : 0;
    let x = await zip.file(n).async("string");
    x = x.replace(/<a:bodyPr wrap="square" rtlCol="0">/g, `<a:bodyPr wrap="square" lIns="${inset}" tIns="0" rIns="${inset}" bIns="0" rtlCol="0">`);
    zip.file(n, x);
  }

  // Slide master text styles: the layouts only style level 1, so deeper levels
  // and new layouts must inherit FMUP sizes, not PowerPoint defaults.
  const mp = "ppt/slideMasters/slideMaster1.xml";
  let m = await zip.file(mp).async("string");
  const lvl = (n, sz, mar, ind, ch) =>
    `<a:lvl${n}pPr marL="${mar}" indent="${ind}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="900"/></a:spcBef><a:buFont typeface="Arial"/><a:buChar char="${ch}"/><a:defRPr sz="${sz}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${n}pPr>`;
  m = m.replace(/<p:titleStyle>[\s\S]*?<\/p:titleStyle>/, () =>
    `<p:titleStyle><a:lvl1pPr algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:lnSpc><a:spcPct val="95000"/></a:lnSpc><a:spcBef><a:spcPct val="0"/></a:spcBef><a:buNone/><a:defRPr sz="3600" b="1" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mj-lt"/><a:ea typeface="+mj-ea"/><a:cs typeface="+mj-cs"/></a:defRPr></a:lvl1pPr></p:titleStyle>`);
  m = m.replace(/<p:bodyStyle>[\s\S]*?<\/p:bodyStyle>/, () =>
    `<p:bodyStyle>${lvl(1, 2400, 355600, -355600, "•")}${lvl(2, 2000, 711200, -304800, "–")}${lvl(3, 1800, 1066800, -266700, "•")}${lvl(4, 1600, 1422400, -266700, "–")}${lvl(5, 1600, 1778000, -266700, "•")}${lvl(6, 1600, 2133600, -266700, "•")}${lvl(7, 1600, 2489200, -266700, "•")}${lvl(8, 1600, 2844800, -266700, "•")}${lvl(9, 1600, 3200400, -266700, "•")}</p:bodyStyle>`);
  zip.file(mp, m);

  if (template) {
    // .potx: template main part content type.
    let ct = await zip.file("[Content_Types].xml").async("string");
    ct = ct.replace(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
      "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml"
    );
    // pptxgenjs omits the slide master override when the deck has no slides.
    if (!ct.includes("/ppt/slideMasters/slideMaster1.xml")) {
      ct = ct.replace(
        "</Types>",
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/></Types>'
      );
    }
    zip.file("[Content_Types].xml", ct);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// ---- Example deck ----
// A short story, not a catalogue: titles state the conclusion, every slide has speaker notes.
function exampleDeck(pres) {
  const L = (n) => `FMUP ${n}`;
  const bl = (arr) => arr.map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } }));
  // Stand-in for a photo: a flat panel. Real decks insert pictures through the layout placeholder.
  const panel = (sl, x, y, w, h, label) => {
    sl.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.surfaceStrong }, line: { type: "none" } });
    sl.addShape(pres.shapes.RECTANGLE, { x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5, fill: { color: C.yellow }, line: { type: "none" } });
    sl.addText(label, { x, y, w, h, align: "center", valign: "middle", fontFace: SANS, fontSize: 18, bold: true, color: C.muted, margin: 0 });
  };
  const slide = (layout, notes) => {
    const sl = pres.addSlide({ masterName: L(layout) });
    sl.addNotes(notes);
    return sl;
  };
  const t = (sl, text, ph) => sl.addText(text, { placeholder: ph });

  let s = slide("Título", "Abertura. Diga o tema numa frase. O logótipo e o bloco amarelo já estão no esquema.");
  t(s, "Decidir com dados: a espirometria na consulta", "title");
  t(s, "Exemplo de apresentação com o modelo FMUP", "subtitle");
  t(s, "Tiago Jacinto  |  2026-11-08", "author");

  s = slide("Orador", "Apresentação pessoal em dez segundos. Corte a fotografia no PowerPoint com Formatar > Cortar.");
  panel(s, M, 0.7, 4.2, 5.8, "Fotografia");
  t(s, "Tiago Jacinto", "title");
  t(s, "Professor Auxiliar, MEDCIDS, Faculdade de Medicina da Universidade do Porto", "role");
  t(s, bl(["Diretor do Mestrado em Informática da Saúde", "Investigação em saúde digital e função pulmonar", "Mais de 120 artigos indexados"]), "bio");
  t(s, "tiagojct@med.up.pt", "contact");

  s = slide("Pergunta", "Pergunta à audiência. Dê trinta segundos para votar. Mostre a resposta no slide seguinte.");
  t(s, "Qual é o primeiro passo ao interpretar uma espirometria?", "title");
  ["Verificar a qualidade do teste", "Comparar o FEV1 com o previsto", "Calcular a razão FEV1/FVC", "Classificar a gravidade"].forEach((o, i) => t(s, o, `option-${"abcd"[i]}`));

  s = slide("Título e conteúdo", "Agenda. Cinco linhas no máximo. Um slide de agenda por apresentação.");
  t(s, "O que vamos ver em vinte minutos", "title");
  t(s, bl(["Contexto e objetivos", "Métodos", "Resultados", "Discussão", "Conclusões"]), "content");

  s = slide("Secção", "Divisor. Pare, respire e anuncie a nova parte.");
  t(s, "01", "number");
  t(s, "Contexto", "title");
  t(s, "Porque este tema importa agora", "lead");

  s = slide("Número em destaque", "Um número por slide. Diga o que o número significa antes de o mostrar. Dados fictícios.");
  t(s, "Sete em cada dez doentes tiveram alta em menos de 48 horas", "title");
  t(s, "72%", "number");
  t(s, "dos doentes do serviço, no último ano. Dados fictícios de exemplo.", "content");

  s = slide("Três números", "Três indicadores no máximo. Alinhe sempre a unidade e o período. Dados fictícios.");
  t(s, "Três indicadores resumem o desempenho do serviço", "title");
  [["1 248", "espirometrias por ano"], ["94%", "testes com qualidade aceitável"], ["12 min", "duração média de cada teste"]].forEach(([n, l], i) => {
    t(s, n, `stat${i + 1}`);
    t(s, l, `stat${i + 1}-label`);
  });

  s = slide("Linha temporal", "Quatro marcos no máximo. Use anos ou meses, nunca ambos.");
  t(s, "O projeto avançou em quatro marcos", "title");
  [["2024", "Desenho do protocolo"], ["2025", "Piloto em dois centros"], ["2026", "Avaliação dos resultados"], ["2027", "Extensão a todos os centros"]].forEach(([w, x], i) => {
    t(s, w, `when${i + 1}`);
    t(s, x, `what${i + 1}`);
  });

  s = slide("Conteúdo e imagem", "Imagem à direita. Use uma fotografia real ou uma figura sua, nunca imagem de banco genérica.");
  t(s, "A qualidade do teste vem antes do valor", "title");
  t(s, bl(["Critérios de aceitabilidade", "Critérios de repetibilidade", "Registo do esforço do doente"]), "content");
  panel(s, 7.0, 0.7, W - M - 7.0, 5.7, "Imagem");

  s = slide("Só título", "Tabela com cabeçalho preto e texto amarelo. Destaque a linha que sustenta o título.");
  t(s, "A DPOC reduz o FEV1 em 37 pontos face ao controlo", "title");
  const hdr = (x) => ({ text: x, options: { bold: true, color: C.yellow, fill: { color: C.ink } } });
  s.addTable(
    [
      [hdr("Grupo"), hdr("n"), hdr("FEV1 (% previsto)")],
      ["Controlo", "120", "98 (12)"],
      ["Asma", "85", "84 (15)"],
      ["DPOC", "64", "61 (18)"],
    ],
    {
      x: M, y: 1.9, w: CW, colW: [5.9, 2.0, 4.03], rowH: 0.6,
      fontFace: SANS, fontSize: 18, color: C.ink, valign: "middle", margin: [0, 0.15, 0, 0.15],
      border: { type: "solid", pt: 0.75, color: C.border },
    }
  );

  s = slide("Só título", "Gráfico nativo: edite os dados com botão direito > Editar dados. Preto para a referência, amarelo para o que interessa.");
  t(s, "O FEV1 melhora em todos os grupos depois da intervenção", "title");
  s.addChart(
    pres.charts.BAR,
    [
      { name: "Antes", labels: ["Controlo", "Asma", "DPOC"], values: [98, 84, 61] },
      { name: "Depois", labels: ["Controlo", "Asma", "DPOC"], values: [99, 90, 70] },
    ],
    {
      x: M, y: 1.8, w: CW, h: 4.7, barDir: "col", barGapWidthPct: 60,
      chartColors: [C.chart[0], C.chart[1]],
      showLegend: true, legendPos: "b", legendFontFace: SANS, legendFontSize: 14, legendColor: C.ink,
      showValue: true, dataLabelFontFace: SANS, dataLabelFontSize: 14, dataLabelColor: C.ink, dataLabelPosition: "outEnd",
      catAxisLabelFontFace: SANS, catAxisLabelFontSize: 14, catAxisLabelColor: C.ink,
      valAxisLabelFontFace: SANS, valAxisLabelFontSize: 12, valAxisLabelColor: C.muted,
      valAxisMinVal: 0, valAxisMaxVal: 120, valAxisHidden: true,
      valGridLine: { color: C.border, size: 0.5 }, catGridLine: { style: "none" },
    }
  );

  s = slide("Comparação", "Compare duas opções com os mesmos critérios nas duas colunas.");
  t(s, "A opção B custa menos e demora mais", "title");
  t(s, "Opção A", "left-head");
  t(s, bl(["Mais rápida", "Custo inicial maior"]), "left");
  t(s, "Opção B", "right-head");
  t(s, bl(["Mais lenta", "Custo inicial menor"]), "right");

  s = slide("Três colunas", "Três ideias em paralelo. Mantenha o mesmo número de linhas em cada cartão.");
  t(s, "Problema, método e resultado numa página", "title");
  [["Problema", ["Falta de tempo", "Dados dispersos"]], ["Método", ["Revisão rápida", "Critérios claros"]], ["Resultado", ["Menos erros", "Decisão mais rápida"]]].forEach(([h, items], i) => {
    t(s, h, `col${i + 1}-head`);
    t(s, bl(items), `col${i + 1}`);
  });

  s = slide("Passos", "Processo em três passos. Verbo no infinitivo em cada título de passo.");
  t(s, "Três passos levam do dado à decisão", "title");
  [["Preparar", "Reúna os dados e defina a pergunta."], ["Analisar", "Aplique o método e registe os resultados."], ["Comunicar", "Escreva uma mensagem por diapositivo."]].forEach(([h, x], i) => {
    t(s, h, `step${i + 1}-head`);
    t(s, x, `step${i + 1}`);
  });

  s = slide("Dois conteúdos", "Duas colunas de texto. Prefira Comparação quando as colunas forem alternativas.");
  t(s, "Duas leituras do mesmo resultado", "title");
  t(s, bl(["Leitura clínica", "Foco no doente", "Decisão individual"]), "left");
  t(s, bl(["Leitura populacional", "Foco no serviço", "Decisão de política"]), "right");

  s = slide("Código", "Código em Geist Mono. Dezoito pontos no mínimo: corte linhas em vez de reduzir a letra.");
  t(s, "Uma função de três linhas calcula o FEV1 percentual", "title");
  t(s, ["def fev1_percent(medido, previsto):", "    return 100 * medido / previsto", "", "print(fev1_percent(2.8, 3.5))"].map((x, i, a) => ({ text: x, options: { breakLine: i < a.length - 1 } })), "code");

  s = slide("Imagem total", "Fotografia de página inteira. O título fica sobre a caixa preta, por isso lê-se em qualquer imagem.");
  panel(s, 0, 0, W, H, "Imagem de página inteira");
  t(s, "Uma imagem forte substitui um parágrafo", "title");

  s = slide("Mensagem-chave", "A ideia que a audiência deve levar. Diga-a devagar e passe ao slide seguinte.");
  t(s, "Sem um teste de boa qualidade, não há decisão clínica fiável.", "message");
  t(s, "Mensagem principal desta apresentação", "support");

  s = slide("Frase em destaque", "Citação ou regra de ouro, com a fonte por baixo.");
  t(s, "Um diapositivo, uma ideia.", "quote");
  t(s, "Regra de ouro das apresentações", "source");

  s = slide("Referências", "Referências em tamanho pequeno. Uma por parágrafo.");
  t(s, "Referências", "title");
  t(s, ["Bringhurst, R. (2004). The Elements of Typographic Style. Hartley & Marks.", "Tufte, E. R. (2001). The Visual Display of Quantitative Information. Graphics Press."].map((x, i, a) => ({ text: x, options: { breakLine: i < a.length - 1, paraSpaceAfter: 10 } })), "refs");

  s = slide("Final", "Agradeça, mostre os contactos e abra a discussão.");
  t(s, "Obrigado", "title");
  t(s, "tiagojct@med.up.pt\nFaculdade de Medicina da Universidade do Porto", "contacts");

  s = slide("Título claro", "Variante clara do esquema de título. Use para documentos impressos e PDF.");
  t(s, "Variante clara do título", "title");
  t(s, "Para impressão e PDF", "subtitle");
  t(s, "Tiago Jacinto  |  2026-11-08", "author");
}

// ---- Run ----
const tpl = newPres();
const tplBuf = await tpl.write({ outputType: "nodebuffer" });
writeFileSync(join(OUT, "fmup-modelo.potx"), await postProcess(tplBuf, { template: true }));

const ex = newPres();
exampleDeck(ex);
const exBuf = await ex.write({ outputType: "nodebuffer" });
writeFileSync(join(OUT, "fmup-exemplo.pptx"), await postProcess(exBuf, { template: false }));
console.log("built", OUT);
