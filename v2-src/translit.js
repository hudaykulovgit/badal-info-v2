// Uzbek Cyrillic → Uzbek Latin (o‘ g‘ with U+2018, tutuq ’ U+2019), applied at build time.
// Russian copy is protected: the `ru: { … }` block in Login.jsx is left as it is.
const VOW = new Set("аеёиоуўэюяАЕЁИОУЎЭЮЯ");
const MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ч: "ch", ш: "sh", щ: "sh",
  ъ: "\u2019", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "o\u2018", қ: "q", ғ: "g\u2018", ҳ: "h",
};
const isCyr = (c) => !!c && /[\u0400-\u04FF]/.test(c);
const isUpper = (c) => !!c && isCyr(c) && c !== c.toLowerCase();

export function translit(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!isCyr(ch)) { out += ch; continue; }
    const lo = ch.toLowerCase();
    const prev = text[i - 1];
    let t;
    if (lo === "е") t = !isCyr(prev) || VOW.has(prev) || /[ъьЪЬ]/.test(prev) ? "ye" : "e";
    else if (lo === "ц") t = VOW.has(prev) ? "ts" : "s";
    else t = MAP[lo] ?? lo;
    if (ch !== lo && t) {
      const caps = isUpper(text[i + 1]) || (isUpper(prev) && !isCyr(text[i + 1]));
      t = caps ? t.toUpperCase() : t[0].toUpperCase() + t.slice(1);
    }
    out += t;
  }
  return out;
}

export function convertSource(code, id = "") {
  const keep = [];
  let src = code;
  if (/Login\.jsx$/.test(id)) {
    src = src.replace(/\n  ru: \{[\s\S]*?\n  \},/, (m) => { keep.push(m); return `\n/*__KEEP${keep.length - 1}__*/`; });
    src = src.replace('"ЎЗ"', '"UZ"');
  }
  src = translit(src);
  return src.replace(/\n\/\*__KEEP(\d+)__\*\//g, (_, n) => keep[Number(n)]);
}

export default function uzLatin() {
  return {
    name: "uz-latin",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0];
      if (file.includes("node_modules") || !/[\\/]src[\\/].*\.(jsx?|json)$/.test(file)) return null;
      return { code: convertSource(code, file), map: null };
    },
    transformIndexHtml(html) {
      return html.replace('lang="uz-Cyrl"', 'lang="uz-Latn"').replace(/<title>(.*?)<\/title>/, (_, t) => `<title>${translit(t)}</title>`);
    },
  };
}
