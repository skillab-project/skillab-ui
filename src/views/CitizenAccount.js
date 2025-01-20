import React, { useState } from "react";
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

function CitizenAccount() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

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
                          defaultValue="John D."
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
                          defaultValue="john@gmail.com"
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
                        <label>Address (disabled)</label>
                        <Input
                          defaultValue="Thessaloniki, Greece"
                          placeholder="Address"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Portfolio</label>
                        <Input
                          defaultValue="example.com/..."
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
                        className="btn-round"
                        color="info"
                        type="submit"
                      >
                        Update Profile
                      </Button>
                    </div>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>


          <Col md="6">
            <CitizenSkills />
          </Col>
        </Row>
        
        <TargetOccupation />
      </div>
    </>
  );
}

export default CitizenAccount;
