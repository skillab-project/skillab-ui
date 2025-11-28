import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Collapse, Badge, Row, Col, Alert } from 'reactstrap';

const getPriorityColor = (priority) => {
    if (!priority) return 'secondary';
    switch (priority.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'secondary';
    }
};

const ActionCard = ({ action }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card className="mb-2 border">
            <CardHeader 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white py-2"
                style={{ cursor: 'pointer' }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <span className="text-muted mr-2">{isOpen ? '▼' : '▶'}</span>
                        <strong className="text-primary">{action.area}</strong>
                        <span className="mx-2 text-muted">|</span>
                        <span className="text-dark" style={{fontWeight:'500'}}>
                            {action.action.substring(0, 60)}{action.action.length > 60 ? '...' : ''}
                        </span>
                    </div>
                    <Badge color={getPriorityColor(action.priority)} pill>{action.priority} Priority</Badge>
                </div>
            </CardHeader>
            <Collapse isOpen={isOpen}>
                <CardBody className="pt-2">
                    <div className="mb-3">
                        <strong>Full Action:</strong>
                        <p className="mb-0">{action.action}</p>
                    </div>
                    <Row>
                        <Col md="6">
                            <div className="mb-3 p-2 bg-light rounded">
                                <strong>Rationale:</strong>
                                <p className="mb-0 small">{action.rationale}</p>
                            </div>
                        </Col>
                        <Col md="6">
                            <div className="mb-3 p-2 bg-light rounded border-left border-danger" style={{borderLeftWidth:'4px'}}>
                                <strong>Risks:</strong>
                                <p className="mb-0 small text-danger">{action.risks}</p>
                            </div>
                        </Col>
                    </Row>
                    <Row className="mt-2">
                        <Col md="4">
                            <strong>Timeframe:</strong> <br/>
                            <Badge color="info" className="mt-1">{action.timeframe}</Badge>
                        </Col>
                        <Col md="4">
                            <strong>KPIs:</strong>
                            <ul className="pl-3 mt-1 small">
                                {action.KPIs && action.KPIs.map((kpi, k) => <li key={k}>{kpi}</li>)}
                            </ul>
                        </Col>
                        <Col md="4">
                            <strong>Stakeholders:</strong>
                            <div className="mt-1">
                                {action.stakeholders && action.stakeholders.map((s, sIdx) => (
                                    <Badge key={sIdx} color="light" className="border text-dark mr-1 mb-1">{s}</Badge>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Collapse>
        </Card>
    );
};

const RecommendationItem = ({ rec }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card className="mb-3 border shadow-sm">
            <CardHeader 
                onClick={() => setIsOpen(!isOpen)} 
                className={`d-flex justify-content-between align-items-center ${isOpen ? 'bg-primary text-white' : 'bg-light'}`}
                style={{ cursor: 'pointer' }}
            >
                <h5 className="mb-0">{rec.technology}</h5>
                <div>
                    <Badge color="light" className="text-dark mr-2">{rec.actions.length} Actions</Badge>
                    <span>{isOpen ? '▼' : '▶'}</span>
                </div>
            </CardHeader>

            <Collapse isOpen={isOpen}>
                <CardBody className="bg-light pt-3">
                    {rec.actions.map((action, idx) => (
                        <ActionCard key={idx} action={action} />
                    ))}
                </CardBody>
            </Collapse>
        </Card>
    );
};

const PolicyRecommendations = ({ data }) => {
    if (!data) return <p>Generate recommendations to see results here.</p>;
    const { recommendations } = data;

    if (!recommendations || recommendations.length === 0) {
        return <Alert color="info">No policy recommendations were generated based on the current parameters.</Alert>;
    }

    return (
        <>
            {recommendations.map((rec, idx) => (
                <RecommendationItem key={idx} rec={rec} />
            ))}
        </>
    );
};

export default PolicyRecommendations;