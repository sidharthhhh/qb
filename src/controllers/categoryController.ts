import { Request, Response } from 'express';
import { db } from '../config/db';

// ✅ Get all categories
export const getAllCategories = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query('SELECT id, name, description FROM categories');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch categories' });
  }
};

// ✅ Get all options for a specific category (materials, sizes, accessories, power supplies)
export const getCategoryOptions = async (req: Request, res: Response) => {
  const categoryId = req.params.id;

  try {
    // 🧱 Get materials
    const [materials]: any = await db.query(
      'SELECT id, name FROM materials WHERE category_id = ?',
      [categoryId]
    );

    // 📏 Get sizes
    const [sizes]: any = await db.query('SELECT id, label FROM sizes');

    // 🧩 Get accessories
    const [accessories]: any = await db.query(
      'SELECT id, name, size, price FROM accessories'
    );

    // 🔌 Get power supply options
    const [powerSupplies]: any = await db.query(
      `SELECT ps.id, ps.name, ps.price, s.label AS size_label, ps.size_id, ps.switch, ps.fan, ps.dimmer, ps.curtain
       FROM power_supply_options ps
       JOIN sizes s ON ps.size_id = s.id
       WHERE ps.category_id = ?`,
      [categoryId]
    );

    res.json({
      materials,
      sizes,
      accessories,
      power_supplies: powerSupplies,
    });
  } catch (err) {
    console.error('[getCategoryOptions] Error:', err);
    res.status(500).json({ msg: 'Failed to fetch category options' });
  }
};
