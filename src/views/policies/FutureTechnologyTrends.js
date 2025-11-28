import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button,
  Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner, Input, Label,
  FormGroup
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';
import TechnologyList from "./futureTechnology/TechnologyList";
import EscoMappingResults from "./futureTechnology/EscoMappingResults";
import PolicyRecommendations from "./futureTechnology/PolicyRecommendations";

const API_BASE_URL = process.env.REACT_APP_API_URL_FUTURE_TECHNOLOGY_TRENDS_IDENTIFIER;

// Delay function that is cancellable
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

    return (
    <div className="content">
        <Card>
            <CardHeader><CardTitle tag="h4">Future Technology Trends Identifier</CardTitle></CardHeader>
            <CardBody>
                {/* Upload Section */}
                {loadingState === 'idle' && (
                    <Row>
                        <Col md="8">
                            <FormGroup>
                                <Label for="pdfFile">Upload a PDF document to analyze</Label>
                                <Input type="file" id="pdfFile" accept=".pdf" onChange={handleFileChange} />
                            </FormGroup>
                        </Col>
                        <Col md="4" className="d-flex align-items-end">
                            <Button color="primary" block onClick={handleUpload} disabled={!selectedFile}>Analyze Document</Button>
                        </Col>
                    </Row>
                )}
                
                {/* Loading Status Section */}
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

                {/* Results Section */}
                {technologies.length > 0 && (
                    <div key={jobId}> 
                        <hr/>
                        <Nav tabs>
                            <NavItem><NavLink className={classnames({ active: activeTab === '1' })} onClick={() => setActiveTab('1')} style={{cursor: 'pointer'}}>Identified Technologies</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === '2' })} onClick={() => setActiveTab('2')} disabled={!escoMapping} style={{cursor: 'pointer'}}>ESCO Mapping</NavLink></NavItem>
                            <NavItem><NavLink className={classnames({ active: activeTab === '3' })} onClick={() => setActiveTab('3')} disabled={!recommendationsData} style={{cursor: 'pointer'}}>Policy Recommendations</NavLink></NavItem>
                        </Nav>
                        <TabContent activeTab={activeTab} className="mt-3">
                            <TabPane tabId="1">
                                <TechnologyList 
                                    technologies={technologies}
                                    escoParams={escoParams}
                                    setEscoParams={setEscoParams}
                                    onMapClick={handleMapToEsco}
                                    loading={loadingState === 'mapping'}
                                />
                            </TabPane>
                            <TabPane tabId="2">
                                <EscoMappingResults 
                                    escoMapping={escoMapping}
                                    policyParams={policyParams}
                                    setPolicyParams={setPolicyParams}
                                    onRecommendClick={handleGetRecommendations}
                                    loading={loadingState === 'recommending'}
                                />
                            </TabPane>
                            <TabPane tabId="3">
                                <PolicyRecommendations data={recommendationsData} />
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