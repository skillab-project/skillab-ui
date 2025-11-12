// src/components/policies/PoliciesMain.js

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
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';

// Define the base URL for your API for easier maintenance
const API_URL = process.env.REACT_APP_API_URL_KPI + '/policy';

function PoliciesMain({ policies, onPolicyCreated }) {
    const [newPolicy, setNewPolicy] = useState({
        name: '',
        description: '',
        sector: 'Technology',
        region: ''
    });
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [activePolicyTab, setActivePolicyTab] = useState('1');

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
        setNewPolicy({ name: '', description: '', sector: 'Technology', region: '' });
    };
    
    // Set first policy as selected by default when policies are loaded
    useEffect(() => {
        if (!selectedPolicy && policies.length > 0) {
            setSelectedPolicy(policies[0]);
        }
    }, [policies, selectedPolicy]);

    const togglePolicyTab = tab => {
        if (activePolicyTab !== tab) setActivePolicyTab(tab);
    }
    
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
                                        <Input type="select" name="sector" id="policySector" value={newPolicy.sector} onChange={handleInputChange}>
                                            <option>Technology</option>
                                            <option>Healthcare</option>
                                            <option>Finance</option>
                                            <option>Corporate</option>
                                            <option>Other</option>
                                        </Input>
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
                                        Associated KPIs
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
                                    {selectedPolicy.kpiList && selectedPolicy.kpiList.length > 0 ? (
                                        <>
                                            <h5>KPIs for this Policy:</h5>
                                            <ul>
                                                {selectedPolicy.kpiList.map(kpi => (
                                                    <li key={kpi.id}>{kpi.name}</li>
                                                ))}
                                            </ul>
                                        </>
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