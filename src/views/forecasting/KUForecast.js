import React, { useState, useCallback, useMemo } from "react";
import {
  Card, CardHeader, CardBody, CardTitle, Row, Col, Button,
  Alert, Spinner, Input, Label, FormGroup
} from "reactstrap";
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL_SKILL_AGEING;

const KUForecast = () => {
    const [loading, setLoading] = useState(false);
    const [organization, setOrganization] = useState('eclipse');
    const [horizon, setHorizon] = useState(6);
    const [forecastResults, setForecastResults] = useState(null);
    const [selectedKU, setSelectedKU] = useState("");
    const [error, setError] = useState(null);

    // 1. Natural Sort Function: Sorts K1, K2, K10 instead of K1, K10, K2
    const sortedKUKeys = useMemo(() => {
        if (!forecastResults) return [];
        return Object.keys(forecastResults).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10);
            const numB = parseInt(b.replace(/\D/g, ''), 10);
            return numA - numB;
        });
    }, [forecastResults]);

    const handleFetchForecast = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/forecast/ku_forecast_arima`, {
                params: { horizon, organization }
            });
            const results = response.data.results;
            setForecastResults(results);
            
            // Auto-select the first KU in the sorted list
            const firstKU = Object.keys(results).sort((a, b) => {
                const numA = parseInt(a.replace(/\D/g, ''), 10);
                const numB = parseInt(b.replace(/\D/g, ''), 10);
                return numA - numB;
            })[0];

            if (firstKU) setSelectedKU(firstKU);
            
        } catch (err) {
            setError("Failed to fetch forecast data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [horizon, organization]);

    const chartData = useMemo(() => {
        if (!forecastResults || !selectedKU || !forecastResults[selectedKU]) return [];
        const data = forecastResults[selectedKU];
        
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

        if (historyPoints.length > 0 && predictionPoints.length > 0) {
            predictionPoints[0].history = historyPoints[historyPoints.length - 1].history;
        }

        return [...historyPoints, ...predictionPoints];
    }, [forecastResults, selectedKU]);

    return (
        <>
            <Card>
                <CardHeader >
                    <CardTitle tag="h4">Forecast Settings</CardTitle>
                </CardHeader>
                <CardBody>
                    <Row style={{ justifyContent: "center" }}>
                        <Col md="4">
                            <FormGroup>
                                <Label for="orgInput">Organization</Label>
                                <Input 
                                    id="orgInput" 
                                    type="text" 
                                    placeholder="e.g., eclipse" 
                                    value={organization} 
                                    onChange={e => setOrganization(e.target.value)} 
                                />
                            </FormGroup>
                        </Col>
                        <Col md="2">
                            <FormGroup>
                                <Label for="horizonInput">Horizon (Months)</Label>
                                <Input 
                                    id="horizonInput"
                                    type="number" 
                                    value={horizon} 
                                    onChange={e => setHorizon(parseInt(e.target.value, 10))} 
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row style={{ justifyContent: "center" }} className="mb-3">
                        <Button color="primary" onClick={handleFetchForecast} disabled={loading}>
                            {loading ? <><Spinner size="sm" /> Processing...</> : 'Apply'}
                        </Button>
                    </Row>

                </CardBody>
            </Card>

            {error && <Alert color="danger">{error}</Alert>}

            {/* Chart Area */}
            {forecastResults && (
                <Card>
                    <CardBody>
                        <Row >
                            <Col md="6">
                                <h4 style={{margin:"auto"}}>Visualizing: <strong>{selectedKU}</strong></h4>
                            </Col>
                            <Col md="6">
                                <div style={{alignSelf:"center"}} className="d-flex align-items-center justify-content-end">
                                    <Label for="kuSelect" className="me-2 mb-0">Select KU:</Label>
                                    <Input 
                                        type="select" 
                                        id="kuSelect" 
                                        style={{ width: '200px' }}
                                        value={selectedKU} 
                                        onChange={e => setSelectedKU(e.target.value)}
                                    >
                                        {sortedKUKeys.map(ku => (
                                            <option key={ku} value={ku}>{ku}</option>
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
                                        tick={{fontSize: 12}} 
                                    />
                                    <YAxis tick={{fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
                                    />
                                    <Legend verticalAlign="top" height={40}/>
                                    
                                    <Line 
                                        type="monotone" 
                                        dataKey="history" 
                                        name="Historical Count" 
                                        stroke="#6610f2" 
                                        strokeWidth={3} 
                                        dot={false}
                                    />
                                    
                                    <Line 
                                        type="monotone" 
                                        dataKey="prediction" 
                                        name="Forecasted Horizon" 
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

export default KUForecast;