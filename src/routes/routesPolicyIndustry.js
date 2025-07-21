import Configuration from "views/dataConfiguration/Configuration";
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand";
import PolicyIndustryAccount from "views/PolicyIndustryAccount";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import ManagePolicies from "../views/policies/ManagePolicies";
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics";

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
    name: "Demand",
    isCategory: true, 
    children: [
      {
        path: "/demand-analytics",
        name: "Analytics",
        icon: "nc-icon nc-zoom-split",
        component: <SkillDemandMatrix />,
        layout: "/policy-industry",
      },
      {
        path: "/demand-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SkillDemandMatrix />,
        layout: "/policy-industry",
      },
    ],
  },
  {
    name: "Supply",
    isCategory: true,
    children: [
      {
        path: "/supply-analytics",
        name: "Analytics",
        icon: "nc-icon nc-zoom-split",
        component: <SkillDemandMatrix />,
        layout: "/policy-industry",
      },
      {
        path: "/supply-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SkillDemandMatrix />,
        layout: "/policy-industry",
      },
    ],
  },
  // {
  //   path: "/labour-market-demand",
  //   name: "Labour Market Demand",
  //   icon: "nc-icon nc-planet",
  //   component: <LabourMarketDemand />,
  //   layout: "/policy-industry",
  // },
  // {
  //   path: "/skills-demand-matrix",
  //   name: "Skills Demand Matrix",
  //   icon: "nc-icon nc-vector",
  //   component: <SkillDemandMatrix />,
  //   layout: "/policy-industry",
  // },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/policy-industry",
  },
];
export default routes;
