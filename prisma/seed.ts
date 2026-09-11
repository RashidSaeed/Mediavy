/**
 * Mock/sample data generator for Mediavy.
 *
 * Generates a realistic-looking (but entirely fictional) dataset: regions,
 * field force reps, HCPs, SKUs, chemists, plan vs actual calls, HCP
 * engagements (count + value), and HCP/SKU/Chemist share mapping — across
 * the trailing 6 months.
 *
 * Run with: npm run db:seed
 */
import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

faker.seed(42);

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const REGIONS = [
  { name: "North", code: "NORTH" },
  { name: "South", code: "SOUTH" },
  { name: "East", code: "EAST" },
  { name: "West", code: "WEST" },
  { name: "Central", code: "CENTRAL" },
];

const DESIGNATIONS = ["Medical Rep", "Senior Medical Rep", "Territory Manager"];

const SKUS = [
  { name: "Cardimax 10", brand: "Cardimax", category: "Cardiology" },
  { name: "Cardimax 20", brand: "Cardimax", category: "Cardiology" },
  { name: "Gluconorm", brand: "Glucon", category: "Diabetes" },
  { name: "Glucostat XR", brand: "Glucon", category: "Diabetes" },
  { name: "Respiclear", brand: "Respiclear", category: "Respiratory" },
  { name: "Neurolief", brand: "Neurolief", category: "Neurology" },
  { name: "Orthoease", brand: "Orthoease", category: "Orthopedics" },
  { name: "Pediasafe Syrup", brand: "Pediasafe", category: "Pediatrics" },
  { name: "Gynocare", brand: "Gynocare", category: "Gynecology" },
];

const SPECIALTY_CATEGORY_MAP: Record<string, string[]> = {
  Cardiologist: ["Cardiology"],
  Endocrinologist: ["Diabetes"],
  "General Physician": ["Cardiology", "Diabetes", "Respiratory"],
  Pulmonologist: ["Respiratory"],
  Neurologist: ["Neurology"],
  Orthopedic: ["Orthopedics"],
  Gynecologist: ["Gynecology"],
  Pediatrician: ["Pediatrics"],
};
const SPECIALTIES = Object.keys(SPECIALTY_CATEGORY_MAP);

const HCP_TIERS = ["A", "B", "C"] as const;
const CHEMIST_TIERS = ["Key", "Standard"] as const;
const ENGAGEMENT_TYPES = [
  "Detailing",
  "Sampling",
  "CME",
  "RTM",
  "Group Meeting",
] as const;

const PLANNED_CALLS_BY_TIER: Record<string, number> = { A: 3, B: 2, C: 1 };
const VALUE_BASELINE_BY_TYPE: Record<string, number> = {
  Detailing: 8000,
  Sampling: 4000,
  CME: 25000,
  RTM: 6000,
  "Group Meeting": 40000,
};

