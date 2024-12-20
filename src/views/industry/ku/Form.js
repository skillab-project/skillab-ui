import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "reactstrap";
import { GitCommitVertical, BarChartHorizontal } from 'lucide-react';
import Heatmap from './Heatmap';

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


    useEffect(() => {
        setRepoUrl(initialRepoUrl);
    }, [initialRepoUrl]);

    useEffect(() => {
        if (repoUrl) {
          fetchHeatmapData(repoUrl);
        }
    }, [repoUrl]);
    
    const fetchHeatmapData = async (repoURL) => {
        setLoadingHeatmap(true);
        setInitialHeatmapHandler(true);
        try {
          const response = await axios.get(process.env.REACT_APP_API_URL_KU+`/analyzedb?repo_name=${getRepoNameFromUrl(repoURL)}`);
          const analysisResults = response.data || [];
          setLoadingHeatmap(false);
    
          if (analysisResults.length > 0) {
            setHeatmapData(analysisResults);
          } else {
            setHeatmapMessage("No analysis data found for this repository.");
            setHeatmapData([]);
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
    
    
    const handleExtractSkills = () => {
        setInitialHeatmapHandler(false);
        setAnalysisStarted(true);
        setProgress(0);
        setAnalysisResults(heatmapData);
        setResultsOfAnalysis(true);
    
        const eventSource = new EventSource(
            process.env.REACT_APP_API_URL_KU+`/analyze?repo_url=${encodeURIComponent(repoUrl)}`
        );
    
        eventSource.onmessage = (event) => {
            if (event.data === "end") {
                eventSource.close();
                setLoading(false);
                setAnalysisStarted(false);
            } else {
                const fileData = JSON.parse(event.data);
                setAnalysisResults((prevResults) => [...prevResults, fileData]);
                setProgress((prevProgress) => prevProgress + 1);
            }
        };
    
        eventSource.onerror = (error) => {
            console.error("Error streaming data:", error);
            eventSource.close();
            setLoading(false);
            setAnalysisStarted(false);
        };
    
        eventSource.onopen = () => {
            setProgress(0);
        };
    };
    
    const handleAnalysis = async () => {
        await handleFetchCommits();
        handleExtractSkills();
    };



    return (
        <div className="flex flex-col gap-4 items-start">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 w-full">
                <div>
                    <label htmlFor="repoUrl" className="block text-gray-700 mb-2">
                        GitHub Repository URL
                    </label>
                    <input
                        type="text"
                        id="repoUrl"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>
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
                    <Button>Loading</Button>
                    ) : (
                    <div className="flex space-x-4"> {/* Προσθέτω αυτή την γραμμή */}
                        <Button
                            type="button"
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

            {/* Heatmap section */}
            {initialHeatmapHandler && (
                <div className="mt-8 w-full">
                    {loadingHeatmap ? (
                        <p>Loading analysis data...</p>
                    ) : heatmapData.length > 0 ? (
                        <Heatmap analysisResults={heatmapData} />
                    ) : (
                        <p>{heatmapMessage}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Form;