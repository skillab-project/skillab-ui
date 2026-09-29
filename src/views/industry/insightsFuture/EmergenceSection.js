import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardHeader, CardBody, CardTitle, Table, Badge, Alert } from "reactstrap";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import EmergenceDetail from "./EmergenceDetail";
import { fmtDate, fmtNum } from "../futureNeeds/futureNeedsUtils";
import { CATEGORIES, METRIC_HELP, categoryInfo, entitiesAnalysed } from "./insightsFutureUtils";

const COLUMNS = [
  { key: "emergence_quotient", label: "EQ", get: (e) => e.emergence_quotient, fmt: (v) => fmtNum(v, 0), help: METRIC_HELP.emergence_quotient },
  { key: "theta", label: "Theta", get: (e) => e.theta, fmt: (v) => fmtNum(v, 3), help: METRIC_HELP.theta },
  { key: "confidence", label: "Confidence", get: (e) => e.confidence, fmt: (v) => fmtNum(v, 2), help: METRIC_HELP.confidence },
  {
    key: "tte",
    label: "Years to emergence",
    get: (e) => e.time_to_emergence?.point_estimate_years,
    fmt: (v) => fmtNum(v, 2),
    help: METRIC_HELP.time_to_emergence,
    ascending: true,
  },
];

function StatTile({ label, value, color = "#2d3e75", help }) {
  return (
    <Col xs="6" md="4" lg="2" className="mb-3" title={help}>
      <Card className="mb-0" style={{ height: "100%", boxShadow: "none", border: "1px solid #eee" }}>
        <CardBody className="text-center py-3">
          <div style={{ fontSize: "1.5rem", fontWeight: 600, color }}>{value}</div>
          <div className="text-muted" style={{ fontSize: "0.8rem" }}>{label}</div>
        </CardBody>
      </Card>
    </Col>
  );
}

