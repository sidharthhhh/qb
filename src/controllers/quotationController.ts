import { Request, Response } from 'express';
import { db } from '../config/db';

export const getQuotationPreview = async (req: Request, res: Response) => {
  const { material_id, size_id, power_supply_id, accessory_ids } = req.body;

  try {
    // Get material price
    const [materialRows]: any = await db.query(
      'SELECT price FROM material_size_prices WHERE material_id = ? AND size_id = ?',
      [material_id, size_id]
    );
    const material_price = materialRows[0]?.price || 0;

    // Get power supply price
    const [psRows]: any = await db.query(
      'SELECT name, price FROM power_supply_options WHERE id = ?',
      [power_supply_id]
    );
    const power_supply_price = psRows[0]?.price || 0;

    // Get accessories (optional)
    let accessories: any[] = [];
    let accessory_total = 0;

    if (accessory_ids && accessory_ids.length > 0) {
      const [accessoryRows]: any = await db.query(
        `SELECT id, name, price FROM accessories WHERE id IN (${accessory_ids.map(() => '?').join(',')})`,
        accessory_ids
      );
      accessories = accessoryRows;
      accessory_total = accessories.reduce((sum, acc) => sum + acc.price, 0);
    }

    // Total
    const grand_total = material_price + power_supply_price + accessory_total;

    res.json({
      material_price,
      power_supply_price,
      accessory_total,
      grand_total,
      accessories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to calculate quotation preview' });
  }
};
