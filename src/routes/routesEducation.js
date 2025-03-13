import EducationAccount from "views/EducationAccount"
import Configuration from "views/dataConfiguration/Configuration"
import LabourMarketDemand from "views/labourMarketDemand/LabourMarketDemand";
import SkillDemandMatrix from "views/skillDemandMatrix/SkillDemandMatrix";
import EuGeneralPurposeStatistics from "views/EuGeneralPurposeStatistics";
import EducationManagement from "views/education/EducationManagement";

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
    path: "/labour-market-demand",
    name: "Labour Market Demand",
    icon: "nc-icon nc-planet",
    component: <LabourMarketDemand />,
    layout: "/education",
  },
  {
    path: "/skills-demand-matrix",
    name: "Skills Demand Matrix",
    icon: "nc-icon nc-vector",
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
    icon: "nc-icon nc-settings",
    component: <Configuration />,
    layout: "/education",
  },
];
export default routes;
