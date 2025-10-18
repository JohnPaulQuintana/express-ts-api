"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quakes_js_1 = __importDefault(require("./routes/quakes.js"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
// Routes
app.use('/api', quakes_js_1.default);
app.get('/', (_req, res) => {
    res.send('<h1>Express + TypeScript API</h1><p>Try /api/all-quakes</p>');
});
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
