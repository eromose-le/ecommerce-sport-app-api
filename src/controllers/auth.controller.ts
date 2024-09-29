import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { LoginUserDto, RegisterUserDto } from "../types/auth.types";
import { asyncHandler } from "../middleware/async";
import { sendVerificationEmail } from "../helpers/mailer";
import { verifyOwner } from "./../middleware/verifyOwner";

const authService = new AuthService();
const userService = new UserService();

export const register = asyncHandler(
  async (req: { body: RegisterUserDto }, res: Response, next: NextFunction) => {
    const { email, password, firstName, lastName, phone, address } = req.body;
    const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
    const THIRTY_MINUTES = 1000 * 60 * 30;
    const isAdmin = false;

    const hashedPassword: string = await authService.hashPassword(password);
    const newUser = await authService.register(
      {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        address,
      },
      next
    );
    if (!newUser) return;

    const emailVerificationToken = await authService.generateCookieToken(
      newUser?.id,
      THIRTY_MINUTES,
      isAdmin
    );

    const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
    await sendVerificationEmail(newUser?.email, newUser?.firstName, url);

    const token = await authService.generateCookieToken(
      newUser?.id,
      SEVEN_DAYS,
      isAdmin
    );

    const { password: userPassword, isVerified, ...userInfo } = newUser;
    const result = { token, ...userInfo };

    res
      // .cookie("token", token, {
      //   httpOnly: true, // Only client-side js access
      //   // ...(EnvKeys.isProduction() && { secure: true }), // Only https access
      //   maxAge: SEVEN_DAYS,
      // })
      .status(201)
      .json({
        message: "User created successfully",
        data: result,
        success: !!result,
      });
  }
);

export const activate = asyncHandler(
  async (req, res: Response, next: NextFunction) => {
    const { token } = req.body;
    const tokenUserId = req.userId;

    const decodedJwtUser = await authService.decodeCookieToken(token);
    if (!decodedJwtUser) return;

    const user = await userService.getUser({ id: decodedJwtUser?.id }, next);
    if (!user) return;

    await verifyOwner(res, next, user?.id, tokenUserId);
    const jwtUser = await authService.activate(
      { userId: user?.id, isVerified: user?.isVerified },
      next
    );
    if (!jwtUser) return;

    const { password: userPassword, ...userInfo } = jwtUser;
    const result = { token, ...userInfo };

    res.status(201).json({
      message: "Account has been activated successfully.",
      data: result,
      success: !!result,
    });
  }
);

export const sendVerification = asyncHandler(
  async (req, res: Response, next: NextFunction) => {
    const tokenUserId = req.userId;

    const jwtUser = await userService.getUser({ id: tokenUserId }, next);
    if (!jwtUser) return;

    const sentTojwtUser = await authService.sendVerification(
      {
        userId: jwtUser?.id,
        userEmail: jwtUser?.email,
        userFirstName: jwtUser.firstName,
        isVerified: jwtUser?.isVerified,
      },
      next
    );
    if (!sentTojwtUser) return;

    res.status(201).json({
      message: "Account email verification link sent successfully.",
      data: sentTojwtUser,
      success: !!sentTojwtUser,
    });
  }
);

export const sendResetPasswordCode = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const sentResetPasswordCode = await authService.sendResetPasswordCode(
      email,
      next
    );
    if (!sentResetPasswordCode) return;

    res.status(201).json({
      message: "Email reset code has been sent to your email",
      data: { email },
      success: !!sentResetPasswordCode,
    });
  }
);

export const validateResetPasswordCode = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, code, newPassword } = req.body;

    const validateResetPasswordCode =
      await authService.validateResetPasswordCode(email, code, next);
    if (!validateResetPasswordCode) return;

    const changePassword = await authService.changePassword(
      email,
      newPassword,
      next
    );
    if (!changePassword) return;

    res.status(201).json({
      message: "Password reset successful, kindly login!",
      data: validateResetPasswordCode,
      success: !!validateResetPasswordCode,
    });
  }
);

export const changePassword = asyncHandler(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const tokenUserId = req.userId;

    await verifyOwner(res, next, tokenUserId, tokenUserId);
    const jwtUser = await userService.getUser({ id: tokenUserId }, next);
    if (!jwtUser) return;

    const changePassword = await authService.changePassword(
      jwtUser.email,
      password,
      next
    );
    if (!changePassword) return;

    res.status(201).json({
      message: "Password change successfully",
      data: changePassword,
      success: !!changePassword,
    });
  }
);
export const changePasswordViaReset = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const changePassword = await authService.changePassword(
      email,
      password,
      next
    );

    if (!changePassword) return;

    res.status(201).json({
      message: "Password change successfully",
      data: changePassword,
      success: !!changePassword,
    });
  }
);

export const login = asyncHandler(
  async (req: { body: LoginUserDto }, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const userExist = await authService.validatedEmail(email, next);
    if (!userExist) return;

    const isPasswordValid = await authService.comparePassword(
      password,
      userExist?.password,
      next
    );

    if (!isPasswordValid) return;

    const isValid = !!userExist && isPasswordValid;
    if (!isValid) return;

    if (isValid) {
      const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
      const isAdmin = false;

      const token = await authService.generateCookieToken(
        userExist?.id,
        SEVEN_DAYS,
        isAdmin
      );
      const { password: userPassword, ...userInfo } = userExist;

      res
        .cookie("token", token, {
          httpOnly: true, // Only client-side js access
          // ...(EnvKeys.isProduction() && { secure: true }), // Only https access
          maxAge: SEVEN_DAYS,
        })
        .status(200)
        .json({
          message: "User login successfully",
          data: { ...userInfo, token },
          success: !!userInfo,
        });
    }
  }
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  return res.clearCookie("token").status(200).json({
    message: "Logout Successful",
    data: null,
    success: true,
  });
});
