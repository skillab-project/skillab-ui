import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Table,
  ListGroup,
  ListGroupItem
} from "reactstrap";
import axios from 'axios';
import OccupationSelection from "./OccupationSelection";
import "../../assets/css/loader.css";

const sourceOptions = {
    courses: ["All", "Udacity", "europass", "coursera"],
    jobs: ["All", "OJA", "kariera.gr"],
    profiles: [
        "All", "stack-biology", "stack-chemistry", "stack-earthscience", "stack-electronics",
        "stack-interpersonal", "stack-law", "stack-linguistics", "stack-literature",
        "stack-math", "stack-philosophy", "stack-physics", "stack-politics",
        "stack-sports", "stack-stackoverflow"
    ],
    policies: ["eur_lex"],
};

const TaxonomyForecasting = () => {
    const [sourceType, setSourceType] = useState("courses");
    const [params, setParams] = useState({
        keywords: "data",
        occupation_ids: "",
        selectedOccupation: null,
        source: "All",
        similarity_threshold: 0.7,
        top_k: 30,
        method: 'adamic_adar',
        min_upload_date: "",
        max_upload_date: "",
    });

    const [loading, setLoading] = useState(false);
    const [isTakingLong, setIsTakingLong] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");
    const [results, setResults] = useState(null);
    const [searchStarted, setSearchStarted] = useState(false);

    const timerRef = useRef(null);

    // Cleanup timer
    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const handleParamChange = (e) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value }));
    };

    const handleOccupationChange = (occ) => {
        setParams(prev => ({
            ...prev,
            selectedOccupation: occ,
            occupation_ids: occ ? occ.id : ""
        }));
    };
    
    const handleSourceTypeChange = (e) => {
        const newSourceType = e.target.value;
        setSourceType(newSourceType);
        setResults(null); 
        setSearchStarted(false);
        setInfoMessage("");

        const newOptions = sourceOptions[newSourceType] || [];
        setParams(prev => ({
            ...prev,
            source: newOptions[0] || "",
            keywords: newSourceType === 'jobs' ? "" : prev.keywords,
            occupation_ids: newSourceType === 'jobs' ? prev.occupation_ids : "",
            selectedOccupation: newSourceType === 'jobs' ? prev.selectedOccupation : null
        }));
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        
        // Validation
        if (sourceType === 'jobs' && !params.occupation_ids) {
            setInfoMessage("Please select an occupation.");
            return;
        }
        if (sourceType !== 'jobs' && !params.keywords.trim()) {
            setInfoMessage("Keywords are required.");
            return;
        }

        setLoading(true);
        setSearchStarted(true);
        setResults(null);
        setInfoMessage("");
        setIsTakingLong(false);

        // Start 30-second timer
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsTakingLong(true);
        }, 30000);

        // Construct URL
        const endpoints = {
            policies: "/api/forecasting/law_predict",
            profiles: "/api/forecasting/profiles",
            jobs: "/api/forecasting/jobsd-forecast",
            courses: "/api/forecasting/courses",
        };

        const queryParams = new URLSearchParams();
        for (const key in params) {
            if (key === 'selectedOccupation') continue;
            if (key === 'source' && params[key] === 'All') continue;
            if (sourceType === 'jobs' && key === 'keywords') continue;
            if (sourceType !== 'jobs' && key === 'occupation_ids') continue;

            if (params[key] !== null && params[key] !== '') {
                queryParams.append(key, params[key]);
            }
        }
        
        const url = `${process.env.REACT_APP_API_URL_ESCOPLUS_SKILLS_EXTENDER}${endpoints[sourceType]}?${queryParams.toString()}`;

        axios.get(url)
            .then((res) => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setLoading(false);

                // Check for "processing" status
                if (res.data && res.data.status === "processing") {
                    setInfoMessage(`${res.data.message} Estimated completion: ${res.data.estimated_completion}`);
                    return;
                }

                setResults(res.data);
            })
            .catch((err) => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setLoading(false);

                if (err.response && err.response.status === 504) {
                    setInfoMessage("The forecasting is still running in the background. Please try clicking 'Forecast' again in a few moments.");
                } else {
                    setInfoMessage(err.response?.data?.detail || "An error occurred during forecasting.");
                }
                console.error("Forecasting error:", err);
            });
    };

    return (
        <>
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Taxonomy Forecasting via Link Prediction</CardTitle>
                            <p className="card-category">Select a data source to predict future skill relationships.</p>
                        </CardHeader>
                        <CardBody>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="sourceType">Data Source</Label>
                                            <Input type="select" name="sourceType" value={sourceType} onChange={handleSourceTypeChange} disabled={loading}>
                                                <option value="courses">Courses</option>
                                                <option value="jobs">Jobs</option>
                                                <option value="profiles">Profiles</option>
                                                <option value="policies">Law & Policies</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col md="9">
                                        <FormGroup>
                                            {sourceType === 'jobs' ? (
                                                <>
                                                    <Label>Occupation (required)</Label>
                                                    <OccupationSelection 
                                                        selectedValue={params.selectedOccupation}
                                                        onChange={handleOccupationChange}
                                                        disabled={loading}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <Label for="keywords">Keywords (comma-separated)</Label>
                                                    <Input type="text" name="keywords" value={params.keywords} onChange={handleParamChange} disabled={loading} />
                                                </>
                                            )}
                                        </FormGroup>
                                    </Col>
                                </Row>
                                
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="source">Filter by Source</Label>
                                            <Input type="select" name="source" value={params.source} onChange={handleParamChange} disabled={loading}>
                                                {(sourceOptions[sourceType] || []).map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="similarity_threshold">Similarity Threshold</Label>
                                            <Input type="number" step="0.05" name="similarity_threshold" value={params.similarity_threshold} onChange={handleParamChange} disabled={loading} />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="top_k">Top K Predictions</Label>
                                            <Input type="number" name="top_k" value={params.top_k} onChange={handleParamChange} disabled={loading} />
                                        </FormGroup>
                                    </Col>
                                     <Col md="3">
                                        <FormGroup>
                                            <Label for="method">Prediction Method</Label>
                                            <Input type="select" name="method" value={params.method} onChange={handleParamChange} disabled={loading}>
                                                <option value="adamic_adar">Adamic-Adar</option>
                                                <option value="resource_allocation">Resource Allocation</option>
                                                <option value="jaccard">Jaccard</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Button color="primary" type="submit" disabled={loading}>
                                    Forecast
                                </Button>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md="12">
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <div className="lds-dual-ring"></div>
                            {isTakingLong && (
                                <p style={{ marginTop: "20px", color: "#666", fontWeight: "bold" }}>
                                    Predicting links may take some time depending on the graph size...
                                </p>
                            )}
                        </div>
                    ) : infoMessage ? (
                        <Card>
                            <CardBody style={{ textAlign: "center", padding: "40px" }}>
                                <h6 className="text-info">{infoMessage}</h6>
                            </CardBody>
                        </Card>
                    ) : results ? (
                        <Row>
                            <Col md="4">
                                <Card>
                                    <CardHeader><CardTitle tag="h5">Forecast Summary</CardTitle></CardHeader>
                                    <CardBody>
                                        <ListGroup flush>
                                            {Object.entries(results.summary).map(([key, value]) => {
                                                if (key === 'Confidence distribution') return null;
                                                return (
                                                    <ListGroupItem key={key} className="d-flex justify-content-between align-items-center">
                                                        <span>{key}</span>
                                                        <span className="font-weight-bold">{value}</span>
                                                    </ListGroupItem>
                                                );
                                            })}
                                        </ListGroup>
                                        {results.summary['Confidence distribution'] && (
                                            <>
                                                <hr/>
                                                <h6>Confidence Distribution</h6>
                                                <ListGroup flush>
                                                    {Object.entries(results.summary['Confidence distribution']).map(([level, count]) => (
                                                        <ListGroupItem key={level} className="d-flex justify-content-between align-items-center">
                                                            <span>{level}</span>
                                                            <span className="font-weight-bold">{count}</span>
                                                        </ListGroupItem>
                                                    ))}
                                                </ListGroup>
                                            </>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md="8">
                                <Card>
                                    <CardHeader><CardTitle tag="h5">Predicted Skill Links</CardTitle></CardHeader>
                                    <CardBody>
                                        <Table responsive hover>
                                            <thead className="text-primary">
                                                <tr>
                                                    <th>Source Skill</th>
                                                    <th>Target Skill</th>
                                                    <th>Score</th>
                                                    <th>Confidence</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.predicted_links.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.source}</td>
                                                        <td>{item.target}</td>
                                                        <td>{item.predicted_score?.toFixed(3)}</td>
                                                        <td>{item.emoji} {item.confidence_level}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    ) : searchStarted ? (
                        <div style={{ textAlign: "center", padding: "20px" }}><h6>No predictions available for these parameters.</h6></div>
                    ) : null}
                </Col>
            </Row>
        </>
    );
};

export default TaxonomyForecasting;