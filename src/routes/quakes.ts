import express from "express";
import { DataService } from "../services/DataService";

const router = express.Router();

/**
 * 🌏 PHIVOLCS endpoint
 */
router.get("/phivolcs", async (_req, res) => {
  try {
    const quakes = await DataService.fetchPhivolcsData();
    res.json({ count: quakes.length, quakes });
  } catch (err) {
    console.error("❌ PHIVOLCS endpoint error:", err);
    res.status(500).json({ error: "Failed to fetch PHIVOLCS data" });
  }
});

/**
 * 🌐 USGS endpoint
 */
router.get("/usgs", async (_req, res) => {
  try {
    const quakes = await DataService.fetchUSGSData();
    res.json({ count: quakes.length, quakes });
  } catch (err) {
    console.error("❌ USGS endpoint error:", err);
    res.status(500).json({ error: "Failed to fetch USGS data" });
  }
});

/**
 * 🌍 Combined endpoint
 */
router.get("/all", async (_req, res) => {
  try {
    const [phivolcs, usgs] = await Promise.all([
      DataService.fetchPhivolcsData(),
      DataService.fetchUSGSData(),
    ]);

    const allQuakes = [...phivolcs, ...usgs].sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    );

    res.json({ count: allQuakes.length, quakes: allQuakes });
  } catch (err) {
    console.error("❌ Fetch all quakes error:", err);
    res.status(500).json({ error: "Failed to fetch earthquake data" });
  }
});

export default router;
