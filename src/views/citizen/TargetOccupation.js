import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, CardHeader, CardTitle } from 'reactstrap';
import OccupationSelection from './OccupationSelection';


const TargetOccupation = ({}) => {

    const handleApplyOccupationSelection = (selectedOccupation) => {
        console.log('Occupation received:', selectedOccupation);
    };

    return (
        <Row>
            <Col md="12">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h5">Target occupation</CardTitle>
                        <OccupationSelection onApplySelection={handleApplyOccupationSelection}/>
                    </CardHeader>
                    <CardBody>
                        <Row>
                            <Col md="12">
                                <Card>
                                    <CardBody>
                                        <Row>
                                            <Col md="12">
                                                Table for Skills needed
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md="12">
                                                Table for Institutes
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
};

export default TargetOccupation;