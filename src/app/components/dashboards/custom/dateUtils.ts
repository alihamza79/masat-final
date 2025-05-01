import { PeriodType } from './PeriodSelector';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subQuarters, subMonths } from 'date-fns';

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
      
    case 'thisMonth':
      return {
        startDate: startOfMonth(now),
        endDate: endOfDay(now)
      };
      
    case 'lastMonth': {
      const lastMonth = subDays(startOfMonth(now), 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    }
    
    case 'thisQuarter': {
      // Custom 4-month quarter calculation
      const month = now.getMonth();
      // Determine the start month of the 4-month quarter (0, 4, 8)
      const startMonth = Math.floor(month / 4) * 4;
      const startQuarterDate = new Date(now.getFullYear(), startMonth, 1);
      
      return {
        startDate: startOfDay(startQuarterDate),
        endDate: endOfDay(now)
      };
    }
      
    case 'lastQuarter': {
      // Custom 4-month quarter calculation for previous quarter
      const month = now.getMonth();
      const startMonth = Math.floor(month / 4) * 4;
      
      // If we're in the first quarter, go to last year's last quarter
      let prevQuarterStartMonth, prevQuarterYear;
      
      if (startMonth === 0) {
        // If in first quarter (months 0-3), go to previous year's last quarter (months 8-11)
        prevQuarterStartMonth = 8;
        prevQuarterYear = now.getFullYear() - 1;
      } else {
        // Otherwise, go to previous quarter in same year
        prevQuarterStartMonth = startMonth - 4;
        prevQuarterYear = now.getFullYear();
      }
      
      const prevQuarterStart = new Date(prevQuarterYear, prevQuarterStartMonth, 1);
      const prevQuarterEnd = new Date(prevQuarterYear, prevQuarterStartMonth + 4, 0);
      
      return {
        startDate: startOfDay(prevQuarterStart),
        endDate: endOfDay(prevQuarterEnd)
      };
    }
    
    case 'thisYear':
      return {
        startDate: startOfYear(now),
        endDate: endOfDay(now)
      };
      
    case 'lastYear': {
      const lastYear = subDays(startOfYear(now), 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear)
      };
    }
    
    case 'allTime':
      // For all time, use a far past date (2000-01-01) to ensure we get all historical data
      return {
        startDate: new Date(2000, 0, 1),
        endDate: endOfDay(now)
      };
    
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