import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_POLL_ATTEMPTS, POLL_INTERVAL_MS, fetchOrgNeedsAnalysis, pendingStatus } from "./futureNeedsUtils";

/**
 * Calls an organization-needs endpoint (e.g. "longtermanalysis/skills") and
 * keeps calling it while the backend is still working:
 *   1st call of a new analysis → { status: "started" }
 *   following calls            → { status: "in_progress" }
 *   when finished              → the analysis payload
 *
 * The first request is sent the first time `active` is true, so a tab that is
 * never opened never triggers a computation.
 *
 * Returns:
 *   phase         idle | loading | pending | done | error
 *   serverStatus  "started" | "in_progress" while pending
 *   data          last finished payload (kept while a refresh is running)
 *   message       backend / error message
 *   attempt       number of status checks so far
 *   waitingSince  timestamp (ms) when the current run started waiting
 *   nextCheckAt   timestamp (ms) of the next scheduled status check
 *   lastTopN      top_n of the last run (the one shown / being computed)
 *   run(topN)     start (or restart) a run — returns the stored result if there is one
 *   rerun()       compute the last analysis again (same organization and top_n)
 *   checkNow()    check the status immediately without restarting
 */
export default function useOrgNeedsAnalysis({ path, organization, topN, active, errorMessage }) {
  const [phase, setPhase] = useState("idle");
  const [serverStatus, setServerStatus] = useState(null);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [waitingSince, setWaitingSince] = useState(null);
  const [nextCheckAt, setNextCheckAt] = useState(null);
  const [lastTopN, setLastTopN] = useState(null);

  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const runIdRef = useRef(0);
  const startedRef = useRef(false);
  const pollRef = useRef(null); // current run's poll function
  const tryRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
  }, [clearTimer]);

  useEffect(() => stop, [stop]);

  const run = useCallback(
    (n, { rerun = false } = {}) => {
      if (!organization) return;
      setLastTopN(n);
      // send rerun=true only once (the first request of this run)
      let sendRerun = rerun;
      stop();
      const runId = ++runIdRef.current;
      setPhase("loading");
      setServerStatus(null);
      setMessage("");
      setAttempt(0);
      setWaitingSince(Date.now());
      setNextCheckAt(null);

      const schedule = (tryNo) => {
        tryRef.current = tryNo;
        setAttempt(tryNo);
        setNextCheckAt(Date.now() + POLL_INTERVAL_MS);
        timerRef.current = setTimeout(() => poll(tryNo + 1), POLL_INTERVAL_MS);
      };

      const poll = async (tryNo) => {
        clearTimer();
        setNextCheckAt(null);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const withRerun = sendRerun;
          sendRerun = false; // later polls just check the status
          const res = await fetchOrgNeedsAnalysis(path, n, controller.signal, withRerun);
          if (runId !== runIdRef.current) return;

          const pending = pendingStatus(res.data);
          if (pending) {
            setPhase("pending");
            // Keep showing "started" until the backend reports progress.
            setServerStatus((prev) => (pending === "in_progress" || !prev ? pending : prev));
            setMessage(res.data.message || "");
            if (tryNo >= MAX_POLL_ATTEMPTS) {
              setPhase("error");
              setMessage(
                "The analysis is taking longer than expected. It keeps running in the background — check again in a few minutes."
              );
              tryRef.current = tryNo;
              return;
            }
            schedule(tryNo);
            return;
          }

          const payload = res.data?.result && !res.data?.organization_analysis ? res.data.result : res.data;
          setData(payload);
          setServerStatus(null);
          setPhase("done");
        } catch (err) {
          if (runId !== runIdRef.current || err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
          console.error(`organization-needs ${path} failed:`, err);
          // A gateway timeout usually means the computation is still running.
          if (err.response && [502, 503, 504].includes(err.response.status) && tryNo < MAX_POLL_ATTEMPTS) {
            setPhase("pending");
            setServerStatus((prev) => prev || "in_progress");
            schedule(tryNo);
            return;
          }
          setPhase("error");
          setServerStatus(null);
          setMessage(err.response?.data?.detail || err.response?.data?.message || errorMessage || "Could not load the analysis.");
        }
      };

      pollRef.current = poll;
      poll(1);
    },
    [clearTimer, errorMessage, organization, path, stop]
  );

  const checkNow = useCallback(() => {
    if (!pollRef.current) return;
    stop();
    setPhase((p) => (p === "error" ? "pending" : p));
    // After giving up on automatic checks, a manual check starts a new round.
    pollRef.current(tryRef.current >= MAX_POLL_ATTEMPTS ? 1 : tryRef.current + 1);
  }, [stop]);

  useEffect(() => {
    if (active && organization && !startedRef.current) {
      startedRef.current = true;
      run(topN);
    }
  }, [active, organization, run, topN]);

  const rerun = useCallback(() => {
    if (lastTopN != null) run(lastTopN, { rerun: true });
  }, [lastTopN, run]);

  return { phase, serverStatus, data, message, attempt, waitingSince, nextCheckAt, lastTopN, run, rerun, checkNow };
}
