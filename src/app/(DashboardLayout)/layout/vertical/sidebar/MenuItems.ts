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
  IconAward,
  IconBoxMultiple,
  IconPoint,
  IconAlertCircle,
  IconNotes,
  IconCalendar,
  IconMail,
  IconTicket,
  IconEdit,
  IconGitMerge,
  IconCurrencyDollar,
  IconApps,
  IconFileDescription,
  IconFileDots,
  IconFiles,
  IconBan,
  IconStar,
  IconMoodSmile,
  IconBorderAll,
  IconBorderHorizontal,
  IconBorderInner,
  IconBorderVertical,
  IconBorderTop,
  IconUserCircle,
  IconPackage,
  IconMessage2,
  IconBasket,
  IconChartLine,
  IconChartArcs,
  IconChartCandle,
  IconChartArea,
  IconChartDots,
  IconChartDonut3,
  IconChartRadar,
  IconLogin,
  IconUserPlus,
  IconRotate,
  IconBox,
  IconShoppingCart,
  IconAperture,
  IconLayout,
  IconSettings,
  IconHelp,
  IconZoomCode,
  IconBoxAlignBottom,
  IconBoxAlignLeft,
  IconBorderStyle2,
  IconAppWindow,
  IconUser,
  IconDashboard,
  IconBuildingStore,
  IconCreditCard,
  IconPlugConnected,
  IconCalculator,
  IconListSearch,
  IconKeyboard,
  IconBrandTwitter,
  IconReportAnalytics,
} from "@tabler/icons-react";

const Menuitems: MenuitemsType[] = [
  {
    navlabel: true,
    subheader: "Home",
  },

  
  
  {
    id: uniqueId(),
    title: "My Account",
    icon: IconUser,
    href: "/my-account",
  },
  
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconDashboard,
    href: "/dashboard",
  },
  
  {
    id: uniqueId(),
    title: "Business Profile",
    icon: IconBuildingStore,
    href: "/business-profile",
  },
  
  {
    id: uniqueId(),
    title: "Subscription and Payment",
    icon: IconCreditCard,
    href: "/subscription",
  },
  
  {
    id: uniqueId(),
    title: "Integrations",
    icon: IconPlugConnected,
    href: "/integrations",
  },
  
  {
    id: uniqueId(),
    title: "Calculator",
    icon: IconCalculator,
    href: "/calculator",
  },
  
  {
    id: uniqueId(),
    title: "Listing Optimizer",
    icon: IconListSearch,
    href: "/listing-optimizer",
  },
  
  {
    id: uniqueId(),
    title: "Keyword Tracker",
    icon: IconKeyboard,
    href: "/keyword-tracker",
  },
  
  {
    id: uniqueId(),
    title: "X Scan",
    icon: IconBrandTwitter,
    href: "/x-scan",
  },
  
  {
    id: uniqueId(),
    title: "Reports",
    icon: IconReportAnalytics,
    href: "/reports",
  },
  
];

export default Menuitems;
