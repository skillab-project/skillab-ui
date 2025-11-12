import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardBody,
    Row,
    Col,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
    Spinner
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';
import PoliciesMain from "./policies/PoliciesMain";
import KPIsMain from "./kpis/KPIsMain";
import MetricsMain from "./metrics/MetricsMain";
import KPIsSetup from "./kpis/KPIsSetup";
import Workflows from "./Workflows";

const API_BASE_URL = process.env.REACT_APP_API_URL_KPI;
const POLICY_API_URL = `${API_BASE_URL}/policy`;
const KPI_API_URL = `${API_BASE_URL}/kpi`;
const METRIC_API_URL = `${API_BASE_URL}/indicator`;


function ManagePolicies() {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [policies, setPolicies] = useState([]);
    const [kpis, setKpis] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPolicies = useCallback(async () => {
        try {
            const response = await axios.get(`${POLICY_API_URL}/all`);
            setPolicies(response.data);
        } catch (err) {
            setError("Failed to fetch policies.");
            console.error(err);
        }
    }, []);

    const fetchKpis = useCallback(async () => {
        try {
            const response = await axios.get(`${KPI_API_URL}/all`);
            setKpis(response.data);
        } catch (err) {
            setError("Failed to fetch KPIs.");
            console.error(err);
        }
    }, []);

    const fetchMetrics = useCallback(async () => {
        try {
            const response = await axios.get(`${METRIC_API_URL}/all`);
            setMetrics(response.data);
        } catch (err) {
            setError("Failed to fetch metrics.");
            console.error(err);
        }
    }, []);
    
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            await Promise.all([fetchPolicies(), fetchKpis(), fetchMetrics()]);
            setIsLoading(false);
        };
        fetchAllData();
    }, [fetchPolicies, fetchKpis, fetchMetrics]);


    const handleAddPolicy = async (newPolicy) => {
        try {
            await axios.post(POLICY_API_URL, newPolicy);
            await fetchPolicies();
            alert('Policy created successfully!');
        } catch (error) {
            console.error("There was an error creating the policy!", error);
            alert('Failed to create policy.');
        }
    };
    
    const handleAddMetric = async (newMetric) => {
        try {
            await axios.post(METRIC_API_URL, newMetric);
            await fetchMetrics();
            alert(`Metric "${newMetric.name}" created successfully!`);
        } catch (error) {
            console.error("Error creating metric:", error);
            alert(`Error creating metric: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleAddKpi = async (kpiData) => {
        try {
            const { name, equation, policyName, targetValue, targetTime } = kpiData;
            const createPayload = { name, equation, policyName };
            await axios.post(KPI_API_URL, createPayload);

            if (targetValue || targetTime) {
                const params = new URLSearchParams();
                params.append('name', name);
                if (targetValue) params.append('targetValue', targetValue);
                if (targetTime) params.append('targetTime', targetTime);
                await axios.put(`${KPI_API_URL}?${params.toString()}`);
            }

            await fetchKpis();
            await fetchPolicies();
            alert(`KPI "${name}" created successfully!`);
        } catch (error) {
            console.error("Error creating KPI:", error);
            alert(`Failed to create KPI. Error: ${error.response?.data?.message || error.message}`);
        }
    };


    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    if (isLoading) {
        return <div className="content text-center"><Spinner>Loading...</Spinner></div>;
    }
    if (error) {
        return <div className="content text-center text-danger"><h3>Error</h3><p>{error}</p></div>;
    }

    return (
        <div className="content">
            <Nav tabs style={{marginBottom:"5px"}}>
                <NavItem style={{cursor:"pointer"}}>
                    <NavLink
                        className={classnames({
                            active:
                                currentActiveTab === '1'
                        })}
                        onClick={() => { toggle('1'); }}
                    >
                        Policies
                    </NavLink>
                </NavItem>
                <NavItem style={{cursor:"pointer"}}>
                    <NavLink
                        className={classnames({
                            active:
                                currentActiveTab === '2'
                        })}
                        onClick={() => { toggle('2'); }}
                    >
                        KPIs
                    </NavLink>
                </NavItem>
                <NavItem style={{cursor:"pointer"}}>
                    <NavLink
                        className={classnames({
                            active:
                                currentActiveTab === '3'
                        })}
                        onClick={() => { toggle('3'); }}
                    >
                        Metrics
                    </NavLink>
                </NavItem>
                <NavItem style={{cursor:"pointer"}}>
                    <NavLink
                        className={classnames({
                            active:
                                currentActiveTab === '4'
                        })}
                        onClick={() => { toggle('4'); }}
                    >
                        KPIs-Setup
                    </NavLink>
                </NavItem>
                <NavItem style={{cursor:"pointer"}}>
                    <NavLink
                        className={classnames({
                            active:
                                currentActiveTab === '5'
                        })}
                        onClick={() => { toggle('5'); }}
                    >
                        Workflows
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={currentActiveTab}>
                <TabPane tabId="1">
                    <PoliciesMain policies={policies} onPolicyCreated={handleAddPolicy} />
                </TabPane>

                <TabPane tabId="2">
                    <KPIsMain kpis={kpis} />
                </TabPane>
                
                <TabPane tabId="3">
                    <MetricsMain metrics={metrics} onMetricCreated={handleAddMetric} />
                </TabPane>
                
                <TabPane tabId="4">
                    <KPIsSetup 
                        policies={policies} 
                        availableMetrics={metrics} 
                        onKpiCreated={handleAddKpi} 
                    />
                </TabPane>
                
                <TabPane tabId="5">
                    <Workflows />
                </TabPane>
            </TabContent>
        </div>
    );
}

export default ManagePolicies;