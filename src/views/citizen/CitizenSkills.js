import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, CardHeader, CardTitle, Input } from 'reactstrap';
import SkillSelection from './SkillSelection';
import {getId} from "../../utils/Tokens";
import axios from "axios";


const CitizenSkills = ({ skills, setSkills }) => {
    const handleOnAddSkill = async (selectedSkill) => {
        console.log('Skill received:', selectedSkill);
        if(selectedSkill.skill!='' && selectedSkill.years!=''){
            setSkills((prevSkills) => [...prevSkills, selectedSkill]);

            try {
                const userId = await getId();
                const response = await axios.put(
                    process.env.REACT_APP_API_URL_USER_MANAGEMENT+'/user/'+userId+'/skills',
                    {
                        'skillId': selectedSkill.skill.id,
                        'skillLabel': selectedSkill.skill.label,
                        'years': selectedSkill.years
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                        }
                    }
                );
                console.log("Profile updated successfully:", response.data);
            }
            catch (error) {
                console.error("Error updating profile:", error);
            }  
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
                                            {skill.skill.label}
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

                <SkillSelection onAddSkill={handleOnAddSkill}/>
                
            </CardBody>
        </Card>
    );
}

export default CitizenSkills;