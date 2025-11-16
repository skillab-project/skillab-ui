import React, { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Spinner,
  Badge
} from "reactstrap";
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Define constants for easier management
const API_URL = process.env.REACT_APP_API_URL_OCCUPATIONAL_DEMAND_FORECASTER + "/forecast";
const OCCUPATIONS = [
  "Applications programmers",
  "Software developers",
  "Systems analysts",
  "Web and multimedia developers",
  "Chemical engineers",
  "Chemists",
  "Environmental protection professionals"
];

const ForecastingTimeseries = ({}) => {
  // State for user inputs
  const [selectedOccupation, setSelectedOccupation] = useState(OCCUPATIONS[0]);
  const [horizon, setHorizon] = useState(12);

  // State for API response and UI status
  const [forecastResult, setForecastResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleForecast = async () => {
    setLoading(true);
    setError(null);
    setForecastResult(null);

    try {
      const response = await axios.post(API_URL, {
        occupation: selectedOccupation,
        method: "sarimax",
        horizon: parseInt(horizon, 10),
        start_after_last: true
      });
      setForecastResult(response.data);
    } catch (err) {
      console.error("Error fetching forecast data:", err);
      setError("Failed to fetch forecast data. The service might be temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  // useMemo will re-calculate the chart data only when forecastResult changes
  const chartData = useMemo(() => {
    if (!forecastResult) return [];

    // Map historical data
    const historicalData = forecastResult.ground_truth.map(item => ({
      date: item.ds.substring(0, 7), // Format date to 'YYYY-MM'
      historical: item.share_index,
    }));

    // Map forecast data
    const forecastData = forecastResult.forecast.map(item => ({
      date: item.ds.substring(0, 7),
      forecast: item.yhat,
      // Include confidence interval for the tooltip
      confidenceInterval: [item.yhat_lower, item.yhat_upper],
    }));

    // To connect the historical line to the forecast line smoothly,
    // we take the last historical point and add it to the first forecast point's data.
    const lastHistoricalPoint = historicalData[historicalData.length - 1];
    
    return [
      ...historicalData,
      {
        ...forecastData[0], // Takes the date from the first forecast point
        historical: lastHistoricalPoint.historical, // Takes the value from the last historical point
      },
      ...forecastData.slice(1), // Add the rest of the forecast points
    ];

  }, [forecastResult]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle tag="h4">Occupational Demand Forecasting</CardTitle>
      </CardHeader>
      <CardBody>
        {/* --- INPUT CONTROLS --- */}
        <Row className="mb-4">
          <Col md="5">
            <FormGroup>
              <Label for="occupationSelect">Occupation</Label>
              <Input
                type="select"
                id="occupationSelect"
                value={selectedOccupation}
                onChange={(e) => setSelectedOccupation(e.target.value)}
                disabled={loading}
              >
                {OCCUPATIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
              </Input>
            </FormGroup>
          </Col>
          <Col md="4">
            <FormGroup>
              <Label for="horizonInput">Forecast Horizon (Months)</Label>
              <Input
                type="number"
                id="horizonInput"
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                min="1"
                max="48"
                placeholder="e.g., 24"
                disabled={loading}
              />
            </FormGroup>
          </Col>
          <Col md="3" className="d-flex align-items-end">
            <Button color="primary" onClick={handleForecast} disabled={loading} block>
              {loading ? (
                <>
                  <Spinner size="sm" /> Forecasting...
                </>
              ) : (
                "Run Forecast"
              )}
            </Button>
          </Col>
        </Row>

        {/* --- RESULTS DISPLAY --- */}
        {error && <Alert color="danger">{error}</Alert>}
        
        {!forecastResult && !loading && !error && (
            <Alert color="info">
                Select an occupation and forecast horizon, then click "Run Forecast" to see the results.
            </Alert>
        )}

        {forecastResult && (
          <div className="mt-4">
            <hr/>
            <h5>
              Results for <Badge color="info">{forecastResult.occupation}</Badge>
            </h5>
            <p className="text-muted">
              Forecasting from {forecastResult.forecast_start} to {forecastResult.forecast_end} using the {forecastResult.method} method.
            </p>
            
            {/* --- CHART --- */}
            <div style={{ width: '100%', height: 400 }} className="mt-4">
              <ResponsiveContainer>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(tick) => tick.toFixed(4)} domain={['dataMin', 'dataMax']} />
                  <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(6) : value} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    name="Historical Data"
                    stroke="#007bff"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="#28a745"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default ForecastingTimeseries;