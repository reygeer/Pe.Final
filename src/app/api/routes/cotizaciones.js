const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Obtener todas las cotizaciones con cliente y productos
router.get('/', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [cotizaciones] = await connection.query(`
      SELECT c.id, cl.nombre AS cliente, c.fecha
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      ORDER BY c.fecha DESC
    `);

    for (let cot of cotizaciones) {
      const [productos] = await connection.query(`
        SELECT p.nombre, cp.cantidad
        FROM cotizacion_productos cp
        JOIN productos p ON cp.producto_id = p.id
        WHERE cp.cotizacion_id = ?
      `, [cot.id]);

      cot.productos = productos;
      cot.total = productos.reduce((sum, p) => sum + p.cantidad * 100, 0); // puedes reemplazar con precio real
    }

    res.json(cotizaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  } finally {
    connection.end();
  }
});

// Registrar nueva cotización
router.post('/', async (req, res) => {
  const { cliente, fecha, productos } = req.body;

  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.beginTransaction();

    // Verificar si el cliente ya existe
    let [rows] = await connection.query(`SELECT id FROM clientes WHERE nombre = ?`, [cliente]);
    let clienteId;
    if (rows.length > 0) {
      clienteId = rows[0].id;
    } else {
      const [result] = await connection.query(`INSERT INTO clientes (nombre) VALUES (?)`, [cliente]);
      clienteId = result.insertId;
    }

    // Insertar cotización
    const [cotizacionResult] = await connection.query(`
      INSERT INTO cotizaciones (cliente_id, fecha) VALUES (?, ?)
    `, [clienteId, fecha]);

    const cotizacionId = cotizacionResult.insertId;

    // Insertar productos relacionados
    for (const prod of productos) {
      await connection.query(`
        INSERT INTO cotizacion_productos (cotizacion_id, producto_id, cantidad)
        VALUES (?, ?, ?)
      `, [cotizacionId, prod.id, prod.cantidad]);
    }

    await connection.commit();
    res.status(201).json({ mensaje: 'Cotización registrada correctamente' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al registrar cotización' });
  } finally {
    connection.end();
  }
});

// Eliminar cotización
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const connection = await mysql.createConnection(dbConfig);

  try {
    await connection.beginTransaction();
    await connection.query(`DELETE FROM cotizacion_productos WHERE cotizacion_id = ?`, [id]);
    await connection.query(`DELETE FROM cotizaciones WHERE id = ?`, [id]);
    await connection.commit();

    res.json({ mensaje: 'Cotización eliminada correctamente' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar cotización' });
  } finally {
    connection.end();
  }
});

module.exports = router;
