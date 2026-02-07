/**
 * Admin Authorization Middleware
 * Checks if user is authenticated AND has admin role
 * 
 * Usage: router.use(adminAuthMiddleware) or router.post('/route', adminAuthMiddleware, handler)
 */

const adminAuthMiddleware = (req, res, next) => {
  // First check if user is authenticated (auth middleware should have set req.userId)
  if (!req.userId) {
    console.error("❌ Admin auth: Not authenticated");
    return res.status(401).json({
      message: "Unauthorized - not authenticated",
    });
  }

  // Check if user has admin role (will be populated by auth middleware)
  if (!req.user || req.user.role !== "admin") {
    console.error("❌ Admin auth: User is not admin. Role:", req.user?.role);
    return res.status(403).json({
      message: "Forbidden - admin access required",
    });
  }

  console.log("✅ Admin auth passed for user:", req.userId);
  next();
};

module.exports = adminAuthMiddleware;
