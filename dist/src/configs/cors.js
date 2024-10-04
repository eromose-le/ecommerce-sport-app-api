"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
];
exports.corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        // Check if the origin is in the allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true); // Allow the request
        }
        else {
            callback(new Error("Not allowed by CORS")); // Reject the request
        }
    },
    credentials: true, // Enable credentials
};
