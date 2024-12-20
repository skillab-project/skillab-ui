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
import Progress from "./ku/Progress";
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
            const response = await fetch(process.env.REACT_APP_API_URL_KU+'/detected_kus');
          
            // Έλεγχος αν η απάντηση είναι επιτυχής
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
      
            const analysisData = await response.json();
            const aggregatedData = {};
      
            // Υπολογισμός αθροισμάτων για κάθε KUs
            analysisData.forEach((item) => {
                for (const [key, value] of Object.entries(item)) {
                    if (typeof value === 'number') {
                        if (aggregatedData[key]) {
                            aggregatedData[key] += value;
                        } else {
                            aggregatedData[key] = value;
                        }
                    }
                }
            });
      
            // Ταξινόμηση των κλειδιών αριθμητικά
            const sortedKeys = Object.keys(aggregatedData).sort((a, b) => {
                const numA = parseInt(a.slice(1)); // Λαμβάνουμε το αριθμητικό μέρος του κλειδιού
                const numB = parseInt(b.slice(1)); // Λαμβάνουμε το αριθμητικό μέρος του κλειδιού
                return numA - numB; // Ταξινόμηση αριθμητικά
            });
      
            // Δημιουργία των labels και των data με τη σωστή σειρά
            const labels = sortedKeys;
            const data = sortedKeys.map(key => aggregatedData[key]);
      
            setChartData({
                labels: labels,
                datasets: [
                    {
                        label: 'Number of KUs',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    },
                ],
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
                                    <div>
                                        {totalFiles > 0 && (
                                        <div className="flex gap-2 items-center justify-between">
                                            <Progress
                                                value={(progress / totalFiles) * 100}
                                                className="flex-grow bg-white"
                                            />
                                            <span className="whitespace-nowrap">
                                            {progress}/{totalFiles}
                                            </span>
                                        </div>
                                        )}
                                        <div className="flex flex-col gap-4">
                                        {analysisResults.length > 0 && (
                                            <Heatmap analysisResults={analysisResults} />
                                        )}
                                        <Commits commits={commits} loading={loading} />
                                        </div>
                                    </div>
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