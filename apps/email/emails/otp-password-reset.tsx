import { OTPEmail } from "../templates/otp-email";

export default function OTPPasswordResetPreview() {
  return (
    <OTPEmail
      otp="456789"
      type="forget-password"
      appName="NexusPoint"
      appUrl="https://example.com"
    />
  );
}
