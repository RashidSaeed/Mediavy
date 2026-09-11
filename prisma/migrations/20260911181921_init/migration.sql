-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FieldForce" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FieldForce_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hcp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "fieldForceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hcp_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Hcp_fieldForceId_fkey" FOREIGN KEY ("fieldForceId") REFERENCES "FieldForce" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Chemist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chemist_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HcpChemistLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hcpId" TEXT NOT NULL,
    "chemistId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "HcpChemistLink_hcpId_fkey" FOREIGN KEY ("hcpId") REFERENCES "Hcp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HcpChemistLink_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "Chemist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CallPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "fieldForceId" TEXT NOT NULL,
    "hcpId" TEXT NOT NULL,
    "plannedCalls" INTEGER NOT NULL,
    CONSTRAINT "CallPlan_fieldForceId_fkey" FOREIGN KEY ("fieldForceId") REFERENCES "FieldForce" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CallPlan_hcpId_fkey" FOREIGN KEY ("hcpId") REFERENCES "Hcp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CallActual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "fieldForceId" TEXT NOT NULL,
    "hcpId" TEXT NOT NULL,
    "actualCalls" INTEGER NOT NULL,
    CONSTRAINT "CallActual_fieldForceId_fkey" FOREIGN KEY ("fieldForceId") REFERENCES "FieldForce" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CallActual_hcpId_fkey" FOREIGN KEY ("hcpId") REFERENCES "Hcp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "fieldForceId" TEXT NOT NULL,
    "hcpId" TEXT NOT NULL,
    "skuId" TEXT,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    CONSTRAINT "Engagement_fieldForceId_fkey" FOREIGN KEY ("fieldForceId") REFERENCES "FieldForce" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Engagement_hcpId_fkey" FOREIGN KEY ("hcpId") REFERENCES "Hcp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Engagement_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShareMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "hcpId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "chemistId" TEXT NOT NULL,
    "brandValue" REAL NOT NULL,
    "marketValue" REAL NOT NULL,
    CONSTRAINT "ShareMapping_hcpId_fkey" FOREIGN KEY ("hcpId") REFERENCES "Hcp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShareMapping_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShareMapping_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "Chemist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FieldForce_employeeCode_key" ON "FieldForce"("employeeCode");

-- CreateIndex
CREATE INDEX "FieldForce_regionId_idx" ON "FieldForce"("regionId");

-- CreateIndex
CREATE INDEX "Hcp_regionId_idx" ON "Hcp"("regionId");

-- CreateIndex
CREATE INDEX "Hcp_fieldForceId_idx" ON "Hcp"("fieldForceId");

-- CreateIndex
CREATE UNIQUE INDEX "Sku_name_key" ON "Sku"("name");

-- CreateIndex
CREATE INDEX "Chemist_regionId_idx" ON "Chemist"("regionId");

-- CreateIndex
CREATE INDEX "HcpChemistLink_chemistId_idx" ON "HcpChemistLink"("chemistId");

-- CreateIndex
CREATE UNIQUE INDEX "HcpChemistLink_hcpId_chemistId_key" ON "HcpChemistLink"("hcpId", "chemistId");

-- CreateIndex
CREATE INDEX "CallPlan_period_idx" ON "CallPlan"("period");

-- CreateIndex
CREATE INDEX "CallPlan_hcpId_idx" ON "CallPlan"("hcpId");

-- CreateIndex
CREATE UNIQUE INDEX "CallPlan_fieldForceId_hcpId_period_key" ON "CallPlan"("fieldForceId", "hcpId", "period");

-- CreateIndex
CREATE INDEX "CallActual_period_idx" ON "CallActual"("period");

-- CreateIndex
CREATE INDEX "CallActual_hcpId_idx" ON "CallActual"("hcpId");

-- CreateIndex
CREATE UNIQUE INDEX "CallActual_fieldForceId_hcpId_period_key" ON "CallActual"("fieldForceId", "hcpId", "period");

-- CreateIndex
CREATE INDEX "Engagement_period_idx" ON "Engagement"("period");

-- CreateIndex
CREATE INDEX "Engagement_hcpId_idx" ON "Engagement"("hcpId");

-- CreateIndex
CREATE INDEX "Engagement_fieldForceId_idx" ON "Engagement"("fieldForceId");

-- CreateIndex
CREATE INDEX "ShareMapping_period_idx" ON "ShareMapping"("period");

-- CreateIndex
CREATE INDEX "ShareMapping_hcpId_idx" ON "ShareMapping"("hcpId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareMapping_hcpId_skuId_chemistId_period_key" ON "ShareMapping"("hcpId", "skuId", "chemistId", "period");
