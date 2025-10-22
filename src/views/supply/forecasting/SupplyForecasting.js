import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import classnames from 'classnames';
import axios from 'axios';
import "../../../assets/css/loader.css";
import ForecastingAgeing from "../../forecasting/ForecastingAgeing";

// A list of all possible tabs to make rendering dynamic
const allTabs = [
    { id: '1', name: 'XAI' },
    { id: '2', name: 'Timeseries' },
];

// Map data sources to the tabs they support
const tabVisibilityConfig = {
    'Short Courses': ['1', '2'],
    'EU KUs': ['1', '2']
};

const dataSources = ['Short Courses', 'EU KUs'];

const SupplyForecasting = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedDataSource, setSelectedDataSource] = useState(dataSources[0]); // Default to 'Short Courses'

    const toggleTab = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }
    
    const toggleDropdown = () => setDropdownOpen(prevState => !prevState);

    // UseEffect to handle side-effects of changing the data source
    useEffect(() => {
        const availableTabs = tabVisibilityConfig[selectedDataSource];
        setCurrentActiveTab(availableTabs[0]);
        // // If the currently active tab is NOT available for the new data source
        // //  reset the active tab to the first available one.
        // if (!availableTabs.includes(currentActiveTab)) {
        //     setCurrentActiveTab(availableTabs[0]);
        // }
    }, [selectedDataSource]); // Rerun when data source changes

    // Get the list of tabs that should be visible based on the current selection
    const visibleTabs = allTabs.filter(tab => 
        tabVisibilityConfig[selectedDataSource].includes(tab.id)
    );

    return (
        <>
            <div className="content">
                <Row>
                    <Col md="12" style={{justifyItems:"left"}}>
                        <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                            <DropdownToggle caret color="info">
                                Data Source: <strong>{selectedDataSource}</strong>
                            </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem header>Select a data source</DropdownItem>
                                {dataSources.map(source => (
                                    <DropdownItem 
                                        key={source}
                                        onClick={() => setSelectedDataSource(source)}
                                        active={selectedDataSource === source}
                                    >
                                        {source}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    </Col>
                </Row>
                
                {/* Dynamically Render the Nav */}
                <Nav tabs style={{marginBottom:"5px"}}>
                    {visibleTabs.map(tab => (
                         <NavItem key={tab.id} style={{cursor:"pointer"}}>
                            <NavLink
                                className={classnames({ active: currentActiveTab === tab.id })}
                                onClick={() => { toggleTab(tab.id); }}
                            >
                                {tab.name}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>
        
                <TabContent activeTab={currentActiveTab}>
                    <TabPane tabId="1">
                        {currentActiveTab === '1' && selectedDataSource === 'Short Courses' &&
                        <>
                            <ForecastingAgeing parentDatasource="courses"/>
                        </>}

                        {currentActiveTab === '1' && selectedDataSource === 'EU KUs' &&
                        <>
                            <ForecastingAgeing parentDatasource="ku"/>
                        </>}
                    </TabPane>
        
                    <TabPane tabId="2">
                        {currentActiveTab === '2' && selectedDataSource === 'Short Courses' &&
                        <>
                            2, Short Courses
                        </>}

                        {currentActiveTab === '2' && selectedDataSource === 'EU KUs' &&
                        <>
                            2, EU KUs
                        </>}
                    </TabPane>
                </TabContent>
              </div>
            </>
    );
}

export default SupplyForecasting;