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
  ListGroupItem,
  Badge
} from "reactstrap";
import axios from 'axios';
import NetworkGraph from "./NetworkGraph";
import OccupationSelection from "./OccupationSelection";
import "../../assets/css/loader.css";

const sourceOptions = {
    courses: ["All", "Udacity", "europass"],
    jobs: ["All", "OJA", "kariera.gr"],
    profiles: [
        "All", "stack-biology", "stack-chemistry", "stack-earthscience", "stack-electronics",
        "stack-interpersonal", "stack-law", "stack-linguistics", "stack-literature",
        "stack-math", "stack-philosophy", "stack-physics", "stack-politics",
        "stack-sports", "stack-stackoverflow"
    ],
    policies: ["eur_lex"],
};

const TaxonomyAnalytics = () => {
    const [sourceType, setSourceType] = useState("courses");
    const [params, setParams] = useState({
        keywords: "data",
        occupation_ids: "",
        selectedOccupation: null,
        source: "All",
        similarity_threshold: 0.8,
        confidence_threshold: 0.6,
        min_upload_date: "",
        max_upload_date: "",
    });

    const [loading, setLoading] = useState(false);
    const [isTakingLong, setIsTakingLong] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");
    const [results, setResults] = useState(null);
    const [searchStarted, setSearchStarted] = useState(false);

    // Ref for the 30-second timer
    const timerRef = useRef(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
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
        e.preventDefault();

        // Validation
        if (sourceType === 'jobs' && !params.occupation_ids) {
            setInfoMessage("Please select an occupation.");
            return;
        }
        if (sourceType !== 'jobs' && !params.keywords.trim()) {
            setInfoMessage("Keywords are required.");
            return;
        }

        // Reset States
        setLoading(true);
        setSearchStarted(true);
        setResults(null);
        setInfoMessage("");
        setIsTakingLong(false);

        // Start 30-second "taking long" timer
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsTakingLong(true);
        }, 30000);

        // Construct URL
        const endpoints = {
            policies: "/api/analysis/law-policies_extend_esco",
            profiles: "/api/analysis/profiles_extend_esco",
            jobs: "/api/analysis/jobs_ultra",
            courses: "/api/analysis/courses_ultra",
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

                // Handle the "processing" status from your new service logic
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
                    setInfoMessage("The analysis is still running in the background. Because this is a large dataset, it may take a few minutes. Please try clicking 'Analyze' again shortly.");
                } else {
                    setInfoMessage(err.response?.data?.detail || "An error occurred while fetching data. Please try again.");
                }
                console.error("Fetch error:", err);
            });
    };

    // Helper for rendering results
    const proposedExtensions = results?.proposed_extensions || 
                              (results?.associations ? results.associations.map(a => a.non_ESCO_skill) : []);
    const skillsPreview = results?.new_skills_preview || results?.associations || [];

    return (
        <>
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">ESCO Taxonomy Extension Analysis</CardTitle>
                            <p className="card-category">Select a data source and parameters to find new technology skills.</p>
                        </CardHeader>
                        <CardBody>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="sourceType">Data Source</Label>
                                            <Input type="select" name="sourceType" value={sourceType} onChange={handleSourceTypeChange}>
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
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <Label for="keywords">Keywords (comma-separated)</Label>
                                                    <Input type="text" name="keywords" value={params.keywords} onChange={handleParamChange} />
                                                </>
                                            )}
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="source">Filter by Source</Label>
                                            <Input type="select" name="source" value={params.source} onChange={handleParamChange}>
                                                {(sourceOptions[sourceType] || []).map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="similarity_threshold">Similarity Threshold</Label>
                                            <Input type="number" step="0.05" name="similarity_threshold" value={params.similarity_threshold} onChange={handleParamChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="confidence_threshold">Confidence Threshold</Label>
                                            <Input type="number" step="0.05" name="confidence_threshold" value={params.confidence_threshold} onChange={handleParamChange} />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Button color="primary" type="submit" disabled={loading}>
                                    Analyze
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
                                    The analysis might take some time as we are processing a large volume of data...
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
                        /* Results Section */
                        <Row>
                            <Col md="12" xl="8">
                                <Card>
                                    <CardHeader><CardTitle tag="h5">Skill Network Visualization</CardTitle></CardHeader>
                                    <CardBody style={{overflow: "hidden"}}>
                                        <NetworkGraph data={results.network} />
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md="12" xl="4">
                                <Card>
                                    <CardHeader><CardTitle tag="h5">Summary</CardTitle></CardHeader>
                                    <CardBody>
                                        <ListGroup flush>
                                            {results.summary && Object.entries(results.summary).map(([key, value]) => (
                                                <ListGroupItem key={key} className="d-flex justify-content-between align-items-center">
                                                    <span>{key}</span>
                                                    <span className="font-weight-bold">{String(value)}</span>
                                                </ListGroupItem>
                                            ))}
                                        </ListGroup>
                                    </CardBody>
                                </Card>
                                <Card className="mt-3">
                                    <CardHeader><CardTitle tag="h5">Proposed New Skills</CardTitle></CardHeader>
                                    <CardBody>
                                        <ListGroup>
                                            {proposedExtensions.map((skill, idx) => (
                                                <ListGroupItem key={idx}>{String(skill)}</ListGroupItem>
                                            ))}
                                        </ListGroup>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md="12">
                                <Card>
                                    <CardHeader><CardTitle tag="h5">Matches Preview</CardTitle></CardHeader>
                                    <CardBody>
                                        <Table responsive>
                                            <thead>
                                                <tr>
                                                    <th>ESCO Skill</th>
                                                    <th>New Skill</th>
                                                    <th>Similarity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {skillsPreview.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.ESCO_skill}</td>
                                                        <td>{item.non_ESCO_skill}</td>
                                                        <td>{item.similarity?.toFixed(3)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    ) : searchStarted ? (
                        <div style={{ textAlign: "center", padding: "20px" }}><h6>No results found for these parameters.</h6></div>
                    ) : null}
                </Col>
            </Row>
        </>
    );
};

export default TaxonomyAnalytics;