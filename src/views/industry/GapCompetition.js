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
                <Col md="12">
                    <Card>
                        <CardBody>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default GapCompetition;