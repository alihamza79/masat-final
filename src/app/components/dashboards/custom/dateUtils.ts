import { PeriodType } from './PeriodSelector';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Calculate date range based on selected period
 * @param period The selected period
 * @param customStartDate Custom start date for custom period (in ISO format)
 * @param customEndDate Custom end date for custom period (in ISO format)
 * @returns Date range with start and end dates
 */
export function calculateDateRange(
  period: PeriodType, 
  customStartDate?: string, 
  customEndDate?: string
): DateRange {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now)
      };
      
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday)
      };
    }
    
    case 'last7days':
      return {
        startDate: startOfDay(subDays(now, 6)),
        endDate: endOfDay(now)
      };
      
    case 'last30days':
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now)
      };
      
    case 'currentMonth':
      return {
        startDate: startOfMonth(now),
        endDate: now
      };
      
    case 'previousMonth': {
      const lastMonth = subDays(startOfMonth(now), 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    }
    
    case 'currentQuarter':
      return {
        startDate: startOfQuarter(now),
        endDate: now
      };
      
    case 'previousQuarter': {
      const lastQuarter = subDays(startOfQuarter(now), 1);
      return {
        startDate: startOfQuarter(lastQuarter),
        endDate: endOfQuarter(lastQuarter)
      };
    }
    
    case 'currentYear':
      return {
        startDate: startOfYear(now),
        endDate: now
      };
      
    case 'previousYear': {
      const lastYear = subDays(startOfYear(now), 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear)
      };
    }
    
    case 'custom':
      if (customStartDate && customEndDate) {
        return {
          startDate: startOfDay(new Date(customStartDate)),
          endDate: endOfDay(new Date(customEndDate))
        };
      }
      // Fallback to last 30 days if custom dates are not provided
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now)
      };
      
    default:
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now)
      };
  }
}

/**
 * Calculate the previous period for comparison
 * @param currentRange The current date range
 * @returns The previous date range for comparison
 */
export function calculatePreviousPeriod(currentRange: DateRange): DateRange {
  const { startDate, endDate } = currentRange;
  const durationInMs = endDate.getTime() - startDate.getTime();
  
  return {
    startDate: new Date(startDate.getTime() - durationInMs),
    endDate: new Date(endDate.getTime() - durationInMs)
  };
}

/**
 * Format a date as YYYY-MM-DD
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
} 