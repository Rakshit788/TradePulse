import express from "express";
import { firsttimeTreward } from "./helper"; // your business logic function

const router = express.Router();

router.post("/firsttime-reward", async (req, res) => {
    const { userId, data } = req.body;

    if (!userId || !Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        await firsttimeTreward(data, userId);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error processing reward:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;


