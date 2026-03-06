const express = require('express');
const router = express.Router();

const controller = require('../controllers/usersController');
const {
  protect,
  authorizeRoles,
  requireSuperAdmin,
} = require('../middleware/authMiddleware');

const { ROLES } = require('../utils/rolePermissions');

/* =========================================================
   USER MANAGEMENT
========================================================= */

/**
 * Create User
 * Access: Super Admin / HRMS Handler
 */
router.post(
  '/',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.HRMS_HANDLER
  ),
  controller.createUser
);

/**
 * List All Users
 * Access: Super Admin / HRMS Handler
 */
router.get(
  '/',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.HRMS_HANDLER
  ),
  controller.listUsers
);

/* =========================================================
   PASSWORD MANAGEMENT VIEW
   Used in Reset Password page
========================================================= */

/**
 * List Users With Employee Info
 * Access:
 *  - Super Admin
 *  - HRMS Handler
 *  - Unit HR
 */
router.get(
  '/with-employee',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.HRMS_HANDLER,
    ROLES.UNIT_HR
  ),
  controller.listUsersWithEmployee
);

/**
 * Get Single User
 * Access: Super Admin / HRMS Handler
 */
router.get(
  '/:id',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.HRMS_HANDLER
  ),
  controller.getUserById
);

/**
 * Update User
 * Access: Super Admin / HRMS Handler
 */
router.put(
  '/:id',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.HRMS_HANDLER
  ),
  controller.updateUser
);

/**
 * Delete User
 * Access: Super Admin only
 */
router.delete(
  '/:id',
  protect,
  requireSuperAdmin,
  controller.deleteUser
);

/* =========================================================
   PASSWORD RESET
========================================================= */

/**
 * Reset Password
 * Access:
 *  - Super Admin
 *  - HRMS Handler
 *  - Unit HR (only their unit users)
 */
router.post(
  '/:userId/reset-password',
  protect,
  authorizeRoles(
    ROLES.SUPER_ADMIN,
    ROLES.HRMS_HANDLER,
    ROLES.UNIT_HR
  ),
  controller.resetPasswordByHR
);

/**
 * Change Own Password
 */
router.post(
  '/change-password',
  protect,
  controller.changePassword
);

module.exports = router;