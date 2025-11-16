import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup, ListGroup, ListGroupItem, Badge, Progress
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL_FUTURE_TECHNOLOGY_TRENDS_IDENTIFIER;

// This delay function is now cancellable
const cancellableDelay = (ms, signal) => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      return reject(new axios.Cancel('Operation canceled.'));
    }
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new axios.Cancel('Operation canceled.'));
    });
  });
};

// Continuously attempts to fetch a URL until success or cancellation
const fetchContinuously = async (url, signal, interval = 5000) => {
  let attempt = 0;
  while (true) {
    if (signal.aborted) {
      throw new axios.Cancel('Operation canceled by the user.');
    }
    try {
      const response = await axios.get(url, { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Fetch canceled.');
        throw error;
      }

      // If it's a 404, wait and continue the loop.
      if (error.response && error.response.status === 404) {
        attempt++;
        console.log(`Attempt ${attempt} failed with 404. Retrying in ${interval / 1000}s...`);
        await cancellableDelay(interval, signal);
      } else {
        throw error;
      }
    }
  }
};

const FutureTechnologyTrends = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [jobMessage, setJobMessage] = useState("");
    const [technologies, setTechnologies] = useState([]);
    const [escoMapping, setEscoMapping] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [loadingState, setLoadingState] = useState('idle');
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('1');
    const [escoParams, setEscoParams] = useState({ top_n: 5, threshold: 0.4, target: "both" });
    const [policyParams, setPolicyParams] = useState({ similarity_threshold: 0.5, max_actions_per_tech: 5, target: "both" });

    const pollingAbortControllerRef = useRef(null);
    const jobPollingIntervalRef = useRef(null);


    useEffect(() => {
        return () => {
            if (jobPollingIntervalRef.current) clearInterval(jobPollingIntervalRef.current);
            pollingAbortControllerRef.current?.abort();
        };
    }, []);

    const resetState = () => {
        pollingAbortControllerRef.current?.abort();
        if (jobPollingIntervalRef.current) clearInterval(jobPollingIntervalRef.current);

        setSelectedFile(null);
        setJobId(null);
        setJobStatus(null);
        setJobMessage("");
        setTechnologies([]);
        setEscoMapping(null);
        setRecommendations(null);
        setLoadingState('idle');
        setError(null);
        setActiveTab('1');
    };

    const handleFileChange = (e) => { setSelectedFile(e.target.files[0]); setError(null); };

    const handleUpload = async () => {
        if (!selectedFile) { setError("Please select a PDF file first."); return; }
        resetState();
        setSelectedFile(selectedFile);
        setLoadingState('uploading');
        setError(null);
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
            const response = await axios.post(`${API_BASE_URL}/analyze/pdf`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const { job_id, status } = response.data;
            setJobId(job_id);
            if (status === 'done') {
                fetchTechnologies(job_id);
            } else {
                setLoadingState('polling');
                setJobStatus(status);
                startPolling(job_id);
            }
        } catch (err) {
            setError("File upload failed. Please try again.");
            setLoadingState('idle');
            console.error(err);
        }
    };
    
    const startPolling = (currentJobId) => {
        jobPollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/jobs/${currentJobId}`);
                const { status, message } = res.data;
                setJobStatus(status);
                setJobMessage(message);
                if (status === 'done') {
                    clearInterval(jobPollingIntervalRef.current);
                    fetchTechnologies(currentJobId);
                } else if (status === 'failed') {
                    clearInterval(jobPollingIntervalRef.current);
                    setError(message || "Analysis job failed.");
                    setLoadingState('idle');
                }
            } catch (err) {
                clearInterval(jobPollingIntervalRef.current);
                setError("Could not get job status.");
                setLoadingState('idle');
                console.error(err);
            }
        }, 3000);
    };

    const fetchTechnologies = async (currentJobId) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/results/${currentJobId}/download`);
            setTechnologies(res.data.technologies);
            setLoadingState('done');
            setActiveTab('1');
        } catch (err) {
            setError("Failed to fetch technology results.");
            setLoadingState('idle');
            console.error(err);
        }
    };
    
    const handleMapToEsco = async () => {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
        setLoadingState('mapping');
        setError(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/map-to-esco`, { job_id: jobId, ...escoParams });
            setEscoMapping(res.data);
            setActiveTab('2');
        } catch (err) {
            setError("Failed to map technologies to ESCO.");
            console.error(err);
        } finally {
            setLoadingState('done');
        }
    };

    const handleGetRecommendations = async () => {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
        setLoadingState('recommending');
        setError(null);
        setJobMessage("");
        
        pollingAbortControllerRef.current = new AbortController();
        const { signal } = pollingAbortControllerRef.current;

        try {
            const res = await axios.post(`${API_BASE_URL}/policy/recommendations`, {
                job_id: jobId, ...policyParams
            }, { signal }); 
            
            if (res.data.result_path) {
                setJobMessage("Recommendation job sent. Polling for results file...");
                const downloadUrl = `${API_BASE_URL}/results/${res.data.job_id}/download`;
                
                const finalData = await fetchContinuously(downloadUrl, signal);
                
                // Check if recommendations exist and then flatten the nested structure.
                if (finalData.recommendations) {
                    const flattenedRecommendations = finalData.recommendations;
                    setRecommendations(flattenedRecommendations);
                } else {
                    setRecommendations([]);
                }
            } else {
                setRecommendations([]);
            }
            setActiveTab('3');
        } catch (err) {
            if (!axios.isCancel(err)) {
                setError("An error occurred while getting recommendations.");
                console.error(err);
            }
        } finally {
            setLoadingState('done');
            setJobMessage("");
        }
    };

    
    const handleCancelPolling = () => {
        if (pollingAbortControllerRef.current) {
            pollingAbortControllerRef.current.abort();
            setJobMessage("Polling for results canceled by user.");
            setLoadingState('done');
        }
    };

    const renderTechnology = (tech) => ( <ListGroupItem key={tech.name}> <strong>{tech.name}</strong> <p className="text-muted small mb-0">{tech.description}</p> </ListGroupItem> );
    const renderMapping = (mappingData, type) => ( <Card className="mt-3"> <CardHeader>{type === 'occupations' ? 'Occupations' : 'Skills'}</CardHeader> <CardBody> {mappingData[type].map(item => ( <div key={item.technology} className="mb-3"> <h6>{item.technology}</h6> {item.matches.length > 0 ? ( <ListGroup flush> {item.matches.map(match => ( <ListGroupItem key={match.label} className="d-flex justify-content-between align-items-center"> {match.label} <Badge color="primary" pill>{match.score.toFixed(3)}</Badge> </ListGroupItem> ))} </ListGroup> ) : <p className="text-muted">No matches found.</p>} </div> ))} </CardBody> </Card> );
    

    // A helper function to determine badge color based on priority
    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'secondary';
        }
    };


    return (
    <div className="content">
        <Card>
            <CardHeader><CardTitle tag="h4">Future Technology Trends Identifier</CardTitle></CardHeader>
            <CardBody>
                {loadingState === 'idle' && (
                    <Row>
                        <Col md="8"><FormGroup><Label for="pdfFile">Upload a PDF document to analyze</Label><Input type="file" id="pdfFile" accept=".pdf" onChange={handleFileChange} /></FormGroup></Col>
                        <Col md="4" className="d-flex align-items-end"><Button color="primary" block onClick={handleUpload} disabled={!selectedFile}>Analyze Document</Button></Col>
                    </Row>
                )}
                
                {(loadingState === 'uploading' || loadingState === 'polling' || loadingState === 'recommending') && (
                    <div className="text-center">
                        <Spinner color="primary" />
                        <p className="mt-3">
                            {loadingState === 'uploading' && "Uploading and initiating analysis..."}
                            {loadingState === 'polling' && `Processing: ${jobStatus}`}
                            {loadingState === 'recommending' && "Generating recommendations..."}
                        </p>
                        {jobMessage && <p className="text-muted">{jobMessage}</p>}
                        {loadingState === 'recommending' && (
                            <Button color="danger" outline size="sm" onClick={handleCancelPolling}>
                                Cancel
                            </Button>
                        )}
                    </div>
                )}
                
                {error && <Alert color="danger" className="mt-3">{error}</Alert>}

                {technologies.length > 0 && (
                    <div>
                        <hr/>
                        <Nav tabs>
                            <NavItem><NavLink className={classnames({ active: activeTab === '1' })} onClick={() => setActiveTab('1')}>Identified Technologies</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === '2' })} disabled={!escoMapping}>ESCO Mapping</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === '3' })} disabled={!recommendations}>Policy Recommendations</NavLink></NavItem>
                        </Nav>
                        <TabContent activeTab={activeTab} className="mt-3">
                            <TabPane tabId="1">
                                <h5>Found Technologies</h5>
                                <ListGroup>{technologies.map(renderTechnology)}</ListGroup>
                                <hr/>
                                <h5>Map to ESCO</h5>
                                <Row>
                                    <Col md="4"><FormGroup><Label>Top N</Label><Input type="number" value={escoParams.top_n} onChange={e => setEscoParams({...escoParams, top_n: e.target.value})} /></FormGroup></Col>
                                    <Col md="4"><FormGroup><Label>Threshold</Label><Input type="number" step="0.1" value={escoParams.threshold} onChange={e => setEscoParams({...escoParams, threshold: e.target.value})} /></FormGroup></Col>
                                    <Col md="4" className="d-flex align-items-end"><Button color="success" block onClick={handleMapToEsco} disabled={loadingState === 'mapping'}>{loadingState === 'mapping' ? <Spinner size="sm" /> : 'Run ESCO Mapping'}</Button></Col>
                                </Row>
                            </TabPane>
                            <TabPane tabId="2">
                                {escoMapping ? (
                                    <>
                                        <Row>
                                            <Col md="6">{renderMapping(escoMapping, 'occupations')}</Col>
                                            <Col md="6">{renderMapping(escoMapping, 'skills')}</Col>
                                        </Row>
                                        <hr/>
                                        <h5>Generate Policy Recommendations</h5>
                                        <Row>
                                            <Col md="4"><FormGroup><Label>Similarity Threshold</Label><Input type="number" step="0.1" value={policyParams.similarity_threshold} onChange={e => setPolicyParams({...policyParams, similarity_threshold: e.target.value})} /></FormGroup></Col>
                                            <Col md="4"><FormGroup><Label>Max Actions per Tech</Label><Input type="number" value={policyParams.max_actions_per_tech} onChange={e => setPolicyParams({...policyParams, max_actions_per_tech: e.target.value})} /></FormGroup></Col>
                                            <Col md="4" className="d-flex align-items-end"><Button color="info" block onClick={handleGetRecommendations} disabled={loadingState === 'recommending'}>{loadingState === 'recommending' ? <Spinner size="sm" /> : 'Get Recommendations'}</Button></Col>
                                        </Row>
                                    </>
                                ) : <p>Run the ESCO mapping to see results here.</p>}
                            </TabPane>
                            <TabPane tabId="3">
                                {recommendations ? (
                                    recommendations.length > 0 ? (
                                        <>
                                        {recommendations.map((rec, index) => (
                                            <Card key={index}>
                                                <CardHeader>
                                                    <CardTitle tag="h5">{rec.technology}</CardTitle>
                                                </CardHeader>
                                                <CardBody>
                                                    {rec.actions.map((action, index2) => (
                                                        <Card key={index2}>
                                                            <CardHeader>
                                                                <CardTitle tag="h6">{action.area}
                                                                    <Badge color={getPriorityColor(action.priority)}>{action.priority}</Badge>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardBody>
                                                                {/* Using a more semantic and styled layout */}
                                                                <p><strong>Action:</strong> {action.action}</p>
                                                                <p><strong>Rationale:</strong> {action.rationale}</p>
                                                                <p><strong>Risks:</strong> {action.risks}</p>

                                                                {/* Displaying the other data you have! */}
                                                                <hr />
                                                                <div>
                                                                    <strong>Timeframe:</strong> <Badge color="info" pill>{action.timeframe}</Badge>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <strong>Stakeholders:</strong>
                                                                    {action.stakeholders.map(stakeholder => (
                                                                        <Badge key={stakeholder} color="light" className="mr-1 text-dark border">{stakeholder}</Badge>
                                                                    ))}
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    ))}
                                                </CardBody>
                                            </Card>
                                        ))}
                                        </>
                                    ) : <Alert color="info">No policy recommendations were generated based on the current parameters.</Alert>
                                ) : <p>Generate recommendations to see results here.</p>}
                            </TabPane>
                        </TabContent>
                    </div>
                )}
            </CardBody>
            <CardFooter>
                <Button outline color="secondary" onClick={resetState} disabled={loadingState !== 'idle' && loadingState !== 'done'}>Start Over</Button>
            </CardFooter>
        </Card>
    </div>
    );
}

export default FutureTechnologyTrends;