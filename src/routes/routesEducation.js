import EducationAccount from "views/EducationAccount"
import Configuration from "views/dataConfiguration/Configuration"
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics";
import EducationManagement from "views/education/EducationManagement";
import DemandAnalytics from "views/demand/analytics/DemandAnalytics"
import DemandForecasting from "views/demand/forecasting/DemandForecasting"
import SupplyAnalytics from "views/supply/analytics/SupplyAnalytics"
import SupplyForecasting from "views/supply/forecasting/SupplyForecasting"
import TaxonomyManagement from "views/taxonomies/TaxonomyManagement";

var routes = [
  {
    path: "/account",
    name: "My University",
    icon: "nc-icon nc-single-02",
    component: <EducationAccount />,
    layout: "/education",
  },
  {
    path: "/account/management",
    name: "Management",
    icon: "nc-icon nc-single-02",
    component: <EducationManagement />,
    layout: "/education",
  },
  {
    path: "/account/taxonomy",
    name: "Taxonomy",
    icon: "nc-icon nc-single-02",
    component: <TaxonomyManagement />,
    layout: "/education",
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
    layout: "/education",
  },
];
export default routes;
