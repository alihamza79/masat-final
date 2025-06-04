import { uniqueId } from "lodash";

interface MenuitemsType {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
}
import {

  IconGitMerge,
  IconCurrencyDollar,
    IconFileDescription,
  IconUserCircle,

  IconChartLine,

  IconChartDonut3,
 
  IconAperture,
 
  IconZoomCode,
 
  IconCalculator,
  IconUser,
  IconBulb,
  IconCreditCard
} from "@tabler/icons-react";

const Menuitems: MenuitemsType[] = [
  
  
  {
    id: uniqueId(),
    title: "menu.dashboard",
    icon: IconChartLine,
    href: "/dashboard",
  },
  
      {
        id: uniqueId(),
        title: "menu.expenses",
        icon: IconCurrencyDollar,
        href: "/expenses",
      },
      {
        id: uniqueId(),
    title: "menu.subscriptionPayment",
    icon: IconCurrencyDollar,
    href: "/subscriptions",
      },
      {
        id: uniqueId(),
    title: "menu.integrations",
    icon: IconGitMerge,
    href: "/integrations",
  },
  {
    id: uniqueId(),
    title: "menu.campaignCalculator",
    icon: IconCalculator,
    href: "/calculator",
  },
  
 
  {
    id: uniqueId(),
    title: "menu.listingOptimizer",
    icon: IconChartDonut3,
    href: "/listing-optfrfimizer",
  },
  {
    id: uniqueId(),
    title: "menu.keywordTracker",
    icon: IconZoomCode,
    href: "/keyword-tracker",
  },
  {
    id: uniqueId(),
    title: "menu.xScan",
    icon: IconAperture,
    href: "/x-scfran",
  },
  {
    id: uniqueId(),
    title: "menu.developmentRequests",
    icon: IconBulb,
    href: "/development-requests",
  },
  {
    id: uniqueId(),
    title: "menu.pricing",
    icon: IconCreditCard,
    href: "/pricing",
  },
  
];

export default Menuitems;
