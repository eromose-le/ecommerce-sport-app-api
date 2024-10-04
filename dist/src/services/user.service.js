"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const constants_1 = require("../constants");
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorResponse_1 = require("../utils/errorResponse");
const utils_1 = require("../utils");
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
class UserService {
    getUserByEmail(_email, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prisma_1.default.user.findUnique({
                    where: { email: _email },
                });
                if (user) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_EXISTS_WITH_EMAIL, constants_1.HTTP_STATUS_CODE[400].code);
                }
                return user;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    getUsers(_query, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const queryParams = { filter: _query };
                const { filter } = queryParams;
                const { sort, page, limit, q, createdAt, updatedAt } = filter !== null && filter !== void 0 ? filter : {};
                const { take, offset: skip, page: currentPage, limit: queryLimit, } = (0, utils_1.getPaginationParams)(page, limit);
                const whereFilter = Object.assign(Object.assign(Object.assign({ deletedAt: null }, (updatedAt && {
                    updatedAt: {
                        gte: new Date(updatedAt).toISOString(),
                    },
                })), (createdAt && {
                    createdAt: {
                        gte: new Date(createdAt).toISOString(),
                    },
                })), (q && {
                    OR: [
                        { firstName: { contains: q, mode: "insensitive" } },
                        { lastName: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                    ],
                }));
                const [results, count] = yield Promise.all([
                    prisma_1.default.user.findMany({
                        where: whereFilter,
                        orderBy: Object.assign({}, (sort && {
                            lastName: sort === "asc" ? "asc" : "desc",
                        })), // Add sorting here
                        take,
                        skip,
                    }),
                    prisma_1.default.user.count({
                        where: whereFilter,
                    }),
                ]);
                if (!results) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
                }
                return {
                    currentPage,
                    count,
                    pageCount: (0, utils_1.getPageCount)(count, queryLimit),
                    results,
                };
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    getUser(_a, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            var dto = __rest(_a, []);
            const { id: _id } = dto;
            try {
                const user = yield prisma_1.default.user.findUnique({
                    where: { id: _id },
                    // select: { ...userFilter },
                });
                if (!user) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
                }
                return user;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    update(_a, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            var dto = __rest(_a, []);
            const { id: _id, payload: _payload } = dto;
            try {
                const user = yield this.getUser({ id: _id }, _next);
                if (!user) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
                }
                // Construct the payload by merging user details with new data
                const updatedUser = yield prisma_1.default.user.update({
                    where: { id: _id },
                    data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (user && {
                        // retain existing fields if not updated
                        firstName: (_payload === null || _payload === void 0 ? void 0 : _payload.firstName) || user.firstName,
                        lastName: (_payload === null || _payload === void 0 ? void 0 : _payload.lastName) || user.lastName,
                        email: (_payload === null || _payload === void 0 ? void 0 : _payload.email) || user.email,
                        phone: (_payload === null || _payload === void 0 ? void 0 : _payload.phone) || user.phone,
                        address: (_payload === null || _payload === void 0 ? void 0 : _payload.address) || user.address,
                    })), ((_payload === null || _payload === void 0 ? void 0 : _payload.password) && {
                        password: _payload === null || _payload === void 0 ? void 0 : _payload.password,
                    })), (_payload.firstName && {
                        firstName: (_payload === null || _payload === void 0 ? void 0 : _payload.firstName) || user.firstName,
                    })), (_payload.lastName && {
                        lastName: (_payload === null || _payload === void 0 ? void 0 : _payload.lastName) || user.lastName,
                    })), (_payload.email && { email: (_payload === null || _payload === void 0 ? void 0 : _payload.email) || user.email })), (_payload.phone && { phone: (_payload === null || _payload === void 0 ? void 0 : _payload.phone) || user.phone })), (_payload.address && {
                        address: (_payload === null || _payload === void 0 ? void 0 : _payload.address) || user.address,
                    })), ((_payload === null || _payload === void 0 ? void 0 : _payload.avatar) && { avatar: (_payload === null || _payload === void 0 ? void 0 : _payload.avatar) || user.avatar })),
                });
                if (!updatedUser) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.PROFILE_UPDATE_FAILED, constants_1.HTTP_STATUS_CODE[400].code);
                }
                const { password: userPassword } = updatedUser, rest = __rest(updatedUser, ["password"]);
                return rest;
            }
            catch (err) {
                _next(err);
                throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
            }
        });
    }
    delete(_a, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            var dto = __rest(_a, []);
            const { id: _id } = dto;
            try {
                yield this.getUser({ id: _id }, _next);
                yield prisma_1.default.user.delete({
                    where: { id: _id },
                });
            }
            catch (err) {
                return _next(new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_DELETE_FAILED, constants_1.HTTP_STATUS_CODE[400].code));
            }
        });
    }
}
exports.UserService = UserService;
