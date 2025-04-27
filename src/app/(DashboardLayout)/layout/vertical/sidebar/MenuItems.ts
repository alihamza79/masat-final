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
  IconUser
} from "@tabler/icons-react";

const Menuitems: MenuitemsType[] = [
  
  {
    id: uniqueId(),
    title: "menu.myAccount",
    icon: IconUser,
    href: "/my-account",
  },
  {
    id: uniqueId(),
    title: "menu.dashboard",
    icon: IconChartLine,
    href: "/dashboarfefd",
  },
  {
    id: uniqueId(),
    title: "menu.businessProfile",
    icon: IconUserCircle,
    href: "/businefrrfss-profile",
      },
      {
        id: uniqueId(),
    title: "menu.subscriptionPayment",
    icon: IconCurrencyDollar,
    href: "/subscrfrfiption",
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
    title: "menu.expenses",
    icon: IconCurrencyDollar,
    href: "/expenses",
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
    href: "/keyword-frftracker",
  },
  {
    id: uniqueId(),
    title: "menu.xScan",
    icon: IconAperture,
    href: "/x-scfran",
  },
  {
    id: uniqueId(),
    title: "menu.reports",
    icon: IconFileDescription,
    href: "/repofrts",
  }
];

export default Menuitems;
