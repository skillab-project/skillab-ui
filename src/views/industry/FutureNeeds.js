import React, { useEffect, useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import FutureNeedsTab from "./futureNeeds/FutureNeedsTab";
import { getOrganization } from "../../utils/Tokens";

function FutureNeeds() {
  const [currentActiveTab, setCurrentActiveTab] = useState("1");
  const [organization, setOrganization] = useState("");
  const [loadingOrganization, setLoadingOrganization] = useState(true);

  const toggle = (tab) => {
    if (currentActiveTab !== tab) setCurrentActiveTab(tab);
  };

  useEffect(() => {
    let isMounted = true;
    getOrganization()
      .then((org) => isMounted && setOrganization(org || ""))
      .catch((err) => console.error("Failed to read organization:", err))
      .finally(() => isMounted && setLoadingOrganization(false));
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="content">
      <Nav tabs style={{ marginBottom: "5px" }}>
        <NavItem style={{ cursor: "pointer" }}>
          <NavLink className={classnames({ active: currentActiveTab === "1" })} onClick={() => toggle("1")}>
            Skills
          </NavLink>
        </NavItem>
        <NavItem style={{ cursor: "pointer" }}>
          <NavLink className={classnames({ active: currentActiveTab === "2" })} onClick={() => toggle("2")}>
            Occupations
          </NavLink>
        </NavItem>
      </Nav>

      {/* Both tabs stay mounted so a running analysis (and its polling) and
          finished results survive switching between tabs. */}
      <TabContent activeTab={currentActiveTab}>
        {/** Tab: Skills (GET /shorttermanalysis/skills) */}
        <TabPane tabId="1">
          <FutureNeedsTab
            kind="skills"
            organization={organization}
            loadingOrganization={loadingOrganization}
            active={currentActiveTab === "1"}
          />
        </TabPane>

        {/** Tab: Occupations (GET /shorttermanalysis/occupations) */}
        <TabPane tabId="2">
          <FutureNeedsTab
            kind="occupations"
            organization={organization}
            loadingOrganization={loadingOrganization}
            active={currentActiveTab === "2"}
          />
        </TabPane>
      </TabContent>
    </div>
  );
}

export default FutureNeeds;
