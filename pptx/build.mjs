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
// Official lockup, bottom right. `dark` picks the white version for dark layouts.
const footerLogo = (dark = false) => ({
  image: {
    path: LOGO(dark ? "logoFMUP_UP_branco.png" : "logoFMUP_UP.png"),
    x: W - M - 0.64 * LOGO_RATIO, y: 6.67, w: 0.64 * LOGO_RATIO, h: 0.64, altText: LOGO_ALT,
  },
});
// Official lockup, top left, on the dark opening and closing layouts.
const headLogo = () => ({
  image: { path: LOGO("logoFMUP_UP_branco.png"), x: M, y: 0.6, w: 1.2 * LOGO_RATIO, h: 1.2, altText: LOGO_ALT },
});
const slideNo = {
  x: M, y: 6.78, w: 0.5, h: 0.42,
  fontFace: SANS, fontSize: 11, bold: true, color: C.ink, align: "center", valign: "middle",
};
// The yellow number tile is the motif that repeats on every content layout.
const numberTile = () => tile(M, 6.78, 0.5).rect && { rect: { x: M, y: 6.78, w: 0.5, h: 0.42, fill: { color: C.yellow }, line: { type: "none" } } };

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
    title: "FMUP Secção",
    background: { color: C.ink },
    slideNumber: slideNo,
    objects: [
      numberTile(),
      footerLogo(true),
      body("number", "01", { y: 1.6, h: 2.6, w: 6, fontSize: 150, bold: true, color: C.yellow, valign: "bottom" }),
      title({ y: 4.4, h: 1.3, w: 10.8, fontSize: 44, color: "FFFFFF", valign: "top" }),
      body("lead", "Descrição curta da secção", { y: 5.6, h: 0.9, w: 9, fontSize: 18, color: C.mutedOnDark }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Título e conteúdo",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [numberTile(), footerLogo(), title(), list("content", "Clique para editar o texto")],
  });

  pres.defineSlideMaster({
    title: "FMUP Só título",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [numberTile(), footerLogo(), title()],
  });

  const colW = 5.8;
  pres.defineSlideMaster({
    title: "FMUP Dois conteúdos",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      numberTile(), footerLogo(), title(),
      list("left", "Coluna esquerda", { w: colW }),
      list("right", "Coluna direita", { x: W - M - colW, w: colW }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Conteúdo e imagem",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      numberTile(), footerLogo(),
      title({ y: 0.7, w: 5.8, h: 1.5, valign: "top" }),
      list("content", "Clique para editar o texto", { y: 2.4, w: 5.6, h: 4.0 }),
      pic("picture", { x: 7.0, y: 0.7, w: W - M - 7.0, h: 5.7 }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Número em destaque",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      numberTile(), footerLogo(), title(),
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
      numberTile(), footerLogo(), title(),
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
      numberTile(), footerLogo(), title(),
      { rect: { x: M, y: 1.8, w: CW, h: 4.6, fill: { color: C.surfaceStrong }, line: { color: C.border, width: 0.75 }, rectRadius: 0.08 } },
      body("code", "Cole o código aqui", { x: M + 0.35, y: 2.05, w: CW - 0.7, h: 4.1, fontFace: MONO, fontSize: 18 }),
    ],
  });

  const cols3W = (CW - 2 * 0.5) / 3;
  const cx = (i) => M + i * (cols3W + 0.5);
  pres.defineSlideMaster({
    title: "FMUP Três colunas",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [
      numberTile(), footerLogo(), title(),
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
      numberTile(), footerLogo(), title(),
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
      numberTile(), footerLogo(), title(),
      body("refs", "Autor, A. (ano). Título. Revista, volume(número), páginas.", { y: 1.7, h: 4.8, fontSize: 14, color: C.ink }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Frase em destaque",
    background: { color: C.surface },
    slideNumber: slideNo,
    objects: [
      numberTile(), footerLogo(),
      tile(1.2, 1.2, 0.5),
      body("quote", "Frase ou mensagem principal", { x: 1.2, y: 2.0, w: 10.9, h: 2.6, fontSize: 44, bold: true, valign: "top" }),
      body("source", "Fonte ou autor", { x: 1.2, y: 4.8, w: 10.9, h: 0.6, fontSize: 16, color: C.muted }),
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
      body("contacts", "Contactos", { y: 4.5, h: 1.8, w: 9.4, fontSize: 20, color: C.mutedOnDark }),
    ],
  });

  pres.defineSlideMaster({
    title: "FMUP Em branco",
    background: { color: C.bg },
    slideNumber: slideNo,
    objects: [numberTile(), footerLogo()],
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
function exampleDeck(pres) {
  const L = (n) => `FMUP ${n}`;

  let s = pres.addSlide({ masterName: L("Título") });
  s.addText("Título da apresentação", { placeholder: "title" });
  s.addText("Subtítulo com a mensagem principal", { placeholder: "subtitle" });
  s.addText("Tiago Jacinto  |  2026-11-08", { placeholder: "author" });
  s.addNotes("Diapositivo de título. O logótipo vai no espaço superior direito.");

  s = pres.addSlide({ masterName: L("Título e conteúdo") });
  s.addText("Agenda", { placeholder: "title" });
  s.addText(
    ["Contexto e objetivos", "Métodos", "Resultados", "Discussão", "Conclusões"].map((t, i, a) => ({
      text: t, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 8 },
    })),
    { placeholder: "content" }
  );

  s = pres.addSlide({ masterName: L("Secção") });
  s.addText("01", { placeholder: "number" });
  s.addText("Contexto", { placeholder: "title" });
  s.addText("Porque este tema importa agora", { placeholder: "lead" });

  s = pres.addSlide({ masterName: L("Dois conteúdos") });
  s.addText("Dois conteúdos lado a lado", { placeholder: "title" });
  const bl = (arr) => arr.map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 8 } }));
  s.addText(bl(["Um ponto por linha", "Frases curtas", "Verbos ativos"]), { placeholder: "left" });
  s.addText(bl(["Máximo de cinco linhas", "Um tema por diapositivo", "Texto com 20 pt ou mais"]), { placeholder: "right" });

  // Stand-in for a photo: a flat panel. Real decks insert pictures through the layout placeholder.
  const panel = (sl, x, y, w, h, label) => {
    sl.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.surfaceStrong }, line: { type: "none" } });
    sl.addShape(pres.shapes.RECTANGLE, { x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5, fill: { color: C.yellow }, line: { type: "none" } });
    sl.addText(label, { x, y, w, h, align: "center", valign: "middle", fontFace: SANS, fontSize: 18, bold: true, color: C.muted, margin: 0 });
  };

  s = pres.addSlide({ masterName: L("Conteúdo e imagem") });
  s.addText("Texto e imagem", { placeholder: "title" });
  s.addText(bl(["Imagem à direita", "Texto à esquerda", "Cortar a imagem no PowerPoint"]), { placeholder: "content" });
  panel(s, 7.0, 0.7, W - M - 7.0, 5.7, "Imagem");

  s = pres.addSlide({ masterName: L("Imagem total") });
  panel(s, 0, 0, W, H, "Imagem de página inteira");
  s.addText("Título sobre a imagem", { placeholder: "title" });

  s = pres.addSlide({ masterName: L("Número em destaque") });
  s.addText("Um número que fica na memória", { placeholder: "title" });
  s.addText("72%", { placeholder: "number" });
  s.addText("dos doentes tiveram alta em menos de 48 horas. Fonte: dados de exemplo.", { placeholder: "content" });

  s = pres.addSlide({ masterName: L("Comparação") });
  s.addText("Comparação de duas opções", { placeholder: "title" });
  s.addText("Opção A", { placeholder: "left-head" });
  s.addText(bl(["Mais rápida", "Custo inicial maior"]), { placeholder: "left" });
  s.addText("Opção B", { placeholder: "right-head" });
  s.addText(bl(["Mais lenta", "Custo inicial menor"]), { placeholder: "right" });

  s = pres.addSlide({ masterName: L("Só título") });
  s.addText("Tabela com o estilo FMUP", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.yellow, fill: { color: C.ink } } });
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

  s = pres.addSlide({ masterName: L("Só título") });
  s.addText("Gráfico nativo com as cores FMUP", { placeholder: "title" });
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

  s = pres.addSlide({ masterName: L("Código") });
  s.addText("Código em Geist Mono", { placeholder: "title" });
  s.addText(
    ["def fev1_percent(medido, previsto):", "    return 100 * medido / previsto", "", "print(fev1_percent(2.8, 3.5))"]
      .map((t, i, a) => ({ text: t, options: { breakLine: i < a.length - 1 } })),
    { placeholder: "code" }
  );

  s = pres.addSlide({ masterName: L("Três colunas") });
  s.addText("Três ideias em paralelo", { placeholder: "title" });
  [["Problema", ["Falta de tempo", "Dados dispersos"]], ["Método", ["Revisão rápida", "Critérios claros"]], ["Resultado", ["Menos erros", "Decisão mais rápida"]]].forEach(([h, items], i) => {
    s.addText(h, { placeholder: `col${i + 1}-head` });
    s.addText(bl(items), { placeholder: `col${i + 1}` });
  });

  s = pres.addSlide({ masterName: L("Passos") });
  s.addText("Como se faz em três passos", { placeholder: "title" });
  [["Preparar", "Reúna os dados e defina a pergunta."], ["Analisar", "Aplique o método e registe os resultados."], ["Comunicar", "Escreva uma mensagem por diapositivo."]].forEach(([h, t], i) => {
    s.addText(h, { placeholder: `step${i + 1}-head` });
    s.addText(t, { placeholder: `step${i + 1}` });
  });

  s = pres.addSlide({ masterName: L("Referências") });
  s.addText("Referências", { placeholder: "title" });
  s.addText(
    ["Bringhurst, R. (2004). The Elements of Typographic Style. Hartley & Marks.", "Tufte, E. R. (2001). The Visual Display of Quantitative Information. Graphics Press."]
      .map((t, i, a) => ({ text: t, options: { breakLine: i < a.length - 1, paraSpaceAfter: 10 } })),
    { placeholder: "refs" }
  );

  s = pres.addSlide({ masterName: L("Frase em destaque") });
  s.addText("Um diapositivo, uma ideia.", { placeholder: "quote" });
  s.addText("Regra de ouro das apresentações", { placeholder: "source" });

  s = pres.addSlide({ masterName: L("Final") });
  s.addText("Obrigado", { placeholder: "title" });
  s.addText("tiagojct@med.up.pt\nFaculdade de Medicina da Universidade do Porto", { placeholder: "contacts" });
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
