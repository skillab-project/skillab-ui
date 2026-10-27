import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { GitCommitVertical } from 'lucide-react';
import Heatmap from './Heatmap';
import { Alert, Button, Row, Col, Progress } from "reactstrap";
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';
import {
    KU_SOURCES,
    normalizeResults,
    getErrorMessage,
    rememberRunningSource,
    getRunningSource,
    clearRunningSource,
} from './kuSources';

const API = () => process.env.REACT_APP_API_URL_KU;
const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` },
});

function getRepoNameFromUrl(url) {
    if (!url) return "";
    const cleanedUrl = url.endsWith('.git') ? url.slice(0, -4) : url;
    const parts = cleanedUrl.split('/');
    return parts[parts.length - 1];
}

const isRunningStatus = (statusData) => {
    const status = statusData?.status;
    const progress = Number(statusData?.progress) || 0;
    if (status === "error" || status === "completed" || status === "not_started") return false;
    return status === "in-progress" || status === "in_progress" || (progress > 0 && progress < 100);
};

/**
 * One KU analysis panel (start analysis + progress + heatmap) for a given detector.
 *
 * source:          "java" (legacy K1–K28) or "eclipse" (detector17)
 * activeAnalysis:  source key currently running on this page (shared between cards), or null
 * setActiveAnalysis: setter for activeAnalysis
 * The commit-related props are only used by the Java detector.
 */
const Form = ({
    source = "java",
    activeAnalysis = null,
    setActiveAnalysis = () => {},
    commits,
    setCommits = () => {},
    setProgress = () => {},
    setTotalFiles = () => {},
    loading = false,
    setLoading = () => {},
    setAnalysisResults = () => {},
    initialRepoUrl = "",
    setResultsOfAnalysis = () => {},
}) => {
    const config = KU_SOURCES[source] || KU_SOURCES.java;

    const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
    const [commitLimit, setCommitLimit] = useState(config.commitLimit?.default ?? "30");
    const [analysisStarted, setAnalysisStarted] = useState(false);
    const [starting, setStarting] = useState(false);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loadingHeatmap, setLoadingHeatmap] = useState(false);
    const [heatmapMessage, setHeatmapMessage] = useState("No data available");
    const [initialHeatmapHandler, setInitialHeatmapHandler] = useState(false);
    const [filteredHeatmapData, setFilteredHeatmapData] = useState([]);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

    const [minDate, setMinDate] = useState(null);
    const [maxDate, setMaxDate] = useState(null);
    const [totalMonths, setTotalMonths] = useState(0);
    const [selectedMonths, setSelectedMonths] = useState(1);

    const pollingIntervalRef = useRef(null);
    const currentRepoRef = useRef("");

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const finishAnalysis = (repoName) => {
        stopPolling();
        setAnalysisStarted(false);
        setStarting(false);
        if (config.usesCommits) setLoading(false);
        setActiveAnalysis((current) => (current === config.key ? null : current));
        if (repoName) clearRunningSource(repoName);
    };

    const applyResults = (results) => {
        setHeatmapData(results);
        setFilteredHeatmapData(results);
        if (results.length === 0) {
            setHeatmapMessage(`No ${config.title} found for this repository yet. Click "Start Analysis" to analyze it.`);
        }
    };

    const handleSliderChange = (value) => {
        setSelectedMonths(value);

        const endDate = new Date(maxDate);
        const startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - (value - 1));

        const filteredResults = heatmapData.filter(result => {
            const resultDate = new Date(result.timestamp);
            return resultDate >= startDate && resultDate <= endDate;
        });

        setFilteredHeatmapData(filteredResults);
    };

    useEffect(() => {
        if (heatmapData.length > 0) {
            const timestamps = heatmapData
                .map(result => new Date(result.timestamp).getTime())
                .filter(t => !Number.isNaN(t));
            if (timestamps.length === 0) return;
            const min = new Date(Math.min(...timestamps));
            const max = new Date(Math.max(...timestamps));

            setMinDate(min);
            setMaxDate(max);

            const monthsDiff = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth());
            setTotalMonths(Math.max(1, monthsDiff + 1)); // Ensure at least 1 month
            setSelectedMonths(Math.max(1, monthsDiff + 1)); // Initialize to total months
        }
    }, [heatmapData]);

    useEffect(() => {
        setRepoUrl(initialRepoUrl);
    }, [initialRepoUrl]);

    useEffect(() => {
        // Switching repository: stop anything that belonged to the previous one
        stopPolling();
        setAnalysisStarted(false);
        setStarting(false);
        setErrorMessage("");
        setInfoMessage("");
        setAnalysisProgress(0);
        currentRepoRef.current = getRepoNameFromUrl(repoUrl);

        if (repoUrl) {
            fetchHeatmapData(repoUrl);
            resumePollingIfNeeded(repoUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoUrl]);

    useEffect(() => {
        return () => stopPolling();
    }, []);

    // Resume polling on page refresh if an analysis started by THIS detector was in progress
    const resumePollingIfNeeded = async (url) => {
        const repoName = getRepoNameFromUrl(url);
        try {
            const statusRes = await axios.get(
                `${API()}/analysis_status?repo_name=${encodeURIComponent(repoName)}`,
                authHeaders()
            );
            if (currentRepoRef.current !== repoName) return;

            if (!isRunningStatus(statusRes.data)) {
                if (getRunningSource(repoName) === config.key) clearRunningSource(repoName);
                return;
            }

            // Status is shared between detectors; legacy runs (no marker) belong to the Java card
            const runningSource = getRunningSource(repoName) || "java";
            setActiveAnalysis(runningSource);
            if (runningSource !== config.key) return;

            setAnalysisStarted(true);
            setInitialHeatmapHandler(true);
            if (config.usesCommits) setResultsOfAnalysis(true);
            setAnalysisProgress(Number(statusRes.data.progress) || 0);
            startPolling(repoName);
        } catch (error) {
            console.log("No ongoing analysis found for this repo.");
        }
    };

    const startPolling = (repoName) => {
        stopPolling();

        pollingIntervalRef.current = setInterval(async () => {
            if (currentRepoRef.current !== repoName) {
                stopPolling();
                return;
            }
            try {
                const statusRes = await axios.get(
                    `${API()}/analysis_status?repo_name=${encodeURIComponent(repoName)}`,
                    authHeaders()
                );
                const { status, progress, error_message } = statusRes.data || {};
                setAnalysisProgress(Number(progress) || 0);

                // Fetch latest results to show incremental updates
                const resultsRes = await axios.get(`${API()}${config.resultsPath(repoName)}`, authHeaders());
                const latestResults = normalizeResults(resultsRes.data);
                if (config.usesCommits) setAnalysisResults(latestResults);
                applyResults(latestResults);

                if (status === "error") {
                    setErrorMessage(error_message || "The analysis failed on the server.");
                    finishAnalysis(repoName);
                } else if (Number(progress) >= 100 || status === "completed") {
                    finishAnalysis(repoName);
                }
            } catch (error) {
                console.error("Error polling analysis status:", error);
                setErrorMessage(getErrorMessage(error, "Lost connection while tracking the analysis progress."));
                finishAnalysis(repoName);
            }
        }, 6000);
    };

    const fetchHeatmapData = async (repoURL) => {
        const repoName = getRepoNameFromUrl(repoURL);
        setLoadingHeatmap(true);
        setInitialHeatmapHandler(true);
        try {
            const response = await axios.get(`${API()}${config.resultsPath(repoName)}`, authHeaders());
            if (currentRepoRef.current !== repoName) return;
            const analysisResults = normalizeResults(response.data);
            applyResults(analysisResults);
        } catch (error) {
            if (currentRepoRef.current !== repoName) return;
            console.error("Error fetching analysis data:", error);
            setHeatmapData([]);
            setFilteredHeatmapData([]);
            const status = error?.response?.status;
            setHeatmapMessage(
                status === 400 || status === 404
                    ? `This repository has not been analyzed for ${config.title} yet.`
                    : getErrorMessage(error, "Failed to fetch analysis data.")
            );
        } finally {
            if (currentRepoRef.current === repoName) setLoadingHeatmap(false);
        }
    };

    // ── Java (legacy) flow: store commits, then analyze them ───────────────
    // Returns the number of file changes stored, or -1 on failure.
    const handleFetchCommits = async () => {
        setLoading(true);
        setCommits([]);
        setAnalysisResults([]);
        setProgress(0);
        setResultsOfAnalysis(true);

        try {
            const limit = commitLimit ? parseInt(commitLimit, 10) : null;
            const response = await axios.post(`${API()}/commits`, {
                repo_url: repoUrl,
                limit: limit,
            }, authHeaders());

            const fileChanges = Array.isArray(response.data) ? response.data : [];
            const grouped = fileChanges.reduce((acc, fileChange) => {
                if (!acc[fileChange.sha]) {
                    acc[fileChange.sha] = {
                        sha: fileChange.sha,
                        author: fileChange.author,
                        timestamp: fileChange.timestamp,
                        file_changes: [],
                    };
                }
                acc[fileChange.sha].file_changes.push(fileChange);
                return acc;
            }, {});

            setCommits(Object.values(grouped));
            setTotalFiles(fileChanges.length);
            return fileChanges.length;
        } catch (error) {
            console.error("Error fetching commits:", error);
            setErrorMessage(getErrorMessage(error, "Failed to fetch the repository commits."));
            return -1;
        } finally {
            setLoading(false);
        }
    };

    const startJavaAnalysis = async (repoName) => {
        const fileCount = await handleFetchCommits();
        if (fileCount < 0) return false;
        // /analyze answers 400 "No commits found" in this case, so don't call it at all
        if (fileCount === 0) {
            setInfoMessage("No Java file changes were found in the selected commits, so there is nothing to analyze. Try a larger commit limit or leave it empty to scan all commits.");
            return false;
        }

        await axios.get(`${API()}/analyze?repo_url=${encodeURIComponent(repoUrl)}`, authHeaders());
        return true;
    };

    // ── Eclipse (detector17) flow: one call, backend clones and walks git log ──
    const startEclipseAnalysis = async (repoName) => {
        const body = {};
        if (String(commitLimit).trim() !== "") {
            const limit = parseInt(commitLimit, 10);
            const { min = 1, max } = config.commitLimit || {};
            if (Number.isNaN(limit) || limit < min || (max && limit > max)) {
                setInfoMessage(max
                    ? `Commit limit must be a whole number between ${min} and ${max}.`
                    : `Commit limit must be a whole number of at least ${min}, or leave it empty to scan all commits.`);
                return false;
            }
            body.commit_limit = limit;
        }
        await axios.post(`${API()}${config.startPath(repoName)}`, body, authHeaders());
        return true;
    };

    const handleAnalysis = async () => {
        const repoName = getRepoNameFromUrl(repoUrl);
        setErrorMessage("");
        setInfoMessage("");
        setStarting(true);
        setActiveAnalysis(config.key);

        try {
            const started = config.usesCommits
                ? await startJavaAnalysis(repoName)
                : await startEclipseAnalysis(repoName);

            if (!started) {
                finishAnalysis();
                return;
            }

            rememberRunningSource(repoName, config.key);
            setInitialHeatmapHandler(true);
            setAnalysisStarted(true);
            setAnalysisProgress(0);
            if (config.usesCommits) {
                setAnalysisResults(heatmapData);
                setResultsOfAnalysis(true);
            }
            setStarting(false);
            startPolling(repoName);
        } catch (error) {
            console.error(`Error starting ${config.title} analysis:`, error);
            const status = error?.response?.status;
            if (status === 409) {
                setInfoMessage("An analysis is already running for this repository. Please wait for it to finish and try again.");
            } else if (getErrorMessage(error, "") === "No commits found for the repository") {
                setInfoMessage("No commits with Java files were found for this repository, so there is nothing to analyze.");
            } else {
                setErrorMessage(getErrorMessage(error, "Failed to start the analysis."));
            }
            finishAnalysis();
        }
    };

    const otherAnalysisRunning = activeAnalysis && activeAnalysis !== config.key;
    const busy = starting || analysisStarted || (config.usesCommits && loading);

    return (
        <div className="flex flex-col gap-4 items-start">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 w-full">
                {(() => {
                    const { min = 1, max } = config.commitLimit || {};
                    return (
                    <div>
                        <label htmlFor={`commitLimit-${config.key}`} className="block text-gray-700 mb-2">
                            {max
                                ? `Commit Limit (${min}–${max}, leave empty for the server default)`
                                : "Commit Limit (leave empty to scan all commits)"}
                        </label>
                        <input
                            type="number"
                            id={`commitLimit-${config.key}`}
                            value={commitLimit}
                            onChange={(e) => setCommitLimit(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            min={min}
                            max={max || undefined}
                        />
                    </div>
                    );
                })()}
                {busy && !analysisStarted ? (
                    <Button color='info' disabled>
                        Loading
                    </Button>
                ) : (
                    <div className="flex space-x-4">
                        <Button
                            color='info'
                            onClick={handleAnalysis}
                            disabled={!repoUrl || busy || otherAnalysisRunning}
                        >
                            <GitCommitVertical className="mr-2 h-4 w-4" />
                            Start Analysis
                        </Button>
                    </div>
                )}
                {otherAnalysisRunning && !analysisStarted && (
                    <small className="text-muted d-block mt-2">
                        Another KU analysis is running for this repository. You can start this one when it finishes.
                    </small>
                )}
            </form>

            {errorMessage && (
                <Alert color="danger" className="mt-3" toggle={() => setErrorMessage("")}>
                    {errorMessage}
                </Alert>
            )}
            {infoMessage && (
                <Alert color="warning" className="mt-3" toggle={() => setInfoMessage("")}>
                    {infoMessage}
                </Alert>
            )}

            {/* Progress Bar in case of new analysis */}
            {analysisStarted &&
                <Progress style={{ marginBottom: "25px", marginTop: "15px" }} value={analysisProgress}>
                    {analysisProgress}%
                </Progress>
            }

            {/* Heatmap section */}
            {initialHeatmapHandler && (
                <div className="mt-8 w-full">
                    {loadingHeatmap ? (
                        <p>Loading analysis data...</p>
                    ) : filteredHeatmapData.length > 0 ? (
                        <>
                            <div style={{ padding: '1rem' }}>
                                <Row>
                                    <Col xs="4" style={{ textAlign: "left" }}><strong>Newest Date:</strong></Col>
                                    <Col xs="4" ><strong>{selectedMonths} Month(s)</strong></Col>
                                    <Col xs="4" style={{ textAlign: "right" }}><strong>Oldest Date:</strong></Col>
                                </Row>

                                <Slider
                                    min={1}
                                    max={totalMonths}
                                    step={1}
                                    value={selectedMonths}
                                    onChange={handleSliderChange}
                                    trackStyle={{ backgroundColor: '#007bff', height: 6 }}
                                    handleStyle={{
                                        borderColor: '#007bff',
                                        height: 20,
                                        width: 20,
                                        marginTop: -7,
                                        backgroundColor: 'white',
                                    }}
                                    railStyle={{ backgroundColor: '#e9ecef', height: 6 }}
                                />

                                <Row>
                                    <Col style={{ textAlign: "left" }} className="text-start">{minDate?.toDateString()}</Col>
                                    <Col style={{ textAlign: "right" }} className="text-end">{maxDate?.toDateString()}</Col>
                                </Row>
                            </div>

                            <Heatmap
                                analysisResults={filteredHeatmapData}
                                kuNames={config.kuNames}
                                kuDescriptions={config.kuDescriptions}
                                normalizeKu={config.normalizeKu}
                                kuOrder={config.kuOrder}
                            />
                        </>
                    ) : heatmapData.length > 0 ? (
                        <p>No results in the selected time range.</p>
                    ) : (
                        <p>{heatmapMessage}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Form;
