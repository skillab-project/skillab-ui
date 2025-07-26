import PolicyEducationAccount from "views/PolicyEducationAccount";
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
    name: "Demand",
    isCategory: true, 
    children: [
      {
        path: "/demand-analytics",
        name: "Analytics",
        icon: "nc-icon nc-zoom-split",
        component: <SkillDemandMatrix />,
        layout: "/policy-education",
      },
      {
        path: "/demand-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SkillDemandMatrix />,
        layout: "/policy-education",
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
        layout: "/policy-education",
      },
      {
        path: "/supply-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SkillDemandMatrix />,
        layout: "/policy-education",
      },
    ],
  },
  // {
  //   path: "/labour-market-demand",
  //   name: "Labour Market Demand",
  //   icon: "nc-icon nc-planet",
  //   component: <LabourMarketDemand />,
  //   layout: "/policy-education",
  // },
  // {
  //   path: "/skills-demand-matrix",
  //   name: "Skills Demand Matrix",
  //   icon: "nc-icon nc-vector",
  //   component: <SkillDemandMatrix />,
  //   layout: "/policy-education",
  // },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/policy-education",
  },
];
export default routes;
