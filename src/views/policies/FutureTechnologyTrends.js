import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup, ListGroup, ListGroupItem, Badge, Collapse, Table
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL_FUTURE_TECHNOLOGY_TRENDS_IDENTIFIER;

// delay function that is cancellable
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
    const [recommendationsData, setRecommendationsData] = useState(null);
    const [loadingState, setLoadingState] = useState('idle');
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('1');
    const [escoParams, setEscoParams] = useState({ top_n: 5, threshold: 0.4, target: "both" });
    const [policyParams, setPolicyParams] = useState({ similarity_threshold: 0.5, max_actions_per_tech: 5, target: "both" });
    const [openTechs, setOpenTechs] = useState({});
    const [openEsco, setOpenEsco] = useState({});
    const [openRecs, setOpenRecs] = useState({});
    const [openActions, setOpenActions] = useState({});

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
        setRecommendationsData(null);
        setLoadingState('idle');
        setError(null);
        setActiveTab('1');
        
        // Reset toggles
        setOpenTechs({}); 
        setOpenEsco({});
        setOpenRecs({});
        setOpenActions({});
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
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                
                // Store the whole data structure (emerging, recommendations, mapping_evidence)
                setRecommendationsData(finalData);
            } else {
                setRecommendationsData(null);
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

    // Toggle Handlers
    const toggleTech = (name) => {
        setOpenTechs(prevState => ({ ...prevState, [name]: !prevState[name] }));
    };
    
    const toggleEsco = (id) => {
        setOpenEsco(prevState => ({ ...prevState, [id]: !prevState[id] }));
    };

    const toggleRec = (index) => {
        setOpenRecs(prevState => ({ ...prevState, [index]: !prevState[index] }));
    };

    const toggleAction = (uniqueId) => {
        setOpenActions(prevState => ({ ...prevState, [uniqueId]: !prevState[uniqueId] }));
    };

    // Render Helpers
    const getPriorityColor = (priority) => {
        if (!priority) return 'secondary';
        switch (priority.toLowerCase()) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'secondary';
        }
    };

    const renderTechnology = (tech) => {
        const isOpen = !!openTechs[tech.name];
        return (
            <ListGroupItem key={tech.name} className="p-0">
                <div 
                    onClick={() => toggleTech(tech.name)} 
                    style={{ cursor: 'pointer', padding: '12px 20px' }}
                    className={`d-flex justify-content-between align-items-center ${isOpen ? 'bg-light' : ''}`}
                >
                    <strong style={{fontSize: '1.05rem'}}>{tech.name}</strong>
                    <span className="text-muted">{isOpen ? '▼' : '▶'}</span>
                </div>
                <Collapse isOpen={isOpen}>
                    <div className="p-3 border-top bg-white">
                        <p className="text-muted mb-0">{tech.description}</p>
                    </div>
                </Collapse>
            </ListGroupItem>
        );
    };

    const renderEscoColumn = (items, type) => {
        const mapped = items.filter(item => item.matches && item.matches.length > 0);
        const notMapped = items.filter(item => !item.matches || item.matches.length === 0);

        return (
            <Card className="h-100 shadow-sm border">
                <CardHeader className="bg-white">
                    <CardTitle tag="h5" className="mb-0 text-primary">
                        {type === 'occupations' ? 'Occupations' : 'Skills'}
                    </CardTitle>
                </CardHeader>
                <CardBody style={{padding: '1rem'}}>
                    <div className="mb-4">
                        <h6 className="text-dark font-weight-bold border-bottom pb-2 mb-3">Mapped ({mapped.length})</h6>
                        {mapped.length === 0 && <p className="text-muted small">No direct matches found.</p>}
                        <ListGroup flush>
                            {mapped.map(item => {
                                const uniqueKey = `${type}-${item.technology}`;
                                const isOpen = !!openEsco[uniqueKey];
                                return (
                                    <ListGroupItem key={uniqueKey} className="p-0 border-0 mb-2">
                                        <div 
                                            onClick={() => toggleEsco(uniqueKey)}
                                            style={{ cursor: 'pointer', borderRadius: '4px' }}
                                            className={`d-flex justify-content-between align-items-center p-2 ${isOpen ? 'bg-light border' : ''}`}
                                        >
                                            <span className="font-weight-bold" style={{fontSize: '0.9rem', textAlign: 'left'}}>{item.technology}</span>
                                            <span className="text-muted small">{isOpen ? '▼' : '▶'}</span>
                                        </div>
                                        <Collapse isOpen={isOpen}>
                                            <div className="pl-3 pr-2 py-2">
                                                <ListGroup>
                                                    {item.matches.map((match, idx) => (
                                                        <ListGroupItem key={idx} className="d-flex justify-content-between align-items-center p-2 bg-white small border">
                                                            <span>{match.label}</span>
                                                            <Badge color="primary" pill>{match.score.toFixed(2)}</Badge>
                                                        </ListGroupItem>
                                                    ))}
                                                </ListGroup>
                                            </div>
                                        </Collapse>
                                    </ListGroupItem>
                                );
                            })}
                        </ListGroup>
                    </div>
                    <div>
                        <h6 className="text-dark font-weight-bold border-bottom pb-2 mb-3">Not Mapped / Emerging ({notMapped.length})</h6>
                        <ListGroup flush>
                            {notMapped.map((item, idx) => (
                                <ListGroupItem key={idx} className="p-2 border-0 d-flex justify-content-between align-items-center">
                                    <span className="text-muted" style={{fontSize: '0.9rem'}}>{item.technology}</span>
                                    <Badge color="warning" className="text-dark" pill>Emerging</Badge>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </div>
                </CardBody>
            </Card>
        );
    };

    const renderRecommendationsTab = () => {
        if (!recommendationsData) return <p>Generate recommendations to see results here.</p>;
        const { emerging, recommendations } = recommendationsData;
        return (
            <>
                {/* Emerging Technologies Summary Section
                {emerging && emerging.length > 0 && (
                    <div className="mb-4">
                        <h5>Emerging Technologies Detected</h5>
                        <p className="text-muted small">These technologies were identified as emerging high-value trends.</p>
                        <div className="d-flex flex-wrap">
                            {emerging.map((item, idx) => (
                                <Badge key={idx} color="dark" className="mr-2 mb-2 p-2" style={{fontSize:'0.9rem'}}>
                                    {item.name}
                                </Badge>
                            ))}
                        </div>
                        <hr />
                    </div>
                )} */}

                {/* Recommendations Accordion */}
                {recommendations && recommendations.length > 0 ? (
                    recommendations.map((rec, recIndex) => {
                        const isTechOpen = !!openRecs[recIndex];
                        return (
                            <Card key={recIndex} className="mb-3 border shadow-sm">
                                {/* Technology Header */}
                                <CardHeader 
                                    onClick={() => toggleRec(recIndex)} 
                                    className={`d-flex justify-content-between align-items-center ${isTechOpen ? 'bg-primary text-white' : 'bg-light'}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h5 className="mb-0">{rec.technology}</h5>
                                    <div>
                                        <Badge color="light" className="text-dark mr-2">{rec.actions.length} Actions</Badge>
                                        <span>{isTechOpen ? '▼' : '▶'}</span>
                                    </div>
                                </CardHeader>

                                <Collapse isOpen={isTechOpen}>
                                    <CardBody className="bg-light pt-3">
                                        {rec.actions.map((action, actionIndex) => {
                                            const actionId = `${recIndex}-${actionIndex}`;
                                            const isActionOpen = !!openActions[actionId];

                                            return (
                                                <Card key={actionIndex} className="mb-2 border">
                                                    {/* Action Header */}
                                                    <CardHeader 
                                                        onClick={() => toggleAction(actionId)}
                                                        className="bg-white py-2"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div className="d-flex align-items-center">
                                                                <span className="text-muted mr-2">{isActionOpen ? '▼' : '▶'}</span>
                                                                <strong className="text-primary">{action.area}</strong>
                                                                <span className="mx-2 text-muted">|</span>
                                                                <span className="text-dark" style={{fontWeight:'500'}}>{action.action.substring(0, 60)}{action.action.length > 60 ? '...' : ''}</span>
                                                            </div>
                                                            <Badge color={getPriorityColor(action.priority)} pill>{action.priority} Priority</Badge>
                                                        </div>
                                                    </CardHeader>

                                                    {/* Action Details */}
                                                    <Collapse isOpen={isActionOpen}>
                                                        <CardBody className="pt-2">
                                                            <div className="mb-3">
                                                                <strong>Full Action:</strong>
                                                                <p className="mb-0">{action.action}</p>
                                                            </div>
                                                            <Row>
                                                                <Col md="6">
                                                                    <div className="mb-3 p-2 bg-light rounded">
                                                                        <strong>Rationale:</strong>
                                                                        <p className="mb-0 small">{action.rationale}</p>
                                                                    </div>
                                                                </Col>
                                                                <Col md="6">
                                                                    <div className="mb-3 p-2 bg-light rounded border-left border-danger" style={{borderLeftWidth:'4px'}}>
                                                                        <strong>Risks:</strong>
                                                                        <p className="mb-0 small text-danger">{action.risks}</p>
                                                                    </div>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mt-2">
                                                                <Col md="4">
                                                                    <strong>Timeframe:</strong> <br/>
                                                                    <Badge color="info" className="mt-1">{action.timeframe}</Badge>
                                                                </Col>
                                                                <Col md="4">
                                                                    <strong>KPIs:</strong>
                                                                    <ul className="pl-3 mt-1 small">
                                                                        {action.KPIs && action.KPIs.map((kpi, k) => (
                                                                            <li key={k}>{kpi}</li>
                                                                        ))}
                                                                    </ul>
                                                                </Col>
                                                                <Col md="4">
                                                                    <strong>Stakeholders:</strong>
                                                                    <div className="mt-1">
                                                                        {action.stakeholders && action.stakeholders.map((s, sIdx) => (
                                                                            <Badge key={sIdx} color="light" className="border text-dark mr-1 mb-1">{s}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                        </CardBody>
                                                    </Collapse>
                                                </Card>
                                            );
                                        })}
                                    </CardBody>
                                </Collapse>
                            </Card>
                        );
                    })
                ) : (
                    <Alert color="info">No policy recommendations were generated based on the current parameters.</Alert>
                )}
            </>
        );
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
                            <NavItem><NavLink className={classnames({ active: activeTab === '1' })} onClick={() => setActiveTab('1')} style={{cursor: 'pointer'}}>Identified Technologies</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === '2' })} onClick={() => setActiveTab('2')} disabled={!escoMapping} style={{cursor: 'pointer'}}>ESCO Mapping</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === '3' })} onClick={() => setActiveTab('3')} disabled={!recommendationsData} style={{cursor: 'pointer'}}>Policy Recommendations</NavLink></NavItem>
                        </Nav>
                        <TabContent activeTab={activeTab} className="mt-3">
                            <TabPane tabId="1">
                                <h5>Found Technologies <small className="text-muted">(Click to expand)</small></h5>
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
                                            <Col md="6">{renderEscoColumn(escoMapping['occupations'], 'occupations')}</Col>
                                            <Col md="6">{renderEscoColumn(escoMapping['skills'], 'skills')}</Col>
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
                                {renderRecommendationsTab()}
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