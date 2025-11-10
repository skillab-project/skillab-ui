import React, { useState } from "react";
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
  Spinner,
  Alert,
  Table,
  ListGroup,
  ListGroupItem
} from "reactstrap";
import NetworkGraph from "./NetworkGraph";

const fetchAnalyticsData = async (sourceType, params) => {
    const endpoints = {
        policies: "/api/analysis/law-policies_extend_esco",
        profiles: "/api/analysis/profiles_extend_esco",
        jobs: "/api/analysis/jobs_ultra",
        courses: "/api/analysis/courses_ultra",
    };
    const endpoint = endpoints[sourceType];
    if (!endpoint) {
        throw new Error("Invalid source type selected.");
    }

    const queryParams = new URLSearchParams();
    for (const key in params) {
        if (key === 'source' && params[key] === 'All') {
            continue;
        }

        if (params[key] !== null && params[key] !== '') {
            queryParams.append(key, params[key]);
        }
    }
    const url = `${process.env.REACT_APP_API_URL_ESCOPLUS_SKILLS_EXTENDER}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "An error occurred while fetching data.");
    }
    return response.json();
};

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
        source: "All",
        similarity_threshold: 0.8,
        confidence_threshold: 0.6,
        min_upload_date: "",
        max_upload_date: "",
        max_pages: 10,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);

    const handleParamChange = (e) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSourceTypeChange = (e) => {
        const newSourceType = e.target.value;
        setSourceType(newSourceType);
        setResults(null); 

        const newOptions = sourceOptions[newSourceType] || [];
        setParams(prev => ({
            ...prev,
            source: newOptions[0] || ""
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const data = await fetchAnalyticsData(sourceType, params);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Normalize data before rendering to handle different response structures
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
                            <p className="card-category">
                                Select a data source and parameters to find new technology skills.
                            </p>
                        </CardHeader>
                        <CardBody>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="sourceType">Data Source</Label>
                                            <Input type="select" name="sourceType" id="sourceType" value={sourceType} onChange={handleSourceTypeChange}>
                                                <option value="courses">Courses</option>
                                                <option value="jobs">Jobs</option>
                                                <option value="profiles">Profiles</option>
                                                <option value="policies">Law & Policies</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col md="9">
                                        <FormGroup>
                                            <Label for="keywords">Keywords (comma-separated)</Label>
                                            <Input type="text" name="keywords" id="keywords" value={params.keywords} onChange={handleParamChange} required />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="source">Filter by Source</Label>
                                            <Input
                                                type="select"
                                                name="source"
                                                id="source"
                                                value={params.source}
                                                onChange={handleParamChange}
                                            >
                                                {(sourceOptions[sourceType] || []).map(option => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="similarity_threshold">Similarity Threshold</Label>
                                            <Input type="number" step="0.05" name="similarity_threshold" id="similarity_threshold" value={params.similarity_threshold} onChange={handleParamChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label for="confidence_threshold">Confidence Threshold</Label>
                                            <Input type="number" step="0.05" name="confidence_threshold" id="confidence_threshold" value={params.confidence_threshold} onChange={handleParamChange} />
                                        </FormGroup>
                                    </Col>
                                    {(sourceType === 'jobs' || sourceType === 'profiles') && (
                                         <Col md="3">
                                            <FormGroup>
                                                <Label for="max_pages">Max Pages</Label>
                                                <Input type="number" name="max_pages" id="max_pages" value={params.max_pages} onChange={handleParamChange} />
                                            </FormGroup>
                                        </Col>
                                    )}
                                </Row>
                                {sourceType === 'jobs' && (
                                     <Row>
                                        <Col md="3">
                                            <FormGroup>
                                                <Label for="min_upload_date">Min Upload Date</Label>
                                                <Input type="date" name="min_upload_date" id="min_upload_date" value={params.min_upload_date} onChange={handleParamChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <FormGroup>
                                                <Label for="max_upload_date">Max Upload Date</Label>
                                                <Input type="date" name="max_upload_date" id="max_upload_date" value={params.max_upload_date} onChange={handleParamChange} />
                                            </FormGroup>
                                        </Col>
                                     </Row>
                                )}
                                <Button color="primary" type="submit" disabled={loading}>
                                    {loading ? <><Spinner size="sm" /> Analyzing...</> : "Analyze"}
                                </Button>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>
            </Row>


            {loading && <div className="text-center p-4"><Spinner style={{ width: '3rem', height: '3rem' }} /></div>}
            {error && <Alert color="danger">{error}</Alert>}
            
            {results && (
                <Row>
                    <Col md="12" xl="8">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">Skill Network Visualization</CardTitle>
                            </CardHeader>
                            <CardBody style={{overflow: "hidden"}}>
                                <NetworkGraph data={results.network} />
                                <div className="d-flex justify-content-around mt-3">
                                    <span><span style={{color: '#1f77b4'}}>●</span> ESCO Skill</span>
                                    <span><span style={{color: '#ff7f0e'}}>●</span> Non-ESCO Skill</span>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="12" xl="4">
                        <Row>
                            <Col md="8" xl="12">
                                <Card>
                                    <CardHeader>
                                        <CardTitle tag="h5">Summary</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <ListGroup flush>
                                            {Object.entries(results.summary).map(([key, value]) => (
                                                <ListGroupItem key={key} className="d-flex justify-content-between align-items-center">
                                                    <span>{key}</span>
                                                    <span className="font-weight-bold">{value}</span>
                                                </ListGroupItem>
                                            ))}
                                        </ListGroup>
                                        <hr/>
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col md="4" xl="12">
                                <Card>
                                    <CardHeader>
                                        <CardTitle tag="h5">Proposed New Skills</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <ListGroup>
                                            {proposedExtensions.map(skill => (
                                                <ListGroupItem key={skill}>{skill}</ListGroupItem>
                                            ))}
                                        </ListGroup>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                    <Col md="12">
                        <Card>
                             <CardHeader>
                                <CardTitle tag="h5">High-Confidence Matches Preview</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table responsive>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>ESCO Skill</th>
                                            <th>New Technology Skill</th>
                                            <th>Similarity</th>
                                            <th>Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {skillsPreview.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.ESCO_skill}</td>
                                                <td>{item.non_ESCO_skill}</td>
                                                <td>{item.similarity.toFixed(3)}</td>
                                                <td>{item.confidence.toFixed(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default TaxonomyAnalytics;