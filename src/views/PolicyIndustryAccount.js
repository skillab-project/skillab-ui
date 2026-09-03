import React from "react";
import { Row, Col } from "reactstrap";
import {
  MdPolicy,
  MdAccountTree,
  MdSchool,
  MdInsights,
  MdTrendingUp,
} from "react-icons/md";
import NavCard from "../components/Cards/NavCard";

const MANAGE_POLICIES_PATH = "/policy-industry/account/manage-policies";

function PolicyIndustryAccount() {
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
              description="Create, review and publish industry policies."
              onClick={go(MANAGE_POLICIES_PATH)}
            />
          </Col>
          <Col lg="3" md="6" className="mb-4">
            <NavCard
              icon={MdAccountTree}
              color="#6bd098"
              title="Taxonomy"
              description="Browse and maintain the skills taxonomy."
              onClick={go("/policy-industry/account/taxonomy")}
            />
          </Col>
        </Row>

        {/* Insights */}
        <Row>
          <Col md="12">
            <h6 className="text-uppercase text-muted" style={{ marginTop: 6 }}>
              Insights
            </h6>
          </Col>
          <Col lg="3" md="6" className="mb-4">
            <NavCard
              icon={MdInsights}
              color="#51bcda"
              title="Future Technology Trends"
              description="Explore emerging technologies shaping skills."
              onClick={go("/policy-industry/account/future-technology-trends")}
            />
          </Col>
        </Row>
      </div>
    </>
  );
}

export default PolicyIndustryAccount;
