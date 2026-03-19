import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { GitCommitVertical, BarChartHorizontal } from 'lucide-react';
import Heatmap from './Heatmap';
import {Button, Card, CardBody, Row, Col, Progress } from "reactstrap";
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';

const Form =({
    commits,
    setCommits,
    setProgress,
    setTotalFiles,
    loading,
    setLoading,
    setAnalysisResults,
    initialRepoUrl = "",
    setResultsOfAnalysis}) => {

    const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
    const [commitLimit, setCommitLimit] = useState("30");
    const [analysisStarted, setAnalysisStarted] = useState(false);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loadingHeatmap, setLoadingHeatmap] = useState(false);
    const [heatmapMessage, setHeatmapMessage] = useState("No data available");
    const [initialHeatmapHandler, setInitialHeatmapHandler] = useState(false);
    const [filteredHeatmapData, setFilteredHeatmapData] = useState([]);
    const [analysisProgress, setAnalysisProgress] = useState(0);

    const [minDate, setMinDate] = useState(null);
    const [maxDate, setMaxDate] = useState(null);
    const [totalMonths, setTotalMonths] = useState(0);
    const [selectedMonths, setSelectedMonths] = useState(1);

    const pollingIntervalRef = useRef(null);

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
          const timestamps = heatmapData.map(result => new Date(result.timestamp));
          const minDate = new Date(Math.min(...timestamps.map(d => d.getTime()))); 
          const maxDate = new Date(Math.max(...timestamps.map(d => d.getTime())));
  
          setMinDate(minDate);
          setMaxDate(maxDate);
  
          const monthsDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth());
          setTotalMonths(Math.max(1, monthsDiff +1 ) ); // Ensure at least 1 month
          setSelectedMonths(Math.max(1, monthsDiff + 1)); // Initialize to total months
      }
    }, [heatmapData]);


    useEffect(() => {
        setRepoUrl(initialRepoUrl);
    }, [initialRepoUrl]);

    useEffect(() => {
        if (repoUrl) {
            fetchHeatmapData(repoUrl);
            resumePollingIfNeeded(repoUrl);
        }
    }, [repoUrl]);

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);


    // Resume polling on page refresh if analysis was in progress
    const resumePollingIfNeeded = async (url) => {
        const repoName = getRepoNameFromUrl(url);
        try {
            const statusRes = await axios.get(
                `${process.env.REACT_APP_API_URL_KU}/analysis_status?repo_name=${repoName}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } }
            );

            const { status, progress } = statusRes.data;

            if (status === "in_progress" || (progress > 0 && progress < 100)) {
                setAnalysisStarted(true);
                setInitialHeatmapHandler(true);
                setResultsOfAnalysis(true);
                setAnalysisProgress(progress);
                startPolling(repoName);
            }
        } catch (error) {
            console.log("No ongoing analysis found for this repo.");
        }
    };

    const startPolling = (repoName) => {
        // Clear any existing interval first
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(async () => {
            try {
                // Poll status
                const statusRes = await axios.get(
                    `${process.env.REACT_APP_API_URL_KU}/analysis_status?repo_name=${repoName}`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } }
                );
                setAnalysisProgress(statusRes.data.progress);

                // Also fetch latest results from db to show incremental updates
                const resultsRes = await axios.get(
                    `${process.env.REACT_APP_API_URL_KU}/analyzedb?repo_name=${repoName}`,
                    { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } }
                );
                const latestResults = resultsRes.data || [];
                setAnalysisResults(latestResults);
                setHeatmapData(latestResults);
                setFilteredHeatmapData(latestResults);

                // Done
                if (statusRes.data.progress === 100) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                    setAnalysisStarted(false);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error polling analysis status:", error);
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
                setAnalysisStarted(false);
                setLoading(false);
            }
        }, 6000);
    };

    
    const fetchHeatmapData = async (repoURL) => {
        setLoadingHeatmap(true);
        setInitialHeatmapHandler(true);
        try {
          const response = await axios.get(process.env.REACT_APP_API_URL_KU+`/analyzedb?repo_name=${getRepoNameFromUrl(repoURL)}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
            },
          });
          const analysisResults = response.data || [];
          setLoadingHeatmap(false);
    
          if (analysisResults.length > 0) {
            setHeatmapData(analysisResults);
            setFilteredHeatmapData(analysisResults);
          } else {
            setHeatmapMessage("No analysis data found for this repository.");
            setHeatmapData([]);
            setFilteredHeatmapData([]);
          }
        } catch (error) {
          console.error("Error fetching analysis data:", error);
          setLoadingHeatmap(false);
          setHeatmapMessage("Failed to fetch analysis data.");
        }
    };

    function getRepoNameFromUrl(url) {
        const cleanedUrl = url.endsWith('.git') ? url.slice(0, -4) : url;
        const parts = cleanedUrl.split('/');
        return parts[parts.length - 1];
    }
    
    const handleFetchCommits = async () => {
        setLoading(true);
        setCommits([]);
        setAnalysisResults([]);
        setProgress(0);
        setResultsOfAnalysis(true);
    
        try {
            const limit = commitLimit ? parseInt(commitLimit) : null;
            const response = await axios.post(process.env.REACT_APP_API_URL_KU+"/commits", {
                repo_url: repoUrl,
                limit: limit,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                },
            });
    
            const fileChanges = response.data;
            const commits = [];
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
    
            for (const sha in grouped) {
                commits.push(grouped[sha]);
            }
    
            setCommits(commits);
            const totalFiles = fileChanges.length;
            setTotalFiles(totalFiles);
        }
        catch (error) {
            console.error("Error fetching commits:", error);
        }
        finally {
            setLoading(false);
        }
    };
    
    
    const handleExtractSkills = async () => {
        setInitialHeatmapHandler(true);
        setAnalysisStarted(true);
        setAnalysisProgress(0);
        setAnalysisResults(heatmapData);
        setResultsOfAnalysis(true);

        const repoName = getRepoNameFromUrl(repoUrl);

        // Start background analysis
        await axios.get(
            `${process.env.REACT_APP_API_URL_KU}/analyze?repo_url=${encodeURIComponent(repoUrl)}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}` } }
        );

        startPolling(repoName);
    };

    
    const handleAnalysis = async () => {
        await handleFetchCommits();
        handleExtractSkills();
    };



    return (
        <div className="flex flex-col gap-4 items-start">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 w-full">
                <div>
                    <label htmlFor="commitLimit" className="block text-gray-700 mb-2">
                        Commit Limit (leave empty to scan all commits)
                    </label>
                    <input
                        type="number"
                        id="commitLimit"
                        value={commitLimit}
                        onChange={(e) => setCommitLimit(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="1"
                    />
                </div>
                {loading ? (
                    <Button color='info' active="false">
                        Loading
                    </Button>
                    ) : (
                    <div className="flex space-x-4">
                        <Button
                            color='info'
                            onClick={handleAnalysis}
                            disabled={!repoUrl || analysisStarted}
                        >
                            <GitCommitVertical className="mr-2 h-4 w-4" />
                            Start Analysis
                        </Button>
                    </div> 
                    )
                }
            </form>

            {/* Progress Bar in case of new analysis */}
            {analysisStarted &&
                <Progress style={{marginBottom:"25px"}} value={analysisProgress}>
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
                                    <Col xs="4" style={{textAlign:"left"}}><strong>Newest Date:</strong></Col>
                                    <Col xs="4" ><strong>{selectedMonths} Month(s)</strong></Col>
                                    <Col xs="4" style={{textAlign:"right"}}><strong>Oldest Date:</strong></Col>
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
                                    <Col style={{textAlign:"left"}} className="text-start">{minDate?.toDateString()}</Col>
                                    <Col style={{textAlign:"right"}} className="text-end">{maxDate?.toDateString()}</Col>
                                </Row>
                            </div>

                            <Heatmap analysisResults={filteredHeatmapData} />
                        </>
                    ) : (
                        <p>{heatmapMessage}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Form;