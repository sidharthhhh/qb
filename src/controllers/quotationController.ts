import { Request, Response } from 'express';
import { db as pool } from '../config/db';

// -------------------- Preview Quotation -------------------- //
export const getQuotationPreview = async (req: Request, res: Response) => {
  const { material_id, size_id, power_supply_id, accessory_ids } = req.body;

  try {
    // 1. Get material price from material_size_prices
    const [materialRows]: any = await pool.query(
      'SELECT price FROM material_size_prices WHERE material_id = ? AND size_id = ?',
      [material_id, size_id]
    );
    const material_price = parseFloat(materialRows[0]?.price || 0);

    // 2. Get power supply price
    const [psRows]: any = await pool.query(
      'SELECT price FROM power_supply_options WHERE id = ?',
      [power_supply_id]
    );
    const power_supply_price = parseFloat(psRows[0]?.price || 0);

    // 3. Get accessory prices (if provided)
    let accessories: any[] = [];
    let accessory_total = 0;

    if (Array.isArray(accessory_ids) && accessory_ids.length > 0) {
      const placeholders = accessory_ids.map(() => '?').join(',');
      const [accessoryRows]: any = await pool.query(
        `SELECT id, name, price FROM accessories WHERE id IN (${placeholders})`,
        accessory_ids
      );
      accessories = accessoryRows;
      accessory_total = accessoryRows.reduce(
        (sum: number, acc: any) => sum + parseFloat(acc.price || 0),
        0
      );
    }

    // 4. Calculate grand total
    const grand_total = material_price + power_supply_price + accessory_total;

    res.json({
      material_price,
      power_supply_price,
      accessory_total,
      grand_total,
      accessories
    });
  } catch (err) {
    console.error('[getQuotationPreview] Error:', err);
    res.status(500).json({ msg: 'Failed to calculate quotation preview' });
  }
};

// -------------------- Save Quotation -------------------- //
export const saveQuotation = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      category_id,
      material_id,
      size_id,
      power_supply_id,
      material_price,
      power_supply_price,
      accessory_total,
      grand_total,
      accessory_ids
    } = req.body;

    // Validate required fields
    if (
      !user_id || !category_id || !material_id || !size_id ||
      material_price == null || power_supply_price == null || grand_total == null
    ) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // 1. Insert quotation row
    const [quotationResult]: any = await pool.query(
      `INSERT INTO quotations 
      (user_id, category_id, material_id, size_id, power_supply_id, material_price, power_supply_price, accessory_total, grand_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        category_id,
        material_id,
        size_id,
        power_supply_id,
        material_price,
        power_supply_price,
        accessory_total || 0,
        grand_total
      ]
    );

    const quotation_id = quotationResult.insertId;

    // 2. Insert quotation accessories
    if (Array.isArray(accessory_ids) && accessory_ids.length > 0) {
      const accessoryValues = accessory_ids.map((id: number) => [quotation_id, id]);
      await pool.query(
        'INSERT INTO quotation_accessories (quotation_id, accessory_id) VALUES ?',
        [accessoryValues]
      );
    }

    res.json({ msg: 'Quotation saved successfully', quotation_id });
  } catch (err) {
    console.error('[saveQuotation] Error:', err);
    res.status(500).json({ msg: 'Error saving quotation' });
  }
};
