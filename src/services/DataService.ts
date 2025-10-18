import { Quake, USGSGeoJSON } from "../types/types";
import * as cheerio from "cheerio";

// Node 18+ native fetch is used
// import fetch from "node-fetch"; // no longer needed

export class DataService {
  private static readonly PHIVOLCS_URL =
    "https://earthquake.phivolcs.dost.gov.ph/";
  private static readonly USGS_URL =
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

  // Dev mode check
  private static readonly isDev = process.env.NODE_ENV !== "production";

  // 🔹 Generic timeout helper
  private static timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms)
    );
  }

  // 🔹 Retry helper for fetch
  private static async fetchWithRetry(
    url: string,
    retries = 2,
    delay = 2000,
    timeoutMs = 30000
  ): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res;
      } catch (err) {
        if (i === retries) throw err;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error("Failed after retries");
  }

  // 🔹 PHIVOLCS fetch
  static async fetchPhivolcsData(): Promise<Quake[]> {
    try {
      // ✅ Dev only: ignore TLS errors
    //   if (this.isDev) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

      const response = await this.fetchWithRetry(this.PHIVOLCS_URL, 2, 2000, 15000);
      const html = await response.text();
      if (!html || html.length < 1000) return [];

      const $ = cheerio.load(html);
      const quakes: Quake[] = [];
      let count = 0;
      const MAX_QUAKES = 100;

      // Pick first table with rows
      const outerTable = $(".MsoNormalTable")
        .filter((i, el) => $(el).find("tr").length > 1)
        .first();

      const targetTable = outerTable.find("table").first().length
        ? outerTable.find("table").first()
        : outerTable;

      targetTable.find("tr").each((index, el) => {
        if (count >= MAX_QUAKES) return false;

        const tds = $(el).find("td");
        if (tds.length >= 6) {
          const dateTime = $(tds[0]).text().trim();
          const latitude = parseFloat($(tds[1]).text().trim());
          const longitude = parseFloat($(tds[2]).text().trim());
          const depth = parseFloat($(tds[3]).text().trim());
          const magnitude = parseFloat($(tds[4]).text().trim());
          const place = $(tds[5]).text().trim() || "Philippines Region";

          if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(depth) && !isNaN(magnitude)) {
            quakes.push({
              id: `phivolcs-${index}-${Date.now()}`,
              latitude,
              longitude,
              depth,
              magnitude,
              place,
              occurred_at: this.parsePhivolcsDate(dateTime),
              source: "phivolcs",
            });
            count++;
          }
        }
      });

      console.log(`🔹 PHIVOLCS quakes fetched: ${quakes.length}`);
      return quakes;
    } catch (err) {
      console.error("❌ PHIVOLCS fetch error:", err);
      return [];
    }
  }

  // 🔹 USGS fetch
  static async fetchUSGSData(): Promise<Quake[]> {
    try {
      const response = await this.fetchWithRetry(this.USGS_URL, 2, 2000, 30000);
      const data: USGSGeoJSON = (await response.json()) as USGSGeoJSON;

      console.log(`🔹 USGS quakes fetched: ${data.features.length}`);

      return data.features
        .filter((f) => f.properties.mag >= 2.5)
        .slice(0, 200)
        .map((f) => ({
          id: f.id,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
          depth: f.geometry.coordinates[2],
          magnitude: f.properties.mag,
          place: f.properties.place,
          occurred_at: new Date(f.properties.time).toISOString(),
          source: "usgs",
        }));
    } catch (err: any) {
      if (err.name === "AbortError") console.error("❌ USGS fetch timeout");
      else console.error("❌ USGS fetch error:", err);
      return [];
    }
  }

  // 🔹 Parse PHIVOLCS date string
  private static parsePhivolcsDate(str: string): string {
    try {
      const match = str.match(/(\d{1,2}) (\w+) (\d{4}) - (\d{1,2}):(\d{2}) (AM|PM)/);
      if (!match) return new Date().toISOString();

      const [, day, monthName, year, hourStr, minuteStr, ampm] = match;
      const months: Record<string, number> = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11,
      };

      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;

      const month = months[monthName];
      return new Date(Date.UTC(+year, month, +day, hour - 8, minute)).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
}
