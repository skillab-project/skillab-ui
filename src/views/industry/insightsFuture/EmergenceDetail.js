import React from "react";
import { Row, Col, Card, CardHeader, CardBody, CardTitle, Badge } from "reactstrap";
import { Recommendations } from "../futureNeeds/EntityDetail";
import { fmtNum } from "../futureNeeds/futureNeedsUtils";
import { CATEGORIES, LONG_TERM_DIMENSIONS, METRIC_HELP, SIGNAL_LABELS, categoryInfo } from "./insightsFutureUtils";

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

function MeterRow({ label, value, max = 1, color, help, valueText }) {
  const pct = clamp01((Number(value) || 0) / max) * 100;
  return (
    <div className="mb-2" title={help}>
      <div className="d-flex justify-content-between" style={{ fontSize: "0.82rem" }}>
        <span>{label}</span>
        <strong>{valueText ?? fmtNum(value, 2)}</strong>
      </div>
      <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// Horizontal timeline from "now" to the forecast horizon, showing the
// confidence interval as a band and the point estimate as a marker.
export function TimeToEmergenceBar({ tte, horizon = 5, color }) {
  if (!tte || tte.point_estimate_years === undefined || tte.point_estimate_years === null) {
    return <p className="text-muted mb-0">No time-to-emergence estimate.</p>;
  }
  const max = Math.max(horizon, Number(tte.ci_upper_years) || 0, Number(tte.point_estimate_years) || 0) || 5;
  const pos = (v) => `${clamp01((Number(v) || 0) / max) * 100}%`;
  const lo = tte.ci_lower_years ?? tte.point_estimate_years;
  const hi = tte.ci_upper_years ?? tte.point_estimate_years;
  const ticks = Array.from({ length: Math.floor(max) + 1 }, (_, i) => i);

  return (
    <div title={METRIC_HELP.time_to_emergence}>
      <div style={{ position: "relative", height: 26, margin: "8px 6px 4px" }}>
        <div style={{ position: "absolute", top: 11, left: 0, right: 0, height: 4, background: "#eee", borderRadius: 2 }} />
        <div
          style={{
            position: "absolute",
            top: 7,
            left: pos(lo),
            width: `calc(${pos(hi)} - ${pos(lo)})`,
            height: 12,
            background: color,
            opacity: 0.35,
            borderRadius: 6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 3,
            left: `calc(${pos(tte.point_estimate_years)} - 10px)`,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: color,
            border: "3px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
          }}
        />
      </div>
      <div style={{ position: "relative", height: 16, margin: "0 6px", fontSize: "0.7rem", color: "#999" }}>
        {ticks.map((t) => (
          <span key={t} style={{ position: "absolute", left: pos(t), transform: "translateX(-50%)" }}>
            {t === 0 ? "now" : `${t}y`}
          </span>
        ))}
      </div>
      <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 6 }}>
        Expected in <strong style={{ color: "#333" }}>{fmtNum(tte.point_estimate_years, 2)} years</strong> (range{" "}
        {fmtNum(lo, 2)}–{fmtNum(hi, 2)} years)
      </div>
    </div>
  );
}

function Tile({ label, value, help }) {
  return (
    <Col xs="6" md="3" className="mb-2" title={help}>
      <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "#2d3e75" }}>{value}</div>
      <div className="text-muted" style={{ fontSize: "0.78rem" }}>{label}</div>
    </Col>
  );
}

function EmergenceDetail({ entity, label, kindInfo, horizon }) {
  if (!entity) return null;
  const cat = categoryInfo(entity.dominant_category);
  const tte = entity.time_to_emergence || {};
  const memberships = entity.fuzzy_memberships || {};
  const signals = entity.irt_signals || {};
  const mentions = entity.total_job_mentions ?? null;
  const nSkills = entity.n_associated_skills ?? null;

  return (
    <Card className="mb-0" style={{ boxShadow: "none", border: "1px solid #eee" }}>
      <CardHeader>
        <CardTitle tag="h5" className="mb-1">
          {label}{" "}
          <Badge color={cat.badge} pill style={{ verticalAlign: "middle", fontSize: "0.7rem" }} title={cat.help}>
            {cat.label}
          </Badge>
        </CardTitle>
        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
          {cat.help || `Long-term emergence profile of this ${kindInfo.singular.toLowerCase()}.`}
        </p>
      </CardHeader>
      <CardBody>
        <Row className="mb-2">
          <Tile label="Emergence Quotient" value={fmtNum(entity.emergence_quotient, 0)} help={METRIC_HELP.emergence_quotient} />
          <Tile label="Theta (maturity)" value={fmtNum(entity.theta, 3)} help={METRIC_HELP.theta} />
          <Tile label="Confidence" value={fmtNum(entity.confidence, 2)} help={METRIC_HELP.confidence} />
          {nSkills !== null ? (
            <Tile label="Associated skills" value={nSkills} />
          ) : (
            <Tile label="Job mentions" value={mentions !== null ? Number(mentions).toLocaleString() : "—"} />
          )}
        </Row>

        <Row>
          <Col lg="4" className="mb-3">
            <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
              Time to emergence
            </h6>
            <TimeToEmergenceBar tte={tte} horizon={horizon} color={cat.color} />
          </Col>
          <Col lg="4" md="6" className="mb-3">
            <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
              Category membership
            </h6>
            {CATEGORIES.map((c) => (
              <MeterRow key={c.key} label={c.label} value={memberships[c.key]} color={c.color} help={c.help} />
            ))}
          </Col>
          <Col lg="4" md="6" className="mb-3">
            <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
              Job market signals
            </h6>
            {Object.entries(signals).map(([key, s]) => (
              <MeterRow
                key={key}
                label={SIGNAL_LABELS[key] || key.replace(/_/g, " ")}
                value={s?.value}
                color="#51cbce"
                help={s?.description}
              />
            ))}
            {Object.keys(signals).length === 0 && <p className="text-muted mb-0">No signals.</p>}
          </Col>
        </Row>

        <hr />
        <h6 className="text-uppercase text-muted" style={{ fontSize: "0.75rem" }}>
          Recommendations
        </h6>
        <Recommendations recommendations={entity.recommendations} dimensions={LONG_TERM_DIMENSIONS} />
      </CardBody>
    </Card>
  );
}

export default EmergenceDetail;
