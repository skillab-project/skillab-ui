import React, { useState, useCallback, useMemo } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col, Button,
  Alert, Spinner, Input, Label, FormGroup, Badge, Table,
} from "reactstrap";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { API_BASE_URL, GRANULARITIES, FORM_HEADERS, HelpIcon, SectionTitle } from "./projectorShared";

// 10 distinguishable categorical colours (one per top-k skill; cycles if top_k > 10)
const SERIES_COLORS = [
  "#51cbce", "#6610f2", "#ef8157", "#28a745", "#fbc658",
  "#e83e8c", "#17a2b8", "#795548", "#6c757d", "#20c997",
];

const formatGrowth = (value) => {
  if (value === null || value === undefined) return "—";
  const pct = value * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
};

const formatShare = (value) =>
  value === null || value === undefined ? "—" : `${(value * 100).toFixed(1)}%`;

const growthColor = (value) => {
  if (value === null || value === undefined) return undefined;
  if (value > 0) return "#28a745";
  if (value < 0) return "#dc3545";
  return undefined;
};

const TemporalProjections = () => {
  // --- Filters ---
  const [minDate, setMinDate] = useState("2023-10-01");
  const [maxDate, setMaxDate] = useState("2023-12-31");
  const [keywords, setKeywords] = useState("software");
  const [granularity, setGranularity] = useState("monthly");
  const [forecastPeriods, setForecastPeriods] = useState(1);
  const [topK, setTopK] = useState(10);

  // --- Request state ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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
        keywords: keywords,
        granularity: granularity,
        forecast_periods: String(forecastPeriods),
        top_k: String(topK),
      });
      const response = await axios.post(`${API_BASE_URL}/temporal-projections`, body, {
        headers: FORM_HEADERS,
      });
      const data = response.data;
      if (data?.status && data.status !== "completed") {
        setError(`The analysis did not complete (status: ${data.status}).`);
        setResult(null);
      } else {
        setResult(data);
        if (!data?.insights?.skills?.length) {
          setError("No skills were found for these filters.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch temporal projections.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [minDate, maxDate, keywords, granularity, forecastPeriods, topK]);

  const insights = result?.insights;
  const skills = useMemo(() => insights?.skills || [], [insights]);

  // Job volume chart: one point per period
  const jobVolumeData = useMemo(
    () => (insights?.periods || []).map((p) => ({ period: p.period, job_count: p.job_count })),
    [insights]
  );

  // Skill time series: pivot to [{ period, [skillName]: count, ... }]
  const skillSeriesData = useMemo(() => {
    const periodOrder = (insights?.periods || []).map((p) => p.period);
    const byPeriod = {};
    periodOrder.forEach((p) => { byPeriod[p] = { period: p }; });
    skills.forEach((skill) => {
      (skill.series || []).forEach((point) => {
        if (!byPeriod[point.period]) byPeriod[point.period] = { period: point.period };
        byPeriod[point.period][skill.name] = point.count;
      });
    });
    return Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period));
  }, [insights, skills]);

  // Flat table rows
  const seriesRows = useMemo(
    () => skills.flatMap((skill) =>
      (skill.series || []).map((point) => ({ skill: skill.name, id: skill.skill_id, ...point }))
    ),
    [skills]
  );

  const forecastRows = useMemo(
    () => skills.flatMap((skill) =>
      (skill.forecast || []).map((f) => ({ skill: skill.name, id: skill.skill_id, ...f }))
    ),
    [skills]
  );

  const singlePoint = jobVolumeData.length <= 1;

  return (
    <>
      {/* ---------- Filters ---------- */}
      <Card>
        <CardHeader>
          <CardTitle tag="h4">Temporal Projections Settings</CardTitle>
        </CardHeader>
        <CardBody>
          <Row style={{ justifyContent: "center" }}>
            <Col md="4">
              <FormGroup>
                <Label for="tpKeywords">Keywords</Label>
                <Input
                  id="tpKeywords"
                  type="text"
                  placeholder="e.g., software"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label for="tpMinDate">From</Label>
                <Input id="tpMinDate" type="date" value={minDate} onChange={(e) => setMinDate(e.target.value)} />
              </FormGroup>
            </Col>
            <Col md="3">
              <FormGroup>
                <Label for="tpMaxDate">To</Label>
                <Input id="tpMaxDate" type="date" value={maxDate} onChange={(e) => setMaxDate(e.target.value)} />
              </FormGroup>
            </Col>
          </Row>
          <Row style={{ justifyContent: "center" }}>
            <Col md="3">
              <FormGroup>
                <Label for="tpGranularity">Granularity</Label>
                <Input
                  id="tpGranularity"
                  type="select"
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value)}
                >
                  {GRANULARITIES.map((g) => (
                    <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md="2">
              <FormGroup>
                <Label for="tpForecast">Forecast</Label>
                <Input
                  id="tpForecast"
                  type="number"
                  min={1}
                  value={forecastPeriods}
                  onChange={(e) => setForecastPeriods(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </FormGroup>
            </Col>
            <Col md="2">
              <FormGroup>
                <Label for="tpTopK">Top K</Label>
                <Input
                  id="tpTopK"
                  type="number"
                  min={1}
                  value={topK}
                  onChange={(e) => setTopK(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
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

      {insights && (
        <>
          {/* ---------- KPI + job volume ---------- */}
          <Row>
            <Col md="3">
              <Card className="card-stats h-100">
                <CardBody>
                  <p className="card-category mb-1 d-flex align-items-center">
                    Jobs Analyzed
                    <HelpIcon id="tpJobsHelp" text="Number of job ads matching the keywords within the selected date window." />
                  </p>
                  <h2 className="mb-3">{result.total_jobs?.toLocaleString() ?? "—"}</h2>
                  <div className="d-flex flex-wrap" style={{ gap: 6 }}>
                    <Badge color="info">
                      {insights.window?.min_date} → {insights.window?.max_date}
                    </Badge>
                    <Badge color="secondary">{insights.granularity}</Badge>
                    <Badge color="success">{insights.forecast_method}</Badge>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md="9">
              <Card className="h-100">
                <CardHeader>
                  <SectionTitle
                    id="tpVolumeHelp"
                    title="Job volume by period"
                    help="Total number of matching job ads in each period."
                  />
                </CardHeader>
                <CardBody>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={jobVolumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} padding={singlePoint ? { left: 40, right: 40 } : undefined} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="job_count"
                          name="Job count"
                          stroke="#51cbce"
                          strokeWidth={3}
                          dot={{ r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* ---------- Skill time series ---------- */}
          {skills.length > 0 && (
            <Card className="mt-3">
              <CardHeader>
                <SectionTitle
                  id="tpSeriesHelp"
                  title="Skill time series"
                  help="Number of job ads mentioning each of the top skills, per period."
                />
              </CardHeader>
              <CardBody>
                <div style={{ width: "100%", height: 420 }}>
                  <ResponsiveContainer>
                    <LineChart data={skillSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} padding={singlePoint ? { left: 40, right: 40 } : undefined} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 12 }} />
                      {skills.map((skill, i) => (
                        <Line
                          key={skill.skill_id || skill.name}
                          type="monotone"
                          dataKey={skill.name}
                          stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ maxHeight: 400, overflowY: "auto" }} className="mt-3">
                  <Table hover size="sm">
                    <thead>
                      <tr>
                        <th>Skill</th>
                        <th>Period</th>
                        <th className="text-right">Count</th>
                        <th className="text-right">Share</th>
                        <th className="text-right">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seriesRows.map((row) => (
                        <tr key={`${row.id}-${row.period}`}>
                          <td>{row.skill}</td>
                          <td>{row.period}</td>
                          <td className="text-right">{row.count}</td>
                          <td className="text-right">{formatShare(row.share)}</td>
                          <td className="text-right" style={{ color: growthColor(row.growth_vs_previous) }}>
                            {formatGrowth(row.growth_vs_previous)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ---------- Baseline forecast ---------- */}
          {forecastRows.length > 0 && (
            <Card className="mt-3">
              <CardHeader>
                <SectionTitle
                  id="tpForecastHelp"
                  title="Baseline forecast"
                  help="Projected skill counts for the next period(s), extrapolated from the latest change (last-delta baseline)."
                />
              </CardHeader>
              <CardBody>
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  <Table hover size="sm">
                    <thead>
                      <tr>
                        <th>Skill</th>
                        <th>Period</th>
                        <th className="text-right">Projected count</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastRows.map((row) => (
                        <tr key={`${row.id}-${row.period}`}>
                          <td>{row.skill}</td>
                          <td>{row.period}</td>
                          <td className="text-right">{row.projected_count}</td>
                          <td><Badge color="light">{row.method}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </>
  );
};

export default TemporalProjections;
