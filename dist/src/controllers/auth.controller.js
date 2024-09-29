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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.changePasswordViaReset = exports.changePassword = exports.validateResetPasswordCode = exports.sendResetPasswordCode = exports.sendVerification = exports.activate = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const user_service_1 = require("../services/user.service");
const async_1 = require("../middleware/async");
const mailer_1 = require("../helpers/mailer");
const verifyOwner_1 = require("./../middleware/verifyOwner");
const authService = new auth_service_1.AuthService();
const userService = new user_service_1.UserService();
exports.register = (0, async_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, firstName, lastName, phone, address } = req.body;
    const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
    const THIRTY_MINUTES = 1000 * 60 * 30;
    const isAdmin = false;
    const hashedPassword = yield authService.hashPassword(password);
    const newUser = yield authService.register({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        address,
    }, next);
    if (!newUser)
        return;
    const emailVerificationToken = yield authService.generateCookieToken(newUser === null || newUser === void 0 ? void 0 : newUser.id, THIRTY_MINUTES, isAdmin);
    const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
    yield (0, mailer_1.sendVerificationEmail)(newUser === null || newUser === void 0 ? void 0 : newUser.email, newUser === null || newUser === void 0 ? void 0 : newUser.firstName, url);
    const token = yield authService.generateCookieToken(newUser === null || newUser === void 0 ? void 0 : newUser.id, SEVEN_DAYS, isAdmin);
    const { password: userPassword, isVerified } = newUser, userInfo = __rest(newUser, ["password", "isVerified"]);
    const result = Object.assign({ token }, userInfo);
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
}));
exports.activate = (0, async_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    const tokenUserId = req.userId;
    const decodedJwtUser = yield authService.decodeCookieToken(token);
    if (!decodedJwtUser)
        return;
    const user = yield userService.getUser({ id: decodedJwtUser === null || decodedJwtUser === void 0 ? void 0 : decodedJwtUser.id }, next);
    if (!user)
        return;
    yield (0, verifyOwner_1.verifyOwner)(res, next, user === null || user === void 0 ? void 0 : user.id, tokenUserId);
    const jwtUser = yield authService.activate({ userId: user === null || user === void 0 ? void 0 : user.id, isVerified: user === null || user === void 0 ? void 0 : user.isVerified }, next);
    if (!jwtUser)
        return;
    const { password: userPassword } = jwtUser, userInfo = __rest(jwtUser, ["password"]);
    const result = Object.assign({ token }, userInfo);
    res.status(201).json({
        message: "Account has been activated successfully.",
        data: result,
        success: !!result,
    });
}));
exports.sendVerification = (0, async_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenUserId = req.userId;
    const jwtUser = yield userService.getUser({ id: tokenUserId }, next);
    if (!jwtUser)
        return;
    const sentTojwtUser = yield authService.sendVerification({
        userId: jwtUser === null || jwtUser === void 0 ? void 0 : jwtUser.id,
        userEmail: jwtUser === null || jwtUser === void 0 ? void 0 : jwtUser.email,
        userFirstName: jwtUser.firstName,
        isVerified: jwtUser === null || jwtUser === void 0 ? void 0 : jwtUser.isVerified,
    }, next);
    if (!sentTojwtUser)
        return;
    res.status(201).json({
        message: "Account email verification link sent successfully.",
        data: sentTojwtUser,
        success: !!sentTojwtUser,
    });
}));
exports.sendResetPasswordCode = (0, async_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const sentResetPasswordCode = yield authService.sendResetPasswordCode(email, next);
    if (!sentResetPasswordCode)
        return;
    res.status(201).json({
        message: "Email reset code has been sent to your email",
        data: { email },
        success: !!sentResetPasswordCode,
    });
}));
exports.validateResetPasswordCode = (0, async_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, code, newPassword } = req.body;
    const validateResetPasswordCode = yield authService.validateResetPasswordCode(email, code, next);
    if (!validateResetPasswordCode)
        return;
    const changePassword = yield authService.changePassword(email, newPassword, next);
    if (!changePassword)
        return;
    res.status(201).json({
        message: "Password reset successful, kindly login!",
        data: validateResetPasswordCode,
        success: !!validateResetPasswordCode,
    });
}));
exports.changePassword = (0, async_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.body;
    const tokenUserId = req.userId;
    yield (0, verifyOwner_1.verifyOwner)(res, next, tokenUserId, tokenUserId);
    const jwtUser = yield userService.getUser({ id: tokenUserId }, next);
    if (!jwtUser)
        return;
    const changePassword = yield authService.changePassword(jwtUser.email, password, next);
    if (!changePassword)
        return;
    res.status(201).json({
        message: "Password change successfully",
        data: changePassword,
        success: !!changePassword,
    });
}));
exports.changePasswordViaReset = (0, async_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const changePassword = yield authService.changePassword(email, password, next);
    if (!changePassword)
        return;
    res.status(201).json({
        message: "Password change successfully",
        data: changePassword,
        success: !!changePassword,
    });
}));
exports.login = (0, async_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const userExist = yield authService.validatedEmail(email, next);
    if (!userExist)
        return;
    const isPasswordValid = yield authService.comparePassword(password, userExist === null || userExist === void 0 ? void 0 : userExist.password, next);
    if (!isPasswordValid)
        return;
    const isValid = !!userExist && isPasswordValid;
    if (!isValid)
        return;
    if (isValid) {
        const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
        const isAdmin = false;
        const token = yield authService.generateCookieToken(userExist === null || userExist === void 0 ? void 0 : userExist.id, SEVEN_DAYS, isAdmin);
        const { password: userPassword } = userExist, userInfo = __rest(userExist, ["password"]);
        res
            .cookie("token", token, {
            httpOnly: true, // Only client-side js access
            // ...(EnvKeys.isProduction() && { secure: true }), // Only https access
            maxAge: SEVEN_DAYS,
        })
            .status(200)
            .json({
            message: "User login successfully",
            data: Object.assign(Object.assign({}, userInfo), { token }),
            success: !!userInfo,
        });
    }
}));
exports.logout = (0, async_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.clearCookie("token").status(200).json({
        message: "Logout Successful",
        data: null,
        success: true,
    });
}));
