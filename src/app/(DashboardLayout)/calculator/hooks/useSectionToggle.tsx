import { useState } from 'react';
import { CardKey } from './useCalculatorReset';

export type SectionKey = 'sales' | 'commission' | 'fulfillment' | 'expenditures' | 'productCost' | 'taxes' | 'profit';
export type ExpandedSections = Record<CardKey, Record<SectionKey, boolean>>;

export const useSectionToggle = () => {
  // State for expanded/collapsed sections
  const [isExpanded, setIsExpanded] = useState(true);
  
  // State for tracking which sections are expanded
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    'FBM-NonGenius': {
      sales: true,
      commission: true,
      fulfillment: true,
      expenditures: true,
      productCost: true,
      taxes: true,
      profit: true,
    },
    'FBM-Genius': {
      sales: true,
      commission: true,
      fulfillment: true,
      expenditures: true,
      productCost: true,
      taxes: true,
      profit: true,
    },
    'FBE': {
      sales: true,
      commission: true,
      fulfillment: true,
      expenditures: true,
      productCost: true,
      taxes: true,
      profit: true,
    },
  });

  // Check if any section is expanded
  const isAnySectionExpanded = Object.values(expandedSections).some(section => 
    Object.values(section).includes(true)
  );

  /**
   * Toggle a specific section for all categories
   * @param category The category to toggle
   * @param section The section to toggle
   */
  const handleSectionToggle = (category: CardKey, section: SectionKey) => {
    setExpandedSections(prev => {
      const newValue = !prev[category][section];
      return Object.keys(prev).reduce((acc, cat) => ({
        ...acc,
        [cat]: {
          ...prev[cat as CardKey],
          [section]: newValue,
        },
      }), {} as ExpandedSections);
    });
  };

  /**
   * Toggle all sections at once
   */
  const handleToggleAll = () => {
    const shouldExpand = !isAnySectionExpanded;
    setIsExpanded(shouldExpand);
    setExpandedSections(prev => 
      Object.keys(prev).reduce((acc, category) => ({
        ...acc,
        [category]: Object.keys(prev[category as keyof ExpandedSections]).reduce((secAcc, section) => ({
          ...secAcc,
          [section]: shouldExpand,
        }), {} as Record<SectionKey, boolean>),
      }), {} as ExpandedSections)
    );
  };

  return {
    expandedSections,
    isExpanded,
    isAnySectionExpanded,
    handleSectionToggle,
    handleToggleAll
  };
};

export default useSectionToggle; 