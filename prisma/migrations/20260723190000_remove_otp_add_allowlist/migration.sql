-- Remove OTP-based authentication artifacts; login is now a simple email allowlist.
DROP TABLE "AuthenticationCode";
