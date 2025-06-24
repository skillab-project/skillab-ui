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
  Dropdown,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import TargetOccupation from "./citizen/TargetOccupation";
import CitizenSkills from "./citizen/CitizenSkills";
import {getId} from "../utils/Tokens";
import axios from "axios";


function CitizenAccount() {
  const [userInfo, setUserInfo] = useState({});
  const [initialUserInfo, setInitialUserInfo] = useState({});
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);


  const handleApplyUserUpdate = async () => {
    const userId = await getId();
    if (userId !== "") {
      let url = `${process.env.REACT_APP_API_URL_USER_MANAGEMENT}/user/${userId}`;

      // If there are parameters update them
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
  
      // Change API and call
      if (params.length > 0) {
        setLoading(true);

        url += `?${params.join("&")}`;
        try {
          const response = await axios.put(url, {}, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessTokenSkillab")}`,
            },
          });
          console.log("Profile updated successfully:", response.data);
          setInitialUserInfo(response.data);
        } catch (error) {
          console.error("Error updating profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("No changes to update.");
      }
    }
  }
  


  const fetchProfileData = async () => {
    const userId = await getId();
    console.log("userId: "+userId);
    if(userId!=""){
      //get users general info
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
                        <Input
                          disabled
                          defaultValue="cv.pdf"
                          placeholder="cv.pdf"
                          type="text"
                        />
                        <input type="file" id="myfile" name="myfile"/>
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <div className="update ml-auto mr-auto">
                      <Button
                        onClick={handleApplyUserUpdate}
                        className="btn-round"
                        color="info"
                      >
                        Update Profile
                      </Button>
                      {loading &&
                        <div class="lds-dual-ring"></div>
                      }
                    </div>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>


          <Col md="6">
            <CitizenSkills skills={skills} setSkills={setSkills}/>
          </Col>
        </Row>
        
        <TargetOccupation skills={skills}/>
      </div>
    </>
  );
}

export default CitizenAccount;
