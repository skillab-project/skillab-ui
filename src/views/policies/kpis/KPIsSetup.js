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
} from "reactstrap";


function KPIsSetup({ policies, availableMetrics, onKpiCreated }) {
    const [kpiName, setKpiName] = useState('');
    const [equation, setEquation] = useState('');
    const [selectedPolicyName, setSelectedPolicyName] = useState('');
    const [targetValue, setTargetValue] = useState('');
    const [targetTime, setTargetTime] = useState('');


    // Set the default policy when the prop is available.
    useEffect(() => {
        if (policies.length > 0 && !selectedPolicyName) {
            setSelectedPolicyName(policies[0].name);
        }
    }, [policies, selectedPolicyName]);


    const handleSymbolClick = (symbol) => {
        setEquation(prev => `${prev}${prev ? ' ' : ''}${symbol} `);
    };

    const resetForm = () => {
        setKpiName('');
        setEquation('');
        setTargetValue('');
        setTargetTime('');
        if (policies.length > 0) {
            setSelectedPolicyName(policies[0].name);
        }
    }

    const handleCreateKPI = async (e) => {
        e.preventDefault();
        if (!kpiName || !equation || !selectedPolicyName) {
            alert('Please fill in KPI Name, Equation, and select a Policy.');
            return;
        }

        // Call the parent handler
        await onKpiCreated({
            name: kpiName,
            equation: equation.trim(),
            policyName: selectedPolicyName,
            targetValue,
            targetTime
        });
        resetForm();
    };
    
    const operatorButtons = ['+', '-', '*', '/', '%', '(', ')', '^'];

    return (
        <Row>
            <Col md="7">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h4">Create new KPI</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Form onSubmit={handleCreateKPI}>
                            <FormGroup>
                                <Label for="kpiName">KPI Name</Label>
                                <Input id="kpiName" placeholder="New KPI name" value={kpiName} onChange={e => setKpiName(e.target.value)} />
                            </FormGroup>

                            <FormGroup>
                                <Label for="policySelect">Policy</Label>
                                <Input type="select" id="policySelect" value={selectedPolicyName} onChange={e => setSelectedPolicyName(e.target.value)}>
                                    {policies.length === 0 && <option disabled>Loading policies...</option>}
                                    {policies.map(policy => (
                                        <option key={policy.id} value={policy.name}>{policy.name}</option>
                                    ))}
                                </Input>
                            </FormGroup>

                            <FormGroup>
                                <Label for="equation">Equation</Label>
                                <Input type="textarea" id="equation" rows="3" value={equation} onChange={e => setEquation(e.target.value)} />
                            </FormGroup>
                            
                            <div className="d-flex flex-wrap" style={{gap: '10px', marginBottom: '20px'}}>
                                {operatorButtons.map(op => (
                                    <Button key={op} color="success" outline style={{width: '45px'}} onClick={() => handleSymbolClick(op)}>
                                        {op}
                                    </Button>
                                ))}
                            </div>

                            <Row>
                                <Col md="6">
                                    <FormGroup>
                                        <Label for="targetValue">Target Value (Optional)</Label>
                                        <Input type="number" id="targetValue" placeholder="e.g., 95.5" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
                                    </FormGroup>
                                </Col>
                                <Col md="6">
                                    <FormGroup>
                                        <Label for="targetTime">Target Time (Optional)</Label>
                                        <Input type="text" id="targetTime" placeholder="e.g., 25/10/2027" value={targetTime} onChange={e => setTargetTime(e.target.value)} />
                                    </FormGroup>
                                </Col>
                            </Row>
                            
                            <Button color="primary" type="submit" block>Create KPI</Button>
                        </Form>
                    </CardBody>
                </Card>
            </Col>

            <Col md="5">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h4">Available Metrics</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <ListGroup flush>
                            {availableMetrics.map(metric => (
                                <ListGroupItem 
                                    key={metric.id} 
                                    action 
                                    tag="button"
                                    type="button" // Important to prevent form submission
                                    onClick={() => handleSymbolClick(metric.symbol)}
                                >
                                    {metric.name} - <strong>{metric.symbol}</strong>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
}

export default KPIsSetup;