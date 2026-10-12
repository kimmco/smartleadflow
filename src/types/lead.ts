export type PropertyType =
  | "RESIDENTIAL"
  | "COMMERCIAL";

export interface Lead {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  location: string;
  propertyType: PropertyType;
  monthlyElectricityBill: number;
  backupRequired: boolean;
  preferredInstallationDate?: string;
  source?: string;
  consent: boolean;
}

export interface SolarAssessment {
  estimatedSystemSizeKw: number;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  leadScore: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
}