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



function LabourMarketDemand() {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [showOccupationFilters, setShowOccupationFilters] = useState(false);
    const [showSkillFilters, setShowSkillFilters] = useState(false);

  
    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }


    const handelClickShowFilter = () => {
        if(currentActiveTab ==='1' && showOccupationFilters == false){
            setShowOccupationFilters(true);
        }
        else if(currentActiveTab ==='1' && showOccupationFilters == true){
            setShowOccupationFilters(false);
        }
        else if(currentActiveTab ==='2' && showSkillFilters == false){
            setShowSkillFilters(true);
        }
        else if(currentActiveTab ==='2' && showSkillFilters == true){
            setShowSkillFilters(false);
        }
    };
    

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
                    Occupation
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
                    Skill
                </NavLink>
            </NavItem>
            <span style={{margin:"auto", marginRight:"5px", cursor:"pointer"}} onClick={()=>handelClickShowFilter()}>
                <i className="fa fa-filter"></i>
            </span>
        </Nav>

        <TabContent activeTab={currentActiveTab}>

            {/**
             * Tab: Occupation
             */}
            <TabPane tabId="1">
                {currentActiveTab ==1 &&
                    <LabourMarketDemandOccupation showFilter={showOccupationFilters}/>
                }
            </TabPane>
            

            {/**
             * Tab: Skill
             */}
            <TabPane tabId="2">
                {currentActiveTab ==2 &&
                    <LabourMarketDemandSkill showFilter={showSkillFilters}/>
                }
            </TabPane>
        </TabContent>
      </div>
    </>
    );
}

export default LabourMarketDemand;
