import React, { useState, useEffect } from 'react';
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
        setInitialHeatmapHandler(true);
        setAnalysisStarted(true);
        setProgress(0);
        setAnalysisResults(heatmapData);
        setResultsOfAnalysis(true);
    
        const eventSource = new EventSource(
            process.env.REACT_APP_API_URL_KU+`/analyze?repo_url=${encodeURIComponent(repoUrl)}`
        );
    
        eventSource.onmessage = (event) => {
            const streamData = JSON.parse(event.data);
            if(repoUrl == streamData.repoUrl) {
                console.log(streamData);
                setAnalysisProgress(streamData.progress);

                if(streamData.file_data != undefined){
                    setAnalysisResults((prevResults) => [...prevResults, streamData.file_data]);
                    setHeatmapData((prevResults) => [...prevResults, streamData.file_data]);
                    setFilteredHeatmapData((prevResults) => [...prevResults, streamData.file_data]);
                }

                if (streamData.progress == 100) {
                    eventSource.close();
                    setLoading(false);
                    setAnalysisStarted(false);
                }
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