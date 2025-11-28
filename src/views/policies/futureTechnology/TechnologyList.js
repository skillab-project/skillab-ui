import React, { useState } from 'react';
import { ListGroup, ListGroupItem, Collapse, Row, Col, FormGroup, Label, Input, Button, Spinner } from 'reactstrap';

const TechnologyItem = ({ tech }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <ListGroupItem className="p-0">
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                style={{ cursor: 'pointer', padding: '12px 20px' }}
                className={`d-flex justify-content-between align-items-center ${isOpen ? 'bg-light' : ''}`}
            >
                <strong style={{fontSize: '1.05rem'}}>{tech.name}</strong>
                <span className="text-muted">{isOpen ? '▼' : '▶'}</span>
            </div>
            <Collapse isOpen={isOpen}>
                <div className="p-3 border-top bg-white">
                    <p className="text-muted mb-0">{tech.description}</p>
                </div>
            </Collapse>
        </ListGroupItem>
    );
};

const TechnologyList = ({ technologies, escoParams, setEscoParams, onMapClick, loading }) => {
    return (
        <div>
            <h5>Found Technologies <small className="text-muted">(Click to expand)</small></h5>
            <ListGroup>
                {technologies.map((tech, index) => (
                    <TechnologyItem key={index} tech={tech} />
                ))}
            </ListGroup>
            <hr/>
            <h5>Map to ESCO</h5>
            <Row>
                <Col md="4">
                    <FormGroup>
                        <Label>Top N</Label>
                        <Input 
                            type="number" 
                            value={escoParams.top_n} 
                            onChange={e => setEscoParams({...escoParams, top_n: e.target.value})} 
                        />
                    </FormGroup>
                </Col>
                <Col md="4">
                    <FormGroup>
                        <Label>Threshold</Label>
                        <Input 
                            type="number" 
                            step="0.1" 
                            value={escoParams.threshold} 
                            onChange={e => setEscoParams({...escoParams, threshold: e.target.value})} 
                        />
                    </FormGroup>
                </Col>
                <Col md="4" className="d-flex align-items-end">
                    <Button color="success" block onClick={onMapClick} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Run ESCO Mapping'}
                    </Button>
                </Col>
            </Row>
        </div>
    );
};

export default TechnologyList;