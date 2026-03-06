const asyncHandler = require('../middleware/asyncHandler');
const {
  authenticateUser,
  updatePassword: updatePasswordService,
  createUser,
} = require('../services/authService');

const User = require('../models/User');

/* =========================================================
   CHECK PHONE ROLES
   POST /api/auth/check-phone
   Public
   Returns roles available for a phone number
========================================================= */
const checkPhoneRoles = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required',
    });
  }

  const users = await User.find({
    phone,
    isActive: true,
  })
    .select('role name')
    .lean();

  if (!users.length) {
    return res.status(404).json({
      success: false,
      message: 'No accounts found with this phone number',
    });
  }

  res.status(200).json({
    success: true,
    phone,
    roles: users.map((u) => ({
      role: u.role,
      name: u.name,
    })),
  });
});

/* =========================================================
   LOGIN
   POST /api/auth/login
   Public
========================================================= */
const login = asyncHandler(async (req, res) => {
  const { username, password, email, phoneNo, role } = req.body;

  console.log('Login attempt:', { username, email, phoneNo, role });

  const loginIdentifier = username || phoneNo || email;

  if (!loginIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username / phone / email and password are required',
    });
  }

  const result = await authenticateUser(loginIdentifier, password, role);

  res.status(200).json({
    success: true,
    token: result.token,
    user: result.user,
    mustChangePassword: result.user.mustChangePassword === true,
  });
});

/* =========================================================
   UPDATE PASSWORD (USER)
   PUT /api/auth/password
   Private
========================================================= */
const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters',
    });
  }

  await updatePasswordService(userId, newPassword);

  await User.findByIdAndUpdate(userId, {
    mustChangePassword: false,
    passwordChangedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

/* =========================================================
   CREATE USER (ADMIN / HR)
   POST /api/auth/create-user
   Private
========================================================= */
const createNewUser = asyncHandler(async (req, res) => {
  const creator = req.user;
  const userData = req.body;

  const newUser = await createUser(userData, creator);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser,
  });
});

/* =========================================================
   GET CURRENT USER
   GET /api/auth/me
   Private
========================================================= */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password -resetToken -resetTokenExpiry')
    .populate('employeeId', 'empName contactNo department designation')
    .lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

module.exports = {
  login,
  updatePassword,
  createNewUser,
  getCurrentUser,
  checkPhoneRoles, // ✅ export new controller
};