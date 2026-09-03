import React from "react";
import { Row, Col } from "reactstrap";
import { GiStairsGoal } from "react-icons/gi";
import { AiFillAlert } from "react-icons/ai";
import { LuTrendingUpDown } from "react-icons/lu";
import { TbZoomInArea } from "react-icons/tb";
import { TfiAnnouncement } from "react-icons/tfi";
import { FaListUl, FaPeopleRoof } from "react-icons/fa6";
import { FaBuilding, FaHandsHelping } from "react-icons/fa";
import NavCard from "../components/Cards/NavCard";

function IndustryAccount() {
  const go = (path) => () => {
    window.location.href = path;
  };

  return (
    <div className="content">
      {/* Organization Insights and Decision Making */}
      <Row>
        <Col md="12">
          <h6 className="text-uppercase text-muted">
            Organization Insights and Decision Making
          </h6>
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={GiStairsGoal}
            color="#51cbce"
            title="Gap with Competition"
            description="Benchmark your organisation's skills against competitors."
            onClick={go("/industry/account/gap-competition")}
          />
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={AiFillAlert}
            color="#ef8157"
            title="Skills at Risk"
            description="Spot skills at risk of becoming obsolete."
            onClick={go("/industry/account/at-risk")}
          />
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={LuTrendingUpDown}
            color="#fbc658"
            title="Future Needs"
            description="Anticipate upcoming skill needs. (Coming soon)"
          />
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={TbZoomInArea}
            color="#51bcda"
            title="Insights on Future"
            description="Forward-looking market insights. (Coming soon)"
          />
        </Col>
      </Row>

      {/* Job Management */}
      <Row>
        <Col md="12">
          <h6 className="text-uppercase text-muted" style={{ marginTop: 6 }}>
            Job Management
          </h6>
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={TfiAnnouncement}
            color="#6bd098"
            title="Job Advertisements / Interviews"
            description="Create job ads and manage interviews."
            onClick={go("/industry/account/advertisements")}
          />
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={FaHandsHelping}
            color="#e14eca"
            title="Auto Job Advertisements"
            description="Generate job advertisements automatically."
            onClick={go("/industry/account/auto-job-advertisements")}
          />
        </Col>
      </Row>

      {/* Data Analysis and Skill Identification */}
      <Row>
        <Col md="12">
          <h6 className="text-uppercase text-muted" style={{ marginTop: 6 }}>
            Data Analysis and Skill Identification
          </h6>
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={FaListUl}
            color="#8965e0"
            title="Artifact Repositories"
            description="Browse and manage artifact repositories."
            onClick={go("/industry/account/artifacts")}
          />
        </Col>
      </Row>

      {/* Employee Skills and Information */}
      <Row>
        <Col md="12">
          <h6 className="text-uppercase text-muted" style={{ marginTop: 6 }}>
            Employee Skills and Information
          </h6>
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={FaPeopleRoof}
            color="#51cbce"
            title="Employee Skills"
            description="View and manage employee skills."
            onClick={go("/industry/account/employee-skills")}
          />
        </Col>
        <Col lg="3" md="6" className="mb-4">
          <NavCard
            icon={FaBuilding}
            color="#fbc658"
            title="Organization Information"
            description="Manage your organisation's profile and details."
            onClick={go("/industry/account/organization-info")}
          />
        </Col>
      </Row>
    </div>
  );
}

export default IndustryAccount;
