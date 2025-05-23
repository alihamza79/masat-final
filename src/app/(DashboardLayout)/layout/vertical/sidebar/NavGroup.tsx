import { IconBell, IconChartLine, IconCalculator, IconGitMerge, IconCurrencyDollar, IconBulb } from '@tabler/icons-react';
import { uniqueId } from 'lodash';

// Define the NavGroup interface
export interface NavGroup {
  id: string;
  title: string;
  icon: any;
  href: string;
}

// Define the iconMap for use in our navigation items
const iconMap = {
  dashboard: IconChartLine,
  calculator: IconCalculator,
  integrations: IconGitMerge,
  expenses: IconCurrencyDollar,
  features: IconBulb
};

const mainItems: NavGroup[] = [
  {
    id: uniqueId(),
    title: 'menu.apps',
    icon: iconMap.dashboard,
    href: '/dashboard',
  },
  {
    id: uniqueId(),
    title: 'menu.campaignCalculator',
    icon: iconMap.calculator,
    href: '/calculator',
  },
  {
    id: uniqueId(),
    title: 'menu.integrations',
    icon: iconMap.integrations,
    href: '/integrations',
  },
  {
    id: uniqueId(),
    title: 'menu.expenses',
    icon: iconMap.expenses,
    href: '/expenses',
  },
  {
    id: uniqueId(),
    title: 'menu.developmentRequests',
    icon: iconMap.features,
    href: '/development-requests',
  },
  {
    id: uniqueId(),
    title: 'menu.notifications',
    icon: <IconBell width={18} height={18} />,
    href: '/notifications',
  },
];

export default mainItems; 