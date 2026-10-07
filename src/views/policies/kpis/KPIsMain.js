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
import { DeleteIconButton, SoftHardDeleteModal, TrashCard } from '../common/DeletionUi';
import { apiErrorMessage, deleteKpi, getDeletedKpis, restoreKpi } from '../common/policyApi';

const REPORT_API_URL = process.env.REACT_APP_API_URL_KPI + '/report/kpi';

function KPIsMain({ kpis, onKpisChanged }) {
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState(null);
  const [deletedKpis, setDeletedKpis] = useState([]);

  const loadDeletedKpis = async () => {
    try {
      setDeletedKpis(await getDeletedKpis());
    } catch (error) {
      console.error("Error fetching deleted KPIs:", error);
    }
  };

  useEffect(() => {
    loadDeletedKpis();
  }, []);

  // Clear the selection if the selected KPI is no longer in the list (e.g. it was deleted)
  useEffect(() => {
    if (selectedKpi && !kpis.some(k => k.id === selectedKpi.id)) {
      setSelectedKpi(null);
      setKpiData([]);
    }
  }, [kpis, selectedKpi]);

  const refreshAfterChange = async () => {
    await Promise.all([loadDeletedKpis(), onKpisChanged ? onKpisChanged() : Promise.resolve()]);
  };

  const handleConfirmDelete = async (hard) => {
    try {
      await deleteKpi(kpiToDelete.id, hard);
    } catch (error) {
      throw new Error(apiErrorMessage(error));
    }
    setKpiToDelete(null);
    await refreshAfterChange();
  };

  const handleRestore = async (kpi) => {
    try {
      await restoreKpi(kpi.id);
      await refreshAfterChange();
    } catch (error) {
      alert(`Failed to restore KPI "${kpi.name}": ${apiErrorMessage(error)}`);
    }
  };

  const handleHardDeleteFromTrash = async (kpi) => {
    if (!window.confirm(`Permanently delete KPI "${kpi.name}" and all its historical values? This cannot be undone.`)) return;
    try {
      await deleteKpi(kpi.id, true);
      await refreshAfterChange();
    } catch (error) {
      alert(`Failed to delete KPI "${kpi.name}": ${apiErrorMessage(error)}`);
    }
  };


  const handleSelectKpi = async (kpi) => {
    if (selectedKpi?.id === kpi.id) return; // Avoid re-fetching if already selected

    setSelectedKpi(kpi);
    setIsLoadingData(true);
    setKpiData([]); // Clear previous data

    try {
      const url = `${REPORT_API_URL}?kpiName=${encodeURIComponent(kpi.name)}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessTokenSkillab')}` }
      });
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
                  tag="div"
                  role="button"
                  style={{ cursor: 'pointer' }}
                  className="d-flex justify-content-between align-items-center"
                  active={selectedKpi?.id === kpi.id}
                  onClick={() => handleSelectKpi(kpi)}
                >
                  <span>
                    {kpi.name}
                    {kpi.policyName && <small className={selectedKpi?.id === kpi.id ? 'd-block' : 'd-block text-muted'}>{kpi.policyName}</small>}
                  </span>
                  <DeleteIconButton
                    title={`Delete KPI ${kpi.name}`}
                    className={`p-0 ml-2 ${selectedKpi?.id === kpi.id ? 'text-white' : 'text-danger'}`}
                    onClick={() => setKpiToDelete(kpi)}
                  />
                </ListGroupItem>
              ))}
            </ListGroup>
          </CardBody>
        </Card>

        <TrashCard
          title="Deleted KPIs"
          items={deletedKpis}
          renderLabel={(kpi) => <>{kpi.name}{kpi.policyName && <small className="d-block">{kpi.policyName}</small>}</>}
          onRestore={handleRestore}
          onHardDelete={handleHardDeleteFromTrash}
          emptyText="No deleted KPIs."
        />

        <SoftHardDeleteModal
          isOpen={!!kpiToDelete}
          toggle={() => setKpiToDelete(null)}
          entityLabel="KPI"
          name={kpiToDelete?.name}
          details={kpiToDelete?.policyName && <p>Policy: <strong>{kpiToDelete.policyName}</strong></p>}
          softDescription="Hidden from the policy and lists and no longer recalculated. Its history is kept and it can be restored from 'Deleted KPIs'."
          hardDescription="Removes the KPI and all its historical values. The metrics it uses are kept. This cannot be undone."
          onConfirm={handleConfirmDelete}
        />
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