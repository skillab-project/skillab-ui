import React, { useState } from 'react';
import { Card, CardHeader, CardBody, CardTitle, ListGroup, ListGroupItem, Collapse, Badge, Row, Col, FormGroup, Label, Input, Button, Spinner } from 'reactstrap';

const EscoItem = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <ListGroupItem className="p-0 border-0 mb-2">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', borderRadius: '4px' }}
                className={`d-flex justify-content-between align-items-center p-2 ${isOpen ? 'bg-light border' : ''}`}
            >
                <span className="font-weight-bold" style={{fontSize: '0.9rem', textAlign: 'left'}}>{item.technology}</span>
                <span className="text-muted small">{isOpen ? '▼' : '▶'}</span>
            </div>
            <Collapse isOpen={isOpen}>
                <div className="pl-3 pr-2 py-2">
                    <ListGroup>
                        {item.matches.map((match, idx) => (
                            <ListGroupItem key={idx} className="d-flex justify-content-between align-items-center p-2 bg-white small border">
                                <span>{match.label}</span>
                                <Badge color="primary" pill>{match.score.toFixed(2)}</Badge>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </div>
            </Collapse>
        </ListGroupItem>
    );
};

const EscoColumn = ({ items, type }) => {
    const mapped = items.filter(item => item.matches && item.matches.length > 0);
    const notMapped = items.filter(item => !item.matches || item.matches.length === 0);

    return (
        <Card className="h-100 shadow-sm border">
            <CardHeader className="bg-white">
                <CardTitle tag="h5" className="mb-0 text-primary">
                    {type === 'occupations' ? 'Occupations' : 'Skills'}
                </CardTitle>
            </CardHeader>
            <CardBody style={{padding: '1rem'}}>
                <div className="mb-4">
                    <h6 className="text-dark font-weight-bold border-bottom pb-2 mb-3">Mapped ({mapped.length})</h6>
                    {mapped.length === 0 && <p className="text-muted small">No direct matches found.</p>}
                    <ListGroup flush>
                        {mapped.map((item, idx) => <EscoItem key={idx} item={item} />)}
                    </ListGroup>
                </div>
                <div>
                    <h6 className="text-dark font-weight-bold border-bottom pb-2 mb-3">Not Mapped / Emerging ({notMapped.length})</h6>
                    <ListGroup flush>
                        {notMapped.map((item, idx) => (
                            <ListGroupItem key={idx} className="p-2 border-0 d-flex justify-content-between align-items-center">
                                <span className="text-muted" style={{fontSize: '0.9rem'}}>{item.technology}</span>
                                <Badge color="warning" className="text-dark" pill>Emerging</Badge>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </div>
            </CardBody>
        </Card>
    );
};

const EscoMappingResults = ({ escoMapping, policyParams, setPolicyParams, onRecommendClick, loading }) => {
    if (!escoMapping) return <p>Run the ESCO mapping to see results here.</p>;

    return (
        <>
            <Row>
                <Col md="6"><EscoColumn items={escoMapping['occupations']} type="occupations" /></Col>
                <Col md="6"><EscoColumn items={escoMapping['skills']} type="skills" /></Col>
            </Row>
            <hr/>
            <h5>Generate Policy Recommendations</h5>
            <Row>
                <Col md="4">
                    <FormGroup>
                        <Label>Similarity Threshold</Label>
                        <Input 
                            type="number" step="0.1" 
                            value={policyParams.similarity_threshold} 
                            onChange={e => setPolicyParams({...policyParams, similarity_threshold: e.target.value})} 
                        />
                    </FormGroup>
                </Col>
                <Col md="4">
                    <FormGroup>
                        <Label>Max Actions per Tech</Label>
                        <Input 
                            type="number" 
                            value={policyParams.max_actions_per_tech} 
                            onChange={e => setPolicyParams({...policyParams, max_actions_per_tech: e.target.value})} 
                        />
                    </FormGroup>
                </Col>
                <Col md="4" className="d-flex align-items-end">
                    <Button color="info" block onClick={onRecommendClick} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Get Recommendations'}
                    </Button>
                </Col>
            </Row>
        </>
    );
};

export default EscoMappingResults;