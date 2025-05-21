require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para loggear solicitudes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Rutas API
// Obtener todos los alumnos
app.get('/api/alumnos', async (req, res) => {
    try {
        console.log('Intentando obtener alumnos...');
        const result = await pool.query('SELECT * FROM alumnos ORDER BY id');
        console.log(`Encontrados ${result.rows.length} alumnos`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error en GET /api/alumnos:', err);
        res.status(500).json({ error: 'Error al obtener alumnos' });
    }
});

// Obtener un alumno por ID
app.get('/api/alumnos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM alumnos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener el alumno' });
    }
});

// Crear un nuevo alumno
app.post('/api/alumnos', async (req, res) => {
    const { nombre, apellido, edad, email, carrera } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO alumnos (nombre, apellido, edad, email, carrera) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, apellido, edad, email, carrera]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear alumno' });
    }
});

// Actualizar un alumno
app.put('/api/alumnos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, edad, email, carrera } = req.body;
    try {
        const result = await pool.query(
            'UPDATE alumnos SET nombre = $1, apellido = $2, edad = $3, email = $4, carrera = $5 WHERE id = $6 RETURNING *',
            [nombre, apellido, edad, email, carrera, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar alumno' });
    }
});

// Eliminar un alumno
app.delete('/api/alumnos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM alumnos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }
        res.json({ message: 'Alumno eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar alumno' });
    }
});

// Ruta para probar la conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Crear tabla si no existe
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS alumnos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                edad INTEGER NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                carrera VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla "alumnos" verificada');
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
    }
}

initializeDatabase();