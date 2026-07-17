import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "reactstrap";
// import RecommendOccupation from "./citizen/RecommendOccupation";
import CVUploadModal from "./citizen/CVUploadModal";
// import TargetOccupation from "./citizen/TargetOccupation";
import CitizenSkills from "./citizen/CitizenSkills";
import TargetOccupationDashboard from "./citizen/TargetOccupationDashboard";
import RecommendOccupationEnhanced from "./citizen/RecommendOccupationEnhanced";
import { getId } from "../utils/Tokens";
import axios from "axios";


function CitizenAccount() {
  const [userInfo, setUserInfo] = useState({});
  const [initialUserInfo, setInitialUserInfo] = useState({});
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen(!modalOpen);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const toggleCvModal = () => setCvModalOpen(!cvModalOpen);

  const handleApplyUserUpdate = async () => {
    const userId = await getId();
    if (userId !== "") {
      let url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/${userId}`;
      const params = [];
      if (userInfo.country !== initialUserInfo.country) {
        params.push(`country=${encodeURIComponent(userInfo.country || "")}`);
      }
      if (userInfo.streetAddress !== initialUserInfo.streetAddress) {
        params.push(`streetAddress=${encodeURIComponent(userInfo.streetAddress || "")}`);
      }
      if (userInfo.portfolio !== initialUserInfo.portfolio) {
        params.push(`portfolio=${encodeURIComponent(userInfo.portfolio || "")}`);
      }
  
      if (params.length > 0) {
        setLoading(true);
        url += `?${params.join("&")}`;
        try {
          const response = await axios.put(url, {}, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
            },
          });
          setInitialUserInfo(response.data);
        } catch (error) {
          console.error("Error updating profile:", error);
        } finally {
          setLoading(false);
        }
      }
    }
  }

  // Delete Account Function
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await axios.delete(`${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
        },
      });
      
      // Clear local storage and redirect to login
      localStorage.removeItem("accessTokenSkillab");
      localStorage.removeItem("refreshTokenSkillab");
      localStorage.removeItem("accessTokenSkillabTracker");
      window.location.href = "/login";
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("There was an error deleting your account. Please try again.");
    } finally {
      setLoading(false);
      toggleModal();
    }
  };

  const fetchProfileData = async () => {
    const userId = await getId();
    if(userId !== ""){
      axios.get(process.env.REACT_APP_API_URL_USER_MANAGEMENT+"/user/"+userId, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
        }
        }).then((response) => {
          setUserInfo(response.data);
          setInitialUserInfo(response.data);
      });
      //get users skills
      axios.get(process.env.REACT_APP_API_URL_USER_MANAGEMENT+"/user/"+userId+"/skills", {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("accessTokenSkillab")}`
        }
        }).then((response) => {
          const formattedSkills = response.data.map(skill => ({
              skill: {
                  id: skill.skillId,
                  label: skill.skillLabel
              },
              years: skill.years
          }));
          setSkills(formattedSkills);
      });
    }
  }

  useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <>
      <div className="content">
        <Row>
          <Col md="6">
            <Card className="card-user">
              <CardHeader>
                <CardTitle tag="h5">Profile</CardTitle>
              </CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Name (disabled)</label>
                        <Input
                          defaultValue={userInfo.name}
                          disabled
                          placeholder="Name"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Email (disabled)</label>
                        <Input
                          defaultValue={userInfo.email}
                          disabled
                          placeholder="Email"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Country</label>
                        <Input
                          value={userInfo.country || ""}
                          onChange={(e) => setUserInfo({ ...userInfo, country: e.target.value })}
                          placeholder="Country"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Address</label>
                        <Input
                          value={userInfo.streetAddress || ""}
                          onChange={(e) => setUserInfo({ ...userInfo, streetAddress: e.target.value })}
                          placeholder="Address"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Portfolio URL</label>
                        <Input
                          value={userInfo.portfolio || ""}
                          onChange={(e) => setUserInfo({ ...userInfo, portfolio: e.target.value })}
                          placeholder="Portfolio"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>CV</label>
                        <div>
                          <Button
                            onClick={toggleCvModal}
                            className="btn-round"
                            color="info"
                            outline
                            style={{ width: "100%" }}
                          >
                            <i className="fa fa-upload" style={{ marginRight: "8px" }} />
                            Upload CV
                          </Button>
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>
                  
                  {/* Action Buttons Row */}
                  <div className="d-flex justify-content-end align-items-center">
                    {loading && <div className="lds-dual-ring mr-3"></div>}
                    
                    <Button
                      onClick={handleApplyUserUpdate}
                      className="btn-round btn-hover-effect mr-2"
                      color="info"
                      disabled={loading}
                    >
                      <i className="nc-icon nc-check-2 mr-1" /> 
                      Update Profile
                    </Button>

                    <Button
                      onClick={toggleModal}
                      className="btn-round btn-hover-effect delete-btn-hover"
                      color="danger"
                      outline
                      disabled={loading}
                    >
                      <i className="nc-icon nc-simple-remove mr-1" /> 
                      Delete Account
                    </Button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>

          <Col md="6">
            <CitizenSkills skills={skills} setSkills={setSkills}/>
          </Col>
        </Row>
        
        <TargetOccupationDashboard skills={skills}/>
        {/* <RecommendOccupationEnhanced skills={skills}/> */}
      </div>

      {/* CV Upload Modal */}
      <CVUploadModal
        isOpen={cvModalOpen}
        toggle={toggleCvModal}
        existingSkills={skills}
        onSkillsImported={(newSkills) => {
          setSkills((prev) => {
            const existingIds = new Set(prev.map(s => s.skill.id));
            const unique = newSkills.filter(s => !existingIds.has(s.skill.id));
            return [...prev, ...unique];
          });
        }}
      />

      {/* Confirmation Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal}>
        <ModalHeader toggle={toggleModal}>Confirm Account Deletion</ModalHeader>
        <ModalBody>
          Are you sure you want to delete your account? 
          <br /><br />
          <strong>Warning:</strong> This action is permanent. All your data, profile information, and skills will be deleted forever.
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleModal} disabled={loading}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleDeleteAccount} disabled={loading}>
            {loading ? "Deleting..." : "Yes, Delete Everything"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default CitizenAccount;