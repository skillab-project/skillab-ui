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
import KuAtRisk from "./skillsAtRisk/KuAtRisk";


function AtRisk() {
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
                        Skills
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={currentActiveTab}>
                {/**
                 * Tab: Knowleage Units
                 */}
                <TabPane tabId="1">
                    {currentActiveTab == 1 &&
                        <KuAtRisk />
                    }
                </TabPane>
    
                {/**
                 * Tab: Skills
                 */}
                <TabPane tabId="2">
                    {currentActiveTab == 2 &&
                        <KuAtRisk />
                    }
                </TabPane>
            </TabContent>
        </div>
    );
}

export default AtRisk;