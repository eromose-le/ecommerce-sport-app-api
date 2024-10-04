import { NextFunction } from "express";
import { ERROR_MESSAGES, HTTP_STATUS_CODE } from "../constants";
import prisma from "../lib/prisma";
import { ErrorResponse } from "../utils/errorResponse";
import { UpdateUserResponse, UpdateUserParams } from "../types/user.types";
import { User } from "../models";
import { getPageCount, getPaginationParams } from "../utils";
import { PaginatedApiResponse } from "../types/global.types";

const userFilter = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isVerified: true,
  phone: true,
  avatar: true,
  createdAt: true,
};

export class UserService {
  async getUserByEmail(
    _email: string,
    _next: NextFunction
  ): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: _email },
      });

      if (user) {
        throw new ErrorResponse(
          ERROR_MESSAGES.USER_EXISTS_WITH_EMAIL,
          HTTP_STATUS_CODE[400].code
        );
      }

      return user;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  async getUsers(_query: any, _next: NextFunction) {
    try {
      const queryParams = { filter: _query };
      const { filter } = queryParams;

      const { sort, page, limit, q, createdAt, updatedAt } = filter ?? {};

      const {
        take,
        offset: skip,
        page: currentPage,
        limit: queryLimit,
      } = getPaginationParams(page as string, limit as string);

      const whereFilter: any = {
        deletedAt: null, // Products that aren't soft-deleted

        // Filter by date created and updated
        ...(updatedAt && {
          updatedAt: {
            gte: new Date(updatedAt).toISOString(),
          },
        }),

        // Filter by creation date (newly uploaded products)
        ...(createdAt && {
          createdAt: {
            gte: new Date(createdAt).toISOString(),
          },
        }),

        // Dynamic search across various fields
        ...(q && {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }),
      };

      const [results, count] = await Promise.all([
        prisma.user.findMany({
          where: whereFilter,
          orderBy: {
            ...(sort && {
              lastName: sort === "asc" ? "asc" : "desc",
            }),
          }, // Add sorting here
          take,
          skip,
        }),

        prisma.user.count({
          where: whereFilter,
        }),
      ]);

      if (!results) {
        throw new ErrorResponse(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS_CODE[400].code
        );
      }

      return {
        currentPage,
        count,
        pageCount: getPageCount(count, queryLimit),
        results,
      };
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  async getUser(
    { ...dto }: { id: string | undefined },
    _next: NextFunction
  ): Promise<User | null> {
    const { id: _id } = dto;

    try {
      const user = await prisma.user.findUnique({
        where: { id: _id },
        // select: { ...userFilter },
      });

      if (!user) {
        throw new ErrorResponse(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS_CODE[400].code
        );
      }

      return user;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  async update(
    { ...dto }: UpdateUserParams,
    _next: NextFunction
  ): Promise<UpdateUserResponse | null> {
    const { id: _id, payload: _payload } = dto;

    try {
      const user = await this.getUser({ id: _id }, _next);

      if (!user) {
        throw new ErrorResponse(
          ERROR_MESSAGES.USER_NOT_FOUND,
          HTTP_STATUS_CODE[400].code
        );
      }

      // Construct the payload by merging user details with new data
      const updatedUser = await prisma.user.update({
        where: { id: _id },
        data: {
          ...(user && {
            // retain existing fields if not updated
            firstName: _payload?.firstName || user.firstName,
            lastName: _payload?.lastName || user.lastName,
            email: _payload?.email || user.email,
            phone: _payload?.phone || user.phone,
            address: _payload?.address || user.address,
          }),
          ...(_payload?.password && {
            password: _payload?.password,
          }),
          ...(_payload.firstName && {
            firstName: _payload?.firstName || user.firstName,
          }),
          ...(_payload.lastName && {
            lastName: _payload?.lastName || user.lastName,
          }),
          ...(_payload.email && { email: _payload?.email || user.email }),
          ...(_payload.phone && { phone: _payload?.phone || user.phone }),
          ...(_payload.address && {
            address: _payload?.address || user.address,
          }),
          ...(_payload?.avatar && { avatar: _payload?.avatar || user.avatar }),
        },
      });

      if (!updatedUser) {
        throw new ErrorResponse(
          ERROR_MESSAGES.PROFILE_UPDATE_FAILED,
          HTTP_STATUS_CODE[400].code
        );
      }

      const { password: userPassword, ...rest } = updatedUser;

      return rest;
    } catch (err) {
      _next(err);
      throw new ErrorResponse(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS_CODE[400].code
      );
    }
  }

  async delete({ ...dto }: { id: string }, _next: NextFunction) {
    const { id: _id } = dto;

    try {
      await this.getUser({ id: _id }, _next);
      await prisma.user.delete({
        where: { id: _id },
      });
    } catch (err) {
      return _next(
        new ErrorResponse(
          ERROR_MESSAGES.USER_DELETE_FAILED,
          HTTP_STATUS_CODE[400].code
        )
      );
    }
  }
}
