import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane, } from "reactstrap";
import axios from 'axios';
import classnames from 'classnames';
import KnowleageUnits from "./employeeSkills/KnowledgeUnits";
import GeneralSkills from "./employeeSkills/GeneralSkills";
import KuAtRisk from "./skillsAtRisk/KuAtRisk";
import SkillsAtRisk from "./skillsAtRisk/SkillsAtRisk";


function EmployeeSkills() {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    
    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    return (
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
                        Knowleage Units
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
                        KUs at Risk
                    </NavLink>
                </NavItem>
                <NavItem style={{cursor:"pointer"}}>
                    <NavLink
                        className={classnames({
                            active:
                                currentActiveTab === '3'
                        })}
                        onClick={() => { toggle('3'); }}
                    >
                        Skills
                    </NavLink>
                </NavItem>
                <NavItem style={{cursor:"pointer"}}>
                    <NavLink
                        className={classnames({
                            active:
                                currentActiveTab === '4'
                        })}
                        onClick={() => { toggle('4'); }}
                    >
                        Skills at Risk
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={currentActiveTab}>
                {/**
                 * Tab: Knowleage Units
                 */}
                <TabPane tabId="1">
                    {currentActiveTab == 1 &&
                        <KnowleageUnits />
                    }
                </TabPane>
                
                {/**
                 * Tab: KUs at Risk
                 */}
                <TabPane tabId="2">
                    {currentActiveTab == 2 &&
                        <KuAtRisk />
                    }
                </TabPane>
    
                {/**
                 * Tab: Skills
                 */}
                <TabPane tabId="3">
                    {currentActiveTab == 3 &&
                        <GeneralSkills />
                    }
                </TabPane>
                
                {/**
                 * Tab: Skills at Risk
                 */}
                <TabPane tabId="4">
                    {currentActiveTab == 4 &&
                        <SkillsAtRisk />
                    }
                </TabPane>
            </TabContent>
        </div>
    );
}

export default EmployeeSkills;
