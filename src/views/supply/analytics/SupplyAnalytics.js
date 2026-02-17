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
import { FaFilter } from "react-icons/fa";
import ProfilesShortCoursesFilter from "../ProfilesShortCoursesFilter";
import DescriptiveExploratorySyllabus from "../../descriptiveExploratory/DescriptiveExploratorySyllabus";
import DescriptiveExploratoryKU from "views/descriptiveExploratory/DescriptiveExploratoryKU";
import DescriptiveExploratoryShortCourses from "views/descriptiveExploratory/DescriptiveExploratoryShortCourses";
import DescriptiveExploratoryProfiles from "views/descriptiveExploratory/DescriptiveExploratoryProfiles";
import CoOccurrence from "../../coOccurrence/CoOccurrence";
import DescriptiveExploratoryPolicies from "views/descriptiveExploratory/DescriptiveExploratoryPolicies";

// A list of all possible tabs to make rendering dynamic
const allTabs = [
    { id: '1', name: 'Descriptive/Exploratory' },
    { id: '2', name: 'HCV' },
    { id: '3', name: 'Biodiversity' },
    { id: '4', name: 'Archetypal' },
    { id: '5', name: 'Co-occurrence' },
];

// Map data sources to the tabs they support
const tabVisibilityConfig = {
    'EU profiles': ['1', '2', '3', '4', '5'], // All tabs are visible
    'Short Courses': ['1', '2', '3', '4', '5'], // All tabs are visible
    'EU KUs': ['1', '3', '4', '5'],           // HCV is hidden
    'EU Syllabus': ['1', '3', '4', '5'],       // HCV is hidden
    'EU Policies': ['1', '2', '3', '4', '5'],       // All tabs are visible
};

const dataSources = ['EU profiles', 'Short Courses', 'EU KUs', 'EU Syllabus', 'EU Policies'];

const SupplyAnalytics = () => {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [showFilters, setShowFilters] = useState(false);
    const [numberOfFilters, setNumberOfFilters] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedDataSource, setSelectedDataSource] = useState(dataSources[0]); // Default to 'EU profiles'
    const [filters, setFilters] = useState({dataLimit: "", dataSource: []}); //initial filters to not wait a lot

    const toggleTab = tab => {
        if (currentActiveTab !== tab) {
            setCurrentActiveTab(tab);
            setShowFilters(false);
        }
    }
    
    const toggleDropdown = () => setDropdownOpen(prevState => !prevState);

    const handelClickShowFilter = () => {
        setShowFilters(!showFilters);
    };

    const handleApplyFilters = (filters) => {
        console.log('Filters received:', filters.filters);
        console.log('activeFilterCount:', filters.activeFilterCount);
        setNumberOfFilters(filters.activeFilterCount);
        setFilters(filters.filters);
    };

    // UseEffect to handle side-effects of changing the data source
    useEffect(() => {
        const availableTabs = tabVisibilityConfig[selectedDataSource];
        setCurrentActiveTab(availableTabs[0]);
    }, [selectedDataSource]);

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

                    {(selectedDataSource === 'EU profiles' || selectedDataSource === 'Short Courses') &&
                        (currentActiveTab === '1' || currentActiveTab === '3' || currentActiveTab === '4' ) &&
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

                {showFilters &&
                    <Row>
                        <Col md="12">
                            {selectedDataSource === 'EU profiles' &&
                                <ProfilesShortCoursesFilter supply={"profiles"} onApplyFilters={handleApplyFilters}/>
                            }
                            {selectedDataSource === 'Short Courses' &&
                                <ProfilesShortCoursesFilter supply={"courses"} onApplyFilters={handleApplyFilters}/>
                            }
                        </Col>
                    </Row>
                }
        
                <TabContent activeTab={currentActiveTab}>
                    <TabPane tabId="1">
                        {currentActiveTab === '1' && selectedDataSource === 'EU Syllabus' &&
                            <>
                                <DescriptiveExploratorySyllabus filters=""/>
                            </>
                        }
                        {currentActiveTab === '1' && selectedDataSource === 'EU KUs' &&
                            <>
                                <DescriptiveExploratoryKU filters=""/>
                            </>
                        }
                        {currentActiveTab === '1' && selectedDataSource === 'Short Courses' &&
                            <>
                                <DescriptiveExploratoryShortCourses filters={filters}/>
                            </>
                        }
                        {currentActiveTab === '1' && selectedDataSource === 'EU profiles' &&
                            <>
                                <DescriptiveExploratoryProfiles filters={filters}/>
                            </>
                        }
                        {currentActiveTab === '1' && selectedDataSource === 'EU Policies' &&
                            <>
                                <DescriptiveExploratoryPolicies filters={filters}/>
                            </>
                        }
                    </TabPane>
        
                    <TabPane tabId="2">
                        {currentActiveTab === '2' && <>2, {selectedDataSource}</>}
                    </TabPane>
                    
                    <TabPane tabId="3">
                        {currentActiveTab === '3' && <>3, {selectedDataSource}</>}
                    </TabPane>
                    
                    <TabPane tabId="4">
                        {currentActiveTab === '4' && <>4, {selectedDataSource}</>}
                    </TabPane>

                    <TabPane tabId="5">
                        {currentActiveTab === '5' && selectedDataSource === 'EU KUs' &&
                            <>
                                <CoOccurrence parentDatasource="ku"/>
                            </>
                        }
                        {currentActiveTab === '5' && selectedDataSource === 'Short Courses' &&
                            <>
                                <CoOccurrence parentDatasource="courses"/>
                            </>
                        }
                        {currentActiveTab === '5' && selectedDataSource === 'EU profiles' &&
                            <>
                                <CoOccurrence parentDatasource="profiles"/>
                            </>
                        }
                        {currentActiveTab === '5' && selectedDataSource === 'EU Syllabus' &&
                            <>
                                EU Syllabus
                            </>
                        }
                    </TabPane>
                </TabContent>
              </div>
            </>
    );
}

export default SupplyAnalytics;