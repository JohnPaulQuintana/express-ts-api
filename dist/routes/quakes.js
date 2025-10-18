"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const cheerio = __importStar(require("cheerio"));
const router = express_1.default.Router();
// Helper: fetch PHIVOLCS
const fetchPhivolcs = async () => {
    try {
        const html = await (0, node_fetch_1.default)('https://earthquake.phivolcs.dost.gov.ph/').then(r => r.text());
        const $ = cheerio.load(html);
        const quakes = [];
        const table = $('.MsoNormalTable').eq(2);
        table.find('tr').each((i, tr) => {
            const tds = $(tr).find('td');
            if (tds.length >= 6) {
                const dateTime = $(tds[0]).text().trim();
                const lat = parseFloat($(tds[1]).text().trim());
                const lon = parseFloat($(tds[2]).text().trim());
                const depth = parseFloat($(tds[3]).text().trim());
                const mag = parseFloat($(tds[4]).text().trim());
                const place = $(tds[5]).text().trim() || 'Philippines Region';
                if (!isNaN(lat) && !isNaN(lon) && !isNaN(depth) && !isNaN(mag)) {
                    quakes.push({
                        id: `phivolcs-${i}-${Date.now()}`,
                        latitude: lat,
                        longitude: lon,
                        depth,
                        magnitude: mag,
                        place,
                        occurred_at: new Date().toISOString(),
                        source: 'phivolcs'
                    });
                }
            }
        });
        return quakes;
    }
    catch (err) {
        console.error(err);
        return [];
    }
};
// Example endpoint: all quakes
router.get('/all-quakes', async (_req, res) => {
    const phivolcs = await fetchPhivolcs();
    res.json({ count: phivolcs.length, quakes: phivolcs });
});
exports.default = router;
