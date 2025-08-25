import React, { useState, useEffect } from "react";
import {Button, Card, CardHeader, CardBody, Row, Col, Table, Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input, } from "reactstrap";
import axios from 'axios';


function GapCompetition() {
    const [competitors, setCompetitors] = useState(["My company", "Accenture", "Deloitte"]);
    const [competitorCreation, setCompetitorCreation] = useState(false);
    const [selectedCompetitorForAnalysis, setSelectedCompetitorForAnalysis] = useState("");
    const [newCompetitor, setNewCompetitor] = useState({name: "", industry: ""});
    const [results, setResults] = useState([{skill:"Java", company:"My company", comparison:"20%"},
                                            {skill:"Python", company:"My company", comparison:"-20%"},
                                            {skill:"Java", company:"Accenture", comparison:"-20%"},
                                            {skill:"Java", company:"Accenture", comparison:"20%"}])


    const handleSelectAddCompetition = () => {
        setCompetitorCreation(true);
    };
    
    const handleCompetitorAnalysis = (competitor) => {
        if(competitor){
            setSelectedCompetitorForAnalysis(competitor);
        }
        else{
            setSelectedCompetitorForAnalysis("");
        }

        // toDo
        //  start analysis
    };

    const handleCompetitorDelete = async (competitor) => {
        setCompetitors(competitors.filter((comp) => comp !== competitor));

        // try {
        //   const response = await fetch(process.env.REACT_APP_API_URL_GAP_WITH_COMPETITION+`/delete_competitor/${competitor}`, {
        //     method: 'DELETE',
        //   });
        //   if (!response.ok) {
        //     throw new Error('Failed to delete repository');
        //   }
        //   setCompetitors(repos.filter((repo) => repo.name !== repoName));
        // } catch (error) {
        //   console.error('Error deleting repo:', error);
        // }
    };

    const handleSaveCompetitor = () => {
        if (newCompetitor.name.trim() !== "") {
            setCompetitors([...competitors, newCompetitor.name]);
            
            //toDo
            // send to backend
            // try {
            //   const response = await fetch(process.env.REACT_APP_API_URL_GAP_WITH_COMPETITION+`/competitor/${newCompetitor.name}`, {
            //     method: 'POST',
            //   });
            //   if (!response.ok) {
            //     throw new Error('Failed to delete repository');
            //   }
            //   //todo
            //   //ok set new competitor
            // } catch (error) {
            //   console.error('Error deleting repo:', error);
            // }

            setNewCompetitor({ name: "", industry: "" });
            setCompetitorCreation(false);
        }
    };


    const getCompetitors = async () => {
        // axios
        //     .get(process.env.REACT_APP_API_URL_GAP_WITH_COMPETITION + "/competitor")
        //     .then((res) => {
        //         console.log("repos: "+res.data);
        //         setRepos(res.data);
        //     });
    };

    useEffect(() => {
        getCompetitors();
    }, []);
    

    return (
        <div className="content">
            <Row>
                <Col md="6" xl="4">
                    <Card>
                        <CardBody>
                             <Button
                                onClick={handleSelectAddCompetition}
                                className="btn-round mb-2"
                                color="info"
                                type="submit"
                                block
                            >
                                Add Competition
                            </Button>
                            <Button
                                onClick={() => handleCompetitorAnalysis()}
                                className="btn-round mb-3"
                                color="primary"
                                block
                            >
                                Analyze All Competitors
                            </Button>
                            <ul style={{listStyle: "none", padding: "0px"}}>
                                {competitors.map((competitor) => (
                                <li
                                    key={competitor}
                                    style={{
                                        backgroundColor:
                                        competitor === selectedCompetitorForAnalysis ? "#d8ecffff" : "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        padding: "12px",
                                        marginBottom: "8px",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    <div style={{display:"flex", alignItems:"center",justifyContent:"space-between" }}>
                                        <span className="text-lg font-semibold text-gray-900">{competitor}</span>
                                        <div>
                                            <Button
                                                size="sm"
                                                color="primary"
                                                outline
                                                onClick={() => handleCompetitorAnalysis(competitor)}
                                                style={{
                                                borderRadius: "8px",
                                                padding: "4px 8px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                }}
                                            >
                                                <i className="fas fa-arrows-alt-h"></i>
                                                <span style={{ fontSize: "0.85rem" }}>Analyze</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                outline
                                                onClick={() => handleCompetitorDelete(competitor)}
                                                style={{
                                                borderRadius: "8px",
                                                padding: "4px 8px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                }}
                                            >
                                                <i className="fas fa-trash"></i>
                                                <span style={{ fontSize: "0.85rem" }}>Delete</span>
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                                ))}
                            </ul>
                        </CardBody>
                    </Card>
                </Col>
                <Col md="6" xl="8">
                    <Card>
                        <CardBody>
                            <Table bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Skill</th>
                                        <th>Company</th>
                                        <th>Comparison</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((res, index) => (
                                        <tr key={index}>
                                            <td>{res.skill}</td>
                                            <td>{res.company}</td>
                                            <td
                                                style={{
                                                color: res.comparison.startsWith("-")
                                                    ? "red"
                                                    : "green",
                                                fontWeight: "bold",
                                                }}
                                            >
                                                {res.comparison}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Modal for adding competitor */}
            <Modal isOpen={competitorCreation} toggle={() => setCompetitorCreation(false)}>
                <ModalHeader toggle={() => setCompetitorCreation(false)}>
                    Add New Competitor
                </ModalHeader>
                <ModalBody>
                    <Form>
                        <FormGroup>
                            <Label for="competitorName">Company Name</Label>
                            <Input
                                id="competitorName"
                                type="text"
                                value={newCompetitor.name}
                                onChange={(e) =>
                                        setNewCompetitor({ ...newCompetitor, name: e.target.value })
                                    }
                                placeholder="Enter competitor name"
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="competitorIndustry">Industry</Label>
                            <Input
                                id="competitorIndustry"
                                type="text"
                                value={newCompetitor.industry}
                                onChange={(e) =>
                                    setNewCompetitor({
                                        ...newCompetitor,
                                        industry: e.target.value,
                                    })
                                    }
                                placeholder="Enter industry"
                            />
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setCompetitorCreation(false)}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={handleSaveCompetitor}>
                        Save
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}

export default GapCompetition;