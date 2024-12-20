import React, { useState, useMemo, useRef, useEffect } from "react";
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
  TabPane,
  CardSubtitle
} from "reactstrap";
import classnames from 'classnames';
import InterconnectedSkills from "./InterconnectedSkills";
import ExploratoryAnalytics from "./ExploratoryAnalytics";
import TrendAnalysis from "./TrendAnalysis";
import DescriptiveAnalyticsOccupations from "./DescriptiveAnalyticsOccupations";
import DescriptiveAnalyticsSkills from "./DescriptiveAnalyticsSkills";
import SkillFilter from "./SkillFilter";
import OccupationFilter from "./OccupationFilter";




function LabourMarketDemand() {
    // Tabs
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [showOccupationFilters, setShowOccupationFilters] = useState(false);
    const [showSkillFilters, setShowSkillFilters] = useState(false);
  
    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    const handleApplyOccupationFilters = (selectedFilters) => {
        console.log('Filters received:', selectedFilters);
    };

    const handleApplySkillFilters = (selectedFilters) => {
        console.log('Filters received:', selectedFilters);
    };

    const handelClickShowFilter = () => {
        if(currentActiveTab ==='1' && showOccupationFilters == false){
            setShowOccupationFilters(true);
        }
        else if(currentActiveTab ==='1' && showOccupationFilters == true){
            setShowOccupationFilters(false);
        }
        else if(currentActiveTab ==='2' && showSkillFilters == false){
            setShowSkillFilters(true);
        }
        else if(currentActiveTab ==='2' && showSkillFilters == true){
            setShowSkillFilters(false);
        }
    };
    

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
                    Occupation
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
                    Skill
                </NavLink>
            </NavItem>
            <span style={{margin:"auto", marginRight:"5px", cursor:"pointer"}} onClick={()=>handelClickShowFilter()}>
                <i className="fa fa-filter"></i>
            </span>
        </Nav>

        <TabContent activeTab={currentActiveTab}>

            {/**
             * Tab: Occupation
             */}
            <TabPane tabId="1">
                {showOccupationFilters && <Row>
                    <Col md="12">
                        <SkillFilter onApplyFilters={handleApplyOccupationFilters}/>
                    </Col>
                </Row>
                }

                <Row>
                    <Col md="12">
                        <DescriptiveAnalyticsOccupations />
                    </Col>
                </Row>
                
                <Row>
                    <Col md="12">
                        <ExploratoryAnalytics />
                    </Col>
                </Row>
                
                <Row>
                    <Col md="12">
                        <TrendAnalysis />
                    </Col>
                </Row>
            </TabPane>
            

            {/**
             * Tab: Skill
             */}
            <TabPane tabId="2">
                {showSkillFilters && <Row>
                    <Col md="12">
                        <OccupationFilter onApplyFilters={handleApplySkillFilters}/>
                    </Col>
                </Row>
                }

                <Row>
                    <Col md="12">
                        <DescriptiveAnalyticsSkills />
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">Exploratory Analytics</CardTitle>
                            </CardHeader>
                            <CardBody>
                                {/**
                                 * Same as occupations, but with skills??
                                 */}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">Trend Analysis</CardTitle>
                            </CardHeader>
                            <CardBody>
                                {/**
                                 * Same as occupations, but with skills??
                                 */}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col md="12">
                        <InterconnectedSkills/>
                    </Col>
                </Row>
            </TabPane>
        </TabContent>
      </div>
    </>
    );
}

export default LabourMarketDemand;
