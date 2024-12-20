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

                {/* This will be in a map for all the skills */}
                <Row>
                  <Col md="12">
                    <Card style={{marginBottom:"10px"}}>
                      <CardBody>
                        <Row>
                          <Col md="8" style={{margin:"auto"}}>
                            Skill 1
                          </Col>
                          <Col md="4">
                            5
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
                </Row>

                <Row>
                  <Col md="12">
                    <Card style={{marginBottom:"10px"}}>
                      <CardBody>
                        <Row>
                          <Col md="8" style={{margin:"auto"}}>
                            Skill 2
                          </Col>
                          <Col md="4">
                            2
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
                </Row>
                {/* This will be in a map for all the skills */}

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
                            />
                          </Col>
                          <Col md="4">
                            <Input
                              placeholder="Years"
                              type="text"
                              style={{textAlign:"center"}}
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
                        >
                          <i className="fa fa-plus-circle" />
                    </Button>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12">
          <Card>
              <CardHeader>
                <CardTitle tag="h5">Target occupation</CardTitle>
                <UncontrolledDropdown isOpen={dropdownOpen} toggle={toggle} direction="down">
                  <DropdownToggle caret color="info">Select Target Occupation</DropdownToggle>
                  <DropdownMenu >
                    <DropdownItem>Some Action</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem>Foo Action</DropdownItem>
                    <DropdownItem>Bar Action</DropdownItem>
                    <DropdownItem>Quo Action</DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
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
      </div>
    </>
  );
}

export default CitizenAccount;
