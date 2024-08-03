import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { ERROR_MESSAGES, HTTP_STATUS_CODE } from "../constants";
import { ErrorResponse } from "../utils/errorResponse";
import { NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { EnvKeys } from "../common/EnvKeys";
import {
  ActivateUserDto,
  CanRegisterResponse,
  RegisterUserDto,
  SendVerificationDto,
} from "types/auth.types";
import { UserService } from "./user.service";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "../helpers/mailer";

const userService = new UserService();
export class AuthService {
  // constructor(public userService: UserService) {}

  async hashPassword(_password: string): Promise<string> {
    try {
      return await bcrypt.hash(_password, 10);
    } catch (err: any) {
      return err;
    }
  }

  async generateCookieToken(
    _userId: string,
    _expireTime: number,
    _isAdmin: boolean = false
  ): Promise<string> {
    try {
      const secret = EnvKeys.JWT_SECRET;

      // res.setHeader("Set-Cookie", "test=" + "myValue").json("success")

      const token = jwt.sign(
        {
          id: _userId,
          isAdmin: _isAdmin,
        },
        secret,
        { expiresIn: _expireTime }
      );

      return token;
    } catch (err: any) {
      return err;
    }
  }

  async decodeCookieToken(_token: string): Promise<JwtPayload> {
    try {
      const secret = EnvKeys.JWT_SECRET;

      const decodedJwtUser = jwt.verify(_token, secret) as JwtPayload;

      return decodedJwtUser;
    } catch (err: any) {
      return err;
    }
  }

  async validatedEmail(_email: string, _next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: _email },
      });

      if (!user) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.INVALID_CREDENTIALS,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      return user;
    } catch (err) {
      return _next(err);
    }
  }

  async validatedUserId(_id: string, _next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: _id },
      });

      if (!user) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.INVALID_CREDENTIALS,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      return user;
    } catch (err) {
      return _next(err);
    }
  }

  async comparePassword(
    _password: string,
    _userPassword: string,
    _next: NextFunction
  ) {
    try {
      const isPasswordValid = await bcrypt.compare(_password, _userPassword);

      if (!isPasswordValid) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.INVALID_CREDENTIALS,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      return isPasswordValid;
    } catch (err) {
      return _next(err);
    }
  }

  private async canRegister(
    _payload: {
      email: string;
      dto?: any;
    },
    _next: NextFunction
  ): Promise<CanRegisterResponse | void> {
    try {
      const [email] = await Promise.all([
        userService.getUserByEmail(_payload.email, _next),
      ]);

      const result: CanRegisterResponse = {
        isCanRegister: !!!email,
        isEmailExist: !!email,
      };

      return {
        isCanRegister: result?.isCanRegister,
        isEmailExist: result?.isEmailExist,
      };
    } catch (err) {
      return _next(err);
    }
  }

  async register(
    {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      isVerified,
    }: RegisterUserDto,
    _next: NextFunction
  ) {
    try {
      const payload = {
        email,
        firstName,
        lastName,
        phone,
        address,
        isVerified,
      };
      const canRegister = await this.canRegister({ ...payload }, _next);

      if (!canRegister?.isCanRegister) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.USER_EXISTS_WITH_EMAIL_OR_USERNAME,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      const newUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          password,
          firstName,
          lastName,
          phone,
          address,
          isVerified,
        },
      });

      return newUser;
    } catch (err) {
      return _next(err);
    }
  }

  async activate({ userId, isVerified }: ActivateUserDto, _next: NextFunction) {
    try {
      if (isVerified) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.USER_EMAIL_ALREADY_VERIFIED,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
        },
      });

      return updatedUser;
    } catch (err) {
      return _next(err);
    }
  }

  async sendVerification(
    { userId, userEmail, userFirstName, isVerified }: SendVerificationDto,
    _next: NextFunction
  ) {
    const THIRTY_MINUTES = 1000 * 60 * 30;
    const isAdmin = false;

    try {
      if (isVerified) {
        return _next(
          new ErrorResponse(
            ERROR_MESSAGES.USER_EMAIL_ALREADY_VERIFIED,
            HTTP_STATUS_CODE[400].code
          )
        );
      }

      const emailVerificationToken = await this.generateCookieToken(
        userId,
        THIRTY_MINUTES,
        isAdmin
      );

      const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
      sendVerificationEmail(userEmail, userFirstName, url);

      return true;
    } catch (err) {
      return _next(err);
    }
  }
}
