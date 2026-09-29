import { PrismaClient } from "@prisma/client";
import { initialCountryProfiles } from "@globalwork/domain";
import { scryptSync } from "crypto";

const prisma = new PrismaClient();

async function main() {
  for (const profile of initialCountryProfiles) {
    await prisma.countryProfile.upsert({
      where: { countryCode: profile.countryCode },
      update: {
        defaultCurrency: profile.defaultCurrency,
        payrollFrequency: profile.payrollFrequency,
        standardWorkWeekHours: profile.standardWorkWeekHours,
        annualPtoDays: profile.annualPtoDays,
        employerCostRateBps: profile.employerCostRateBps,
        requiredWorkerDocuments: profile.requiredWorkerDocuments,
        requiredContractFields: profile.requiredContractFields
      },
      create: {
        countryCode: profile.countryCode,
        countryName: countryName(profile.countryCode),
        defaultCurrency: profile.defaultCurrency,
        payrollFrequency: profile.payrollFrequency,
        standardWorkWeekHours: profile.standardWorkWeekHours,
        annualPtoDays: profile.annualPtoDays,
        employerCostRateBps: profile.employerCostRateBps,
        requiredWorkerDocuments: profile.requiredWorkerDocuments,
        requiredContractFields: profile.requiredContractFields
      }
    });
  }

  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@globalwork.local" },
    update: {},
    create: {
      email: "admin@globalwork.local",
      name: "Avery Platform Admin",
      passwordHash: developmentPasswordHash("Password123!"),
      platformRole: "PLATFORM_ADMIN"
    }
  });

  const clientOwner = await prisma.user.upsert({
    where: { email: "owner@acme.example" },
    update: {},
    create: {
      email: "owner@acme.example",
      name: "Morgan Client Owner",
      passwordHash: developmentPasswordHash("Password123!")
    }
  });

  const organization = await prisma.organization.upsert({
    where: { id: "demo-org-acme" },
    update: {},
    create: {
      id: "demo-org-acme",
      legalName: "Acme Robotics Inc.",
      tradeName: "Acme Robotics",
      billingEmail: "finance@acme.example",
      billingCurrency: "USD",
      countryCode: "US",
      status: "APPROVED"
    }
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: clientOwner.id
      }
    },
    update: { role: "CLIENT_OWNER" },
    create: {
      organizationId: organization.id,
      userId: clientOwner.id,
      role: "CLIENT_OWNER"
    }
  });

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      actorId: platformAdmin.id,
      action: "seed.demo_data_created",
      entityType: "Organization",
      entityId: organization.id,
      after: {
        legalName: organization.legalName,
        status: organization.status
      }
    }
  });
}

function countryName(countryCode: string): string {
  const names: Record<string, string> = {
    US: "United States",
    CA: "Canada",
    GB: "United Kingdom"
  };

  return names[countryCode] ?? countryCode;
}

function developmentPasswordHash(password: string): string {
  const salt = "globalwork-development-salt";
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
