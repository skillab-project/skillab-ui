import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from "reactstrap";
import classnames from 'classnames';


function EuGeneralPurposeStatistics() {
  const [currentActiveTab, setCurrentActiveTab] = useState('1');
  const toggle = tab => {
    if (currentActiveTab !== tab) setCurrentActiveTab(tab);
  }

  return (
    <>
      <div className="content">
        <Nav tabs style={{marginBottom:"5px"}}>
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '1'
                    })}
                    onClick={() => { toggle('1'); }}
                >
                    Official EU Statistics
                </NavLink>
            </NavItem>
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '2'
                    })}
                    onClick={() => { toggle('2'); }}
                >
                    Quantitative Information on EU Education Organizations
                </NavLink>
            </NavItem>
        </Nav>

        <TabContent activeTab={currentActiveTab}>
            <TabPane tabId="1">
                <Row>
                    <Col md="12">
                        <Card>
                        <CardHeader>
                            <CardTitle tag="h5">ss</CardTitle>
                        </CardHeader>
                        <CardBody>
                            ss
                        </CardBody>
                        </Card>
                    </Col>
                </Row>
            </TabPane>
            <TabPane tabId="2">
                <Row>
                    <Col md="12">
                        <Card>
                        <CardHeader>
                            <CardTitle tag="h5">ss2</CardTitle>
                        </CardHeader>
                        <CardBody>
                            ss2
                        </CardBody>
                        </Card>
                    </Col>
                </Row>
            </TabPane>
        </TabContent>
      </div>
    </>
  );
}

export default EuGeneralPurposeStatistics;
