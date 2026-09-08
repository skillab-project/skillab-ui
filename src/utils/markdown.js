// ---------------------------------------------------------------------------
// Minimal, self-contained Markdown -> HTML renderer, shared across policy views.
// Input is HTML-escaped first, so raw HTML in the Markdown cannot inject.
// Handles: headings, bold/italic/inline-code, fenced code, links, blockquotes,
// horizontal rules, unordered/ordered lists and simple pipe tables.
// ---------------------------------------------------------------------------
export const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const inlineMd = (text) => {
  let t = text;
  t = t.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return t;
};

export const isTableSep = (line) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");

export const renderTable = (rows) => {
  const cells = (r) => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  let html = '<table class="rep-table"><thead><tr>';
  head.forEach((h) => (html += `<th>${inlineMd(h)}</th>`));
  html += "</tr></thead><tbody>";
  body.forEach((r) => {
    html += "<tr>";
    r.forEach((c) => (html += `<td>${inlineMd(c)}</td>`));
    html += "</tr>";
  });
  html += "</tbody></table>";
  return html;
};

// Some LLM responses wrap the ENTIRE body in a ```markdown ... ```
export const stripMarkdownFence = (md) => {
  if (!md) return md;
  const t = String(md).trim();
  const m = t.match(/^```(?:markdown|md)?[ \t]*\n([\s\S]*?)\n?```$/i);
  if (m && !m[1].includes("```")) return m[1].trim();
  return t;
};

export const mdToHtml = (md) => {
  if (!md) return "";
  const lines = escapeHtml(md.replace(/\r\n/g, "\n")).split("\n");
  let html = "";
  let para = [];
  let listType = null;
  let inCode = false;
  let codeBuf = [];

  const flushPara = () => {
    if (para.length) { html += `<p>${inlineMd(para.join(" "))}</p>`; para = []; }
  };
  const flushList = () => {
    if (listType) { html += `</${listType}>`; listType = null; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // fenced code blocks
    if (/^\s*```/.test(line)) {
      if (inCode) { html += `<pre><code>${codeBuf.join("\n")}</code></pre>`; codeBuf = []; inCode = false; }
      else { flushPara(); flushList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // blank line
    if (!line.trim()) { flushPara(); flushList(); continue; }

    // table (header + separator + rows)
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushPara(); flushList();
      const rows = [line, lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim()) { rows.push(lines[j]); j++; }
      html += renderTable(rows);
      i = j - 1;
      continue;
    }

    // headings
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) { flushPara(); flushList(); const lvl = h[1].length; html += `<h${lvl}>${inlineMd(h[2].trim())}</h${lvl}>`; continue; }

    // horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { flushPara(); flushList(); html += "<hr/>"; continue; }

    // blockquote (">" is HTML-escaped to "&gt;" above)
    if (/^\s*&gt;\s?/.test(line)) { flushPara(); flushList(); html += `<blockquote>${inlineMd(line.replace(/^\s*&gt;\s?/, ""))}</blockquote>`; continue; }

    // unordered list
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) { flushPara(); if (listType !== "ul") { flushList(); html += "<ul>"; listType = "ul"; } html += `<li>${inlineMd(ul[1])}</li>`; continue; }

    // ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) { flushPara(); if (listType !== "ol") { flushList(); html += "<ol>"; listType = "ol"; } html += `<li>${inlineMd(ol[1])}</li>`; continue; }

    // paragraph text
    flushList();
    para.push(line.trim());
  }
  if (inCode) html += `<pre><code>${codeBuf.join("\n")}</code></pre>`;
  flushPara();
  flushList();
  return html;
};

export const PRINT_CSS = `
  body { font-family: Arial, Helvetica, sans-serif; color: #222; line-height: 1.5; padding: 32px; max-width: 820px; margin: 0 auto; }
  h1,h2,h3,h4,h5,h6 { line-height: 1.25; margin: 1.2em 0 0.5em; }
  h1 { font-size: 1.8em; } h2 { font-size: 1.45em; } h3 { font-size: 1.2em; }
  p { margin: 0.6em 0; } ul,ol { margin: 0.6em 0 0.6em 1.4em; } li { margin: 0.2em 0; }
  code { background: #f2f2f2; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
  pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #ccc; margin: 0.6em 0; padding: 0.2em 0 0.2em 12px; color: #555; }
  table.rep-table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
  table.rep-table th, table.rep-table td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
  table.rep-table th { background: #f4f4f4; }
  hr { border: none; border-top: 1px solid #ddd; margin: 1.2em 0; }
`;
