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
                                    `)                                                                   
    //console.log(salesRows)
    //console.log("abc")
    

    // Transformar les dades a JSON (per les plantilles .hbs)
    // Cal informar de les columnes i els seus tipus
    const salesJson = db.table_to_json(salesRows, { name: 'string', sale_date: 'date'});
    const sales1Json = db.table_to_json(sales1Rows, { name: 'string', sale_date: 'date'});
    const sale_itemsJson = db.table_to_json(sale_itemsRows, { product_name: 'string'});
    const sale1_itemsJson = db.table_to_json(sale1_itemsRows, { product_name: 'string'});

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
      hasPrev: page > 1,
      hasNext: page < totalPages,
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
  page++; // siguiente página

  const limit = 10;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT id, name, category, stock, active
    FROM products
    LIMIT ${limit} OFFSET ${offset}
  `;

  const productsRows = await db.query(sql);

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
    totalPages: totalPages
  });
});
app.get('/anterior', async (req, res) => {
  let page = parseInt(req.query.numpagina) || 1;

  if (page > 1) page--; // no bajar de 1

  const limit = 10;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT id, name, category, stock, active
    FROM products
    LIMIT ${limit} OFFSET ${offset}
  `;

  const productsRows = await db.query(sql);

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
    currentPage: page
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

app.get('/ProductsSearch', async (req, res) => {
  try {
    // Llegit el valor del paràmetre "id" en format enter

    // Query only the requested course
    const productsRows = await db.query(`
      select id,name,category,stock,active
      from products`)

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
      SearchProducts: productsJson[0],
      common: commonData
    }

    // Render a new template (recommended)
    res.render('ProductsSearch', data)
  } catch (err) {
    console.error(err)
    res.status(500).send('Error consultant la base de dades')
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