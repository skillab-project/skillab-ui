import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col, Button,
  Alert, Spinner, Input, Label, FormGroup, Badge,
} from "reactstrap";
import axios from "axios";

const CURRICULUM = process.env.REACT_APP_API_URL_CURRICULUM_SKILLS;
const FTTI = process.env.REACT_APP_API_URL_FUTURE_TECHNOLOGY_TRENDS_IDENTIFIER;

// FTTI is served behind the authenticated user-management gateway.
const ftAuth = () => ({ Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` });

const errText = (err, fallback = "Something went wrong") =>
  err?.response?.data?.detail || err?.message || fallback;

// ---------------------------------------------------------------------------
// Minimal, self-contained Markdown -> HTML renderer.
// Input is HTML-escaped first, so raw HTML in the Markdown cannot inject.
// Handles: headings, bold/italic/inline-code, fenced code, links, blockquotes,
// horizontal rules, unordered/ordered lists and simple pipe tables.
// ---------------------------------------------------------------------------
const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inlineMd = (text) => {
  let t = text;
  t = t.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return t;
};

const isTableSep = (line) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");

const renderTable = (rows) => {
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

const mdToHtml = (md) => {
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

const PRINT_CSS = `
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

const GenerateReport = () => {
  // ---- source analyses ----
  const [fttiTitles, setFttiTitles] = useState([]);
  const [fttiLoading, setFttiLoading] = useState(false);
  const [fttiTitle, setFttiTitle] = useState("");

  const [shortRuns, setShortRuns] = useState([]);
  const [shortLoading, setShortLoading] = useState(false);
  const [shortTitle, setShortTitle] = useState("");

  const [longRuns, setLongRuns] = useState([]);
  const [longLoading, setLongLoading] = useState(false);
  const [longTitle, setLongTitle] = useState("");

  // ---- options ----
  const [focus, setFocus] = useState("");
  const [forceRefresh, setForceRefresh] = useState(false);

  // ---- result ----
  const [report, setReport] = useState(null);       // markdown string
  const [reportMeta, setReportMeta] = useState(null); // {cached, used_analyses, not_found, created_at}
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // ---- load the selectable analyses ----
  useEffect(() => {
    loadFttiTitles();
    loadShortRuns();
    loadLongRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFttiTitles = async () => {
    setFttiLoading(true);
    try {
      const res = await axios.get(`${FTTI}/analyses/titles`, { headers: ftAuth() });
      setFttiTitles(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError((prev) => prev || `Could not load Future Technology Trends analyses: ${errText(e)}`);
    } finally {
      setFttiLoading(false);
    }
  };

  const loadShortRuns = async () => {
    setShortLoading(true);
    try {
      const res = await axios.get(`${CURRICULUM}/policy/runs`);
      const raw = res.data;
      setShortRuns(Array.isArray(raw) ? raw : (raw?.runs || raw?.data || []));
    } catch (e) {
      setError((prev) => prev || `Could not load Short Term analyses: ${errText(e)}`);
    } finally {
      setShortLoading(false);
    }
  };

  const loadLongRuns = async () => {
    setLongLoading(true);
    try {
      const res = await axios.get(`${CURRICULUM}/skill-gap/longterm/gap-by-title/runs`);
      const raw = res.data;
      setLongRuns(Array.isArray(raw) ? raw : (raw?.runs || raw?.data || []));
    } catch (e) {
      setError((prev) => prev || `Could not load Long Term analyses: ${errText(e)}`);
    } finally {
      setLongLoading(false);
    }
  };

  const anySelected = !!fttiTitle || !!shortTitle || !!longTitle;

  const generate = async () => {
    setError(null);
    if (!anySelected) {
      setError("Select at least one analysis to include in the report.");
      return;
    }
    // Field mapping:
    //   FTTI trends   -> tsouk_title   (fetched live from the Tsouk API)
    //   Short Term    -> policy_title
    //   Long Term     -> longterm_title
    // (shortterm_title / skill-hotness is intentionally not used here.)
    const payload = {
      tsouk_title: fttiTitle || null,
      policy_title: shortTitle || null,
      longterm_title: longTitle || null,
      focus: focus.trim() || null,
      force_refresh: forceRefresh,
    };
    setGenerating(true);
    try {
      const res = await axios.post(`${CURRICULUM}/recommendations/generate`, payload, { headers: ftAuth() });
      const data = res.data || {};
      setReport(data.recommendations || "");
      setReportMeta({
        cached: !!data.cached,
        used_analyses: data.used_analyses,
        not_found: data.not_found || [],
        created_at: data.created_at || null,
      });
      if (!data.recommendations) {
        setError("The report came back empty. Try again or adjust the selected analyses.");
      }
    } catch (e) {
      setReport(null);
      setReportMeta(null);
      setError(`Could not generate the report: ${errText(e)}`);
    } finally {
      setGenerating(false);
    }
  };

  const clearAll = () => {
    setFttiTitle("");
    setShortTitle("");
    setLongTitle("");
    setFocus("");
    setForceRefresh(false);
    setReport(null);
    setReportMeta(null);
    setError(null);
  };

  const printReport = () => {
    if (!report) return;
    const html =
      `<!doctype html><html><head><meta charset="utf-8">` +
      `<title>Curriculum Recommendations</title><style>${PRINT_CSS}</style></head>` +
      `<body>${mdToHtml(report)}</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        // ignore
      }
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  const reportHtml = report ? mdToHtml(report) : "";

  return (
    <div className="content">
      <Card>
        <CardHeader>
          <CardTitle tag="h4" className="mb-1">Generate Report</CardTitle>
          <span style={{ color: "#666" }}>
            Build an LLM curriculum-recommendations report from analyses you have already run.
            Pick any combination of a Future Technology Trends analysis, a Short Term Analysis
            and a Long Term Analysis.
          </span>
        </CardHeader>
        <CardBody>
          {error && <Alert color="danger" toggle={() => setError(null)}>{error}</Alert>}

          <Row>
            {/* Future Technology Trends analysis -> tsouk_title */}
            <Col md="4">
              <FormGroup>
                <Label>
                  <i className="fas fa-lightbulb" style={{ marginRight: 6, color: "#51bcda" }}></i>
                  Future Technology Trends analysis
                </Label>
                <Input
                  type="select"
                  value={fttiTitle}
                  onChange={(e) => setFttiTitle(e.target.value)}
                  disabled={fttiLoading}
                >
                  <option value="">{fttiLoading ? "Loading…" : "— none —"}</option>
                  {fttiTitles.filter((t) => t.title).map((t) => (
                    <option key={t.title} value={t.title}>
                      {t.title}{t.sector ? ` (${t.sector})` : ""}
                    </option>
                  ))}
                </Input>
                {!fttiLoading && fttiTitles.length === 0 && (
                  <small className="text-muted">No analyses found.</small>
                )}
              </FormGroup>
            </Col>

            {/* Short Term Analysis -> policy_title */}
            <Col md="4">
              <FormGroup>
                <Label>
                  <i className="fas fa-bolt" style={{ marginRight: 6, color: "#ef8157" }}></i>
                  Short Term Analysis
                </Label>
                <Input
                  type="select"
                  value={shortTitle}
                  onChange={(e) => setShortTitle(e.target.value)}
                  disabled={shortLoading}
                >
                  <option value="">{shortLoading ? "Loading…" : "— none —"}</option>
                  {shortRuns.filter((r) => r.title).map((r, i) => (
                    <option key={r.title || r.run_id || i} value={r.title}>
                      {r.title}{r.filters?.country ? ` · ${r.filters.country}` : ""}
                    </option>
                  ))}
                </Input>
                {!shortLoading && shortRuns.length === 0 && (
                  <small className="text-muted">No analyses found.</small>
                )}
              </FormGroup>
            </Col>

            {/* Long Term Analysis -> longterm_title */}
            <Col md="4">
              <FormGroup>
                <Label>
                  <i className="fas fa-chart-line" style={{ marginRight: 6, color: "#6bd098" }}></i>
                  Long Term Analysis
                </Label>
                <Input
                  type="select"
                  value={longTitle}
                  onChange={(e) => setLongTitle(e.target.value)}
                  disabled={longLoading}
                >
                  <option value="">{longLoading ? "Loading…" : "— none —"}</option>
                  {longRuns.filter((r) => r.title).map((r, i) => (
                    <option key={r.title || r.run_id || i} value={r.title}>
                      {r.title}{r.filters?.country ? ` · ${r.filters.country}` : ""}
                    </option>
                  ))}
                </Input>
                {!longLoading && longRuns.length === 0 && (
                  <small className="text-muted">No analyses found.</small>
                )}
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md="8">
              <FormGroup>
                <Label>Focus <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></Label>
                <Input
                  bsSize="sm"
                  placeholder="e.g. focus on Greece, emphasise data-science skills…"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="4" className="d-flex align-items-center">
              <FormGroup check className="mt-2">
                <Label check>
                  <Input
                    type="checkbox"
                    checked={forceRefresh}
                    onChange={(e) => setForceRefresh(e.target.checked)}
                  />{" "}
                  Regenerate (ignore cached report)
                </Label>
              </FormGroup>
            </Col>
          </Row>

          {/* Selection summary */}
          {anySelected && (
            <div style={{ marginBottom: 12 }}>
              <small className="text-muted">Included: </small>
              {fttiTitle && <Badge color="info" style={{ marginRight: 4 }}>Trends: {fttiTitle}</Badge>}
              {shortTitle && <Badge color="warning" style={{ marginRight: 4 }}>Short term: {shortTitle}</Badge>}
              {longTitle && <Badge color="success" style={{ marginRight: 4 }}>Long term: {longTitle}</Badge>}
            </div>
          )}

          <Button color="primary" onClick={generate} disabled={!anySelected || generating}>
            {generating ? <><Spinner size="sm" /> Generating…</> : "Generate report"}
          </Button>{" "}
          {(anySelected || report) && (
            <Button color="secondary" outline onClick={clearAll} disabled={generating}>
              Clear
            </Button>
          )}
          {!anySelected && (
            <small className="text-muted ml-2">Select at least one analysis.</small>
          )}
        </CardBody>
      </Card>

      {/* ---- Report preview ---- */}
      {report != null && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <CardTitle tag="h5" className="mb-1">Recommendations</CardTitle>
                {reportMeta && (
                  <span style={{ color: "#666" }}>
                    {reportMeta.cached ? (
                      <Badge color="secondary">cached{reportMeta.created_at ? ` · ${new Date(reportMeta.created_at).toLocaleDateString()}` : ""}</Badge>
                    ) : (
                      <Badge color="success">freshly generated</Badge>
                    )}
                  </span>
                )}
              </div>
              <Button color="info" outline size="sm" onClick={printReport} disabled={!report}>
                <i className="fas fa-print" style={{ marginRight: 6 }}></i>Print report
              </Button>
            </div>
            {reportMeta && reportMeta.not_found && reportMeta.not_found.length > 0 && (
              <Alert color="warning" className="mt-2 mb-0">
                No saved analysis found for: {reportMeta.not_found.join(", ")}. The report used the rest.
              </Alert>
            )}
          </CardHeader>
          <CardBody>
            {report ? (
              <div className="report-markdown" dangerouslySetInnerHTML={{ __html: reportHtml }} />
            ) : (
              <em style={{ color: "#999" }}>No recommendations were returned.</em>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default GenerateReport;
