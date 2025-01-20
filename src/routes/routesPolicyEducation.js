import PolicyEducationAccount from "views/PolicyEducationAccount";
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import Configuration from "views/dataConfiguration/Configuration";
import ManagePolicies from "../views/policies/ManagePolicies";

var routes = [
  {
    path: "/account",
    name: "My Policies",
    icon: "nc-icon nc-single-02",
    component: <PolicyEducationAccount />,
    layout: "/policy-education",
  },
  {
    path: "/account/manage-policies",
    name: "Manage Policies",
    icon: "nc-icon nc-single-02",
    component: <ManagePolicies />,
    layout: "/policy-education",
  },
  {
    path: "/labour-market-demand",
    name: "Labour Market Demand",
    icon: "nc-icon nc-bank",
    component: <LabourMarketDemand />,
    layout: "/policy-education",
  },
  {
    path: "/skills-demand-matrix",
    name: "Skills Demand Matrix",
    icon: "nc-icon nc-bank",
    component: <SkillDemandMatrix />,
    layout: "/policy-education",
  },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-bank",
    component: <Configuration />,
    // Maybe without one tab??
    layout: "/policy-education",
  },
];
export default routes;
