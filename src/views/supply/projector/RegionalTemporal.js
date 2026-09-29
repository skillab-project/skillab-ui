import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col, Button, Alert, Spinner,
  Input, Label, FormGroup, Badge, Table, Collapse, UncontrolledTooltip,
} from "reactstrap";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { API_BASE_URL, GRANULARITIES, FORM_HEADERS, HelpIcon, SectionTitle } from "./projectorShared";

// Territorial levels offered in the UI (the API also returns a country-level
// "raw" breakdown, which is intentionally not shown).
const LEVELS = [
  { id: "nuts1", name: "NUTS 1", description: "Major socio-economic regions" },
  { id: "nuts2", name: "NUTS 2", description: "Basic regions (for regional policies)" },
  { id: "nuts3", name: "NUTS 3", description: "Small regions (for specific diagnoses)" },
];

// --- Specialization (location quotient) colour scale -------------------------
// LQ = 1 means the skill is as common in the area as overall; > 1 over-represented.
// Diverging red → yellow → green centred on 1, on a log scale clamped at 1/4 … 4.
const LQ_STOPS = [
  [-1, [215, 48, 39]],   // red
  [0, [254, 224, 139]],  // yellow
  [1, [26, 152, 80]],    // green
];
const lqColor = (lq) => {
  if (lq === null || lq === undefined || lq <= 0) return "#9a9a9a";
  const t = Math.max(-1, Math.min(1, Math.log2(lq) / 2));
  const [lo, hi] = t < 0 ? [LQ_STOPS[0], LQ_STOPS[1]] : [LQ_STOPS[1], LQ_STOPS[2]];
  const f = (t - lo[0]) / (hi[0] - lo[0]);
  const c = lo[1].map((v, i) => Math.round(v + (hi[1][i] - v) * f));
  return `rgb(${c.join(",")})`;
};

const LqLegend = () => (
  <div className="d-flex align-items-center justify-content-end" style={{ fontSize: 12, gap: 8 }}>
    <span className="text-muted">Specialization (LQ)</span>
    <span>≤0.25</span>
    <div
      style={{
        width: 140, height: 10, borderRadius: 5,
        background: `linear-gradient(to right, ${lqColor(0.25)}, ${lqColor(1)}, ${lqColor(4)})`,
      }}
    />
    <span>≥4</span>
  </div>
);

const SkillTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.15)", fontSize: 13 }}>
      <strong>{s.label}</strong>
      <div>Total mentions: {s.total_count}</div>
      <div>Specialization (LQ): {s.specialization ?? "—"}</div>
      <div>Trend: {s.trend_type}</div>
    </div>
  );
};

