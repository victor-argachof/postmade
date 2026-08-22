ALTER TYPE "IdentityProvider" ADD VALUE IF NOT EXISTS 'google';
ALTER TYPE "ChallengePurpose" ADD VALUE IF NOT EXISTS 'email_change';
DROP INDEX "Identity_userId_provider_key";
CREATE UNIQUE INDEX "Identity_userId_key" ON "Identity"("userId");
