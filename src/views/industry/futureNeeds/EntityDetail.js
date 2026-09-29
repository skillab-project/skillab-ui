import React, { useMemo } from "react";
import { Row, Col, Card, CardHeader, CardBody, CardTitle, Badge } from "reactstrap";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  METRICS,
  buildSeries,
  dimensionInfo,
  fmtNum,
  normalizeRecommendations,
  tierInfo,
} from "./futureNeedsUtils";

const ACTUAL_COLOR = "#2d3e75";
const FORECAST_COLOR = "#ef8157";

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload || {};
  const isForecastOnly = row.actual === undefined;
  return (
    <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 4, padding: "8px 10px", fontSize: "0.8rem" }}>
      <strong>{label}</strong>
      {row.actual !== undefined && <div>Observed: {fmtNum(row.actual, 2)}</div>}
      {isForecastOnly && row.forecast !== undefined && (
        <>
          <div style={{ color: FORECAST_COLOR }}>Forecast: {fmtNum(row.forecast, 2)}</div>
          {row.ci80 && <div className="text-muted">80% CI: {fmtNum(row.ci80[0], 2)} – {fmtNum(row.ci80[1], 2)}</div>}
          {row.ci95 && <div className="text-muted">95% CI: {fmtNum(row.ci95[0], 2)} – {fmtNum(row.ci95[1], 2)}</div>}
        </>
      )}
    </div>
  );
}

export function ForecastChart({ timeSeries, height = 320 }) {
  const { rows, firstForecastQuarter } = useMemo(() => buildSeries(timeSeries), [timeSeries]);
  if (!rows.length) return <p className="text-muted mb-0">No time series available.</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 16, right: 24, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
        <XAxis dataKey="quarter" angle={-45} textAnchor="end" interval={0} height={50} tick={{ fontSize: 11 }} />
        <YAxis width={50} tick={{ fontSize: 11 }} allowDecimals />
        <Tooltip content={<ForecastTooltip />} />
        <Legend wrapperStyle={{ fontSize: "0.8rem" }} verticalAlign="top" height={28} />
        {firstForecastQuarter && (
          <ReferenceLine
            x={firstForecastQuarter}
            stroke="#bbb"
            strokeDasharray="4 4"
            label={{ value: "Forecast →", position: "insideTopLeft", fontSize: 11, fill: "#888" }}
          />
        )}
        <Area type="monotone" dataKey="ci95" name="95% confidence" stroke="none" fill={FORECAST_COLOR} fillOpacity={0.12} isAnimationActive={false} />
        <Area type="monotone" dataKey="ci80" name="80% confidence" stroke="none" fill={FORECAST_COLOR} fillOpacity={0.22} isAnimationActive={false} />
        <Line type="monotone" dataKey="actual" name="Observed job postings" stroke={ACTUAL_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
        <Line type="monotone" dataKey="forecast" name="Forecast" stroke={FORECAST_COLOR} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 2 }} connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function Recommendations({ recommendations, dimensions }) {
  const items = useMemo(() => normalizeRecommendations(recommendations, dimensions), [recommendations, dimensions]);
  if (!items.length) return <p className="text-muted mb-0">No recommendations were generated.</p>;

  return (
    <Row>
      {items.map((item, idx) => {
        const dim = dimensionInfo(item.dimension, dimensions);
        return (
          <Col lg={items.length >= 3 ? 4 : 12 / items.length} md="12" key={`${item.dimension}-${idx}`} className="mb-3">
            <div
              style={{
                height: "100%",
                borderLeft: `4px solid ${dim.color}`,
                background: "#fafafa",
                borderRadius: 4,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontWeight: 600, color: "#333", marginBottom: 6 }}>{dim.label}</div>
              <div style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>{item.text}</div>
              {item.notes.map((n, i) => (
                <div key={i} className="text-muted" style={{ fontSize: "0.8rem", marginTop: 6, fontStyle: "italic" }}>
                  {n}
                </div>
              ))}
            </div>
          </Col>
        );
      })}
    </Row>
  );
}

function EntityDetail({ entity, label, kindInfo }) {
  if (!entity) return null;
  const tier = tierInfo(entity.potential_tier);
  const metrics = entity.metrics || {};

  return (
    <Card className="mb-0" style={{ boxShadow: "none", border: "1px solid #eee" }}>
      <CardHeader>
        <CardTitle tag="h5" className="mb-1">
          {label}{" "}
          <Badge color={tier.badge} pill style={{ verticalAlign: "middle", fontSize: "0.7rem" }}>
            {tier.label} potential
          </Badge>
        </CardTitle>
        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
          {kindInfo.singular} demand over time, with the forecast for the coming quarters
          {entity.time_series?.forecast_method ? ` (${entity.time_series.forecast_method.replace(/_/g, " ")})` : ""}.
        </p>
      </CardHeader>
      <CardBody>
        <Row className="mb-2">
          {METRICS.map((m) => (
            <Col xs="6" md="3" key={m.key} className="mb-2" title={m.help}>
              <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "#2d3e75" }}>{m.fmt(metrics[m.key])}</div>
              <div className="text-muted" style={{ fontSize: "0.78rem" }}>{m.label}</div>
            </Col>
          ))}
        </Row>
        <ForecastChart timeSeries={entity.time_series} />
        <hr />
        <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
          Recommendations
        </h6>
        <Recommendations recommendations={entity.recommendations} />
      </CardBody>
    </Card>
  );
}

export default EntityDetail;
