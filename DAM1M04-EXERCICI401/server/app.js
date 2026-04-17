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
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'tuclave',
    database: 'botiga_marcas'
  });
} else {
  db.init({
    host: '127.0.0.1',
    port: 3307,
    user: 'super',
    password: '1234',
    database: 'botiga_marcas'
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
    const salesRows = await db.query(`SELECT p.name as name , s.sale_date as sale_date
                                      FROM sales s
                                      JOIN sale_items si ON s.id = si.sale_id
                                      JOIN products p ON si.product_id = p.id
                                      WHERE DAY(s.sale_date) = 7;`);
    const sales1Rows=await db.query(`SELECT p.name as name , s.sale_date as sale_date
                                      FROM sales s
                                      JOIN sale_items si ON s.id = si.sale_id
                                      JOIN products p ON si.product_id = p.id
                                      WHERE YEAR(sale_date) = 2026
                                      AND MONTH(sale_date) = 03;`);

    const sale_itemsRows=await db.query(`SELECT p.name AS product_name
                                    FROM sale_items si
                                    JOIN sales s ON si.sale_id = s.id
                                    JOIN products p ON si.product_id = p.id
                                    WHERE DAY(s.sale_date) = 14;
                                    `)                                  
    //console.log(salesRows)
    //console.log("abc")
    

    // Transformar les dades a JSON (per les plantilles .hbs)
    // Cal informar de les columnes i els seus tipus
    const salesJson = db.table_to_json(salesRows, { name: 'string', sale_date: 'date'});
    const sales1Json = db.table_to_json(sales1Rows, { name: 'string', sale_date: 'date'});
    const sale_itemsJson = db.table_to_json(sale_itemsRows, { product_name: 'string'});
    

    // Llegir l'arxiu .json amb dades comunes per a totes les pàgines
    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );
    
    // Construir l'objecte de dades per a la plantilla
    const data = {
      sale_items:sale_itemsJson,
      sales1:sales1Json,
      sales: salesJson,
      common: commonData
    };

    // Renderitzar la plantilla amb les dades
    res.render('index', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
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