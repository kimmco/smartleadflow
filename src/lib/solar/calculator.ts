import type { Lead, SolarAssessment } from "@/types/lead";

export function calculateSolarAssessment(
  lead: Lead
): SolarAssessment {

  const estimatedSystemSizeKw =
    Math.max(1, Math.ceil(lead.monthlyElectricityBill / 3000));

  const estimatedPriceMin =
    estimatedSystemSizeKw * 120_000;

  const estimatedPriceMax =
    estimatedSystemSizeKw * 160_000;

  let leadScore = 0;

  if (lead.monthlyElectricityBill >= 10_000) {
    leadScore += 30;
  }

  if (lead.monthlyElectricityBill >= 20_000) {
    leadScore += 20;
  }

  if (lead.backupRequired) {
    leadScore += 20;
  }

  if (lead.preferredInstallationDate) {
    leadScore += 15;
  }

  if (lead.propertyType === "COMMERCIAL") {
    leadScore += 15;
  }

  const priority =
    leadScore >= 80
      ? "HIGH"
      : leadScore >= 50
        ? "MEDIUM"
        : "LOW";

  return {
    estimatedSystemSizeKw,
    estimatedPriceMin,
    estimatedPriceMax,
    leadScore,
    priority,
  };
}