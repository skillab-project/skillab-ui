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
import axios from 'axios';
import "../../../assets/css/loader.css";
import { FaFilter } from "react-icons/fa";
import JobAdsFilter from "../JobAdsFilter";
import HCV from "../../hcv/HCV";
import Turf from "../../turf/Turf";
import Biodiversity from "../../diversity/Biodiversity";
import DescriptiveExploratoryJobs from "../../descriptiveExploratory/DescriptiveExploratoryJobs";
import CoOccurrence from "../../coOccurrence/CoOccurrence";

const DemandAnalytics = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [showFilters, setShowFilters] = useState(false);
    const [numberOfFilters, setNumberOfFilters] = useState(2);
    const [filters, setFilters] = useState({dataSource: [],
                                            dataLimit: '1000',
                                            occupation: {id: "http://data.europa.eu/esco/isco/C2512", label: "Software developers"}
                                            });

    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    const handelClickShowFilter = () => {
        setShowFilters(!showFilters);
    };

    const handleApplyFilters = (filters) => {
        console.log('Filters received:', filters.filters);
        console.log('activeFilterCount:', filters.activeFilterCount);
        setNumberOfFilters(filters.activeFilterCount);
        setFilters(filters.filters);
        setShowFilters(false);
    };

    const getFilterBadge = (count) => 
        count !== 0 && (
            <span
                style={{
                backgroundColor: "green",
                color: "white",
                padding: "3px 8px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "bold",
                marginLeft: "8px",
                display: "flex",
                alignItems: "center",
                }}
            >
                {count}
            </span>
    );

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
                            Descriptive/Exploratory
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
                            HCV
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
                            Turf
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
                            Biodiversity
                        </NavLink>
                    </NavItem>
                    {/* <NavItem style={{cursor:"pointer"}}>
                        <NavLink
                            className={classnames({
                                active:
                                    currentActiveTab === '5'
                            })}
                            onClick={() => { toggle('5'); }}
                        >
                            Archetypal
                        </NavLink>
                    </NavItem> */}
                    <NavItem style={{cursor:"pointer"}}>
                        <NavLink
                            className={classnames({
                                active:
                                    currentActiveTab === '6'
                            })}
                            onClick={() => { toggle('6'); }}
                        >
                            Co-occurrence
                        </NavLink>
                    </NavItem>
                    {currentActiveTab == '1' &&
                        <span style={{margin:"auto", marginRight:"5px"}} >
                            <button
                                onClick={handelClickShowFilter}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "5px 10px",
                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                    color: "white",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                }}
                            >
                                <FaFilter style={{ color:"black" }} />
                                {getFilterBadge(numberOfFilters)}
                            </button>
                        </span>
                    }
                </Nav>

                {showFilters && currentActiveTab == '1' &&
                    <Row>
                        <Col md="12">
                            <JobAdsFilter filters={filters} onApplyFilters={handleApplyFilters}/>
                        </Col>
                    </Row>
                }
        
                <TabContent activeTab={currentActiveTab}>
        
                    {/**
                     * Tab: Descriptive/Exploratory
                     */}
                    <TabPane tabId="1">
                        {currentActiveTab == 1 &&
                            <DescriptiveExploratoryJobs filters={filters}/>
                        }
                    </TabPane>
        
                    {/**
                     * Tab: HCV
                     */}
                    <TabPane tabId="2">
                        {currentActiveTab == 2 &&
                            <HCV datasource="jobs"/>
                        }
                    </TabPane>
                    
                    {/**
                     * Tab: Turf
                     */}
                    <TabPane tabId="3">
                        {currentActiveTab == 3 &&
                            <Turf datasource="jobs"/>
                        }
                    </TabPane>
                    
        
                    {/**
                     * Tab: Biodiversity
                     */}
                    <TabPane tabId="4">
                        {currentActiveTab == 4 &&
                            <Biodiversity parentDatasource="jobs"/>
                        }
                    </TabPane>
                    

                    {/**
                     * Tab: Archetypal
                     */}
                    <TabPane tabId="5">
                        {currentActiveTab == 5 &&
                            <>5</>
                        }
                    </TabPane>


                    {/**
                     * Tab: Archetypal
                     */}
                    <TabPane tabId="6">
                        {currentActiveTab == 6 &&
                            <CoOccurrence parentDatasource="jobs"/>
                        }
                    </TabPane>
                </TabContent>
              </div>
            </>
    );
}

export default DemandAnalytics;