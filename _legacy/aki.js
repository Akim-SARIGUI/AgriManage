import 'dotenv/config'; // Pour les variables d'environnement
import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg'; // Importation par défaut
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken'; // Utilisation d'import pour jwt
import { v4 as uuidv4 } from 'uuid'; // Importation du module pour générer des UUID
// Importation du module pour générer des UUID
import Joi from 'joi'; // Pour la validation des entrées
import { Server } from 'socket.io';
import http from 'http'; // Importez le module http
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit' // Pour limiter le taux de requêtes
import sanitizeHtml from 'sanitize-html';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';





// Ajout d'une route pour obtenir le token CSRF


const { Pool } = pg;
const app = express();
const port = 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Remplacez par l'URL de votre frontend
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: 'Content-Type',
    
  },
});


app.use(cors());
app.use(bodyParser.json());


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
// Simuler une base de données pour les messages et les réponses
let messages = [];
let responses = [];
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté:', socket.id);

  // Émettre un événement lorsqu'un nouveau message est reçu
  socket.on('newMessage', (message) => {
    io.emit('messageReceived', message);
  });

  // Émettre un événement lorsqu'une réponse est reçue
  socket.on('newResponse', (response) => {
    io.emit('responseReceived', response);
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté:', socket.id);
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////
// Clé secrète pour JWT
const JWT_SECRET = '22A3345'; // Remplacez ceci par une clé secrète plus sécurisée en production



// Limitation du taux de requêtes (100 requêtes par heure par IP)
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100, // Limite de 100 requêtes par IP
  message: 'Trop de requêtes depuis cette IP. Veuillez réessayer plus tard.',
});
app.use('/api/register', limiter);

// Schéma de validation avec Joi
const userSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Les mots de passe ne correspondent pas.',
  }),
});


app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  // Validation des entrées avec Joi
  const { error } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Erreur de validation',
      details: error.details.map((detail) => detail.message),
    });
  }

  try {
    // Vérifier si l'email existe déjà
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hacher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insérer le nouvel utilisateur dans la base de données
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [email, hashedPassword, `${firstName} ${lastName}`, 'user']
    );

    res.status(201).json({ message: 'Inscription réussie!', user: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Une erreur est survenue. Veuillez réessayer.', error: error.message });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.use('/api/login', limiter);



// Schéma de validation avec Joi
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Nombre maximal de tentatives de connexion
const MAX_LOGIN_ATTEMPTS = 3;
// Durée de blocage en millisecondes (5 minutes)
const LOCK_TIME = 5 * 60 * 1000;
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur est bloqué
   if (user.locked_until && user.locked_until > new Date()) {
  const timeRemaining = Math.floor((user.locked_until - new Date()) / 1000); // Temps restant en secondes
  return res.status(403).json({
    message: `Compte bloqué. Veuillez réessayer après ${timeRemaining} secondes.`,
    lockedUntil: user.locked_until,
  });
}

    // Comparer le mot de passe
    const passwordIsValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordIsValid) {
      // Incrémenter le compteur de tentatives
      const updatedAttempts = user.login_attempts + 1;

      // Bloquer l'utilisateur si le nombre de tentatives dépasse le seuil
      if (updatedAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_TIME);
        await pool.query(
          'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
          [updatedAttempts, lockedUntil, user.id]
        );

        return res.status(403).json({
          message: `Trop de tentatives. Compte bloqué jusqu'à ${lockedUntil.toLocaleTimeString()}.`,
          lockedUntil: lockedUntil,
        });
      }

      // Mettre à jour le compteur de tentatives
      await pool.query('UPDATE users SET login_attempts = $1 WHERE id = $2', [updatedAttempts, user.id]);

      return res.status(401).json({
        message: 'Mot de passe incorrect',
        remainingAttempts: MAX_LOGIN_ATTEMPTS - updatedAttempts,
      });
    }

    // Réinitialiser le compteur de tentatives après une connexion réussie
    await pool.query('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);

    // Générer un token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // Réponse réussie
    res.status(200).json({ message: 'Connexion réussie!', token });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Une erreur est survenue. Veuillez réessayer.', error: error.message });
  }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Route protégée
app.get('/api/protected', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send('Token requis');
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send('Token invalide');
    }

    res.status(200).send('Accès autorisé');
  });
});