const RegionalTemporal = () => {
  // --- Filters ---
  const [minDate, setMinDate] = useState("2024-10-01");
  const [maxDate, setMaxDate] = useState("2024-12-31");
  const [keywords, setKeywords] = useState("software");
  const [granularity, setGranularity] = useState("monthly");
  const [topKRegions, setTopKRegions] = useState(10);
  const [topKSkills, setTopKSkills] = useState(10);

  // --- Request / view state ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [level, setLevel] = useState("nuts1");
  const [selectedCode, setSelectedCode] = useState(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const handleFetch = useCallback(async () => {
    if (minDate && maxDate && minDate > maxDate) {
      setError("The start date must be before the end date.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = new URLSearchParams({
        min_date: minDate,
        max_date: maxDate,
        keywords,
        granularity,
        top_k_regions: String(topKRegions),
        top_k_skills: String(topKSkills),
        demo: "false",
      });
      const { data } = await axios.post(`${API_BASE_URL}/regional-temporal`, body, { headers: FORM_HEADERS });
      if (data?.status && data.status !== "completed") {
        setError(`The analysis did not complete (status: ${data.status}).`);
        setResult(null);
      } else {
        setResult(data);
        // Keep the current level if it has data, otherwise fall back to the first level that does
        const rt = data?.regional_temporal || {};
        if (!rt[level]?.length) {
          const firstWithData = LEVELS.find((l) => rt[l.id]?.length);
          if (firstWithData) setLevel(firstWithData.id);
        }
        if (!LEVELS.some((l) => rt[l.id]?.length)) setError("No regional data was found for these filters.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch regional temporal analysis.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [minDate, maxDate, keywords, granularity, topKRegions, topKSkills, level]);

  const areas = useMemo(() => result?.regional_temporal?.[level] || [], [result, level]);

  // Select the top area whenever the list changes (new result or new level)
  useEffect(() => {
    setSelectedCode(areas.length ? areas[0].code : null);
    setEvidenceOpen(false);
  }, [areas]);

  const area = useMemo(() => areas.find((a) => a.code === selectedCode) || null, [areas, selectedCode]);
  const trendData = useMemo(() => (area?.periods || []).map((p) => ({ ...p })), [area]);
  const topSkills = useMemo(() => area?.top_skills || [], [area]);
  const evidenceRows = useMemo(
    () => topSkills.flatMap((s) => (s.series || []).map((p) => ({ label: s.label, id: s.skill_id, ...p }))),
    [topSkills]
  );

  return (
    <>
      {/* ---------- Filters ---------- */}
      <Card>
        <CardHeader>
          <CardTitle tag="h4">Regional Temporal Analysis Settings</CardTitle>
        </CardHeader>
        <CardBody>
          <Row style={{ justifyContent: "center" }}>
            <Col md="4">
              <FormGroup>
                <Label for="rtKeywords">Keywords</Label>
                <Input id="rtKeywords" type="text" placeholder="e.g., software" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label for="rtMinDate">From</Label>
                <Input id="rtMinDate" type="date" value={minDate} onChange={(e) => setMinDate(e.target.value)} />
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label for="rtMaxDate">To</Label>
                <Input id="rtMaxDate" type="date" value={maxDate} onChange={(e) => setMaxDate(e.target.value)} />
              </FormGroup>
            </Col>
          </Row>
          <Row style={{ justifyContent: "center" }}>
            <Col md="3">
              <FormGroup>
                <Label for="rtGranularity">Granularity</Label>
                <Input id="rtGranularity" type="select" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
                  {GRANULARITIES.map((g) => (
                    <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md="2">
              <FormGroup>
                <Label for="rtTopRegions">Top regions</Label>
                <Input id="rtTopRegions" type="number" min={1} value={topKRegions}
                  onChange={(e) => setTopKRegions(Math.max(1, parseInt(e.target.value, 10) || 1))} />
              </FormGroup>
            </Col>
            <Col md="2">
              <FormGroup>
                <Label for="rtTopSkills">Top skills</Label>
                <Input id="rtTopSkills" type="number" min={1} value={topKSkills}
                  onChange={(e) => setTopKSkills(Math.max(1, parseInt(e.target.value, 10) || 1))} />
              </FormGroup>
            </Col>
          </Row>
          <Row style={{ justifyContent: "center" }} className="mb-3">
            <Button color="primary" onClick={handleFetch} disabled={loading}>
              {loading ? <><Spinner size="sm" /> Processing...</> : "Apply"}
            </Button>
          </Row>
        </CardBody>
      </Card>

      {error && <Alert color="danger">{error}</Alert>}

      {result && (
        <>
          {/* ---------- KPI + level switch + top areas ---------- */}
          <Row>
            <Col md="3">
              <Card className="card-stats">
                <CardBody>
                  <p className="card-category mb-1 d-flex align-items-center">
                    Jobs Analyzed
                    <HelpIcon id="rtJobsHelp" text="Number of job ads matching the keywords within the selected date window." />
                  </p>
                  <h2 className="mb-3">{result.total_jobs?.toLocaleString() ?? "—"}</h2>
                  <div className="d-flex flex-wrap" style={{ gap: 6 }}>
                    <Badge color="info">{result.window?.min_date} → {result.window?.max_date}</Badge>
                    <Badge color="secondary">{result.granularity}</Badge>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <p className="card-category mb-2">Territorial level</p>
                  {LEVELS.map((l) => {
                    const count = result.regional_temporal?.[l.id]?.length || 0;
                    const wrapperId = `rtLevel-${l.id}`;
                    return (
                      // The tooltip targets a wrapper so it still shows when the button is disabled
                      <div key={l.id} id={wrapperId} className="mb-2">
                        <Button
                          block
                          color="info"
                          outline={level !== l.id}
                          disabled={!count}
                          onClick={() => setLevel(l.id)}
                          className="d-flex justify-content-between m-0"
                          style={!count ? { pointerEvents: "none" } : undefined}
                        >
                          <span>{l.name}</span>
                          <span>{count}</span>
                        </Button>
                        <UncontrolledTooltip placement="right" target={wrapperId}>
                          <strong>{l.name}:</strong> {l.description}
                          {!count && <div>No data at this level</div>}
                        </UncontrolledTooltip>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            </Col>

            <Col md="9">
              <Card>
                <CardHeader>
                  <SectionTitle
                    id="rtAreasHelp"
                    title="Top areas"
                    help="Areas with the most matching job ads at the selected territorial level. Click a row to inspect that area below."
                  />
                </CardHeader>
                <CardBody>
                  <div style={{ maxHeight: 420, overflowY: "auto" }}>
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th className="text-right">Jobs analyzed</th>
                          <th style={{ width: "45%" }}>Market share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {areas.map((a) => (
                          <tr
                            key={a.code}
                            onClick={() => setSelectedCode(a.code)}
                            style={{
                              cursor: "pointer",
                              background: a.code === selectedCode ? "rgba(81,203,206,0.15)" : undefined,
                              fontWeight: a.code === selectedCode ? 600 : undefined,
                            }}
                          >
                            <td>{a.code}</td>
                            <td className="text-right">{a.total_jobs?.toLocaleString()}</td>
                            <td>
                              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                <div style={{ flex: 1, background: "#eee", borderRadius: 4, height: 8 }}>
                                  <div style={{ width: `${Math.min(100, a.market_share || 0)}%`, background: "#51cbce", height: 8, borderRadius: 4 }} />
                                </div>
                                <span style={{ minWidth: 52, textAlign: "right" }}>{a.market_share?.toFixed(2)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* ---------- Selected area details ---------- */}
          {area && (
            <Row>
              <Col md="12">
                <Card>
                  <CardHeader>
                    <SectionTitle
                      id="rtTrendHelp"
                      title={`Area trend over time: ${area.code}`}
                      help="Number of matching job ads in the selected area, per period."
                    />
                  </CardHeader>
                  <CardBody>
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="period" tick={{ fontSize: 12 }}
                            padding={trendData.length <= 1 ? { left: 40, right: 40 } : undefined} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="job_count" name="Job count" stroke="#51cbce"
                            strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <Table size="sm" className="mt-3 mb-0">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Start</th>
                          <th>End</th>
                          <th className="text-right">Jobs analyzed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.map((p) => (
                          <tr key={p.period}>
                            <td>{p.period}</td>
                            <td>{p.start_date}</td>
                            <td>{p.end_date}</td>
                            <td className="text-right">{p.job_count?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </CardBody>
                </Card>
              </Col>

              <Col md="12">
                <Card>
                  <CardHeader>
                    <SectionTitle
                      id="rtSkillsHelp"
                      title={`Top skills in area: ${area.code}`}
                      help="Most mentioned skills in the selected area. Colour shows specialization (location quotient): above 1 means the skill is more common here than across all areas."
                    />
                  </CardHeader>
                  <CardBody>
                    <LqLegend />
                    <div style={{ width: "100%", height: Math.max(220, topSkills.length * 34 + 40) }}>
                      <ResponsiveContainer>
                        <BarChart data={topSkills} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="label" width={230} tick={{ fontSize: 12 }} interval={0} />
                          <Tooltip content={<SkillTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                          <Bar dataKey="total_count" name="Total mentions" radius={[0, 4, 4, 0]}>
                            {topSkills.map((s) => (
                              <Cell key={s.skill_id} fill={lqColor(s.specialization)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <Table hover size="sm" className="mt-3">
                      <thead>
                        <tr>
                          <th>Skill</th>
                          <th className="text-right">Mentions</th>
                          <th className="text-right">LQ</th>
                          <th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSkills.map((s) => (
                          <tr key={s.skill_id}>
                            <td>
                              <a href={s.skill_id} target="_blank" rel="noopener noreferrer">{s.label}</a>
                            </td>
                            <td className="text-right">{s.total_count}</td>
                            <td className="text-right">
                              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: lqColor(s.specialization), marginRight: 6 }} />
                              {s.specialization ?? "—"}
                            </td>
                            <td><Badge color="light">{s.trend_type}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <Button color="link" className="p-0" onClick={() => setEvidenceOpen((o) => !o)}>
                      {evidenceOpen ? "▾" : "▸"} Statistical evidence
                    </Button>
                    <Collapse isOpen={evidenceOpen}>
                      <div style={{ maxHeight: 320, overflowY: "auto" }} className="mt-2">
                        <Table size="sm">
                          <thead>
                            <tr>
                              <th>Skill</th>
                              <th>Period</th>
                              <th className="text-right">Count</th>
                              <th className="text-right">Share of area jobs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evidenceRows.map((r) => (
                              <tr key={`${r.id}-${r.period}`}>
                                <td>{r.label}</td>
                                <td>{r.period}</td>
                                <td className="text-right">{r.count}</td>
                                <td className="text-right">{r.share != null ? `${(r.share * 100).toFixed(1)}%` : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Collapse>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </>
  );
};

export default RegionalTemporal;
