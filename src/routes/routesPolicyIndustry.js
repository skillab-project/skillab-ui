import Configuration from "views/dataConfiguration/Configuration";
import PolicyIndustryAccount from "views/PolicyIndustryAccount";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import ManagePolicies from "../views/policies/ManagePolicies";
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics";
import DemandAnalytics from "views/demand/analytics/DemandAnalytics"
import DemandForecasting from "views/demand/forecasting/DemandForecasting"
import SupplyAnalytics from "views/supply/analytics/SupplyAnalytics"
import SupplyForecasting from "views/supply/forecasting/SupplyForecasting"

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
        component: <DemandAnalytics />,
        layout: "/citizen",
      },
      {
        path: "/demand-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <DemandForecasting />,
        layout: "/citizen",
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
        component: <SupplyAnalytics />,
        layout: "/citizen",
      },
      {
        path: "/supply-forecasting",
        name: "Forecasting",
        icon: "nc-icon nc-chart-pie-36",
        component: <SupplyForecasting />,
        layout: "/citizen",
      },
    ],
  },
  {
    path: "/configuration",
    name: "Configuration",
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/policy-industry",
  },
];
export default routes;
