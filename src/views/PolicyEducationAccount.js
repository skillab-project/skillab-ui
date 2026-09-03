import React from "react";
import { Row, Col } from "reactstrap";
import {
  MdPolicy,
  MdAccountTree,
  MdSchool,
  MdInsights,
  MdTrendingUp,
  MdDescription,
} from "react-icons/md";
import NavCard from "../components/Cards/NavCard";

const MANAGE_POLICIES_PATH = "/policy-education/account/manage-policies";

function PolicyEducationAccount() {
  const go = (path) => () => {
    window.location.href = path;
  };

  return (
    <>
      <div className="content">
        {/* Management */}
        <Row>
          <Col md="12">
            <h6 className="text-uppercase text-muted">Management</h6>
          </Col>
          <Col lg="3" md="6" className="mb-4">
            <NavCard
              icon={MdPolicy}
              color="#51cbce"
              title="Manage Policies"
              description="Create, review and publish education policies."
              onClick={go(MANAGE_POLICIES_PATH)}
            />
          </Col>
          <Col lg="3" md="6" className="mb-4">
            <NavCard
              icon={MdAccountTree}
              color="#6bd098"
              title="Taxonomy"
              description="Browse and maintain the skills taxonomy."
              onClick={go("/policy-education/account/taxonomy")}
            />
          </Col>
          <Col lg="3" md="6" className="mb-4">
            <NavCard
              icon={MdSchool}
              color="#fbc658"
              title="Manage Universities"
              description="Add and organise participating universities."
              onClick={go("/policy-education/account/manage-universities")}
            />
          </Col>
        </Row>

        {/* Education and Industry Alignment */}
        <Row>
          <Col md="12">
            <h6 className="text-uppercase text-muted" style={{ marginTop: 6 }}>
              Education &amp; Industry Alignment
            </h6>
          </Col>
          <Col lg="3" md="6" className="mb-4">
            <NavCard
              icon={MdInsights}
              color="#51bcda"
              title="Future Technology Trends"
              description="Explore emerging technologies shaping skills."
              onClick={go("/policy-education/account/future-technology-trends")}
            />
          </Col>
          <Col lg="3" md="6" className="mb-4">
            <NavCard
              icon={MdTrendingUp}
              color="#ef8157"
              title="Program and Needs"
              description="Compare programmes against labour-market needs."
              onClick={go("/policy-education/account/program-and-needs")}
            />
          </Col>
          <Col lg="3" md="6" className="mb-4">
            <NavCard
              icon={MdDescription}
              color="#9a7fd1"
              title="Generate Report"
              description="Build a report from analyses you have already run."
              onClick={go("/policy-education/account/generate-report")}
            />
          </Col>
        </Row>
      </div>
    </>
  );
}

export default PolicyEducationAccount;