/** Trailing 6 periods ("YYYY-MM"), most recent last, ending this month. */
function trailingPeriods(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
const PERIODS = trailingPeriods(6);

function pick<T>(arr: readonly T[]): T {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.shareMapping.deleteMany();
  await prisma.engagement.deleteMany();
  await prisma.callActual.deleteMany();
  await prisma.callPlan.deleteMany();
  await prisma.hcpChemistLink.deleteMany();
  await prisma.hcp.deleteMany();
  await prisma.chemist.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.fieldForce.deleteMany();
  await prisma.region.deleteMany();

  console.log("Seeding regions...");
  const regions = [];
  for (const r of REGIONS) {
    regions.push(await prisma.region.create({ data: r }));
  }

  console.log("Seeding SKUs...");
  const skus = [];
  for (const s of SKUS) {
    skus.push(await prisma.sku.create({ data: s }));
  }

  console.log("Seeding field force...");
  type FF = Awaited<ReturnType<typeof prisma.fieldForce.create>> & {
    perf: number;
  };
  const fieldForce: FF[] = [];
  let ffSeq = 1;
  for (const region of regions) {
    const count = faker.number.int({ min: 3, max: 4 });
    for (let i = 0; i < count; i++) {
      const ff = await prisma.fieldForce.create({
        data: {
          employeeCode: `FF${String(ffSeq).padStart(4, "0")}`,
          name: faker.person.fullName(),
          designation: pick(DESIGNATIONS),
          regionId: region.id,
        },
      });
      ffSeq++;
      // Each rep has a consistent "performance factor" (how close to plan
      // they actually execute) so trends look coherent period over period.
      fieldForce.push({ ...ff, perf: faker.number.float({ min: 0.65, max: 1.15, fractionDigits: 2 }) });
    }
  }

  console.log("Seeding chemists...");
  const chemists = [];
  for (const region of regions) {
    const count = faker.number.int({ min: 4, max: 6 });
    for (let i = 0; i < count; i++) {
      chemists.push(
        await prisma.chemist.create({
          data: {
            name: `${faker.company.name().replace(/[,.]/g, "")} Pharmacy`,
            tier: pick(CHEMIST_TIERS),
            regionId: region.id,
          },
        })
      );
    }
  }

  console.log("Seeding HCPs + chemist links...");
  type HCPX = Awaited<ReturnType<typeof prisma.hcp.create>>;
  const hcps: HCPX[] = [];
  const hcpChemists = new Map<string, string[]>(); // hcpId -> chemistIds (primary first)

  for (const region of regions) {
    const regionFF = fieldForce.filter((f) => f.regionId === region.id);
    const regionChemists = chemists.filter((c) => c.regionId === region.id);
    const count = faker.number.int({ min: 10, max: 14 });
    for (let i = 0; i < count; i++) {
      const specialty = pick(SPECIALTIES);
      const hcp = await prisma.hcp.create({
        data: {
          name: `Dr. ${faker.person.fullName()}`,
          specialty,
          tier: pick(HCP_TIERS),
          regionId: region.id,
          fieldForceId: pick(regionFF).id,
        },
      });
      hcps.push(hcp);

      // Link to 2-3 chemists in-region; first is primary.
      const linkedChemists = faker.helpers.arrayElements(
        regionChemists,
        Math.min(regionChemists.length, faker.number.int({ min: 2, max: 3 }))
      );
      hcpChemists.set(
        hcp.id,
        linkedChemists.map((c) => c.id)
      );
      for (let j = 0; j < linkedChemists.length; j++) {
        await prisma.hcpChemistLink.create({
          data: {
            hcpId: hcp.id,
            chemistId: linkedChemists[j].id,
            isPrimary: j === 0,
          },
        });
      }
    }
  }

  console.log("Seeding call plan / actual, engagements, share mapping...");
  const callPlanRows: {
    period: string;
    fieldForceId: string;
    hcpId: string;
    plannedCalls: number;
  }[] = [];
  const callActualRows: {
    period: string;
    fieldForceId: string;
    hcpId: string;
    actualCalls: number;
  }[] = [];
  const engagementRows: {
    period: string;
    fieldForceId: string;
    hcpId: string;
    skuId: string | null;
    type: string;
    count: number;
    value: number;
  }[] = [];
  const shareRows: {
    period: string;
    hcpId: string;
    skuId: string;
    chemistId: string;
    brandValue: number;
    marketValue: number;
  }[] = [];

  const ffById = new Map(fieldForce.map((f) => [f.id, f]));

  for (const hcp of hcps) {
    const ff = ffById.get(hcp.fieldForceId)!;
    const relevantCategories = SPECIALTY_CATEGORY_MAP[hcp.specialty];
    const relevantSkus = skus.filter((s) => relevantCategories.includes(s.category));
    const hcpSkuFocus = faker.helpers.arrayElements(
      relevantSkus,
      Math.min(relevantSkus.length, faker.number.int({ min: 1, max: 2 }))
    );
    const linkedChemistIds = hcpChemists.get(hcp.id) ?? [];

    for (const period of PERIODS) {
      // --- Plan vs actual calls ---
      const basePlanned = PLANNED_CALLS_BY_TIER[hcp.tier];
      const plannedCalls = Math.max(
        1,
        basePlanned + faker.number.int({ min: -1, max: 1 })
      );
      const noise = faker.number.float({ min: 0.85, max: 1.15, fractionDigits: 2 });
      const actualCalls = Math.max(
        0,
        Math.round(plannedCalls * ff.perf * noise)
      );

      callPlanRows.push({ period, fieldForceId: ff.id, hcpId: hcp.id, plannedCalls });
      callActualRows.push({ period, fieldForceId: ff.id, hcpId: hcp.id, actualCalls });

      // --- Engagements (count + value) ---
      const engagementCount = faker.number.int({ min: 1, max: 3 });
      for (let e = 0; e < engagementCount; e++) {
        const type = pick(ENGAGEMENT_TYPES);
        const sku = relevantSkus.length ? pick(relevantSkus) : null;
        const count = faker.number.int({ min: 1, max: 3 });
        const base = VALUE_BASELINE_BY_TYPE[type];
        const tierMultiplier = hcp.tier === "A" ? 1.4 : hcp.tier === "B" ? 1.1 : 0.8;
        const value = round2(
          base * count * tierMultiplier * faker.number.float({ min: 0.7, max: 1.3, fractionDigits: 2 })
        );
        engagementRows.push({
          period,
          fieldForceId: ff.id,
          hcpId: hcp.id,
          skuId: sku?.id ?? null,
          type,
          count,
          value,
        });
      }

      // --- Share mapping: HCP x SKU (focus brands) x linked chemist ---
      for (const sku of hcpSkuFocus) {
        for (const chemistId of linkedChemistIds) {
          const tierMultiplier = hcp.tier === "A" ? 1.6 : hcp.tier === "B" ? 1.15 : 0.75;
          const marketValue = round2(
            faker.number.float({ min: 20000, max: 60000, fractionDigits: 2 }) * tierMultiplier
          );
          const shareFraction = faker.number.float({ min: 0.12, max: 0.55, fractionDigits: 3 });
          const brandValue = round2(marketValue * shareFraction);
          shareRows.push({
            period,
            hcpId: hcp.id,
            skuId: sku.id,
            chemistId,
            brandValue,
            marketValue,
          });
        }
      }
    }
  }

  console.log(
    `Inserting ${callPlanRows.length} call-plan, ${callActualRows.length} call-actual, ${engagementRows.length} engagement, ${shareRows.length} share-mapping rows...`
  );
  await prisma.callPlan.createMany({ data: callPlanRows });
  await prisma.callActual.createMany({ data: callActualRows });
  await prisma.engagement.createMany({ data: engagementRows });
  await prisma.shareMapping.createMany({ data: shareRows });

  console.log("Done.");
  console.log({
    regions: regions.length,
    fieldForce: fieldForce.length,
    chemists: chemists.length,
    hcps: hcps.length,
    skus: skus.length,
    periods: PERIODS,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
