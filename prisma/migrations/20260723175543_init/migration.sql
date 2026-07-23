-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthenticationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "csOwner" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "segment" TEXT,
    "segmentSourceTitle" TEXT,
    "segmentSourceUrl" TEXT,
    "segmentVerifiedAt" DATETIME,
    "contactName" TEXT,
    "contactRole" TEXT,
    "contactInfo" TEXT,
    "technicalOwner" TEXT,
    "startDate" DATETIME,
    "renewalDate" DATETIME,
    "healthScore" INTEGER,
    "healthStatus" TEXT NOT NULL DEFAULT 'Não avaliado',
    "healthReason" TEXT,
    "attentionPoints" TEXT,
    "actionPlan" TEXT,
    "lastContact" DATETIME,
    "nextContact" DATETIME,
    "lastVisit" DATETIME,
    "nextVisit" DATETIME,
    "needs" TEXT,
    "currentPerception" TEXT,
    "expansionPlan" TEXT,
    "growthEstimate" TEXT,
    "opportunities" TEXT,
    "expansionNextStep" TEXT,
    "annualRevenue" REAL,
    "fiscalYear" INTEGER,
    "revenueMetric" TEXT,
    "revenuePeriod" TEXT,
    "revenueSourceTitle" TEXT,
    "revenueSourceUrl" TEXT,
    "revenueVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CustomerService" (
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    PRIMARY KEY ("customerId", "serviceId"),
    CONSTRAINT "CustomerService_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Observation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExternalLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalUpdatedAt" DATETIME,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncDirection" TEXT NOT NULL,
    CONSTRAINT "ExternalLink_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "customerId" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_email_idx" ON "UserSession"("email");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthenticationCode_email_idx" ON "AuthenticationCode"("email");

-- CreateIndex
CREATE INDEX "AuthenticationCode_email_requestedAt_idx" ON "AuthenticationCode"("email", "requestedAt");

-- CreateIndex
CREATE INDEX "Customer_companyName_idx" ON "Customer"("companyName");

-- CreateIndex
CREATE INDEX "Customer_csOwner_idx" ON "Customer"("csOwner");

-- CreateIndex
CREATE INDEX "Customer_category_idx" ON "Customer"("category");

-- CreateIndex
CREATE INDEX "Customer_segment_idx" ON "Customer"("segment");

-- CreateIndex
CREATE INDEX "Customer_healthStatus_idx" ON "Customer"("healthStatus");

-- CreateIndex
CREATE INDEX "Customer_nextContact_idx" ON "Customer"("nextContact");

-- CreateIndex
CREATE INDEX "Customer_nextVisit_idx" ON "Customer"("nextVisit");

-- CreateIndex
CREATE INDEX "Customer_lastContact_idx" ON "Customer"("lastContact");

-- CreateIndex
CREATE INDEX "Customer_lastVisit_idx" ON "Customer"("lastVisit");

-- CreateIndex
CREATE INDEX "Customer_fiscalYear_idx" ON "Customer"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_active_idx" ON "Service"("active");

-- CreateIndex
CREATE INDEX "CustomerService_serviceId_idx" ON "CustomerService"("serviceId");

-- CreateIndex
CREATE INDEX "Observation_customerId_idx" ON "Observation"("customerId");

-- CreateIndex
CREATE INDEX "Observation_createdAt_idx" ON "Observation"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "ExternalLink_customerId_idx" ON "ExternalLink"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalLink_provider_externalId_key" ON "ExternalLink"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalLink_customerId_provider_key" ON "ExternalLink"("customerId", "provider");

-- CreateIndex
CREATE INDEX "SyncLog_provider_idx" ON "SyncLog"("provider");

-- CreateIndex
CREATE INDEX "SyncLog_customerId_idx" ON "SyncLog"("customerId");

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");
