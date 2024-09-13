import 'dotenv/config'; // Pour les variables d'environnement
import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg'; // Importation par défaut
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken'; // Utilisation d'import pour jwt
import { v4 as uuidv4 } from 'uuid'; // Importation du module pour générer des UUID
// Importation du module pour générer des UUID



const { Pool } = pg;
const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

////////////////////////////////////////////////////////////////////////////////////////////////
// Clé secrète pour JWT
const JWT_SECRET = '22A3345'; // Remplacez ceci par une clé secrète plus sécurisée en production

app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  // Validation des champs
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Les mots de passe ne correspondent pas.' });
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
// Route pour la connexion des utilisateurs
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
  
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
  
    const passwordIsValid = await bcrypt.compare(password, user.password_hash);
  
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }
  
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
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
  const {user_id,type, quantity, unit, niveau, date,name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO historique (user_id,type, quantity, unit, niveau, date,name) VALUES ($1, $2, $3, $4, $5,$6, $7) RETURNING *',
      [user_id,type, quantity, unit,niveau, date,name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/api/historique/:userId', async (req, res) => {
    const userId = req.params.userId;
  try {
   const result = await pool.query(
  'SELECT * FROM historique WHERE type IN ($1, $2, $3) AND user_id = $4', 
  ['pesticides', 'semences', 'fertilisants', userId]
);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/historique/produits/:userId', async (req, res) => {
    const userId = req.params.userId;
  try {
    const result = await pool.query('SELECT * FROM historique WHERE type = $1 AND user_id = $2', ['produits', userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////
// Récupérer une entrée spécifique par ID
app.get('/historique/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM historique WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Mettre à jour une entrée spécifique par ID
app.put('/historique/:id', async (req, res) => {
  const { id } = req.params;
  const { stock_id, type, quantity, unit, date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE historique SET stock_id = $1, type = $2, quantity = $3, unit = $4, date = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [stock_id, type, quantity, unit, date, id]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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
      'SELECT * FROM stocks WHERE type = $1 AND user_id = $2',
      ['semences', userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de la récupération des semences.');
  }
});

// 1. Récupérer toutes les semences
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

// 1. Récupérer toutes les semences
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

// 1. Récupérer toutes les semences
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

// 2. Ajouter une nouvelle semence
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
  try {
    const result = await pool.query(
      'INSERT INTO stocks (name, quantity, unit, type,user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, quantity, unit, 'semences', user_id]
       
    );
    console.log(user_id) 
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'ajout de la semence.");
  }
});

// 2. Ajouter une nouvelle semence
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

// 2. Ajouter une nouvelle semence
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
  const { id, name, quantity, unit, created_at, updated_at, type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO stocks (id, name, quantity, unit, created_at, updated_at, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, quantity, unit, created_at, updated_at, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur lors de l\'enregistrement du stock.');
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

// Route pour ajouter une nouvelle entrée dans l'historique
app.post('/api/historique', async (req, res) => {
  const { type, quantity, unit, niveau, date } = req.body;
  const stock_id = uuidv4();

  if (!stock_id || !type || !quantity || !unit || !niveau) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }

  try {
    const newHistorique = new Historique({
      stock_id,
      type,
      quantity,
      unit,
      niveau,
      date: date || Date.now(),
    });

    await newHistorique.save();
    res.status(201).json(newHistorique);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'historique.' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
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
app.get('/revenus', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM revenus_');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// GET all depenses
app.get('/depenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM depenses_');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// POST ajouter revenu
app.post('/revenus', async (req, res) => {
  const { montant, source, date } = req.body;
  try {
    await pool.query('INSERT INTO revenus_ (montant, source, date) VALUES ($1, $2, $3)', [montant, source, date]);
    res.status(201).send('Revenu ajouté');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// POST ajouter depense
app.post('/depenses', async (req, res) => {
  const { montant, categorie, date } = req.body;
  try {
    await pool.query('INSERT INTO depenses_ (montant, categorie, date) VALUES ($1, $2, $3)', [montant, categorie, date]);
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

// Get FAQs
app.get('/api/faqs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM faqs');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Post user message
app.post('/api/contact-support', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO user_messages (name, email, message) VALUES ($1, $2, $3) RETURNING *',
      [name, email, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


app.listen(port, () => {
  console.log(`Serveur à l'écoute sur http://localhost:${port}`);
});
