import { Request, Response } from 'express';
import { db as pool } from '../config/db';

// -------------------- Preview Quotation -------------------- //
export const getQuotationPreview = async (req: Request, res: Response) => {
  console.log('📥 Hit /quotation/preview', req.body);
  const { material_id, size_id, power_supply_id, accessory_ids } = req.body;

  try {
    // Fetch material price
    const [materialRows]: any = await pool.query(
      'SELECT price FROM material_size_prices WHERE material_id = ? AND size_id = ?',
      [material_id, size_id]
    );
    
    // Check if material price exists
    if (!materialRows || materialRows.length === 0) {
      return res.status(404).json({ msg: 'Material price not found for the selected material and size combination' });
    }
    
    // Validate material price
    const materialPrice = materialRows[0]?.price;
    if (materialPrice === undefined || materialPrice === null) {
      return res.status(404).json({ msg: 'Material price is null or undefined' });
    }
    
    const material_price = parseFloat(materialPrice);
    if (isNaN(material_price)) {
      return res.status(400).json({ msg: 'Invalid material price format' });
    }

    // Fetch power supply price
    const [psRows]: any = await pool.query(
      'SELECT price FROM power_supply_options WHERE id = ?',
      [power_supply_id]
    );
    const power_supply_price = parseFloat(psRows[0]?.price || 0);
    if (isNaN(power_supply_price)) {
      return res.status(400).json({ msg: 'Invalid power supply price format' });
    }

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
        (sum: number, acc: any) => {
          const price = parseFloat(acc.price || 0);
          if (isNaN(price)) {
            console.warn(`Invalid price format for accessory ${acc.id}: ${acc.price}`);
            return sum;
          }
          return sum + price;
        },
        0
      );
    }

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

    if (
      !user_id || !category_id || !material_id || !size_id ||
      material_price == null || power_supply_price == null || grand_total == null
    ) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

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

// -------------------- View Quotation by ID -------------------- //
export const getQuotationById = async (req: Request, res: Response) => {
  const quotationId = req.params.id;

  try {
    const [quotationRows]: any = await pool.query(
      `SELECT q.*, 
              m.name AS material_name, 
              s.label AS size_label,
              ps.name AS power_supply_name,
              c.name AS category_name
       FROM quotations q
       JOIN materials m ON q.material_id = m.id
       JOIN sizes s ON q.size_id = s.id
       JOIN categories c ON q.category_id = c.id
       LEFT JOIN power_supply_options ps ON q.power_supply_id = ps.id
       WHERE q.id = ?`,
      [quotationId]
    );

    if (quotationRows.length === 0) {
      return res.status(404).json({ msg: 'Quotation not found' });
    }

    const quotation = quotationRows[0];

    const [accessoryRows]: any = await pool.query(
      `SELECT a.id, a.name, a.price 
       FROM quotation_accessories qa
       JOIN accessories a ON qa.accessory_id = a.id
       WHERE qa.quotation_id = ?`,
      [quotationId]
    );

    res.json({
      id: quotation.id,
      user_id: quotation.user_id,
      category: {
        id: quotation.category_id,
        name: quotation.category_name
      },
      material: {
        id: quotation.material_id,
        name: quotation.material_name
      },
      size: {
        id: quotation.size_id,
        label: quotation.size_label
      },
      power_supply: {
        id: quotation.power_supply_id,
        name: quotation.power_supply_name,
        price: quotation.power_supply_price
      },
      accessories: accessoryRows,
      pricing: {
        material_price: quotation.material_price,
        power_supply_price: quotation.power_supply_price,
        accessory_total: quotation.accessory_total,
        grand_total: quotation.grand_total
      },
      created_at: quotation.created_at
    });
  } catch (err) {
    console.error('[getQuotationById] Error:', err);
    res.status(500).json({ msg: 'Failed to fetch quotation details' });
  }
};