// Route pour obtenir les informations de l'utilisateur
app.get('/api/user-profile', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    
    const result = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil utilisateur' });
  }
});


////////////////////////////////////////////////////////////////////////////////////////////////

// Route pour récupérer les parcelles en fonction de l'ID
app.get('/parcelles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM parcels WHERE user_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aucune parcelle trouvée pour cet ID' });
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/api/parcelles', async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM parcels');
    
    // Formater les résultats comme un tableau d'objets
    const formattedResults = result.rows.map(row => ({
      name: row.name
    }));
    
    res.json(formattedResults); // Renvoie le tableau formaté
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.delete('/parcelles/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Vérifier si l'id est présent dans la table crops
    const cropsResult = await pool.query('SELECT id FROM crops WHERE parcel_id = $1', [id]);

    // Si des cultures sont trouvées pour cette parcelle, les supprimer d'abord
    if (cropsResult.rowCount > 0) {
      await pool.query('DELETE FROM crops WHERE parcel_id = $1', [id]);
    }

    // Ensuite, supprimer la parcelle
    const result = await pool.query('DELETE FROM parcels WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
       await pool.query('DELETE FROM crops WHERE parcel_id = $1', [id]);
    }

    res.json({ message: 'Parcelle supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/api/crops/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Vérifier si l'id est présent dans la table crops
    const crops = await pool.query('SELECT id, name, planting_date FROM crops WHERE parcel_id = $1', [id]);

   res.json(crops.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.put('/parcelles/:id', async (req, res) => {
  const { id } = req.params;
  const { name, size, updated_at  } = req.body;
  try {
    const result = await pool.query(
      'UPDATE parcels SET name = $1, size = $2, updated_at  = $3 WHERE id = $4 RETURNING *',
      [name, size, updated_at , id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Parcelle non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Route pour enregistrer une culture
app.post('/crops', async (req, res) => {
  const { name, planting_date, parcel_id } = req.body;

  // Vérifier que les paramètres requis sont fournis
  if (!name || !planting_date || !parcel_id) {
    return res.status(400).json({ message: 'Les paramètres name, planting_date, et parcel_id sont requis.' });
  }

  try {
    // Insérer les données dans la table crops
    const result = await pool.query(
      `INSERT INTO crops (name, planting_date, harvest_date, parcel_id, created_at, updated_at)
       VALUES ($1, $2, NULL, $3, NOW(), NOW())
       RETURNING *`,
      [name, planting_date, parcel_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la culture :', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour modifier une culture
app.put('/crops/:id', async (req, res) => {
  const { id } = req.params;
  const { name, planting_date, harvest_date } = req.body;

  // Vérifier que les paramètres requis sont fournis
  if (!name || !planting_date) {
    return res.status(400).json({ message: 'Les paramètres name et planting_date sont requis.' });
  }

  try {
    // Mettre à jour les données dans la table crops
    const result = await pool.query(
      `UPDATE crops 
       SET name = $1, planting_date = $2, harvest_date = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [name, planting_date, harvest_date || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Culture non trouvée.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la modification de la culture :', error);
    res.status(500).json({ message: error.message });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post('/parcelles/:userId', async (req, res) => {
  const { userId } = req.params;
  const { name, size, date } = req.body;

  // Vérification des champs obligatoires
  if (!userId || !name || !size) {
    return res.status(400).json({ error: 'Le userId, le nom et la taille sont obligatoires.' });
  }

  try {
    // Requête SQL pour insérer les données dans la table `parcels`
    const result = await pool.query(
      'INSERT INTO parcels (user_id, name, size, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, size, date ? new Date(date) : new Date()]
    );

    // Retourner les données de la nouvelle parcelle
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'insertion:', error);
    res.status(500).json({ error: 'Erreur lors de l\'insertion' });
  }
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Route pour récupérer les cultures d'une parcelle
app.get('/parcelles/:id/cultures', async (req, res) => {
  const parcelleId = req.params.id;

  try {
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(parcelleId)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    const query = `
      SELECT id, name, planting_date, harvest_date
      FROM crops
      WHERE parcel_id = $1
      ORDER BY planting_date;
    `;
    
    const { rows } = await pool.query(query, [parcelleId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Aucune culture trouvée pour cette parcelle' });
    }

    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des cultures :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/api/crops', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id AS cropId,
        c.name AS cropName,
        c.planting_date,
        c.harvest_date,
        p.id AS id,
        p.name AS name
      FROM crops c
      JOIN parcels p ON c.parcel_id = p.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).send('Internal Server Error');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.delete('/api/crops/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Vérifier si l'id est présent dans la table crops
    const result = await pool.query('DELETE FROM crops WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Culture non trouvée' });
    }

    res.json({ message: 'Culture supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la culture:', error);
    res.status(500).json({ message: error.message });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Créer une entrée dans la table historique
app.post('/historique', async (req, res) => {
    console.log('📩 Données reçues:', req.body);

    const { user_id, type, name, quantity, unit, niveau, date } = req.body;

    // ✅ Vérification des champs obligatoires
    if (!user_id || !type || !name || !quantity || !unit || !niveau || !date) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }

    try {
        const result = await pool.query(
            `INSERT INTO historique (user_id, type, name, quantity, unit, niveau, date, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING *`,
            [user_id, type, name, quantity, unit, niveau, date]
        );

        console.log("✅ Historique ajouté avec succès :", result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("❌ Erreur lors de l'insertion dans l'historique :", error.message);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/api/historique/:userId', async (req, res) => {
    const { userId } = req.params;

    console.log(`🔍 Requête API reçue pour l'ID utilisateur: ${userId}`);

    // ✅ Vérification de l'ID utilisateur
    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
        return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    try {
        // ✅ Récupération des entrées "ajouter" et "entrer"
        const resultEntrerAjouter = await pool.query(
            `SELECT * FROM historique WHERE niveau IN ('ajouter', 'entrer') AND user_id = $1 ORDER BY date DESC`,
            [userId]
        );

        // ✅ Récupération des entrées "sortie"
        const resultSortie = await pool.query(
            `SELECT * FROM historique WHERE niveau = 'sortie' AND user_id = $1 ORDER BY date DESC`,
            [userId]
        );

        res.status(200).json({
            historiqueEntrerAjouter: resultEntrerAjouter.rows.length > 0 ? resultEntrerAjouter.rows : [],
            historiqueSortie: resultSortie.rows.length > 0 ? resultSortie.rows : []
        });

    } catch (error) {
        console.error("❌ Erreur SQL :", error.message);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/api/historique/produits/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
        return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM historique WHERE type = 'produits' AND user_id = $1 ORDER BY created_date DESC`,
            [userId]
        );

        res.status(200).json(result.rows.length > 0 ? result.rows : []);
    } catch (error) {
        console.error("❌ Erreur SQL :", error.message);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////
// Récupérer une entrée spécifique par ID
app.put('/api/historique/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, type, quantity, unit, date } = req.body;

  if (!/^[0-9a-fA-F-]{36}$/.test(user_id)) {
    return res.status(400).json({ error: "ID utilisateur invalide" });
  }

  try {
    const result = await pool.query(
      `UPDATE historique 
             SET type = $1, quantity = $2, unit = $3, date = $4, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $5 AND user_id = $6 
             RETURNING *`,
      [type, quantity, unit, date, id, user_id]
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Historique non trouvé" });
    }
  } catch (error) {
    console.error("❌ Erreur SQL :", error.message);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Supprimer une entrée spécifique par ID
app.delete('/historique/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM historique WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Deleted successfully' });
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Récupérer tous les enregistrements par type
app.get('/stocks/:type', async (req, res) => {
  const { type } = req.params;
  try {
    const result = await pool.query('SELECT * FROM stocks WHERE type = $1', [type]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la récupération des stocks.');
  }
});

////////////////////////////////////////////////////////////////////////////////////stocks////////////////////////////////////////////////////////////////////////////

// 1. Récupérer toutes les semences pour un utilisateur spécifique
app.get('/api/stocks/seeds/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE type = $1 AND user_id = $2 ORDER BY updated_at DESC',
      ['semences', userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la récupération des semences.');
  }
});

// 1. Récupérer toutes les fertilisants
app.get('/api/fertilizers/:userId', async (req, res) => {
   const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT * FROM stocks WHERE type = $1 AND user_id = $2', ['fertilisants', userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la récupération des fertilisants.');
  }
});

// 1. Récupérer toutes les produits recoltés
app.get('/api/products/:userId', async (req, res) => {
   const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT * FROM stocks WHERE type = $1 AND user_id = $2', ['produits', userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la récupération des pesticides.');
  }
});

// 1. Récupérer toutes les pesticdes
app.get('/api/pesticides/:userId', async (req, res) => {
   const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT * FROM stocks WHERE type = $1 AND user_id = $2', ['pesticides', userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la récupération des pesticides.');
  }
});

// 2. Ajouter une nouvel produit
app.post('/api/products', async (req, res) => {
  const { name, quantity, unit, user_id  } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO stocks (name, quantity, unit, type, user_id ) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, quantity, unit, 'produits', user_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout de la semence.");
  }
});

// 2. Ajouter une nouvelle semence
app.post('/api/stocks/seeds', async (req, res) => {
  const { name, quantity, unit, user_id } = req.body;
  console.log("Données reçues :", { name, quantity, unit, user_id }); // Log des données

  // Validation des champs obligatoires
  if (!name || !quantity) {
    return res.status(400).json({ error: "Les champs 'name' et 'quantity' sont obligatoires." });
  }

  try {
    const result = await pool.query(
      'INSERT INTO stocks (name, quantity, unit, type, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, quantity, unit || null, 'semences', user_id || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout de la semence.");
  }
});

// 2. Ajouter une nouvel fertilisant
app.post('/api/fertilizers', async (req, res) => {
  const { name, quantity, unit , user_id  } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO stocks (name, quantity, unit, type , user_id ) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, quantity, unit, 'fertilisants', user_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout de la fertilisants.");
  }
});

// 2. Ajouter une nouvelle pesticides
app.post('/api/pesticides', async (req, res) => {
  const { name, quantity, unit , user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO stocks (name, quantity, unit, type , user_id ) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, quantity, unit, 'pesticides', user_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout de la pesticides.");
  }
});


// 3. Mettre à jour une semence existante
app.put('/api/fertilizers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit } = req.body;
  try {
    const result = await pool.query(
      'UPDATE stocks SET name = $1, quantity = $2, unit = $3 WHERE id = $4 AND type = $5 RETURNING *',
      [name, quantity, unit, id, 'fertilisants']
    );
    if (result.rows.length === 0) {
      return res.status(404).send("fertilizers non trouvée.");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la mise à jour de la fertilizers.");
  }
});

// 3. Mettre à jour une semence existante
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit } = req.body;
  try {
    const result = await pool.query(
      'UPDATE stocks SET name = $1, quantity = $2, unit = $3 WHERE id = $4 AND type = $5 RETURNING *',
      [name, quantity, unit, id, 'produits']
    );
    if (result.rows.length === 0) {
      return res.status(404).send("produits non trouvée.");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la mise à jour de la produits.");
  }
});

// 3. Mettre à jour une semence existante
app.put('/api/pesticides/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit } = req.body;
  try {
    const result = await pool.query(
      'UPDATE stocks SET name = $1, quantity = $2, unit = $3 WHERE id = $4 AND type = $5 RETURNING *',
      [name, quantity, unit, id, 'pesticides']
    );
    if (result.rows.length === 0) {
      return res.status(404).send("pesticides non trouvée.");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la mise à jour de la pesticides.");
  }
});

// 3. Mettre à jour une semence existante
app.put('/api/stocks/seeds/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit } = req.body;
  try {
    const result = await pool.query(
      'UPDATE stocks SET name = $1, quantity = $2, unit = $3 WHERE id = $4 AND type = $5 RETURNING *',
      [name, quantity, unit, id, 'semences']
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Semence non trouvée.");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la mise à jour de la semence.");
  }
});

// 4. Supprimer une semence
app.delete('/api/stocks/seeds/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM stocks WHERE id = $1 AND type = $2 RETURNING *', [id, 'semences']);
    if (result.rows.length === 0) {
      return res.status(404).send("Semence non trouvée.");
    }
    res.json({ message: 'Semence supprimée avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la suppression de la semence.');
  }
});

// 4. Supprimer une semence
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM stocks WHERE id = $1 AND type = $2 RETURNING *', [id, 'produits']);
    if (result.rows.length === 0) {
      return res.status(404).send("Produits non trouvée.");
    }
    res.json({ message: 'SProduits supprimée avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la suppression de la Produits.');
  }
});
// 4. Supprimer une semence
app.delete('/api/stocks/seeds/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM stocks WHERE id = $1 AND type = $2 RETURNING *', [id, 'semences']);
    if (result.rows.length === 0) {
      return res.status(404).send("Semence non trouvée.");
    }
    res.json({ message: 'Semence supprimée avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la suppression de la semence.');
  }
});

// 4. Supprimer une semence
app.delete('/api/pesticides/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM stocks WHERE id = $1 AND type = $2 RETURNING *', [id, 'pesticides']);
    if (result.rows.length === 0) {
      return res.status(404).send("Semence non trouvée.");
    }
    res.json({ message: 'Semence supprimée avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la suppression de la semence.');
  }
});

// 4. Supprimer une semence
app.delete('/api/fertilizers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM stocks WHERE id = $1 AND type = $2 RETURNING *', [id, 'fertilisants']);
    if (result.rows.length === 0) {
      return res.status(404).send("fertilisants non trouvée.");
    }
    res.json({ message: 'fertilisants supprimée avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la suppression de la fertilisants.');
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Enregistrer un nouvel enregistrement
app.post('/stocks', async (req, res) => {
    console.log('📩 Données reçues:', req.body);

    const { user_id, name, quantity, unit, type } = req.body;

    // ✅ Vérifier que les champs obligatoires sont bien fournis
    if (!user_id || !name || !quantity || !unit || !type) {
        return res.status(400).json({ error: "Tous les champs (user_id, name, quantity, unit, type) sont obligatoires." });
    }

    try {
        const result = await pool.query(
            `INSERT INTO stocks (user_id, name, quantity, unit, type, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING *`,
            [user_id, name, quantity, unit, type]
        );

        console.log("✅ Stock ajouté avec succès :", result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("❌ Erreur lors de l'ajout au stock :", error.message);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Modifier un enregistrement
app.put('/stocks/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit, updated_at, type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE stocks SET name = $1, quantity = $2, unit = $3, updated_at = $4, type = $5 WHERE id = $6 RETURNING *',
      [name, quantity, unit, updated_at, type, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Stock non trouvé.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la mise à jour du stock.');
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Supprimer un enregistrement
app.delete('/stocks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM stocks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.status(204).send();
    } else {
      res.status(404).send('Stock non trouvé.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la suppression du stock.');
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// GET all revenus
app.get('/revenus/:id', async (req, res) => {
   const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM revenus_  WHERE user_id = $1' , [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// GET all depenses
app.get('/depenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM depenses_ WHERE user_id = $1', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// POST ajouter revenu
app.post('/revenus/:id', async (req, res) => {
    const { id } = req.params;
  const { montant, source, date } = req.body;
  try {
    await pool.query('INSERT INTO revenus_ (montant, source, date, user_id) VALUES ($1, $2, $3, $4)', [montant, source, date, id]);
    res.status(201).send('Revenu ajouté');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// POST ajouter depense
app.post('/depenses/:id', async (req, res) => {
   const { id } = req.params;
  const { montant, categorie, date} = req.body;
  try {
    await pool.query('INSERT INTO depenses_ (montant, categorie, date, user_id) VALUES ($1, $2, $3, $4)', [montant, categorie, date, id]);
    res.status(201).send('Dépense ajoutée');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// PUT modifier revenu
app.put('/revenus/:id', async (req, res) => {
  const { id } = req.params;
  const { montant, source, date } = req.body;
  try {
    await pool.query('UPDATE revenus_ SET montant = $1, source = $2, date = $3 WHERE id = $4', [montant, source, date, id]);
    res.send('Revenu mis à jour');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// PUT modifier depense
app.put('/depenses/:id', async (req, res) => {
  const { id } = req.params;
  const { montant, categorie, date } = req.body;
  try {
    await pool.query('UPDATE depenses_ SET montant = $1, categorie = $2, date = $3 WHERE id = $4', [montant, categorie, date, id]);
    res.send('Dépense mise à jour');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// DELETE supprimer revenu
app.delete('/revenus/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM revenus_ WHERE id = $1', [id]);
    res.send('Revenu supprimé');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// DELETE supprimer depense
app.delete('/depenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM depenses_ WHERE id = $1', [id]);
    res.send('Dépense supprimée');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Route pour ajouter une activité
app.post('/activities', async (req, res) => {
  const { crop_id, name, date, details } = req.body;

  // Vérifier que les paramètres requis sont fournis
  if (!crop_id || !name || !date) {
    return res.status(400).json({ message: 'Les paramètres crop_id, name et date sont requis.' });
  }

  try {
    // Insérer les données dans la table activities
    const result = await pool.query(
      `INSERT INTO activities (crop_id, name, date, details, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [crop_id, name, date, details || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'activité :', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour modifier une activité
app.put('/activities/:id', async (req, res) => {
  const { id } = req.params;
  const { name, date, details } = req.body;

  // Vérifier que les paramètres requis sont fournis
  if (!name || !date) {
    return res.status(400).json({ message: 'Les paramètres name et date sont requis.' });
  }

  try {
    // Mettre à jour les données dans la table activities
    const result = await pool.query(
      `UPDATE activities 
       SET name = $1, date = $2, details = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [name, date, details || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Activité non trouvée.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'activité :', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour supprimer une activité
app.delete('/activities/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM activities WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Activité non trouvée.' });
    }

    res.status(200).json({ message: 'Activité supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'activité :', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour afficher toutes les activités d'une culture
app.get('/activities/:cropId', async (req, res) => {
  const { cropId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM activities WHERE crop_id = $1`,
      [cropId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités :', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour ajouter une intervention
app.post('/interventions', async (req, res) => {
  const { activity_id } = req.body;

  try {
    // Insérer l'intervention dans la table interventions
    const result = await pool.query(
      `INSERT INTO interventions (activity_id, created_at)
       VALUES ($1, NOW())
       RETURNING *`,
      [activity_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'intervention :', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour supprimer une intervention
app.delete('/interventions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM interventions WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Intervention non trouvée.' });
    }

    res.status(200).json({ message: 'Intervention supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'intervention :', error);
    res.status(500).json({ message: error.message });
  }
});


// Route pour récupérer les interventions d'une culture
app.get('/interventions/:cropId', async (req, res) => {
  const { cropId } = req.params;

  try {
    const result = await pool.query(
      `SELECT i.id, a.name, a.date, a.details 
       FROM interventions i
       JOIN activities a ON i.activity_id = a.id
       WHERE a.crop_id = $1`,
      [cropId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des interventions :', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users', (req, res) => {
  pool.query('SELECT * FROM users')
    .then(result => {
      res.json(result.rows);
    })
    .catch(error => {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.post('/api/users', (req, res) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  pool.query(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, password_hash, full_name, role]
  )
    .then(result => {
      res.status(201).json(result.rows[0]);
    })
    .catch(error => {
      console.error('Error adding user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { email, full_name, role } = req.body;

  if (!email || !full_name || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  pool.query(
    'UPDATE users SET email = $1, full_name = $2, role = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
    [email, full_name, role, id]
  )
    .then(result => {
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(result.rows[0]);
    })
    .catch(error => {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id])
    .then(result => {
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(204).send();
    })
    .catch(error => {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});


////////////////////////////////////////////////////////////////////////

// Route pour récupérer les informations de l'utilisateur
app.get('/api/user-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Pour l'exemple, nous supposons que le token est l'ID utilisateur
    const userId = parseInt(token);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
///////////////////////////////////////////////////////////////////////////////@ts-check

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Constantes pour les messages d'erreur
const ERROR_MESSAGES = {
  MISSING_FIELDS: 'Tous les champs sont obligatoires.',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives échouées. Réessayez plus tard.',
  INVALID_CODE: 'Code de réinitialisation invalide ou expiré.',
  PASSWORD_UPDATED: 'Le mot de passe a été mis à jour avec succès !',
  INTERNAL_ERROR: 'Erreur interne du serveur.',
  INVALID_PASSWORD: 'Le mot de passe ne respecte pas les critères de sécurité.',
  EMAIL_NOT_FOUND: 'Email non trouvé.',
};

// Constantes pour les requêtes SQL
const SQL_QUERIES = {
  // Vérifier si l'utilisateur est bloqué (trop d'échecs récents)
  CHECK_BLOCKED_USER: `
    SELECT failed_attempts, last_attempt 
    FROM reinitializer 
    WHERE email = $1 
    ORDER BY last_attempt DESC 
    LIMIT 1
  `,

  // Vérifier si le code de réinitialisation est valide et non expiré
  CHECK_RESET_CODE: `
    SELECT * 
    FROM reinitializer 
    WHERE email = $1 
      AND reset_code = $2 
      AND expires_at > NOW()
    ORDER BY created_at DESC 
    LIMIT 1
  `,

  // Incrémenter le nombre d'échecs de tentative de réinitialisation
  INCREMENT_FAILED_ATTEMPTS: `
    UPDATE reinitializer
    SET failed_attempts = failed_attempts + 1, last_attempt = NOW()
    WHERE email = $1
  `,

  // Mettre à jour le mot de passe de l'utilisateur
  UPDATE_PASSWORD: `
    UPDATE users 
    SET password_hash = $1 
    WHERE email = $2
  `,

  // Supprimer les entrées de réinitialisation après un succès
  DELETE_RESET_ENTRIES: `
    DELETE FROM reinitializer 
    WHERE email = $1
  `,
};
// Validation du mot de passe
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!hasUpperCase) return 'Le mot de passe doit contenir au moins une lettre majuscule.';
  if (!hasLowerCase) return 'Le mot de passe doit contenir au moins une lettre minuscule.';
  if (!hasNumbers) return 'Le mot de passe doit contenir au moins un chiffre.';
  if (!hasSpecialChars) return 'Le mot de passe doit contenir au moins un caractère spécial.';
  return null;
};

// Middleware pour limiter les tentatives
// Middleware pour limiter les tentatives
const rateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // Limite chaque IP à 5 requêtes par fenêtre
  message: ERROR_MESSAGES.TOO_MANY_ATTEMPTS,
});

// API pour envoyer un code de vérification
app.post('/api/send-verification-code', async (req, res) => {
  console.log('Requête reçue avec:', req.body); // Vérifier les données reçues
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: ERROR_MESSAGES.MISSING_FIELDS });
  }

  try {
    // Vérifier si l'email existe dans la base de données
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: ERROR_MESSAGES.EMAIL_NOT_FOUND });
    }

    // Générer un code à 6 chiffres
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Enregistrer le code dans la base de données
    await pool.query(
      'INSERT INTO reinitializer (email, reset_code, expires_at) VALUES ($1, $2, $3)',
      [email, resetCode, expirationTime]
    );

    // Envoyer l'email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Votre code de réinitialisation',
      text: `Votre code de réinitialisation est : ${resetCode} (valide 15 minutes)`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Code de vérification envoyé à votre email !' });
  } catch (error) {
    console.error('Erreur détaillée :', error);
    res.status(500).json({ message: ERROR_MESSAGES.INTERNAL_ERROR });
  }
});

// API pour réinitialiser le mot de passe
app.post('/api/reset-password', rateLimiter, async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  // Validation des champs obligatoires
  if (!email || !resetCode || !newPassword) {
    return res.status(400).json({ message: ERROR_MESSAGES.MISSING_FIELDS });
  }

  // Validation du mot de passe
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    // Vérifier si l'utilisateur est bloqué
    const blockCheck = await pool.query(SQL_QUERIES.CHECK_BLOCKED_USER, [email]);

    if (blockCheck.rows.length > 0) {
      const { failed_attempts, last_attempt } = blockCheck.rows[0];
      const lastAttemptTime = new Date(last_attempt);

      if (failed_attempts >= 5 && Date.now() - lastAttemptTime.getTime() < 30 * 60 * 1000) {
        return res.status(403).json({ message: ERROR_MESSAGES.TOO_MANY_ATTEMPTS });
      }
    }

    // Vérifier si le code est valide et non expiré
    const result = await pool.query(SQL_QUERIES.CHECK_RESET_CODE, [email, resetCode]);

    if (result.rows.length === 0) {
      // Incrémenter le compteur d'échecs
      await pool.query(SQL_QUERIES.INCREMENT_FAILED_ATTEMPTS, [email]);

      return res.status(400).json({ message: ERROR_MESSAGES.INVALID_CODE });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Utiliser une transaction pour garantir l'intégrité des données
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Mettre à jour le mot de passe
      await client.query(SQL_QUERIES.UPDATE_PASSWORD, [hashedPassword, email]);

      // Supprimer les entrées de réinitialisation
      await client.query(SQL_QUERIES.DELETE_RESET_ENTRIES, [email]);

      await client.query('COMMIT');

      // Envoyer un email de confirmation
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Mot de passe mis à jour',
        text: 'Votre mot de passe a été mis à jour avec succès.',
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: ERROR_MESSAGES.PASSWORD_UPDATED });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur détaillée :', error);
    res.status(500).json({ message: ERROR_MESSAGES.INTERNAL_ERROR });
  }
});
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifie si l'email et le mot de passe sont présents dans la requête
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    // Recherche l'utilisateur par email avec un pool de connexions
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Vérifie si l'utilisateur existe
    const rows = result.rows;  // Accède directement à la propriété 'rows'
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const user = rows[0];

    // Vérifie le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // Vérifie le rôle et génère un token
    if (user.role === 'admin') {
      const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '24h' });
      return res.json({ token, user });
    } else {
      return res.status(403).json({ message: 'Vous n\'êtes pas admin.' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});




// Get FAQs
// Récupérer les messages pour l'utilisateur
app.get('/api/contact-support/:id', async (req, res) => {
  const { id } = req.params;

  // Valider le format de l'UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ erreur: 'Format d\'ID invalide' });
  }

  try {
    // Récupérer les messages pour l'utilisateur avec l'ID donné
    const result = await pool.query('SELECT * FROM user_messages WHERE user_id = $1 ORDER BY created_at ', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Aucun message trouvé avec cet ID' });
    }
    // Renvoyer les résultats trouvés
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages :', error);
    res.status(500).json({ erreur: 'Erreur interne du serveur' });
  }
});


// Post user message
app.post('/api/contact-support/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, message } = req.body;

    console.log('Requête reçue:', req.body); // Log des données reçues

    // Log pour vérifier les valeurs avant validation
    console.log('Validation des données:', { name, email, message });

    const { error } = messageSchema.validate({ name, email, message });
    if (error) {
        console.error('Erreur de validation:', error.details);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const result = await pool.query(
            'INSERT INTO user_messages (name, email, message, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, message, id]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du message :', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});



// Endpoint pour envoyer un message de support
app.post('/api/contact-support', async (req, res) => {
  const { name, email, message, user_id } = req.body;

  // Validation des données
  if (!name || !email || !message || !user_id) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ message: 'Adresse e-mail invalide.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO user_messages (name, email, message, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, message, user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'envoi du message.' });
  }
});


// Endpoint pour récupérer tous les messages
app.get('/api/requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des requêtes:', error);
    res.status(500).send(`Erreur serveur: ${error.message}`);
  }
});

// Endpoint pour voir un message spécifique
app.get('/api/requests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM user_messages WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Requête non trouvée');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la requête:', error);
    res.status(500).send('Erreur serveur');
  }
});

// Endpoint pour répondre à un message
app.put('/api/requests/:id/respond', async (req, res) => {
  const requestId = req.params.id;
  const { response } = req.body;

  try {
    const result = await pool.query(
      'UPDATE user_messages SET response = $1, status = $2, response_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [response, 'Répondu', requestId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Requête non trouvée' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de l\'envoi de la réponse:', err);
    res.status(500).json({ message: "Erreur lors de l'envoi de la réponse." });
  }
});

// Endpoint pour supprimer un message
app.delete('/api/requests/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM user_messages WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Requête non trouvée' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).send('Erreur serveur');
  }
});
// Endpoint pour modifier un message
app.put('/api/requests/:id', async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  try {
    const result = await pool.query(
      'UPDATE user_messages SET message = $1 WHERE id = $2 RETURNING *',
      [message, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Requête non trouvée' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la modification du message:', error);
    res.status(500).send('Erreur serveur');
  }
});
// Endpoint pour récupérer les messages avec pagination
app.get('/api/requests', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      'SELECT * FROM user_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des requêtes:', error);
    res.status(500).send(`Erreur serveur: ${error.message}`);
  }
});

// Endpoint pour répondre à un message
app.put('/api/requests/:id/respond', async (req, res) => {
  const requestId = req.params.id;
  const { response } = req.body;

  try {
    const result = await pool.query(
      'UPDATE user_messages SET response = $1, status = $2, response_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [response, 'Répondu', requestId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Requête non trouvée' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de l\'envoi de la réponse:', err);
    res.status(500).json({ message: "Erreur lors de l'envoi de la réponse." });
  }
});


app.listen(port, () => {
  console.log(`Serveur à l'écoute sur http://localhost:${port}`);
});
