import React, { useState, useEffect } from "react";
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from 'classnames';
import Courses from "./Courses";
import Taxonomies from "./Taxonomies";


const EducationManagement = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');

    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    useEffect(() => {
        //to DO
    }, []);

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
                        Courses
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
                        Taxonomies
                    </NavLink>
                </NavItem>
            </Nav>
    
            <TabContent activeTab={currentActiveTab}>
    
                {/**
                 * Tab: Courses
                 */}
                <TabPane tabId="1">
                    {currentActiveTab ==1 &&
                        <Courses />
                    }
                </TabPane>
                
    
                {/**
                 * Tab: Taxonomies
                 */}
                <TabPane tabId="2">
                    {currentActiveTab ==2 &&
                        <Taxonomies />
                    }
                </TabPane>
            </TabContent>
        </div>
    );
}

export default EducationManagement;