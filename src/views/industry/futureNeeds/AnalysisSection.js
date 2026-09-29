import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, CardHeader, CardBody, CardTitle, Table, Badge, Alert } from "reactstrap";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import EntityDetail from "./EntityDetail";
import { METRICS, fmtDate, fmtNum, fmtPct, tierInfo, TIERS } from "./futureNeedsUtils";

const TABLE_METRICS = METRICS.filter((m) =>
  ["composite_potential_score", "forecast_cagr_pct", "market_penetration_rate_pct", "emergence_index", "demand_volatility"].includes(m.key)
);

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

function PotentialChart({ entities, getLabel, onSelect }) {
  const data = useMemo(
    () =>
      entities
        .map((e, idx) => ({
          idx,
          label: getLabel(e),
          score: Number(e.metrics?.composite_potential_score) || 0,
          tier: e.potential_tier,
        }))
        .sort((a, b) => b.score - a.score),
    [entities, getLabel]
  );
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
        <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="label" width={220} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [fmtNum(v, 3), "Potential score"]} />
        <Bar
          dataKey="score"
          name="Potential score"
          radius={[0, 4, 4, 0]}
          barSize={20}
          style={{ cursor: "pointer" }}
          onClick={(d) => onSelect(d.idx)}
        >
          {data.map((d) => (
            <Cell key={d.idx} fill={tierInfo(d.tier).color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Renders one analysis block (organization-level or a single sector):
 * summary tiles, a ranked potential chart, a sortable metrics table and the
 * detail view (forecast chart + recommendations) for the selected entity.
 */
function AnalysisSection({ analysis, kindInfo, title, subtitle, getLabel }) {
  const entities = useMemo(() => analysis?.[kindInfo.entitiesKey] || [], [analysis, kindInfo]);
  const [selected, setSelected] = useState(0);
  const [sortKey, setSortKey] = useState("composite_potential_score");

  useEffect(() => setSelected(0), [analysis]);

  const sortedIdx = useMemo(
    () =>
      entities
        .map((_, i) => i)
        .sort((a, b) => {
          const va = entities[a].metrics?.[sortKey];
          const vb = entities[b].metrics?.[sortKey];
          if (va === null || va === undefined) return 1;
          if (vb === null || vb === undefined) return -1;
          return Number(vb) - Number(va);
        }),
    [entities, sortKey]
  );

  if (!analysis) return null;

  const status = String(analysis.status || "").toLowerCase();
  const summary = analysis.sector_summary || {};
  const meta = analysis.metadata || {};

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
                value={(analysis.jobs_retrieved ?? meta.total_records_retrieved ?? "—").toLocaleString?.() ?? "—"}
              />
              <StatTile label={`${kindInfo.plural} analysed`} value={summary.total_entities_analyzed ?? entities.length} />
              <StatTile label="High potential" value={summary.high_potential_count ?? "—"} color={TIERS.high.color} />
              <StatTile label="Medium potential" value={summary.medium_potential_count ?? "—"} color="#e0a800" />
              <StatTile label="Low potential" value={summary.low_potential_count ?? "—"} color={TIERS.low.color} />
              <StatTile
                label="Mean forecast CAGR"
                value={fmtPct(summary.sector_mean_forecast_cagr_pct, 1)}
                help={`Mean historical CAGR: ${fmtPct(summary.sector_mean_historical_cagr_pct, 1)}`}
              />
            </Row>

            <Row>
              <Col md="12" className="mb-3">
                <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
                  Potential score
                </h6>
                <PotentialChart entities={entities} getLabel={getLabel} onSelect={setSelected} />
                {meta.forecast_horizon_years && (
                  <p className="text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                    Forecast horizon: {meta.forecast_horizon_years} years · history window: {meta.historical_window_years} years
                    {meta.forecast_model ? ` · model: ${meta.forecast_model.replace(/_/g, " ")}` : ""}
                  </p>
                )}
              </Col>
              <Col md="12" className="mb-3">
                <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
                  Ranking — click a row for details
                </h6>
                <div style={{ maxHeight: 360, overflow: "scroll" }}>
                  <Table hover size="sm" className="mb-0" style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th>{kindInfo.singular}</th>
                        <th>Tier</th>
                        {TABLE_METRICS.map((m) => (
                          <th
                            key={m.key}
                            className="text-right"
                            title={`${m.help} Click to sort.`}
                            style={{ cursor: "pointer", whiteSpace: "nowrap", textDecoration: sortKey === m.key ? "underline" : "none" }}
                            onClick={() => setSortKey(m.key)}
                          >
                            {m.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedIdx.map((i) => {
                        const e = entities[i];
                        const tier = tierInfo(e.potential_tier);
                        return (
                          <tr
                            key={`${e.uri}-${i}`}
                            onClick={() => setSelected(i)}
                            style={{ cursor: "pointer", background: selected === i ? "rgba(81,203,206,0.12)" : undefined }}
                          >
                            <td title={e.uri}>{getLabel(e)}</td>
                            <td>
                              <Badge color={tier.badge} pill>
                                {tier.label}
                              </Badge>
                            </td>
                            {TABLE_METRICS.map((m) => (
                              <td key={m.key} className="text-right">
                                {m.fmt(e.metrics?.[m.key])}
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

            <EntityDetail entity={entities[selected]} label={getLabel(entities[selected] || {})} kindInfo={kindInfo} />
          </>
        )}
      </CardBody>
    </Card>
  );
}

export default AnalysisSection;
