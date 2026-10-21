import nodemailer from "nodemailer";

const createTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error("SMTP configuration is missing");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

export const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,

    to: email,

    subject: "GarbaPass Admin Password Reset",

    text: `Hi ${name},

A password reset was requested for your GarbaPass admin account.

Reset your password using this link:

${resetUrl}

This link expires in 30 minutes.

If you did not request this, you can safely ignore this email.

GarbaPass`,
  });
};
