import EducationAccount from "views/EducationAccount"
import Configuration from "views/dataConfiguration/Configuration"
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics";

var routes = [
  {
    path: "/account",
    name: "My University",
    icon: "nc-icon nc-single-02",
    component: <EducationAccount />,
    layout: "/education",
  },
  {
    path: "/labour-market-demand",
    name: "Labour Market Demand",
    icon: "nc-icon nc-bank",
    component: <LabourMarketDemand />,
    layout: "/education",
  },
  {
    path: "/skills-demand-matrix",
    name: "Skills Demand Matrix",
    icon: "nc-icon nc-bank",
    component: <SkillDemandMatrix />,
    layout: "/education",
  },
  {
    path: "/eu-general-purpose-statistics",
    name: "EU General-Purpose Statistics",
    icon: "nc-icon nc-bank",
    component: <EuGeneralPurposeStatistics />,
    layout: "/education",
  },
  {
    path: "/Configuration",
    name: "Configuration",
    icon: "nc-icon nc-bank",
    component: <Configuration />,
    layout: "/education",
  },
];
export default routes;
