import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export default function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "40px auto", background: "#ffffff", padding: 32, borderRadius: 8 }}>
          <Heading style={{ fontSize: 20, color: "#111827", marginBottom: 8 }}>
            Reset your VideoMax password
          </Heading>
          <Text style={{ color: "#374151", marginBottom: 24 }}>
            Hi {name}, we received a request to reset the password for your account.
            Click the button below to set a new password.
          </Text>
          <Button
            href={resetUrl}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: 6,
              textDecoration: "none",
              display: "inline-block",
              marginBottom: 24,
            }}
          >
            Reset password
          </Button>
          <Text style={{ color: "#6b7280", fontSize: 13 }}>
            This link is valid for 1 hour. If you did not request a password reset,
            you can safely ignore this email.
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>
            If the button doesn&apos;t work, copy and paste this URL into your browser:
            <br />
            <span style={{ color: "#2563eb" }}>{resetUrl}</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
