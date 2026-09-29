import type { CurrencyCode } from "./money";

export type SupportedCountryCode = "US" | "CA" | "GB";

export type WorkerDocumentType =
  | "IDENTITY"
  | "PROOF_OF_ADDRESS"
  | "TAX_FORM"
  | "BANK_DETAILS"
  | "WORK_AUTHORIZATION"
  | "SIGNED_CONTRACT";

export interface CountryProfile {
  countryCode: SupportedCountryCode;
  defaultCurrency: CurrencyCode;
  payrollFrequency: "MONTHLY" | "BIWEEKLY";
  standardWorkWeekHours: number;
  requiredWorkerDocuments: WorkerDocumentType[];
  requiredContractFields: string[];
  annualPtoDays: number;
  employerCostRateBps: number;
}

export const initialCountryProfiles: CountryProfile[] = [
  {
    countryCode: "US",
    defaultCurrency: "USD",
    payrollFrequency: "BIWEEKLY",
    standardWorkWeekHours: 40,
    requiredWorkerDocuments: ["IDENTITY", "TAX_FORM", "BANK_DETAILS", "WORK_AUTHORIZATION", "SIGNED_CONTRACT"],
    requiredContractFields: ["jobTitle", "salary", "startDate", "workLocation"],
    annualPtoDays: 15,
    employerCostRateBps: 1400
  },
  {
    countryCode: "CA",
    defaultCurrency: "CAD",
    payrollFrequency: "MONTHLY",
    standardWorkWeekHours: 40,
    requiredWorkerDocuments: ["IDENTITY", "TAX_FORM", "BANK_DETAILS", "SIGNED_CONTRACT"],
    requiredContractFields: ["jobTitle", "salary", "startDate", "province", "workLocation"],
    annualPtoDays: 15,
    employerCostRateBps: 1300
  },
  {
    countryCode: "GB",
    defaultCurrency: "GBP",
    payrollFrequency: "MONTHLY",
    standardWorkWeekHours: 37.5,
    requiredWorkerDocuments: ["IDENTITY", "PROOF_OF_ADDRESS", "BANK_DETAILS", "WORK_AUTHORIZATION", "SIGNED_CONTRACT"],
    requiredContractFields: ["jobTitle", "salary", "startDate", "workLocation", "probationPeriod"],
    annualPtoDays: 28,
    employerCostRateBps: 1600
  }
];
