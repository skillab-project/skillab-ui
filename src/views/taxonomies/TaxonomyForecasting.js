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

const fetchForecastingData = async (sourceType, params) => {
    const endpoints = {
        policies: "/api/forecasting/law_predict",
        profiles: "/api/forecasting/profiles",
        jobs: "/api/forecasting/jobsd-forecast",
        courses: "/api/forecasting/courses",
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
        source: "All",
        similarity_threshold: 0.7,
        top_k: 30,
        method: 'adamic_adar',
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
            const data = await fetchForecastingData(sourceType, params);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Taxonomy Forecasting via Link Prediction</CardTitle>
                            <p className="card-category">
                                Select a data source to predict future skill relationships.
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
                                            <Input type="select" name="source" id="source" value={params.source} onChange={handleParamChange}>
                                                {(sourceOptions[sourceType] || []).map(option => (
                                                    <option key={option} value={option}>{option}</option>
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
                                            <Label for="top_k">Top K Predictions</Label>
                                            <Input type="number" name="top_k" id="top_k" value={params.top_k} onChange={handleParamChange} />
                                        </FormGroup>
                                    </Col>
                                     <Col md="3">
                                        <FormGroup>
                                            <Label for="method">Prediction Method</Label>
                                            <Input type="select" name="method" id="method" value={params.method} onChange={handleParamChange}>
                                                <option value="adamic_adar">Adamic-Adar</option>
                                                <option value="resource_allocation">Resource Allocation</option>
                                                <option value="jaccard">Jaccard</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>
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
                                        <Col md="3">
                                            <FormGroup>
                                                <Label for="max_pages">Max Pages</Label>
                                                <Input type="number" name="max_pages" id="max_pages" value={params.max_pages} onChange={handleParamChange} />
                                            </FormGroup>
                                        </Col>
                                     </Row>
                                )}
                                <Button color="primary" type="submit" disabled={loading}>
                                    {loading ? <><Spinner size="sm" /> Forecasting...</> : "Forecast"}
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
                    <Col md="4">
                         <Card>
                            <CardHeader>
                                <CardTitle tag="h5">Forecast Summary</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <ListGroup flush>
                                    {Object.entries(results.summary).map(([key, value]) => {
                                        if (key === 'Confidence distribution') {
                                            return null;
                                        }
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
                             <CardHeader>
                                <CardTitle tag="h5">Predicted Skill Links</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table responsive hover>
                                    <thead className="text-primary">
                                        <tr>
                                            <th>Source Skill</th>
                                            <th>Target Skill</th>
                                            <th>Prediction Score</th>
                                            <th>Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.predicted_links.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.source}</td>
                                                <td>{item.target}</td>
                                                <td>{item.predicted_score.toFixed(3)}</td>
                                                <td>{item.emoji} {item.confidence_level}</td>
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

export default TaxonomyForecasting;