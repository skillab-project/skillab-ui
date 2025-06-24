import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Row,
  Col } from "reactstrap";
import axios from 'axios';
import '../../assets/css/industry.css';
import { Bar } from 'react-chartjs-2';
import Heatmap from "./ku/Heatmap";
import Commits from "./ku/Commits";
import Form from "./ku/Form";


function KnowleageUnits() {
    const [repos, setRepos] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [showScreen, setShowScreen] = useState(false);
    const [resultsOfAnalysis, setResultsOfAnalysis] = useState(false);

    const [commits, setCommits] = useState([]);
    const [files, setFiles] = useState([]);
    const [progress, setProgress] = useState(0);
    const [totalFiles, setTotalFiles] = useState(0);
    const [loading, setLoading] = useState(false);
    const [analysisResults, setAnalysisResults] = useState([]);
    const [commitLimit, setCommitLimit] = useState(100);
    const [chartData, setChartData] = useState(null);
    const [showChart, setShowChart] = useState(false); 

    const handleSelectRepo = (repoName, repoUrl) => {
        setSelectedRepo(repoName);
        setRepoUrl(repoUrl);
        setShowScreen(true);
        setResultsOfAnalysis(false); // Set resultsOfAnalysis to false when selecting a repo
    };

    const handleCloseChart = () => {
        //setShowScreen(false);
        setShowChart(false)
    };    

    const handleViewOrganizationSkills = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_URL_KU + '/detected_kus');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const analysisData = await response.json();
            const aggregatedData = {};

            // Process each item in the fetched data
            analysisData.forEach((item, index) => {
                const { kus, author } = item;

                for (const [key, value] of Object.entries(kus)) {
                    if (typeof value === 'number') {
                        // Initialize KU entry if not present
                        if (!aggregatedData[key]) {
                            aggregatedData[key] = {
                                files: 0,
                                authors: new Set(),
                                employeeCount: 0,
                            };
                        }

                        // Update number of files
                        aggregatedData[key].files += value;

                        // Add author only if value is 1
                        if (value === 1) {
                            aggregatedData[key].authors.add(author);
                        }

                        // Update employee count (number of unique authors)
                        aggregatedData[key].employeeCount = aggregatedData[key].authors.size;
                    }
                }
            });

            // Sort KU keys numerically (e.g., KU1, KU2, ...)
            const sortedKeys = Object.keys(aggregatedData).sort((a, b) => {
                const numA = parseInt(a.slice(2)); // Skip 'KU'
                const numB = parseInt(b.slice(2));
                return numA - numB;
            });

            // Prepare chart labels and datasets
            const labels = sortedKeys;
            const dataFiles = sortedKeys.map(key => aggregatedData[key].files);
            const dataEmployees = sortedKeys.map(key => aggregatedData[key].employeeCount);

            // Set chart data
            setChartData({
                labels: labels,
                datasets: [
                    {
                        label: 'Number of Files',
                        data: dataFiles,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Number of Authors',
                        data: dataEmployees,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1',
                    },
                ],
                options: {
                    responsive: true,
                    layout: {
                        padding: {
                            right: 150,
                        },
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Number of Files',
                            },
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            offset: true,
                            title: {
                                display: true,
                                text: 'Number of Authors',
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    },
                },
            });
            setShowChart(true);
        }
        catch (error) {
            console.error('Failed to load analysis data:', error);
        }
    };

    

    const getRepos = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_KU + "/repos")
            .then((res) => {
                console.log("repos: "+res.data);
                setRepos(res.data);
            });
    };

    useEffect(() => {
        getRepos();
    }, []);

    return (
        <div className="content">
            <Row>
                <Col lg="12" xl="4">
                    <Card>
                        <CardBody>
                            <div className="flex justify-start p-6">
                                <div className="w-full max-w-md">
                                    <ul style={{paddingLeft:"0px", maxHeight: "500px", overflowY: "auto" }}>
                                        {repos.map((repo) => (
                                            <li
                                                key={repo.name}
                                                style={{display:"flex", justifyContent:"space-between", alignItems:"center" }}
                                                className={`p-4 border border-gray-200 rounded-lg shadow-sm ${
                                                repo.name === selectedRepo ? 'bg-default' : 'bg-white'
                                                }`}
                                            >
                                                <span>{repo.name}</span>
                                                <button
                                                    onClick={() => handleSelectRepo(repo.name, repo.url)}
                                                    aria-label={`Select ${repo.name}`}
                                                >
                                                    <i className="fas fa-eye text-lg"></i>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col lg="12" xl="8">
                    <Card>
                        <CardBody>
                            <Button 
                                onClick={handleViewOrganizationSkills} 
                                className="px-4 py-2 bg-blue-500 text-white rounded"
                            >
                                View Organization Skills
                            </Button>
                            {showChart && chartData && (
                                <div className="mt-8">
                                    <Bar data={chartData} />
                                    <Button 
                                        onClick={handleCloseChart} 
                                        className="mt-4 px-4 py-2 bg-[#c72424] text-white rounded"
                                    >
                                        Close Chart
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
                {showScreen &&
                    <Col md="12">
                        <Card>
                            <CardBody>
                                <Form
                                    commits={commits}
                                    setCommits={setCommits}
                                    setProgress={setProgress}
                                    setTotalFiles={setTotalFiles}
                                    loading={loading}
                                    setLoading={setLoading}
                                    setAnalysisResults={setAnalysisResults}
                                    initialRepoUrl={repoUrl}
                                    setResultsOfAnalysis={setResultsOfAnalysis} // Pass the setter function
                                />
                                {resultsOfAnalysis && ( // Render only if resultsOfAnalysis is true
                                    <Commits commits={commits} loading={loading} />
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                }
            </Row>
        </div>
    );
}

export default KnowleageUnits;