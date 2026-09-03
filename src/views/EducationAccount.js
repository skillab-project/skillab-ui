import React from "react";
import { Row, Col } from "reactstrap";
import { MdManageAccounts, MdAccountTree } from "react-icons/md";
import { GiTeamIdea } from "react-icons/gi";
import NavCard from "../components/Cards/NavCard";

function EducationAccount() {
  const go = (path) => () => {
    window.location.href = path;
  };

  return (
    <div className="content">
      {/* Skill Identification offered by an Educational Institute */}
      <Row>
        <Col md="12">
          <h6 className="text-uppercase text-muted">
            Skill Identification offered by an Educational Institute
          </h6>
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={MdManageAccounts}
            color="#51cbce"
            title="Management"
            description="Manage your institution's skill identification."
            onClick={go("/education/account/management")}
          />
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={MdAccountTree}
            color="#6bd098"
            title="Taxonomy"
            description="Browse and maintain the skills taxonomy."
            onClick={go("/education/account/taxonomy")}
          />
        </Col>
      </Row>

      {/* Provision of Educational Recommendations */}
      <Row>
        <Col md="12">
          <h6 className="text-uppercase text-muted" style={{ marginTop: 6 }}>
            Provision of Educational Recommendations
          </h6>
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={GiTeamIdea}
            color="#ef8157"
            title="Recommendations"
            description="Provide educational recommendations to learners."
            onClick={go("/education/account/recommendations")}
          />
        </Col>
      </Row>
    </div>
  );
}

export default EducationAccount;
