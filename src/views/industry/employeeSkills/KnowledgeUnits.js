import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Row,
  Col } from "reactstrap";
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import Heatmap from "./ku/Heatmap";
import Commits from "./ku/Commits";
import Form from "./ku/Form";
import {
    KU_SOURCES,
    KU_SOURCE_LIST,
    getKuLabelFor,
    getKuDescriptionFor,
    compareKuIds,
    getErrorMessage,
} from "./ku/kuSources";
import { getOrganization } from "../../../utils/Tokens";


// Wrap a long KU description into short lines so the Chart.js tooltip stays readable
const wrapText = (text, maxChars = 60) => {
    if (!text) return [];
    const lines = [];
    let current = "";
    String(text).split(/\s+/).forEach((word) => {
        if (current && (current + " " + word).length > maxChars) {
            lines.push(current);
            current = word;
        } else {
            current = current ? current + " " + word : word;
        }
    });
    if (current) lines.push(current);
    return lines;
};

// Options for the "View Organization Skills" bar chart. The tooltip shows the
// same KU info (id - name + description) as the Knowledge Units heatmap.
const buildOrganizationSkillsChartOptions = (config) => ({
    responsive: true,
    layout: {
        padding: {
            right: 150,
        },
    },
    interaction: {
        mode: "index",
        intersect: false,
    },
    plugins: {
        legend: {
            position: "top",
        },
        tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            titleColor: "#333",
            bodyColor: "#555",
            borderColor: "#ddd",
            borderWidth: 1,
            padding: 12,
            boxPadding: 4,
            titleFont: { size: 13, weight: "bold" },
            bodyFont: { size: 12 },
            callbacks: {
                title: (items) => {
                    if (!items.length) return "";
                    return getKuLabelFor(config, items[0].label);
                },
                afterBody: (items) => {
                    if (!items.length) return [];
                    const description = getKuDescriptionFor(config, items[0].label);
                    return description ? ["", ...wrapText(description)] : [];
                },
            },
        },
    },
    scales: {
        x: {
            title: {
                display: true,
                text: "Knowledge Unit",
            },
        },
        y: {
            type: "linear",
            position: "left",
            beginAtZero: true,
            title: {
                display: true,
                text: "Number of Files",
            },
        },
        y1: {
            type: "linear",
            position: "right",
            beginAtZero: true,
            title: {
                display: true,
                text: "Number of Authors",
            },
            grid: {
                drawOnChartArea: false,
            },
        },
    },
});

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
    // One entry per detector: { key, title, data (chart.js data) } — only detectors with data
    const [orgSkillsCharts, setOrgSkillsCharts] = useState([]);
    const [orgSkillsMessage, setOrgSkillsMessage] = useState("");
    const [loadingOrgSkills, setLoadingOrgSkills] = useState(false);
    const [showChart, setShowChart] = useState(false); 
    const [organization, setOrganization] = useState('');
    // Which detector ("java" | "eclipse") is currently running for the selected repo.
    // Both detectors share one progress record in the backend, so only one may run at a time.
    const [activeAnalysis, setActiveAnalysis] = useState(null);

    const handleSelectRepo = (repoName, repoUrl) => {
        setSelectedRepo(repoName);
        setRepoUrl(repoUrl);
        setShowScreen(true);
        setResultsOfAnalysis(false); // Set resultsOfAnalysis to false when selecting a repo
        setCommits([]);
        setActiveAnalysis(null);
    };

    const handleCloseChart = () => {
        //setShowScreen(false);
        setShowChart(false)
    };    

    const buildOrgSkillsChartData = (config, analysisData) => {
        const sortedData = [...analysisData].sort((a, b) => compareKuIds(config)(a.ku_name, b.ku_name));
        return {
            labels: sortedData.map(item => item.ku_name),
            datasets: [
                {
                    label: 'Number of Files',
                    data: sortedData.map(item => item.total_files),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    label: 'Number of Authors',
                    data: sortedData.map(item => item.total_authors),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                },
            ],
        };
    };

    const handleViewOrganizationSkills = async () => {
        setLoadingOrgSkills(true);
        setOrgSkillsMessage("");
        try {
            // Fetch both detectors in parallel; one failing must not hide the other
            const responses = await Promise.allSettled(
                KU_SOURCE_LIST.map((config) =>
                    axios.get(process.env.REACT_APP_API_URL_KU + config.orgSkillsPath(), {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                        },
                    })
                )
            );

            const charts = [];
            const failures = [];
            responses.forEach((res, i) => {
                const config = KU_SOURCE_LIST[i];
                if (res.status === "rejected") {
                    console.error(`Failed to load ${config.title} organization skills:`, res.reason);
                    failures.push(`${config.title}: ${getErrorMessage(res.reason, "request failed")}`);
                    return;
                }
                const analysisData = Array.isArray(res.value.data) ? res.value.data : [];
                if (analysisData.length > 0) {
                    charts.push({ key: config.key, title: config.title, data: buildOrgSkillsChartData(config, analysisData) });
                }
            });

            setOrgSkillsCharts(charts);
            if (charts.length === 0) {
                setOrgSkillsMessage(
                    failures.length === KU_SOURCE_LIST.length
                        ? "Failed to load the organization skills."
                        : "No analyzed projects yet — run a KU analysis on a project to see the organization skills."
                );
            } else if (failures.length > 0) {
                setOrgSkillsMessage(`Some results could not be loaded (${failures.join("; ")}).`);
            }
            setShowChart(true);
        } finally {
            setLoadingOrgSkills(false);
        }
    };

    const getRepos = async () => {
        axios
            .get(process.env.REACT_APP_API_URL_KU + "/repos?organization=" + organization, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                },
            })
            .then((res) => {
                const sortedRepos = res.data.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                console.log("sorted repos:", sortedRepos);
                setRepos(res.data);
            })
            .catch((error) => {
                console.error("Failed to load repositories:", error);
                setRepos([]);
            });
    };

    useEffect(() => {
        const fetchOrganization = async () => {
            const org = await getOrganization();
            setOrganization(org);
        };

        fetchOrganization();
    }, []);

    useEffect(() => {
        if (!organization) return;
        getRepos();
    }, [organization]);

    return (
        <>
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
                                                repo.name === selectedRepo ? 'bg-success' : 'bg-white'
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
                                color="info"
                                disabled={loadingOrgSkills}
                            >
                                View Organization Skills
                            </Button>
                            {showChart && (
                                <div className="mt-8">
                                    {orgSkillsCharts.map((chart) => (
                                        <div key={chart.key} className="mt-4">
                                            <h4>{chart.title}</h4>
                                            <Bar
                                                data={chart.data}
                                                options={buildOrganizationSkillsChartOptions(KU_SOURCES[chart.key])}
                                            />
                                        </div>
                                    ))}
                                    {orgSkillsMessage && (
                                        <p className="mt-4 text-muted">{orgSkillsMessage}</p>
                                    )}
                                    <Button
                                        color="info"
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
                {showScreen && (
                    <>
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <h3 className="mb-0">{KU_SOURCES.java.title}</h3>
                                    <small className="text-muted">{KU_SOURCES.java.subtitle}</small>
                                </CardHeader>
                                <CardBody>
                                    <Form
                                        source="java"
                                        activeAnalysis={activeAnalysis}
                                        setActiveAnalysis={setActiveAnalysis}
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
                        <Col md="12">
                            <Card>
                                <CardHeader>
                                    <h3 className="mb-0">{KU_SOURCES.eclipse.title}</h3>
                                    <small className="text-muted">{KU_SOURCES.eclipse.subtitle}</small>
                                </CardHeader>
                                <CardBody>
                                    <Form
                                        source="eclipse"
                                        activeAnalysis={activeAnalysis}
                                        setActiveAnalysis={setActiveAnalysis}
                                        initialRepoUrl={repoUrl}
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </>
                )}
            </Row>
        </>
    );
}

export default KnowleageUnits;