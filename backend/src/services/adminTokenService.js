import jwt from "jsonwebtoken";

export const createAdminToken = (admin) => {
  const secret = process.env.JWT_SECRET;

  if (!secret?.trim()) {
    throw new Error("JWT_SECRET must be set to a non-empty value");
  }

  return jwt.sign(
    {
      adminId: admin._id.toString(),
      role: admin.role,
    },
    secret,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};