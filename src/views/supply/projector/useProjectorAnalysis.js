import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL, FORM_HEADERS } from "./projectorShared";

// Projector analyses run in the background. The hook supports both backend contracts:
//
// A) Task contract (current Projector): POST returns 202 { task_id, status: "queued", status_url }.
//    The hook then polls GET /tasks/{task_id} until status is "completed" (payload in `result`)
//    or "failed". The task id is remembered per endpoint + parameters, so pressing Apply again
//    with the same filters (or coming back to the page) resumes it instead of starting a new task.
//
// B) Keyed contract (organization-needs style): calling the same endpoint with the same
//    parameters answers 202 { status: "started" | "in_progress" } and finally 200 <payload>
//    (or 200 { status: "failed" }).
export const POLL_INTERVAL_MS = 5000;
export const MAX_POLL_ATTEMPTS = 360; // ~30 minutes

const TASK_STORAGE_PREFIX = "projectorTask:";
const TASK_STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const pendingStatus = (data) => {
  const st = String(data?.status || "").toLowerCase();
  return st === "started" || st === "in_progress" ? st : null;
};

const errorText = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (detail?.error?.message) return detail.error.message;
  if (typeof detail === "string") return detail;
  return fallback;
};

// --- remembered task ids (per endpoint + parameters); storage may be unavailable ---
const storageKey = (path, params) => {
  const sorted = Object.keys(params).sort().map((k) => [k, params[k]]);
  return `${TASK_STORAGE_PREFIX}${path}:${JSON.stringify(sorted)}`;
};

const loadTaskId = (key) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved?.taskId && Date.now() - saved.savedAt < TASK_STORAGE_MAX_AGE_MS) return saved.taskId;
    localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
  return null;
};

const saveTaskId = (key, taskId) => {
  try {
    localStorage.setItem(key, JSON.stringify({ taskId, savedAt: Date.now() }));
  } catch (e) {
    /* ignore */
  }
};

const forgetTaskId = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
};

/**
 * Starts a Projector analysis and keeps checking it until the result is ready.
 *
 * Returns:
 *   phase         idle | loading | pending | done | error
 *   serverStatus  "started" | "in_progress" while pending
 *   data          last finished payload (kept while a new run is pending)
 *   message       backend / error message
 *   waitingSince  timestamp (ms) when the current run started waiting
 *   nextCheckAt   timestamp (ms) of the next scheduled status check
 *   run(params)   start an analysis (resumes a running/finished task for the same params)
 *   rerun()       compute the last analysis again
 *   checkNow()    check the status immediately
 */
export default function useProjectorAnalysis(path, errorMessage) {
  const [phase, setPhase] = useState("idle");
  const [serverStatus, setServerStatus] = useState(null);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [waitingSince, setWaitingSince] = useState(null);
  const [nextCheckAt, setNextCheckAt] = useState(null);

  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const runIdRef = useRef(0);
  const pollRef = useRef(null);
  const tryRef = useRef(0);
  const lastParamsRef = useRef(null);

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
    (params, { rerun = false } = {}) => {
      lastParamsRef.current = params;
      const key = storageKey(path, params);
      if (rerun) forgetTaskId(key);
      let taskId = rerun ? null : loadTaskId(key);
      let sendRerun = rerun; // keyed contract: only on the first request of this run
      stop();
      const runId = ++runIdRef.current;
      setPhase("loading");
      setServerStatus(null);
      setMessage("");
      setWaitingSince(Date.now());
      setNextCheckAt(null);

      const schedule = (tryNo) => {
        tryRef.current = tryNo;
        if (tryNo >= MAX_POLL_ATTEMPTS) {
          setPhase("error");
          setNextCheckAt(null);
          setMessage(
            "The analysis is taking longer than expected. It keeps running in the background — apply the same filters again in a few minutes."
          );
          return;
        }
        setNextCheckAt(Date.now() + POLL_INTERVAL_MS);
        timerRef.current = setTimeout(() => poll(tryNo + 1), POLL_INTERVAL_MS);
      };

      const setPending = (status, msg) => {
        setPhase("pending");
        // keep "started" until the backend reports progress
        setServerStatus((prev) => (status === "in_progress" || !prev ? status : prev));
        setMessage(msg || "");
      };

      const finish = (payload) => {
        setData(payload);
        setServerStatus(null);
        setPhase("done");
      };

      const fail = (msg) => {
        setPhase("error");
        setServerStatus(null);
        setMessage(`${msg || "The analysis failed."} Press Apply to try again.`);
      };

      // A) task contract: read GET /tasks/{id}
      const checkTask = async (tryNo, signal) => {
        let res;
        try {
          res = await axios.get(`${API_BASE_URL}/tasks/${encodeURIComponent(taskId)}`, { signal });
        } catch (err) {
          if (err?.response?.status === 404) {
            // task lost (service restarted or record pruned): submit it again
            forgetTaskId(key);
            taskId = null;
            return submit(tryNo, signal);
          }
          throw err;
        }
        if (runId !== runIdRef.current) return;
        const task = res.data || {};
        if (task.status === "completed") {
          forgetTaskId(key);
          finish(task.result);
        } else if (task.status === "failed") {
          forgetTaskId(key);
          fail(task.error?.message);
        } else {
          setPending(task.status === "running" ? "in_progress" : "started",
            task.status === "running" ? "Analysis is being computed" : "");
          schedule(tryNo);
        }
      };

      // POST the form (starts a task, or polls the keyed contract)
      const submit = async (tryNo, signal) => {
        const body = new URLSearchParams(params);
        if (sendRerun) body.append("rerun", "true");
        sendRerun = false;
        const res = await axios.post(`${API_BASE_URL}/${path}`, body, { headers: FORM_HEADERS, signal });
        if (runId !== runIdRef.current) return;

        if (res.data?.task_id) {
          taskId = res.data.task_id;
          saveTaskId(key, taskId);
          setPending("started");
          schedule(tryNo);
          return;
        }
        const pending = pendingStatus(res.data);
        if (pending) {
          setPending(pending, res.data.message);
          schedule(tryNo);
          return;
        }
        if (String(res.data?.status || "").toLowerCase() === "failed") {
          fail(res.data.message);
          return;
        }
        finish(res.data);
      };

      const poll = async (tryNo) => {
        clearTimer();
        setNextCheckAt(null);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          if (taskId) await checkTask(tryNo, controller.signal);
          else await submit(tryNo, controller.signal);
        } catch (err) {
          if (runId !== runIdRef.current || err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
          console.error(`projector ${path} failed:`, err);
          // Gateway timeout / queue full: the server is busy, keep checking.
          if (err.response && [502, 503, 504].includes(err.response.status) && tryNo < MAX_POLL_ATTEMPTS) {
            setPending("in_progress");
            schedule(tryNo);
            return;
          }
          setPhase("error");
          setServerStatus(null);
          setMessage(errorText(err, errorMessage || "Could not load the analysis."));
        }
      };

      pollRef.current = poll;
      poll(1);
    },
    [clearTimer, errorMessage, path, stop]
  );

  const rerun = useCallback(() => {
    if (lastParamsRef.current) run(lastParamsRef.current, { rerun: true });
  }, [run]);

  const checkNow = useCallback(() => {
    if (!pollRef.current) return;
    stop();
    pollRef.current(tryRef.current >= MAX_POLL_ATTEMPTS ? 1 : tryRef.current + 1);
  }, [stop]);

  return { phase, serverStatus, data, message, waitingSince, nextCheckAt, run, rerun, checkNow };
}
