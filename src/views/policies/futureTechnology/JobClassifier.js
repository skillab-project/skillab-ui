import React, { useState, useCallback } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col, Button,
  Alert, Spinner, Input, Label, FormGroup, Table, Badge
} from "reactstrap";
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL_ROLE_CLASSIFICATION;


const JobClassifier = () => {
    const [loading, setLoading] = useState(false);
    const [keywords, setKeywords] = useState('');
    const [maxPages, setMaxPages] = useState(10);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleApiCall = useCallback(async () => {
        if (!keywords) {
            setError("Please enter keywords.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/analysis/jobs_emergingdck_train`, null, {
                params: {
                    keywords: keywords,
                    max_pages: maxPages,
                    model_type: 'xgboost'
                }
            });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || "An error occurred while fetching data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [keywords, maxPages]);

    return (
            <Card>
                <CardHeader><CardTitle tag="h4">Job Classifier</CardTitle></CardHeader>
                <CardBody>
                    <Row style={{ justifyContent: "center" }}>
                        <Col md="4">
                            <FormGroup>
                                <Label for="keywordInput">Keywords (required)</Label>
                                <Input 
                                    id="keywordInput" 
                                    type="text" 
                                    placeholder="e.g., python, software developer" 
                                    value={keywords} 
                                    onChange={e => setKeywords(e.target.value)} 
                                />
                            </FormGroup>
                        </Col>
                        <Col md="2">
                            <FormGroup>
                                <Label for="maxPagesInput">Max Pages</Label>
                                <Input 
                                    id="maxPagesInput" 
                                    type="number" 
                                    value={maxPages} 
                                    onChange={e => setMaxPages(parseInt(e.target.value, 10))} 
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row style={{ justifyContent: "center" }} className="mb-3">
                        <Button color="primary" onClick={handleApiCall} disabled={loading}>
                            {loading ? <><Spinner size="sm" /> Processing...</> : 'Apply'}
                        </Button>
                    </Row>

                    {error && <Alert color="danger">{error}</Alert>}

                    {result && (
                        <div className="mt-4">
                            <Row>
                                <Col md="6">
                                    <h5>General Statistics</h5>
                                    <Table bordered size="sm">
                                        <tbody>
                                            <tr><td>Jobs Analyzed</td><td>{result.descriptive_statistics.total_jobs_analyzed}</td></tr>
                                            <tr><td>Emerging Jobs</td><td>{result.descriptive_statistics.num_emerging} ({result.descriptive_statistics.pct_emerging}%)</td></tr>
                                            <tr><td>Established Jobs</td><td>{result.descriptive_statistics.num_established} ({result.descriptive_statistics.pct_established}%)</td></tr>
                                            <tr><td>Avg Skills/Job</td><td>{result.descriptive_statistics.avg_skills_per_job}</td></tr>
                                        </tbody>
                                    </Table>
                                </Col>
                                
                                <Col md="6">
                                    <h5>Top 10 Most Common Skills</h5>
                                    <Table striped size="sm">
                                        <thead>
                                            <tr><th>Skill</th><th>Count</th></tr>
                                        </thead>
                                        <tbody>
                                            {result.descriptive_statistics.top_10_most_common_skills.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.skill}</td>
                                                    <td><Badge color="info">{item.count}</Badge></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>

                            <hr />

                            <Row>
                                <Col md="6">
                                    <h5 className="text-success">Global Top Emerging Skills</h5>
                                    <Table striped size="sm">
                                        <thead>
                                            <tr><th>Skill</th><th>Impact Score</th></tr>
                                        </thead>
                                        <tbody>
                                            {result.global_top_emerging_skills.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.skill}</td>
                                                    <td>{item.global_impact.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Col>
                                <Col md="6">
                                    <h5 className="text-danger">Global Top Established Skills</h5>
                                    <Table striped size="sm">
                                        <thead>
                                            <tr><th>Skill</th><th>Impact Score</th></tr>
                                        </thead>
                                        <tbody>
                                            {result.global_top_established_skills.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.skill}</td>
                                                    <td>{item.global_impact.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>
                        </div>
                    )}
                </CardBody>
            </Card>
    );
}

export default JobClassifier;