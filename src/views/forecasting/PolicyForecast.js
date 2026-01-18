import React, { useState, useCallback, useMemo } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col, Button,
  Alert, Spinner, Input, Label, FormGroup, Badge
} from "reactstrap";
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL_SKILL_AGEING;

const PolicyForecast = () => {
    const [loading, setLoading] = useState(false);
    const [keywords, setKeywords] = useState('data');
    const [horizon, setHorizon] = useState(6);
    const [maxPages, setMaxPages] = useState(10);
    const [forecastResults, setForecastResults] = useState(null);
    const [summary, setSummary] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState("");
    const [error, setError] = useState(null);

    // Sort skill names alphabetically
    const sortedSkillKeys = useMemo(() => {
        if (!forecastResults) return [];
        return Object.keys(forecastResults).sort();
    }, [forecastResults]);

    const handleFetchForecast = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/forecast/policy_skill_forecast`, {
                params: { 
                    keywords: keywords,
                    horizon: horizon, 
                    max_pages: maxPages 
                }
            });
            
            const results = response.data.results;
            setForecastResults(results);
            setSummary(response.data.summary);
            
            // Auto-select the first skill in the sorted list
            const skillKeys = Object.keys(results).sort();
            if (skillKeys.length > 0) {
                setSelectedSkill(skillKeys[0]);
            } else {
                setError("No skills were forecasted for these keywords.");
            }
            
        } catch (err) {
            setError("Failed to fetch policy forecast data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [keywords, horizon, maxPages]);

    const chartData = useMemo(() => {
        if (!forecastResults || !selectedSkill || !forecastResults[selectedSkill]) return [];
        const data = forecastResults[selectedSkill];
        
        const historyPoints = data.history.map(item => ({
            date: item.date,
            history: item.count,
            prediction: null
        }));

        const predictionPoints = data.prediction.map(item => ({
            date: item.date,
            history: null,
            prediction: item.absolute
        }));

        // Continuity trick: connect history line to prediction line
        if (historyPoints.length > 0 && predictionPoints.length > 0) {
            predictionPoints[0].history = historyPoints[historyPoints.length - 1].history;
        }

        return [...historyPoints, ...predictionPoints];
    }, [forecastResults, selectedSkill]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle tag="h4">Policy Skill Forecast Settings</CardTitle>
                </CardHeader>
                <CardBody>
                    <Row style={{ justifyContent: "center" }}>
                        <Col md="4">
                            <FormGroup>
                                <Label for="keywordInput">Keywords</Label>
                                <Input 
                                    id="keywordInput" 
                                    type="text" 
                                    placeholder="e.g., data, waste management" 
                                    value={keywords} 
                                    onChange={e => setKeywords(e.target.value)} 
                                />
                            </FormGroup>
                        </Col>
                        <Col md="2">
                            <FormGroup>
                                <Label for="horizonInput">Horizon</Label>
                                <Input 
                                    id="horizonInput"
                                    type="number" 
                                    value={horizon} 
                                    onChange={e => setHorizon(parseInt(e.target.value, 10))} 
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
                        <Button color="primary" onClick={handleFetchForecast} disabled={loading}>
                            {loading ? <><Spinner size="sm" /> Processing...</> : 'Apply Forecast'}
                        </Button>
                    </Row>
                </CardBody>
            </Card>

            {error && <Alert color="danger">{error}</Alert>}

            {/* Summary Information */}
            {summary && (
                <Alert color="info" className="d-flex justify-content-between align-items-center">
                    <span>
                        <strong>Summary:</strong> {summary["Skills detected"]} skills detected. 
                        <Badge color="success" className="ms-2">{summary["Forecasted"]} Forecasted</Badge>
                        <Badge color="secondary" className="ms-2">{summary["Skipped"]} Skipped (Insufficient data)</Badge>
                    </span>
                </Alert>
            )}

            {/* Chart Area */}
            {forecastResults && selectedSkill && (
                <Card>
                    <CardBody>
                        <Row className="mb-3">
                            <Col md="8">
                                <h4 className="mb-0">Skill: <strong>{selectedSkill}</strong></h4>
                            </Col>
                            <Col md="4">
                                <div className="d-flex align-items-center justify-content-end">
                                    <Label for="skillSelect" className="me-2 mb-0">Select Skill:</Label>
                                    <Input 
                                        type="select" 
                                        id="skillSelect" 
                                        style={{ width: '250px' }}
                                        value={selectedSkill} 
                                        onChange={e => setSelectedSkill(e.target.value)}
                                    >
                                        {sortedSkillKeys.map(skill => (
                                            <option key={skill} value={skill}>{skill}</option>
                                        ))}
                                    </Input>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ width: '100%', height: 450 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{fontSize: 11}} 
                                        minTickGap={30}
                                    />
                                    <YAxis tick={{fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
                                    />
                                    <Legend verticalAlign="top" height={40}/>
                                    
                                    <Line 
                                        type="monotone" 
                                        dataKey="history" 
                                        name="Historical Mention Count" 
                                        stroke="#6610f2" 
                                        strokeWidth={3} 
                                        dot={false}
                                    />
                                    
                                    <Line 
                                        type="monotone" 
                                        dataKey="prediction" 
                                        name="Policy Forecast" 
                                        stroke="#28a745" 
                                        strokeWidth={3} 
                                        strokeDasharray="5 5"
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>
            )}
        </>
    );
};

export default PolicyForecast;