import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col, Button,
  Table, Badge
} from "reactstrap";
import axios from 'axios';
import OccupationSelection from "./OccupationSelection";

const API_BASE_URL = process.env.REACT_APP_API_URL_ROLE_CLASSIFICATION;

const JobClassifier = () => {
    const [loading, setLoading] = useState(false);
    const [isTakingLong, setIsTakingLong] = useState(false);
    const [search, setSearch] = useState(false);
    const [selectedOccupation, setSelectedOccupation] = useState(null);
    const [result, setResult] = useState(null);
    const [infoMessage, setInfoMessage] = useState("");

    // Ref to store the timeout ID
    const timerRef = useRef(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleApply = useCallback(async () => {
        if (!selectedOccupation && selectedOccupation?.id!= "") {
            return;
        }

        // Reset states for a new search
        setSearch(true);
        setLoading(true);
        setResult(null);
        setInfoMessage("");
        setIsTakingLong(false);

        // Start a 30-second timer
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsTakingLong(true);
        }, 30000);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/analysis/jobs_emergingdck_train`, null, 
            {
                params: {
                    occupation_ids: selectedOccupation.id,
                    model_type: 'xgboost',
                    max_jobs: 60000
                }
            });

            // Clear timer once response is received
            if (timerRef.current) clearTimeout(timerRef.current);
            setLoading(false);

            // Check for "processing" status from your new service result
            if (response.data && response.data.status === "processing") {
                setInfoMessage(response.data.message);
                return;
            }

            setResult(response.data);
        } catch (err) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setLoading(false);

            if (err.response && err.response.status === 504) {
                setInfoMessage("The analysis is still running in the background. Because this is a large dataset, it may take a few minutes. Please try clicking 'Apply' again shortly to view the results.");
            } else {
                setInfoMessage(err.response?.data?.detail || "An error occurred while fetching data. Please try again.");
            }
            console.error(err);
        }
    }, [selectedOccupation]);

    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h4">Job Classifier</CardTitle>
            </CardHeader>
            <CardBody>
                <Row style={{ justifyContent: "center", alignItems: "flex-end" }}>
                    <Col md="5">
                        <label className="form-label">Occupation (required)</label>
                        <OccupationSelection 
                            selectedValue={selectedOccupation} 
                            onChange={(occ) => setSelectedOccupation(occ)} 
                        />
                    </Col>
                    <Col md="2">
                        <Button color="primary" onClick={handleApply} disabled={loading} block>
                            Apply
                        </Button>
                    </Col>
                </Row>

                <hr />

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <div className="lds-dual-ring"></div>
                        {isTakingLong && (
                            <p style={{ marginTop: "15px", color: "#666", fontWeight: "bold" }}>
                                The analysis might take some time...
                            </p>
                        )}
                    </div>
                ) : !search ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                        Select an occupation and click Apply to start the analysis.
                    </div>
                ) : infoMessage ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <h6 className="text-info">{infoMessage}</h6>
                    </div>
                ) : result ? (
                    <div className="mt-4 animated fadeIn">
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
                                                <td>{item.global_impact?.toFixed(2)}</td>
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
                                                <td>{item.global_impact?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <h6>No data available</h6>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export default JobClassifier;