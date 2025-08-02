import { Request, Response } from 'express';
import { db } from '../config/db';

export const getCategoryOptions = async (req: Request, res: Response) => {
  const categoryId = req.params.id;

  try {
    // 🧱 Get materials for category
    const [materials]: any = await db.query(
      'SELECT id, name FROM materials WHERE category_id = ?',
      [categoryId]
    );

    // 📏 Get all sizes
    const [sizes]: any = await db.query('SELECT id, label FROM sizes');

    // 🧩 Get all accessories
    const [accessories]: any = await db.query(
      'SELECT id, name, size, price FROM accessories'
    );

    // 🔌 Get power supply options linked to this category
    const [powerSupplies]: any = await db.query(
      `SELECT ps.id, ps.name, ps.price, s.label AS size_label, ps.size_id
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
