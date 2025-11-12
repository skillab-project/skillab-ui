import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  Spinner,
} from "reactstrap";
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const REPORT_API_URL = process.env.REACT_APP_API_URL_KPI + '/report/kpi';

function KPIsMain({ kpis }) {
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);


  const handleSelectKpi = async (kpi) => {
    if (selectedKpi?.id === kpi.id) return; // Avoid re-fetching if already selected

    setSelectedKpi(kpi);
    setIsLoadingData(true);
    setKpiData([]); // Clear previous data

    try {
      const url = `${REPORT_API_URL}?kpiName=${encodeURIComponent(kpi.name)}`;
      const response = await axios.get(url);
      setKpiData(response.data);
    } catch (error) {
      alert(`Failed to fetch data for ${kpi.name}`);
      console.error("Error fetching KPI data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Format data for the chart
  const formattedChartData = kpiData.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(),
  }));

  return (
    <Row>
      <Col md="4">
        <Card>
          <CardHeader>
            <CardTitle tag="h5">Available KPIs</CardTitle>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            <ListGroup flush>
              {kpis.map(kpi => (
                <ListGroupItem
                  key={kpi.id}
                  action
                  tag="button"
                  active={selectedKpi?.id === kpi.id}
                  onClick={() => handleSelectKpi(kpi)}
                >
                  {kpi.name}
                </ListGroupItem>
              ))}
            </ListGroup>
          </CardBody>
        </Card>
      </Col>

      <Col md="8">
        {selectedKpi ? (
          <Card>
            <CardHeader>
              <CardTitle tag="h5">Details for: {selectedKpi.name}</CardTitle>
            </CardHeader>
            <CardBody>
              {isLoadingData ? (
                <div className="text-center p-5"><Spinner>Loading...</Spinner></div>
              ) : (
                <>
                  {/* Target Information */}
                  <Row className="mb-3">
                    <Col>
                      <strong>Target Value:</strong> {selectedKpi.targetValue ?? 'Not set'}
                    </Col>
                    <Col>
                      <strong>Target Time:</strong> {selectedKpi.targetTime ?? 'Not set'}
                    </Col>
                  </Row>
                  <hr />
                  
                  {/* Data Chart */}
                  <CardTitle tag="h6">Historical Performance</CardTitle>
                  {kpiData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={formattedChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" name={selectedKpi.name} stroke="#8884d8" strokeWidth={2} />
                        {/* Add a reference line for the target value if it exists */}
                        {selectedKpi.targetValue && (
                          <ReferenceLine y={selectedKpi.targetValue} label="Target" stroke="red" strokeDasharray="3 3" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>No historical data available to display a chart.</p>
                  )}
                  <hr />

                  {/* Data Points List */}
                  <CardTitle tag="h6">Data Points</CardTitle>
                  {kpiData.length > 0 ? (
                    <ListGroup style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {kpiData.slice().reverse().map((item, index) => ( // Show newest first
                        <ListGroupItem key={index} className="d-flex justify-content-between align-items-center">
                          <span>Date: {new Date(item.date).toLocaleDateString()}</span>
                          <span>Value: {item.value}</span>
                        </ListGroupItem>
                      ))}
                    </ListGroup>
                  ) : (
                    <p>No data points found.</p>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="text-center d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
              <div>
                <CardTitle tag="h5" className="text-muted">No KPI Selected</CardTitle>
                <p className="text-muted">Please select a KPI from the list to view its details.</p>
              </div>
            </CardBody>
          </Card>
        )}
      </Col>
    </Row>
  );
}

export default KPIsMain;