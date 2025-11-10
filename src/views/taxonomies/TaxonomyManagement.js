import React, { useState, useEffect } from "react";
import {Card, CardHeader, CardBody, CardFooter, CardTitle, Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from 'classnames';
import TaxonomyAnalytics from "./TaxonomyAnalytics";
import TaxonomyForecasting from "./TaxonomyForecasting";


const TaxonomyManagement = () => {
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
                        Analytics
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
                        Forecasting
                    </NavLink>
                </NavItem>
            </Nav>
    
            <TabContent activeTab={currentActiveTab}>
    
                {/**
                 * Tab: TaxonomyAnalytics
                 */}
                <TabPane tabId="1">
                    {currentActiveTab ==1 &&
                        <TaxonomyAnalytics />
                    }
                </TabPane>
                
    
                {/**
                 * Tab: TaxonomyForecasting
                 */}
                <TabPane tabId="2">
                    {currentActiveTab ==2 &&
                        <TaxonomyForecasting />
                    }
                </TabPane>
            </TabContent>
        </div>
    );
}

export default TaxonomyManagement;