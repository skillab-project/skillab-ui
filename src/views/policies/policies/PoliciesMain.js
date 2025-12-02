import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  ListGroup,
  ListGroupItem,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Spinner,
  Badge,
  UncontrolledCollapse
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';

const EVAL_API_URL = process.env.REACT_APP_API_URL_POLICY_SUCCESS_EVALUATOR;

function PoliciesMain({ policies, onPolicyCreated }) {
    const [newPolicy, setNewPolicy] = useState({
        name: '',
        description: '',
        sector: '',
        region: ''
    });
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [activePolicyTab, setActivePolicyTab] = useState('1');
    const [evaluationResults, setEvaluationResults] = useState(null);
    const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);
    
    // Ref to store the timeout ID so we can clear it if the user switches tabs/policies
    const pollTimeoutRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPolicy(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleCreatePolicy = async (e) => {
        e.preventDefault();
        if (!newPolicy.name || !newPolicy.description || !newPolicy.sector || !newPolicy.region) {
            alert('Please fill in Name, Description, Sector, and Region.');
            return;
        }
        await onPolicyCreated(newPolicy);
        setNewPolicy({ name: '', description: '', sector: '', region: '' });
    };
    
    // Set first policy as selected by default when policies are loaded
    useEffect(() => {
        if (!selectedPolicy && policies.length > 0) {
            setSelectedPolicy(policies[0]);
        }
    }, [policies, selectedPolicy]);

    // Reset evaluation results and stop polling when switching policies
    useEffect(() => {
        setEvaluationResults(null);
        setIsLoadingEvaluation(false);
        
        // Cleanup function to stop polling if user switches policy
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
        }
    }, [selectedPolicy]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
            }
        };
    }, []);

    const togglePolicyTab = tab => {
        if (activePolicyTab !== tab) setActivePolicyTab(tab);
    }

    // Evaluation Logic
    const handleEvaluatePolicy = async () => {
        if (!selectedPolicy) return;

        setIsLoadingEvaluation(true);
        setEvaluationResults(null);

        // Clear any existing polling timers just in case
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

        try {
            // Initiate the Job
            const initResponse = await axios.post(EVAL_API_URL+"/jobs/policy", {
                policy_name: selectedPolicy.name
            });
            const { job_id } = initResponse.data;
            if (!job_id) {
                throw new Error("No job_id returned from initialization");
            }

            // Polling Function
            const checkStatus = async () => {
                try {
                    const statusResponse = await axios.get(EVAL_API_URL+"/jobs/"+job_id);
                    const { status, result, error } = statusResponse.data;

                    if (status === 'running') {
                        pollTimeoutRef.current = setTimeout(checkStatus, 5000);
                    } else if (status === 'success') {
                        const resultsMap = {};
                        
                        if (Array.isArray(result)) {
                            result.forEach(item => {
                                // Convert ID to string for consistency
                                resultsMap[String(item.kpi_id)] = item;
                            });
                        }
                        
                        setEvaluationResults(resultsMap);
                        setIsLoadingEvaluation(false);
                    } else {
                        // Job failed or unknown status
                        console.error("Evaluation Job Error:", error);
                        alert(`Evaluation failed: ${error || 'Unknown error occurred'}`);
                        setIsLoadingEvaluation(false);
                    }
                } catch (pollError) {
                    console.error("Error polling job status:", pollError);
                    setIsLoadingEvaluation(false);
                }
            };

            // Start the first status check
            checkStatus();
        } catch (error) {
            console.error("Error initiating evaluation:", error);
            alert("Failed to start policy evaluation. Check console for details.");
            setIsLoadingEvaluation(false);
        }
    };

    // Helper to render recommendation items
    const renderRecommendationItem = (rec, index) => (
        <Card key={index} body className="mb-2 bg-light border-0">
            <CardTitle tag="h6" className="d-flex justify-content-between">
                {rec.title}
                <Badge color="info">{rec.lever_type}</Badge>
            </CardTitle>
            <CardSubtitle tag="h6" className="mb-2 text-muted" style={{fontSize:'0.85rem'}}>
                Impact: {rec.expected_impact} | Time: {rec.time_to_effect}
            </CardSubtitle>
            <CardText style={{fontSize:'0.9rem'}}>
                <strong>Mechanism:</strong> {rec.mechanism}<br/>
                <strong>Rationale:</strong> {rec.rational}
            </CardText>
            {rec.risks_tradeoffs && (
                <div className="text-danger small mb-1">
                    <strong>Risk:</strong> {rec.risks_tradeoffs}
                </div>
            )}
        </Card>
    );

    return (
        <Row>
            <Col md="12" xl="4">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">Create New Policy</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Form onSubmit={handleCreatePolicy}>
                            <FormGroup>
                                <Label for="policyName">Name</Label>
                                <Input type="text" name="name" id="policyName" placeholder="e.g., GDPR Compliance" value={newPolicy.name} onChange={handleInputChange} required />
                            </FormGroup>
                            <FormGroup>
                                <Label for="policyDescription">Description</Label>
                                <Input type="textarea" name="description" id="policyDescription" value={newPolicy.description} onChange={handleInputChange} required />
                            </FormGroup>
                            <Row>
                                <Col md="6">
                                    <FormGroup>
                                        <Label for="policySector">Sector</Label>
                                        <Input type="text" name="sector" id="policySector" placeholder="e.g., Technology" value={newPolicy.sector} onChange={handleInputChange} required />
                                    </FormGroup>
                                </Col>
                                <Col md="6">
                                    <FormGroup>
                                        <Label for="policyRegion">Region</Label>
                                        <Input type="text" name="region" id="policyRegion" placeholder="e.g., EU" value={newPolicy.region} onChange={handleInputChange} required />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Button color="primary" type="submit" block>Create Policy</Button>
                        </Form>
                    </CardBody>
                </Card>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle tag="h5">Existing Policies</CardTitle>
                    </CardHeader>
                    <CardBody style={{padding:"0"}}>
                        <ListGroup flush>
                            {policies.map(policy => (
                                <ListGroupItem 
                                    key={policy.id}
                                    action
                                    tag="button"
                                    active={selectedPolicy && selectedPolicy.id === policy.id}
                                    onClick={() => setSelectedPolicy(policy)}
                                >
                                    {policy.name}
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </CardBody>
                </Card>
            </Col>

            <Col md="12" xl="8">
                {selectedPolicy ? (
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h5">Details for: {selectedPolicy.name}</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Nav tabs>
                                <NavItem style={{cursor:"pointer"}}>
                                    <NavLink className={classnames({ active: activePolicyTab === '1' })} onClick={() => { togglePolicyTab('1'); }}>
                                        Details
                                    </NavLink>
                                </NavItem>
                                <NavItem style={{cursor:"pointer"}}>
                                    <NavLink className={classnames({ active: activePolicyTab === '2' })} onClick={() => { togglePolicyTab('2'); }}>
                                        Associated KPIs & Evaluation
                                    </NavLink>
                                </NavItem>
                            </Nav>

                            <TabContent activeTab={activePolicyTab} className="mt-3">
                                <TabPane tabId="1">
                                    <p><strong>Description:</strong> {selectedPolicy.description || 'No description provided.'}</p>
                                    <p><strong>Sector:</strong> {selectedPolicy.sector || 'Not specified'}</p>
                                    <p><strong>Region:</strong> {selectedPolicy.region || 'Not specified'}</p>
                                </TabPane>
                                
                                <TabPane tabId="2">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5>KPIs for this Policy</h5>
                                        <Button 
                                            color="success" 
                                            onClick={handleEvaluatePolicy} 
                                            disabled={isLoadingEvaluation}
                                        >
                                            {isLoadingEvaluation ? <Spinner size="sm" /> : <i className="fa fa-cogs" />} 
                                            {isLoadingEvaluation ? ' Evaluating...' : ' Evaluate Success'}
                                        </Button>
                                    </div>

                                    {selectedPolicy.kpiList && selectedPolicy.kpiList.length > 0 ? (
                                        <div>
                                            {selectedPolicy.kpiList.map(kpi => {
                                                // Check if we have results for this specific KPI
                                                const result = evaluationResults ? evaluationResults[String(kpi.id)] : null;

                                                return (
                                                    <Card key={kpi.id} className="mb-3 border">
                                                        <CardBody>
                                                            <CardTitle tag="h5">{kpi.name}</CardTitle>
                                                            
                                                            {/* Show Trend Analysis if result exists */}
                                                            {result && (
                                                                <div className="mt-2 p-2" style={{backgroundColor: '#f8f9fa', borderLeft: '4px solid #007bff'}}>
                                                                    <strong>Trend Analysis: </strong> 
                                                                    {result.trend_analysis ? (
                                                                        <span>{result.trend_analysis}</span>
                                                                    ) : (
                                                                        <span className="text-muted">No trend data available.</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Recommendations Toggle */}
                                                            {result && result.recommendations && result.recommendations.length > 0 && (
                                                                <div className="mt-3">
                                                                    <Button 
                                                                        color="link" 
                                                                        id={`toggler-${kpi.id}`}
                                                                        className="p-0"
                                                                    >
                                                                        View Recommendations ({result.recommendations.length})
                                                                    </Button>
                                                                    <UncontrolledCollapse toggler={`#toggler-${kpi.id}`}>
                                                                        <div className="mt-3">
                                                                            {result.recommendations.map((rec, idx) => renderRecommendationItem(rec, idx))}
                                                                        </div>
                                                                    </UncontrolledCollapse>
                                                                </div>
                                                            )}
                                                        </CardBody>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p>No KPIs are associated with this policy yet.</p>
                                    )}
                                </TabPane>
                            </TabContent>
                        </CardBody>
                    </Card>
                ) : (
                    <Card>
                        <CardBody className="text-center">
                            <CardTitle tag="h5" className="text-muted">No Policy Selected</CardTitle>
                            <p className="text-muted">Please select a policy from the list on the left to view its details.</p>
                        </CardBody>
                    </Card>
                )}
            </Col>
        </Row>
    );
}

export default PoliciesMain;