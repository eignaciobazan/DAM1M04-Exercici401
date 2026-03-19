const express = require('express');
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const MySQL = require('./utilsMySQL');

const app = express();
const port = 3000;

// Detectar si estem al Proxmox (si és pm2)
const isProxmox = !!process.env.PM2_HOME;

// Iniciar connexió MySQL
const db = new MySQL();
if (!isProxmox) {
  db.init({
    host: '127.0.0.1',
    port: 3307,
    user: 'super',
    password: '1234',
    database: 'sakila'
  });
  /*
  db.init({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'tuclave',
    database: 'sakila'
  });
  */
} else {
  db.init({
    host: '127.0.0.1',
    port: 3307,
    user: 'super',
    password: '1234',
    database: 'sakila'
  });
}

// Static files - ONLY ONCE
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

// Disable cache
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Registrar "Helpers .hbs" aquí
hbs.registerHelper('eq', (a, b) => a == b);
hbs.registerHelper('gt', (a, b) => a > b);

// Partials de Handlebars
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Route
app.get('/', async (req, res) => {
  try {
    // Obtenir les dades de la base de dades
    const filmRows = await db.query(
      `select f.title,f.release_year,a.first_name
      from film f
      left join film_actor fa on f.film_id=fa.film_id
      left join actor a on fa.actor_id=a.actor_id
      limit 5`
    );
    const categoryRows = await db.query(
      `select name
      from category
      limit 5`
    );
    // Transformar les dades a JSON (per les plantilles .hbs)
    // Cal informar de les columnes i els seus tipus
    const filmsJson = db.table_to_json(filmRows, { title: 'string', realese_year: 'year', first_name: 'string' });
    const categoryJson = db.table_to_json(filmRows, { name: 'string' });

    // Llegir l'arxiu .json amb dades comunes per a totes les pàgines
    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );

    // Construir l'objecte de dades per a la plantilla
    const data = {
      film: filmRows,
      category:categoryRows,
      common: commonData
    };
    console.log(data)

    // Renderitzar la plantilla amb les dades
    res.render('index', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});

app.get('/movies', async (req, res) => {
  try {
    // Obtenir les dades de la base de dades
    const filmRows = await db.query(
      `select f.title,f.description,f.rating,f.replacement_cost,f.special_features,a.first_name as actor
      from film f
      left join film_actor fa on f.film_id=fa.film_id
      left join actor a on fa.actor_id=a.actor_id
      limit 15`
    );
    
    // Transformar les dades a JSON (per les plantilles .hbs)
    // Cal informar de les columnes i els seus tipus
    const filmsJson = db.table_to_json(filmRows, { title: 'string',description: 'string',rating: 'string',replacement_cost:'number',special_features:'string',first_name:"string" });
    

    // Llegir l'arxiu .json amb dades comunes per a totes les pàgines
    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );

    // Construir l'objecte de dades per a la plantilla
    const data = {
      film: filmRows,
      common: commonData
    };
    console.log(data)

    // Renderitzar la plantilla amb les dades
    res.render('movies', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});

app.get('/customers', async (req, res) => {
  try {
    // Obtenir les dades de la base de dades
    const customersRows = await db.query(
      `SELECT c.first_name,c.last_name,r.rental_id,r.rental_date
        FROM customer c
        JOIN rental r ON c.customer_id = r.customer_id
        WHERE c.customer_id <= 25
        AND (SELECT COUNT(*)
            FROM rental r2
            WHERE r2.customer_id = c.customer_id
              AND r2.rental_date <= r.rental_date) <= 5
        ORDER BY c.customer_id, r.rental_date;`
    );
    
    // Transformar les dades a JSON (per les plantilles .hbs)
    // Cal informar de les columnes i els seus tipus
    const customersJson = db.table_to_json(customersRows, { first_name:'string',last_name:'string',rental_id:'number',rental_date:'date',customer_id:'number' });
    

    // Llegir l'arxiu .json amb dades comunes per a totes les pàgines
    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );

    // Construir l'objecte de dades per a la plantilla
    const data = {
      customers: customersRows,
      common: commonData
    };
    console.log(data)

    // Renderitzar la plantilla amb les dades
    res.render('customers', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
})

app.post('/create', async (req, res) => {
  try {

    const table = req.body.table

    if (table == "film") {

      const title = req.body.title
      const description = req.body.description
      const rating = req.body.rating
      const replacement_cost = req.body.replacement_cost
      const special_features = req.body.special_features



      // Basic validation
      if (!title || !description || !rating || !replacement_cost || !special_features) {
        return res.status(400).send('Falten dades')
      }

      await db.query(
        `
        INSERT INTO film (title, description,rating,replacement_cost,special_features, language_id)
        VALUES ("${title}", "${description}", "${rating}", ${replacement_cost}, "${special_features}",1)
        `
      )

      // Redirect to list of courses
      res.redirect('/movies')
    }

  } catch (err) {
    console.error(err)
    res.status(500).send('Error afegint la movie')
  }
});

// Start server
const httpServer = app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.end();
  httpServer.close();
  process.exit(0);
});