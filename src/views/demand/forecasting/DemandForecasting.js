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
import ForecastingAgeing from "../../forecasting/ForecastingAgeing";

const DemandForecasting = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [showFilters, setShowFilters] = useState(false);
    const [numberOfFilters, setNumberOfFilters] = useState(0);

    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    const handelClickShowFilter = () => {
        setShowFilters(!showFilters);
    };

    //toDO functionality of filter to data
    const handleApplyFilters = (numberOfFilters) => {
        console.log('Filters received:', numberOfFilters);
        setNumberOfFilters(numberOfFilters);
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
                            Ageing
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
                            Timeseries
                        </NavLink>
                    </NavItem>
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
                </Nav>

                {showFilters &&
                    <Row>
                        <Col md="12">
                            <JobAdsFilter onApplyFilters={handleApplyFilters}/>
                        </Col>
                    </Row>
                }
        
                <TabContent activeTab={currentActiveTab}>
        
                    {/**
                     * Tab: Ageing
                     */}
                    <TabPane tabId="1">
                        {currentActiveTab == 1 &&
                            <ForecastingAgeing parentDatasource="jobs"/>
                        }
                    </TabPane>
        
                    {/**
                     * Tab: Timeseries
                     */}
                    <TabPane tabId="2">
                        {currentActiveTab == 2 &&
                            <>2</>
                        }
                    </TabPane>
                </TabContent>
              </div>
            </>
    );
}

export default DemandForecasting;