function EmergenceChart({ entities, getLabel, onSelect }) {
  const data = useMemo(
    () =>
      entities
        .map((e, idx) => ({ idx, label: getLabel(e), eq: Number(e.emergence_quotient) || 0, cat: e.dominant_category }))
        .sort((a, b) => b.eq - a.eq),
    [entities, getLabel]
  );
  if (!data.length) return null;
  const max = Math.max(100, ...data.map((d) => d.eq));

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
        <XAxis type="number" domain={[0, max]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="label" width={220} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v, _n, p) => [`${fmtNum(v, 0)} (${categoryInfo(p?.payload?.cat).label})`, "Emergence Quotient"]} />
        <Bar dataKey="eq" radius={[0, 4, 4, 0]} barSize={20} style={{ cursor: "pointer" }} onClick={(d) => onSelect(d.idx)}>
          {data.map((d) => (
            <Cell key={d.idx} fill={categoryInfo(d.cat).color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * One long-term analysis block (organization-level or a single sector):
 * summary tiles, Emergence Quotient ranking, sortable table and the detail
 * view (time to emergence, category membership, signals, recommendations).
 */
function EmergenceSection({ analysis, kindInfo, title, subtitle, getLabel }) {
  const entities = useMemo(() => analysis?.[kindInfo.entitiesKey] || [], [analysis, kindInfo]);
  const [selected, setSelected] = useState(0);
  const [sortKey, setSortKey] = useState("emergence_quotient");

  useEffect(() => setSelected(0), [analysis]);

  const sortedIdx = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sortKey) || COLUMNS[0];
    return entities
      .map((_, i) => i)
      .sort((a, b) => {
        const va = col.get(entities[a]);
        const vb = col.get(entities[b]);
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        return col.ascending ? Number(va) - Number(vb) : Number(vb) - Number(va);
      });
  }, [entities, sortKey]);

  if (!analysis) return null;

  const status = String(analysis.status || "").toLowerCase();
  const summary = analysis.sector_summary || {};
  const meta = analysis.metadata || {};
  const dist = summary.category_distribution || {};
  const horizon = Number(meta.forecast_horizon_years) || 5;

  const topLists = CATEGORIES.slice()
    .reverse()
    .map((c) => ({ cat: c, items: summary[`top_${c.key}`] || [] }))
    .filter((t) => t.items.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4" className="mb-0">
          {title}
        </CardTitle>
        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
          {subtitle}
          {analysis.data_source ? ` Source: ${analysis.data_source}.` : ""}
          {meta.analysis_date ? ` Computed ${fmtDate(meta.analysis_date)}.` : ""}
        </p>
      </CardHeader>
      <CardBody>
        {status && status !== "ok" && (
          <Alert color="warning">{analysis.message || `The analysis returned status "${analysis.status}".`}</Alert>
        )}

        {entities.length === 0 ? (
          status === "ok" && (
            <p className="text-muted mb-0">No {kindInfo.plural.toLowerCase()} could be analysed with the available data.</p>
          )
        ) : (
          <>
            <Row>
              <StatTile
                label="Job postings analysed"
                value={Number(analysis.jobs_retrieved ?? summary.total_jobs_ingested ?? meta.total_records_retrieved ?? 0).toLocaleString()}
              />
              <StatTile label={`${kindInfo.plural} analysed`} value={entitiesAnalysed(summary, entities.length)} />
              {CATEGORIES.slice()
                .reverse()
                .map((c) => (
                  <StatTile key={c.key} label={c.label} value={dist[c.key] ?? 0} color={c.color} help={c.help} />
                ))}
            </Row>

            {topLists.length > 0 && (
              <div className="mb-3" style={{ fontSize: "0.85rem" }}>
                {topLists.map(({ cat, items }) => (
                  <div key={cat.key} className="mb-1">
                    <span className="text-muted">Top {cat.label.toLowerCase()}:</span>{" "}
                    {items.map((it) => (
                      <Badge key={it} color={cat.badge} pill className="mr-1">
                        {getLabel({ label: it })}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <Row>
              <Col lg="5" className="mb-3">
                <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
                  Emergence Quotient
                </h6>
                <EmergenceChart entities={entities} getLabel={getLabel} onSelect={setSelected} />
                <p className="text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                  {meta.framework ? `${meta.framework} · ` : ""}horizon: {horizon} years
                  {meta.aggregation_method ? ` · ${meta.aggregation_method}` : ""}
                </p>
              </Col>
              <Col lg="7" className="mb-3">
                <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
                  Ranking — click a row for details
                </h6>
                <div style={{ maxHeight: 360, overflow: "scroll" }}>
                  <Table hover size="sm" className="mb-0" style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th>{kindInfo.singular}</th>
                        <th>Category</th>
                        {COLUMNS.map((c) => (
                          <th
                            key={c.key}
                            className="text-right"
                            title={`${c.help} Click to sort.`}
                            style={{ cursor: "pointer", whiteSpace: "nowrap", textDecoration: sortKey === c.key ? "underline" : "none" }}
                            onClick={() => setSortKey(c.key)}
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedIdx.map((i) => {
                        const e = entities[i];
                        const cat = categoryInfo(e.dominant_category);
                        return (
                          <tr
                            key={`${e.uri}-${i}`}
                            onClick={() => setSelected(i)}
                            style={{ cursor: "pointer", background: selected === i ? "rgba(81,203,206,0.12)" : undefined }}
                          >
                            <td title={e.uri}>{getLabel(e)}</td>
                            <td>
                              <Badge color={cat.badge} pill title={cat.help}>
                                {cat.label}
                              </Badge>
                            </td>
                            {COLUMNS.map((c) => (
                              <td key={c.key} className="text-right">
                                {c.fmt(c.get(e))}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Col>
            </Row>

            <EmergenceDetail
              entity={entities[selected]}
              label={getLabel(entities[selected] || {})}
              kindInfo={kindInfo}
              horizon={horizon}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}

export default EmergenceSection;
