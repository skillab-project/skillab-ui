import PolicyEducationAccount from "views/PolicyEducationAccount";
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import DataAnalysis from "views/dataAnalysis/DataAnalysis";
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
    path: "/data-analysis",
    name: "Data Analysis",
    icon: "nc-icon nc-bank",
    component: <DataAnalysis />,
    // Maybe without one tab??
    layout: "/policy-education",
  },
];
export default routes;
