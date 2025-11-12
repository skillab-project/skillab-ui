import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  ListGroup,
  ListGroupItem,
  Spinner,
} from "reactstrap";
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const REPORT_API_URL = process.env.REACT_APP_API_URL_KPI + '/report/indicator';

function MetricsMain({ metrics, onMetricCreated }) {
  const [newMetric, setNewMetric] = useState({ name: '', symbol: '' });
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [metricData, setMetricData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [newReportValue, setNewReportValue] = useState('');
  const [useCurrentDate, setUseCurrentDate] = useState(true);
  const [customDate, setCustomDate] = useState(new Date().toISOString().slice(0, 16));


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMetric(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCreateMetric = async (e) => {
    e.preventDefault();
    if (!newMetric.name || !newMetric.symbol) {
        alert("Please provide both a name and a symbol.");
        return;
    }
    await onMetricCreated(newMetric);
    setNewMetric({ name: '', symbol: '' });
  };

  const handleSelectMetric = async (metric) => {
    setSelectedMetric(metric);
    setIsLoadingData(true);
    setMetricData([]); // Clear previous data immediately for better UX
    try {
        const url = `${REPORT_API_URL}?indicatorName=${encodeURIComponent(metric.name)}`;
        const response = await axios.get(url);
        setMetricData(response.data);
    } catch (error) {
        alert(`Failed to fetch data for ${metric.name}`);
        console.error("Error fetching metric data:", error);
    } finally {
        setIsLoadingData(false);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!newReportValue || isNaN(parseFloat(newReportValue))) {
        alert("Please enter a valid number for the value.");
        return;
    }

    const payload = {
        name: selectedMetric.name,
        value: parseFloat(newReportValue),
        date: useCurrentDate ? new Date().toISOString() : new Date(customDate).toISOString(),
    };

    try {
        await axios.post(REPORT_API_URL, payload);
        alert("New data point added!");
        setNewReportValue('');
        handleSelectMetric(selectedMetric);
    } catch (error) {
        alert(`Failed to add data: ${error.response?.data?.message || error.message}`);
    }
  }

  const formattedChartData = metricData.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(),
  }));

  return (
    <Row>
      <Col md="4">
        <Card>
          <CardHeader><CardTitle tag="h5">Create New Metric</CardTitle></CardHeader>
          <CardBody>
            <Form onSubmit={handleCreateMetric}>
              <FormGroup>
                <Label for="metricName">Name</Label>
                <Input id="metricName" name="name" placeholder="e.g., User Signups" value={newMetric.name} onChange={handleInputChange} />
              </FormGroup>
              <FormGroup>
                <Label for="metricSymbol">Symbol</Label>
                <Input id="metricSymbol" name="symbol" placeholder="e.g., USR_SGN" value={newMetric.symbol} onChange={handleInputChange} />
              </FormGroup>
              <Button color="primary" type="submit" block>Create Metric</Button>
            </Form>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle tag="h5">Available Metrics</CardTitle></CardHeader>
          <CardBody style={{padding: "0"}}>
            <ListGroup flush>
              {metrics.map(metric => (
                <ListGroupItem
                  key={metric.id}
                  action tag="button"
                  active={selectedMetric?.id === metric.id}
                  onClick={() => handleSelectMetric(metric)}
                >
                  {metric.name} ({metric.symbol})
                </ListGroupItem>
              ))}
            </ListGroup>
          </CardBody>
        </Card>
      </Col>

      <Col md="8">
        {selectedMetric ? (
          <Card>
            <CardHeader><CardTitle tag="h5">Details for: {selectedMetric.name}</CardTitle></CardHeader>
            <CardBody>
              {isLoadingData ? (
                <div className="text-center p-5"><Spinner>Loading...</Spinner></div>
              ) : (
                <>
                  <CardTitle tag="h6">Add New Value</CardTitle>
                  <Form onSubmit={handleAddReport} className="mb-4">
                    <Row>
                        <Col md="4">
                            <FormGroup>
                                <Label for="newValue">Value</Label>
                                <Input type="number" step="any" id="newValue" placeholder="Enter value" value={newReportValue} onChange={e => setNewReportValue(e.target.value)} />
                            </FormGroup>
                        </Col>
                        <Col md="6">
                            <FormGroup check inline className="pt-4">
                                <Label check>
                                    <Input type="checkbox" checked={useCurrentDate} onChange={() => setUseCurrentDate(!useCurrentDate)} />
                                    {' '}
                                    Use Current Date/Time
                                </Label>
                            </FormGroup>
                            {!useCurrentDate && (
                                <Input type="datetime-local" value={customDate} onChange={e => setCustomDate(e.target.value)} />
                            )}
                        </Col>
                        <Col md="2" className="d-flex align-items-end pb-3">
                            <Button color="success" type="submit" size="sm">Add</Button>
                        </Col>
                    </Row>
                  </Form>
                  
                  
                  <CardTitle tag="h6" className="mt-3">Historical Data Graph</CardTitle>
                  {metricData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formattedChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" name={selectedMetric.name} stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                  ) : <p>No data available to display a chart.</p>}


                  <CardTitle tag="h6" className="mt-3">Data Points</CardTitle>
                  {metricData.length > 0 ? (
                    <ListGroup style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {metricData.slice().reverse().map((item, index) => (
                        <ListGroupItem key={index} className="d-flex justify-content-between align-items-center">
                          <span>Date: {new Date(item.date).toLocaleDateString()}</span>
                          <span>Value: {item.value}</span>
                        </ListGroupItem>
                      ))}
                    </ListGroup>
                  ) : <p>No data points found for this metric.</p>}
                </>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="text-center d-flex align-items-center justify-content-center" style={{minHeight: '300px'}}>
              <div>
                <CardTitle tag="h5" className="text-muted">No Metric Selected</CardTitle>
                <p className="text-muted">Please select a metric from the list to view its details.</p>
              </div>
            </CardBody>
          </Card>
        )}
      </Col>
    </Row>
  );
}

export default MetricsMain;