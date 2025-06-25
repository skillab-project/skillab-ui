import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, Button, CardHeader, CardTitle, Input } from 'reactstrap';
import SkillSelection from './SkillSelection';
import {getId} from "../../utils/Tokens";
import axios from "axios";


const CitizenSkills = ({ skills, setSkills }) => {
    const [editingSkillId, setEditingSkillId] = useState(null);
    const [editedSkill, setEditedSkill] = useState({ years: '' });

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

    const handleDeleteSkill = async (skillId) => {
        console.log("delete "+skillId);
        try {
            const userId = await getId();
            const response = await axios.delete(
                process.env.REACT_APP_API_URL_USER_MANAGEMENT+'/user/'+userId+'/skills?skillId='+skillId,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                    }
                }
            );
            const formattedSkills = response.data.map(skill => ({
                skill: {
                    id: skill.skillId,
                    label: skill.skillLabel
                },
                years: skill.years
            }));
            setSkills(formattedSkills);
            console.log("Deleted skill successfully:", response.data);
        }
        catch (error) {
            console.error("Error updating profile:", error);
        }
    }

    const handleSaveUpdateOfSkill = async (skill) => {
        try {
            const userId = await getId();
            const response = await axios.put(
                process.env.REACT_APP_API_URL_USER_MANAGEMENT+'/user/'+userId+'/skills/skill?skillId='+skill.skill.id+'&years='+editedSkill.years,
                {},{
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
                    }
                }
            );
            console.log("Updated skill:", response.data);

            // Update UI
            const updatedSkills = skills.map((s) =>
                s.skill.id === skill.skill.id
                    ? { ...s, years: editedSkill.years }
                    : s
            );
            setSkills(updatedSkills);

            // Reset edit state
            setEditingSkillId(null);
            setEditedSkill({ years: '' });
        } catch (error) {
            console.error("Error updating skill:", error);
        }
    }


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
                                            {editingSkillId === skill.skill.id ? (
                                                <>
                                                    <Col md="12" style={{padding:"0px"}}>
                                                        <Input
                                                            type="number"
                                                            value={editedSkill.years}
                                                            onChange={(e) =>
                                                                setEditedSkill({ ...editedSkill, years: e.target.value })
                                                            }
                                                            style={{ maxWidth: '150px', display: 'inline-block' }}
                                                        />
                                                    </Col>
                                                    <Col md="12" style={{padding:"0px"}}>
                                                        <Button
                                                            onClick={() => handleSaveUpdateOfSkill(skill)}
                                                            className="btn-round btn-icon"
                                                            color="success"
                                                            outline
                                                            size="sm"
                                                            style={{ marginLeft: "5px" }}
                                                        >
                                                            <i className="fa fa-save" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => setEditingSkillId(null)}
                                                            className="btn-round btn-icon"
                                                            color="danger"
                                                            outline
                                                            size="sm"
                                                            style={{ marginLeft: "5px" }}
                                                        >
                                                            <i className="fa fa-times-circle" />
                                                        </Button>
                                                    </Col>
                                                </>
                                            ) : (
                                                <>
                                                    {skill.years}
                                                    <Button
                                                            onClick={() => {
                                                                setEditingSkillId(skill.skill.id);
                                                                setEditedSkill({ years: skill.years });
                                                            }}
                                                            className="btn-round btn-icon"
                                                            color="success"
                                                            outline
                                                            size="sm"
                                                            style={{marginLeft:"5px"}}
                                                        >
                                                            <i className="fa fa-edit" />
                                                    </Button>
                                                    <Button
                                                            onClick={() => handleDeleteSkill(skill.skill.id)}
                                                            className="btn-round btn-icon"
                                                            color="danger"
                                                            outline
                                                            size="sm"
                                                            style={{marginLeft:"5px"}}
                                                        >
                                                            <i className="fa fa-trash" />
                                                    </Button>
                                                </>
                                            )}
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