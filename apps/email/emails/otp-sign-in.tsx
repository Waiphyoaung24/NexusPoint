import { OTPEmail } from "../templates/otp-email";

export default function OTPSignInPreview() {
  return (
    <OTPEmail
      otp="123456"
      type="sign-in"
      appName="NexusPoint"
      appUrl="https://example.com"
    />
  );
}
