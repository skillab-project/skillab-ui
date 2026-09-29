import React, { useEffect, useState } from "react";
import { Button } from "reactstrap";
import "../../../assets/css/loader.css";

const TAKING_LONG_MS = 30000;

/**
 * Waiting state for an organization-needs analysis, styled like the other
 * analysis views in the app (HCV, Co-occurrence, Taxonomy Forecasting…):
 * the dual-ring loader, the backend's status message in `text-info`, and
 * "The analysis might take some time..." once the wait gets long.
 *
 * While the backend reports "started"/"in_progress" the hook keeps calling
 * the endpoint in the background; "Check now" triggers a check immediately.
 */
function AnalysisProgress({ phase, serverStatus, message, waitingSince, nextCheckAt, onCheckNow, hasPreviousResult }) {
  const [now, setNow] = useState(Date.now());
  const visible = phase === "loading" || phase === "pending";

  useEffect(() => {
    if (!visible) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const started = serverStatus === "started";
  const takingLong = serverStatus || now - (waitingSince || now) >= TAKING_LONG_MS;
  const secondsToNext = nextCheckAt ? Math.max(0, Math.ceil((nextCheckAt - now) / 1000)) : null;

  const infoMessage = started
    ? "The analysis has started in the background."
    : serverStatus
    ? message || "Analysis is being computed"
    : null;

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div className="lds-dual-ring"></div>
      {infoMessage && <h6 className="text-info" style={{ marginTop: "10px" }}>{infoMessage}</h6>}
      {takingLong && (
        <p style={{ marginTop: "10px", color: "#666", fontWeight: "bold" }}>
          The analysis might take some time...
        </p>
      )}
      {serverStatus && (
        <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
          The results will appear here automatically
          {hasPreviousResult ? " and replace the ones below" : ""}
          {secondsToNext !== null ? ` · next check in ${secondsToNext}s` : " · checking…"}
          {" · "}
          <Button color="link" size="sm" className="p-0 align-baseline" onClick={onCheckNow} disabled={secondsToNext === null}>
            Check now
          </Button>
        </p>
      )}
    </div>
  );
}

export default AnalysisProgress;
