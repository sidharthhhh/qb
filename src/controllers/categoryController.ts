import { Request, Response } from 'express';
import { db } from '../config/db';

export const getCategoryOptions = async (req: Request, res: Response) => {
  const categoryId = req.params.id;

  try {
    const [materials] = await db.query(
      'SELECT id, name FROM materials WHERE category_id = ?',
      [categoryId]
    );

    const [sizes] = await db.query('SELECT id, label FROM sizes');

    const [accessories] = await db.query('SELECT id, name, price FROM accessories');

    const [powerSupplies] = await db.query(
      `SELECT ps.id, ps.name, ps.price, s.label as size, ps.switch, ps.fan, ps.dimmer, ps.curtain
       FROM power_supply_options ps
       JOIN sizes s ON ps.size_id = s.id`
    );

    res.json({
      materials,
      sizes,
      accessories,
      power_supplies: powerSupplies,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch category options' });
  }
};
