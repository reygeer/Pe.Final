const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// URL base donde están alojadas las imágenes (ajústala si es otra)
const URL_BASE = 'https://pe-backend-frontend.onrender.com/uploads/';

// Función para agregar URL completa a las imágenes si existen
function agregarUrlImagenes(rows) {
  return rows.map(row => ({
    ...row,
    imagen_producto: row.imagen_producto ? URL_BASE + row.imagen_producto : null,
    imagen_proveedor: row.imagen_proveedor ? URL_BASE + row.imagen_proveedor : null,
  }));
}

// Obtener todas las importaciones con nombre del proveedor y rutas de imagen
router.get('/', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT
        i.*,
        p.nombre AS proveedor_nombre,
        p.imagen AS imagen_proveedor,
        prod.imagen AS imagen_producto
      FROM importaciones i
      LEFT JOIN proveedores p ON i.proveedor_id = p.id
      LEFT JOIN productos prod ON i.producto = prod.nombre
      ORDER BY i.fecha DESC
    `);
    await conn.end();

    const rowsConUrl = agregarUrlImagenes(rows);

    res.json(rowsConUrl);
  } catch (err) {
    console.error('Error al obtener importaciones:', err);
    res.status(500).json({ error: 'Error al obtener importaciones' });
  }
});

// Registrar nueva importación
router.post('/', async (req, res) => {
  const { producto, proveedor_id, cantidad, fecha, descripcion } = req.body;

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [result] = await conn.execute(`
      INSERT INTO importaciones (producto, proveedor_id, cantidad, fecha, descripcion)
      VALUES (?, ?, ?, ?, ?)
    `, [producto, proveedor_id, cantidad, fecha, descripcion]);

    const [nueva] = await conn.execute(`
      SELECT
        i.*,
        p.nombre AS proveedor_nombre,
        p.imagen AS imagen_proveedor,
        prod.imagen AS imagen_producto
      FROM importaciones i
      LEFT JOIN proveedores p ON i.proveedor_id = p.id
      LEFT JOIN productos prod ON i.producto = prod.nombre
      WHERE i.id = ?
    `, [result.insertId]);

    await conn.end();

    const nuevaConUrl = agregarUrlImagenes(nueva);

    res.json(nuevaConUrl[0]);
  } catch (err) {
    console.error('Error al registrar importación:', err);
    res.status(500).json({ error: 'Error al registrar importación' });
  }
});

// Actualizar importación existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { producto, proveedor_id, cantidad, fecha, descripcion } = req.body;

  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(`
      UPDATE importaciones
      SET producto = ?, proveedor_id = ?, cantidad = ?, fecha = ?, descripcion = ?
      WHERE id = ?
    `, [producto, proveedor_id, cantidad, fecha, descripcion, id]);

    const [actualizada] = await conn.execute(`
      SELECT
        i.*,
        p.nombre AS proveedor_nombre,
        p.imagen AS imagen_proveedor,
        prod.imagen AS imagen_producto
      FROM importaciones i
      LEFT JOIN proveedores p ON i.proveedor_id = p.id
      LEFT JOIN productos prod ON i.producto = prod.nombre
      WHERE i.id = ?
    `, [id]);

    await conn.end();

    const actualizadaConUrl = agregarUrlImagenes(actualizada);

    res.json(actualizadaConUrl[0]);
  } catch (err) {
    console.error('Error al actualizar importación:', err);
    res.status(500).json({ error: 'Error al actualizar importación' });
  }
});

// Eliminar importación
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM importaciones WHERE id = ?', [id]);
    await conn.end();
    res.json({ mensaje: 'Importación eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar importación:', err);
    res.status(500).json({ error: 'Error al eliminar importación' });
  }
});

module.exports = router;
