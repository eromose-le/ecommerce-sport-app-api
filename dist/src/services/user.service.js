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
    getUsers(_next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield prisma_1.default.user.findMany({
                // select: { ...userFilter },
                });
                if (!users) {
                    throw new errorResponse_1.ErrorResponse(constants_1.ERROR_MESSAGES.USER_NOT_FOUND, constants_1.HTTP_STATUS_CODE[400].code);
                }
                return users;
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
                const updatedUser = yield prisma_1.default.user.update({
                    where: { id: _id },
                    data: Object.assign(Object.assign(Object.assign({}, _payload === null || _payload === void 0 ? void 0 : _payload.inputs), ((_payload === null || _payload === void 0 ? void 0 : _payload.password) && {
                        password: _payload === null || _payload === void 0 ? void 0 : _payload.password,
                    })), ((_payload === null || _payload === void 0 ? void 0 : _payload.avatar) && { avatar: (_payload === null || _payload === void 0 ? void 0 : _payload.avatar) || (user === null || user === void 0 ? void 0 : user.avatar) })),
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
