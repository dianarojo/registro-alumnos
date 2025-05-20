require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// 
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.get('/api/alumnos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM alumnos ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener alumnos' });
    }
});

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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

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
        console.log('Tabla "alumnos" creada o verificada');
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
    }
}

initializeDatabase();