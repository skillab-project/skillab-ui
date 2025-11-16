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
import ForecastingTimeseries from "../../forecasting/ForecastingTimeseries";

const DemandForecasting = () => {
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
                </Nav>


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
                            <ForecastingTimeseries />
                        }
                    </TabPane>
                </TabContent>
              </div>
            </>
    );
}

export default DemandForecasting;