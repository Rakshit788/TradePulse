// src/index.ts
import express from 'express';
import { prisma } from './client';


const app = express();
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('API is working!');
});

// ✅ Get all assets
app.get('/assets', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany();
    res.json(assets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ✅ Create a new asset


// ✅ Update an asset
app.put('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, initialPrice } = req.body;

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        description,
        initialPrice,
        updatedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
