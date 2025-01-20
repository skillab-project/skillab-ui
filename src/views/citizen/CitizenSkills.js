import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, CardHeader, CardTitle, Input } from 'reactstrap';


const CitizenSkills = ({}) => {
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');
    const [newSkillYears, setNewSkillYears] = useState('');

    const addSkill = () => {
        if(newSkill!='' && newSkillYears!=''){
            setSkills((prevSkills) => [...prevSkills, {name:newSkill,years:newSkillYears}]);
            setNewSkill('');
            setNewSkillYears('');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle tag="h5">My Skills</CardTitle>
            </CardHeader>
            <CardBody>
                <Row>
                    <Col md="12">
                        <Card>
                            <CardBody>
                                <Row>
                                    <Col md="8" style={{fontWeight:"bold"}}>
                                        Skills
                                    </Col>
                                    <Col md="4" style={{fontWeight:"bold"}}>
                                        Years
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {skills.map((skill) =>
                    <Row>
                        <Col md="12">
                            <Card style={{marginBottom:"10px"}}>
                                <CardBody>
                                    <Row>
                                        <Col md="8" style={{margin:"auto"}}>
                                            {skill.name}
                                        </Col>
                                        <Col md="4">
                                            {skill.years}
                                            <Button
                                                    className="btn-round btn-icon"
                                                    color="success"
                                                    outline
                                                    size="sm"
                                                    style={{margin:"0px", marginLeft:"5px"}}
                                                >
                                                    <i className="fa fa-edit" />
                                            </Button>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>)
                }

                <Row>
                    <Col md="12">
                        <Card style={{marginBottom:"5px"}}>
                            <CardBody>
                                <Row>
                                    <Col md="8">
                                        <Input
                                            placeholder="Skill"
                                            type="text"
                                            style={{textAlign:"center"}}
                                            value={newSkill} 
                                            onChange={(e) => setNewSkill(e.target.value)}
                                        />
                                    </Col>
                                    <Col md="4">
                                        <Input
                                            placeholder="Years"
                                            type="text"
                                            style={{textAlign:"center"}}
                                            value={newSkillYears} 
                                            onChange={(e) => setNewSkillYears(e.target.value)}
                                        />
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        <Button
                                className="btn-round btn-icon"
                                color="success"
                                outline
                                size="m"
                                onClick={() => addSkill()}
                            >
                                <i className="fa fa-plus-circle" />
                        </Button>
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
}

export default CitizenSkills;