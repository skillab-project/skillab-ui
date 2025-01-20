import Configuration from "views/dataConfiguration/Configuration";
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand";
import PolicyIndustryAccount from "views/PolicyIndustryAccount";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import ManagePolicies from "../views/policies/ManagePolicies";

var routes = [
  {
    path: "/account",
    name: "My Policies",
    icon: "nc-icon nc-single-02",
    component: <PolicyIndustryAccount />,
    layout: "/policy-industry",
  },
  {
    path: "/account/manage-policies",
    name: "Manage Policies",
    icon: "nc-icon nc-single-02",
    component: <ManagePolicies />,
    layout: "/policy-industry",
  },
  {
    path: "/labour-market-demand",
    name: "Labour Market Demand",
    icon: "nc-icon nc-bank",
    component: <LabourMarketDemand />,
    layout: "/policy-industry",
  },
  {
    path: "/skills-demand-matrix",
    name: "Skills Demand Matrix",
    icon: "nc-icon nc-bank",
    component: <SkillDemandMatrix />,
    layout: "/policy-industry",
  },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-bank",
    component: <Configuration />,
    // Maybe without one tab??
    layout: "/policy-industry",
  },
];
export default routes;
