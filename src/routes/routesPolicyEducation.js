import PolicyEducationAccount from "views/PolicyEducationAccount";
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import Configuration from "views/dataConfiguration/Configuration";
import ManagePolicies from "../views/policies/ManagePolicies";
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics";

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
    icon: "nc-icon nc-planet",
    component: <LabourMarketDemand />,
    layout: "/policy-education",
  },
  {
    path: "/skills-demand-matrix",
    name: "Skills Demand Matrix",
    icon: "nc-icon nc-vector",
    component: <SkillDemandMatrix />,
    layout: "/policy-education",
  },
  {
    path: "/eu-general-purpose-statistics",
    name: "EU General-Purpose Statistics",
    icon: "nc-icon nc-bank",
    component: <EuGeneralPurposeStatistics />,
    layout: "/policy-education",
  },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/policy-education",
  },
];
export default routes;
