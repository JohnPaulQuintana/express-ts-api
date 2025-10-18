import express from "express";
import cors from "cors";
import quakesRouter from "../src/routes/quakes";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10); // ✅ convert to number

app.use(cors());
app.use(express.json());

app.use("/api/quakes", quakesRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
