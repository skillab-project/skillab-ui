import React, { useEffect, useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane, Alert } from "reactstrap";
import classnames from "classnames";
import GapAnalysisTab from "./gapCompetition/GapAnalysisTab";
import WorkforceGapTab from "./gapCompetition/WorkforceGapTab";
import { fetchOrganizationAndDepartments } from "./gapCompetition/gapCompetitionUtils";

function GapCompetition() {
    const [currentActiveTab, setCurrentActiveTab] = useState('1');
    const [departments, setDepartments] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [departmentsError, setDepartmentsError] = useState("");

    const toggle = tab => {
        if (currentActiveTab !== tab) setCurrentActiveTab(tab);
    }

    useEffect(() => {
        let isMounted = true;

        const loadDepartments = async () => {
            setLoadingDepartments(true);
            setDepartmentsError("");
            try {
                const { departments: depts } = await fetchOrganizationAndDepartments();
                if (isMounted) setDepartments(depts);
            } catch (error) {
                console.error("Failed to load departments:", error);
                if (isMounted) {
                    setDepartmentsError("Could not load departments for your organization. Please try again later.");
                }
            } finally {
                if (isMounted) setLoadingDepartments(false);
            }
        };

        loadDepartments();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="content">
            {departmentsError && <Alert color="warning">{departmentsError}</Alert>}

            <Nav tabs style={{marginBottom:"5px"}}>
                <NavItem style={{cursor:"pointer"}}>
                    <NavLink
                        className={classnames({
                            active:
                                currentActiveTab === '1'
                        })}
                        onClick={() => { toggle('1'); }}
                    >
                        Skills Gap vs Sector
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
                        Workforce Gap Recommendation
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={currentActiveTab}>
                {/**
                 * Tab: Skills Gap vs Sector (POST /gap-analysis)
                 */}
                <TabPane tabId="1">
                    {currentActiveTab == 1 &&
                        <GapAnalysisTab departments={departments} loadingDepartments={loadingDepartments} />
                    }
                </TabPane>

                {/**
                 * Tab: Workforce Gap Recommendation (POST /workforce-gap-recommendation)
                 */}
                <TabPane tabId="2">
                    {currentActiveTab == 2 &&
                        <WorkforceGapTab departments={departments} loadingDepartments={loadingDepartments} />
                    }
                </TabPane>
            </TabContent>
        </div>
    );
}

export default GapCompetition;
