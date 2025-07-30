import CitizenAccount from "views/CitizenAccount";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix"
import Configuration from "views/dataConfiguration/Configuration"
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics"
import DemandAnalytics from "views/demand/analytics/DemandAnalytics"
import DemandForecasting from "views/demand/forecasting/DemandForecasting"
import SupplyAnalytics from "views/supply/analytics/SupplyAnalytics"
import SupplyForecasting from "views/supply/forecasting/SupplyForecasting"

var routes = [
  {
    path: "/account",
    name: "My Account",
    icon: "nc-icon nc-single-02",
    component: <CitizenAccount />,
    layout: "/citizen",
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
    path: "/Configuration",
    name: "Configuration",
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/citizen",
  }
];
export default routes;
