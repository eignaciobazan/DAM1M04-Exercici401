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
    port: 3307,
    user: 'super',
    password: '1234',
    database: 'botiga_marcas'
  });
} else {
  db.init({
    host: '127.0.0.1',
    port: 3306,
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
                                      AND MONTH(sale_date) = 3;`);

    const sale_itemsRows=await db.query(`SELECT p.name AS product_name
                                    FROM sale_items si
                                    JOIN sales s ON si.sale_id = s.id
                                    JOIN products p ON si.product_id = p.id
                                    WHERE DAY(s.sale_date) = 7;
                                    `);
    const sale1_itemsRows=await db.query(`SELECT p.name AS product_name
                                    FROM sale_items si
                                    JOIN sales s ON si.sale_id = s.id
                                    JOIN products p ON si.product_id = p.id
                                    WHERE MONTH(s.sale_date) = 3;
                                    `);
    const stockRows=await db.query(`
      select name,stock
      from products
      where stock<=20`);
    const ventesRows=await db.query(`
      SELECT s.id, c.name AS client, s.sale_date, s.total
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      ORDER BY s.sale_date DESC
      LIMIT 5;
      `);
      const ventes1Rows=await db.query(`
      SELECT p.name, SUM(si.qty) AS total_vendes
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY total_vendes DESC
      LIMIT 5;
      `)                                                                                                        
    //console.log(salesRows)
    //console.log("abc")
    

    // Transformar les dades a JSON (per les plantilles .hbs)
    // Cal informar de les columnes i els seus tipus
    const salesJson = db.table_to_json(salesRows, { name: 'string', sale_date: 'date'});
    const sales1Json = db.table_to_json(sales1Rows, { name: 'string', sale_date: 'date'});
    const sale_itemsJson = db.table_to_json(sale_itemsRows, { product_name: 'string'});
    const sale1_itemsJson = db.table_to_json(sale1_itemsRows, { product_name: 'string'});
    const stockJson = db.table_to_json(stockRows, { stock: 'number',name:'string'});
    const ventesJson = db.table_to_json(ventesRows, { client: 'string',sale_date:'date',total:'number'});
    const ventes1Json = db.table_to_json(ventes1Rows, { name: 'string',total_vendes:'number'});

    // Llegir l'arxiu .json amb dades comunes per a totes les pàgines
    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );
    
    // Construir l'objecte de dades per a la plantilla
    const data = {
      sale_items:sale_itemsJson,
      sales1:sales1Json,
      sales: salesJson,
      sale1_items:sale1_itemsJson,
      stock:stockJson,
      ventes:ventesJson,
      ventes1:ventes1Json,
      common: commonData
    };

    // Renderitzar la plantilla amb les dades
    res.render('index', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});
app.get('/clientes', async (req, res) => {
  try {
    // Obtenir les dades de la base de dades
    const customersRows = await db.query(`select name
                                          from customers`);
    

                                    
    //console.log(salesRows)
    //console.log("abc")
    

    // Transformar les dades a JSON (per les plantilles .hbs)
    // Cal informar de les columnes i els seus tipus
    const customersJson = db.table_to_json(customersRows, { name: 'string'});
    
    

    // Llegir l'arxiu .json amb dades comunes per a totes les pàgines
    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );
    
    // Construir l'objecte de dades per a la plantilla
    const data = {
      customers:customersJson,
      common: commonData
    };

    // Renderitzar la plantilla amb les dades
    res.render('clients', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});
app.get('/productes', async (req, res) => {
  try {
    const cerca = req.query.cerca || null;
    const categoria = req.query.categoria || null;
    const page = parseInt(req.query.pagina) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Construir WHERE dinámico
    let where = "WHERE 1=1";

    if (cerca) {
      where += ` AND name LIKE '%${cerca}%'`;
    }

    if (categoria) {
      where += ` AND category LIKE '%${categoria}%'`;
    }

    // Total de productos filtrados
    const totalRows = await db.query(`
      SELECT COUNT(*) AS total
      FROM products
      ${where}
    `);

    const totalProducts = totalRows[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Productos filtrados + paginados
    const productsRows = await db.query(`
      SELECT id, name, category, stock, active
      FROM products
      ${where}
      LIMIT ${limit} OFFSET ${offset}
    `);

    const productsJson = db.table_to_json(productsRows, {
      id: 'number',
      name: 'string',
      category: 'string',
      stock: 'number',
      active: 'number'
    });

    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );

    res.render('products', {
      products: productsJson,
      common: commonData,
      currentPage: page,
      totalPages: totalPages,
      cerca: cerca,
      categoria: categoria
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});

 app.get('/siguiente', async (req, res) => {

let page = parseInt(req.query.numpagina) || 1;

page++; // Ir a la siguiente página


const limit = 10;


// 1. Contar cuántos productos hay en total

const totalRows = await db.query(`SELECT COUNT(*) AS total FROM products`);

const totalProducts = totalRows[0].total;


// 2. Calcular cuántas páginas existen

const totalPages = Math.ceil(totalProducts / limit);


// 3. Evitar que page se pase del máximo

if (page > totalPages) page = totalPages;


const offset = (page - 1) * limit;


// 4. Obtener los productos de la página actual

const productsRows = await db.query(`

SELECT id, name, category, stock, active

FROM products

LIMIT ${limit} OFFSET ${offset}

`);


const productsJson = db.table_to_json(productsRows, {

id: 'number',

name: 'string',

category: 'string',

stock: 'number',

active: 'number'

});


const commonData = JSON.parse(

fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')

);


// 5. Renderizar la plantilla con datos de paginación

res.render('products', {

products: productsJson,

common: commonData,

currentPage: page,

totalPages: totalPages,

hasPrev: page > 1,

hasNext: page < totalPages

});

});


app.get('/anterior', async (req, res) => {

let page = parseInt(req.query.numpagina) || 1;


// 1. Contar total de productos

const totalRows = await db.query(`SELECT COUNT(*) AS total FROM products`);

const totalProducts = totalRows[0].total;

const limit = 10;

const totalPages = Math.ceil(totalProducts / limit);


// 2. Evitar bajar de página 1

if (page > 1) page--;

if (page < 1) page = 1;


const offset = (page - 1) * limit;


// 3. Obtener productos de la página actual

const productsRows = await db.query(`

SELECT id, name, category, stock, active

FROM products

LIMIT ${limit} OFFSET ${offset}

`);


const productsJson = db.table_to_json(productsRows, {

id: 'number',

name: 'string',

category: 'string',

stock: 'number',

active: 'number'

});


const commonData = JSON.parse(

fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')

);


// 4. Renderizar con paginación correcta

res.render('products', {

products: productsJson,

common: commonData,

currentPage: page,

totalPages: totalPages,

hasPrev: page > 1,

hasNext: page < totalPages

});

});


app.get('/productsEdit', async (req, res) => {
  try {
    // Llegit el valor del paràmetre "id" en format enter
    const cursId = parseInt(req.query.id, 10)

    // Validar que és un número enter positiu (o respondre amb error 400)
    if (!Number.isInteger(cursId) || cursId <= 0) {
      return res.status(400).send('Paràmetre id invàlid')
    }

    // Query only the requested course
    const productsRows = await db.query(`
      select id,name,category,stock,active
      from products
      where id=${[cursId]}`)

    // Si no s'ha trobat cap curs amb aquest id, respondre amb error 404
    if (!productsRows || productsRows.length === 0) {
      return res.status(404).send('Curs no trobat')
    }

    // Transformar les dades a JSON (per les plantilles .hbs)
    const productsJson = db.table_to_json(productsRows, {
      id: 'number',
      name: 'string',
      category: 'string',
      stock:'number',
      active:'number'
      
    })

    // Llegir l'arxiu .json amb dades comunes per a totes les pàgines
    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    )

    // Construir l'objecte de dades per a la plantilla
    // com que tenim una llista amb un sol element, agafem directament el primer element (cursosJson[0])
    const data = {
      Products: productsJson[0],
      common: commonData
    }

    // Render a new template (recommended)
    res.render('productsEdit', data)
  } catch (err) {
    console.error(err)
    res.status(500).send('Error consultant la base de dades')
  }
});
app.post('/create', async (req, res) => {
  try {
    const table = req.body.table;

    if (table === "products") {

      const name = req.body.name;
      const category = req.body.category;
      const price = req.body.price;
      const stock = req.body.stock;

      if (!name || !category || !price || !stock) {
        return res.status(400).send('Falten dades');
      }

      // INSERT INTO products (name, category, price, stock, active, created_at) VALUES ('abc', 'Calzado', 2.0, 1, 1, '2026-03-14 17:49:21')
      await db.query(`INSERT INTO products (name, category, price, stock, active, created_at) VALUES ("${name}", "${category}", ${price}, ${stock}, 1, CURRENT_DATE())`);

      res.redirect('/productes');
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Error afegint el producte');
  }
});







app.post('/update', async (req, res) => {
  try {
    const { table,id, name, category, stock} = req.body;

    if (table === "products") {
      // Usamos comillas dobles para envolver los textos por si tienen espacios
      const sql = `
        UPDATE products 
        SET name = "${name}", 
            category = "${category}", 
            stock = "${stock}" 
        WHERE id = ${id}
      `;

      await db.query(sql); // Aquí no pasamos array, porque ya van dentro del string

      console.log(`Producto ${id} actualizada`);
      res.redirect('/productes');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error actualizando: ' + err.message);
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