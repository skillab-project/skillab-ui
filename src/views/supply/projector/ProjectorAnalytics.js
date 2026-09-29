import React, { useState } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane, Card, CardBody } from "reactstrap";
import classnames from "classnames";
import TemporalProjections from "./TemporalProjections";
import RegionalTemporal from "./RegionalTemporal";

const tabs = [
  { id: "1", name: "Temporal Projections" },
  { id: "2", name: "Regional Temporal" },
//   { id: "3", name: "Tab 3" },
];

const ComingSoon = () => (
  <Card>
    <CardBody className="text-center text-muted py-5">Coming soon</CardBody>
  </Card>
);

export const ProjectorAnalytics = () => {
  const [activeTab, setActiveTab] = useState("1");

  return (
    <div className="content">
      <Nav tabs style={{ marginBottom: "5px" }}>
        {tabs.map((tab) => (
          <NavItem key={tab.id} style={{ cursor: "pointer" }}>
            <NavLink
              className={classnames({ active: activeTab === tab.id })}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      {/* Tabs render only when active so each one fetches lazily */}
      <TabContent activeTab={activeTab}>
        <TabPane tabId="1">{activeTab === "1" && <TemporalProjections />}</TabPane>
        <TabPane tabId="2">{activeTab === "2" && <RegionalTemporal />}</TabPane>
        {/* <TabPane tabId="3">{activeTab === "3" && <ComingSoon />}</TabPane> */}
      </TabContent>
    </div>
  );
};

export default ProjectorAnalytics;
