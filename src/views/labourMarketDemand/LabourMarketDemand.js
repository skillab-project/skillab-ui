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
import "../../assets/css/loader.css";
import LabourMarketDemandOccupation from "./LabourMarketDemandOccupation";
import LabourMarketDemandSkill from "./LabourMarketDemandSkill";
import GeneralJobStatistics from "./GeneralJobStatistics"
import { FaFilter } from "react-icons/fa";


function LabourMarketDemand() {
    const [currentActiveTab, setCurrentActiveTab] = useState('2');
    const [showOccupationFilters, setShowOccupationFilters] = useState(false);
    const [showSkillFilters, setShowSkillFilters] = useState(false);
    // toDo
    //  change to 0 afterwards
    const [numberOfOccupationFilters, setNumberOfOccupationFilters] = useState(1);
    const [numberOfSkillFilters, setNumberOfSkillFilters] = useState(1);

  
    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }


    const handelClickShowFilter = () => {
        if(currentActiveTab ==='1'){
            setShowOccupationFilters(false);
            setShowSkillFilters(false);
        }
        else if(currentActiveTab ==='2' && showOccupationFilters == false){
            setShowOccupationFilters(true);
        }
        else if(currentActiveTab ==='2' && showOccupationFilters == true){
            setShowOccupationFilters(false);
        }
        else if(currentActiveTab ==='3' && showSkillFilters == false){
            setShowSkillFilters(true);
        }
        else if(currentActiveTab ==='3' && showSkillFilters == true){
            setShowSkillFilters(false);
        }
    };

    const handleApplyOccupationFilters = (numberOfFilters) => {
        console.log('Filters received:', numberOfFilters);
        setNumberOfOccupationFilters(numberOfFilters);
    };

    const handleApplySkillFilters = (numberOfFilters) => {
        console.log('Filters received:', numberOfFilters);
        setNumberOfSkillFilters(numberOfFilters);
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
            {/* <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '1'
                    })}
                    onClick={() => { toggle('1'); }}
                >
                    General
                </NavLink>
            </NavItem> */}
            <NavItem style={{cursor:"pointer"}}>
                <NavLink
                    className={classnames({
                        active:
                            currentActiveTab === '2'
                    })}
                    onClick={() => { toggle('2'); }}
                >
                    Occupation
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
                    Skill
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
                    {currentActiveTab == 2 && getFilterBadge(numberOfOccupationFilters)}
                    {currentActiveTab == 3 && getFilterBadge(numberOfSkillFilters)}
                </button>
            </span>
        </Nav>

        <TabContent activeTab={currentActiveTab}>

            {/**
             * Tab: General
             */}
            <TabPane tabId="1">
                {currentActiveTab ==1 &&
                    <GeneralJobStatistics />
                }
            </TabPane>

            {/**
             * Tab: Occupation
             */}
            <TabPane tabId="2">
                {currentActiveTab ==2 &&
                    <LabourMarketDemandOccupation showFilter={showOccupationFilters} onApplyFilters={handleApplyOccupationFilters}/>
                }
            </TabPane>
            

            {/**
             * Tab: Skill
             */}
            <TabPane tabId="3">
                {currentActiveTab ==3 &&
                    <LabourMarketDemandSkill showFilter={showSkillFilters} onApplyFilters={handleApplySkillFilters}/>
                }
            </TabPane>
        </TabContent>
      </div>
    </>
    );
}

export default LabourMarketDemand;
