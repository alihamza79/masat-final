/**
 * Custom type declarations
 */

// Declaration for the country-telephone-data module
declare module 'country-telephone-data' {
  export interface CountryData {
    name: string;
    iso2: string;
    dialCode: string;
    priority?: number;
    areaCodes?: string[] | null;
    format?: string;
  }

  export const allCountries: CountryData[];
  export const iso2Lookup: Record<string, CountryData>;
  export const allCountryCodes: Record<string, string[]>;
} 