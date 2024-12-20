import EducationAccount from "views/EducationAccount"
import DataAnalysis from "views/dataAnalysis/DataAnalysis"

var routes = [
  {
    path: "/account",
    name: "My University",
    icon: "nc-icon nc-single-02",
    component: <EducationAccount />,
    layout: "/education",
  },
  {
    path: "/data-analysis",
    name: "Data Analysis",
    icon: "nc-icon nc-bank",
    component: <DataAnalysis />,
    layout: "/education",
  },
];
export default routes;
