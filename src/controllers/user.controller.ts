import { asyncHandler } from "../middleware/async.js";
import { UpdateUserDto } from "../types/user.types.js";
import { UserService } from "../services/user.service.js";
import { AuthService } from "../services/auth.service.js";
import { ERROR_MESSAGES, HTTP_STATUS_CODE } from "../constants.js";
import { verifyOwner } from "../middleware/verifyOwner.js";

const authService = new AuthService();
const userService = new UserService();

export const getUsers = asyncHandler(async (req, res, next) => {
  const users = await userService.getUsers(next);
  res.status(200).json({
    message: "Fetch users successfully",
    data: users,
    success: !!users,
  });
});

export const getUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      error: ERROR_MESSAGES.INVALID_PAYLOAD,
      success: false,
      statusCode: HTTP_STATUS_CODE[400].code,
    });
  }

  const user = await userService.getUser({ id }, next);

  res.status(200).json({
    message: "Fetch user successfully",
    data: user,
    success: !!user,
  });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const { password, avatar, ...inputs } = req.body as UpdateUserDto;

  if (id !== tokenUserId) {
    return res.status(403).json({
      error: ERROR_MESSAGES.NOT_AUTHORIZED,
      success: false,
      statusCode: HTTP_STATUS_CODE[403],
    });
  }

  let updatedPassword = null;

  if (password) {
    updatedPassword = await authService.hashPassword(password);
  }

  const payload: Partial<UpdateUserDto> = {
    ...(updatedPassword && { password: updatedPassword }),
    ...(avatar && { avatar }),
    ...inputs,
  };

  const updatedUser = await userService.update({ id, payload }, next);

  res.status(200).json({
    message: "User updated successfully",
    data: updatedUser,
    success: !!updatedUser,
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  await verifyOwner(res, next, id, tokenUserId);
  await userService.delete({ id }, next);

  res.status(200).json({
    message: "User deleted successfully",
    data: null,
    success: true,
  });
});
