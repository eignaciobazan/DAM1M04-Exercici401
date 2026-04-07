# Exercici302: Web amb dades de MySQL

En aquest exercici crearàs un petit servidor web amb **Node.js + Express + Handlebars (HBS) + MySQL** que genera les següents pàgines a partir de dades *.json* i *MySQL*:

- **index.hbs**: Pàgina principal
- **movies.hbs**: Pàgina de pel·lícules
- **customers.hbs**: Pàgina de clients

> **Important**: Fes servir el servidor de l'exemple *"05-MySQL"* com a base!

---

## Subvistes parcials

Les tres pàgines anteriors com a mínim han de compartir codi HTML comú a totes les pàgines:

- **header.hbs**: Part comú de les capçalerre HTML (meta, link, ...)
- **menu**: Logotip i menú superior comú per canviar de pàgina
- **footer**: Peu de pàgina amb l'any actual i el copyright.

---

## Estructura de carpetes obligatòria

Crea el projecte amb aquesta estructura:

```
DAM1M04-Exercici303/
├── package.json
├── public/
│   ├── estils.css
│   └── imatges/
│       └── *.png
└── server/
    ├── app.js
    ├── data/
    │   ├── common.json
    └── views/
        ├── partials
        │   ├── header.hbs
        │   ├── menu.hbs
        │   └── footer.hbs
        ├── index.hbs
        └── informe.hbs
```

---

## Dades proporcionades

### 1) `server/data/common.json`

Ha de contenir l'any actual i atres dades comuns a totes les pàgines que creguis necessàries.

### 2) `sakila.sql`

Si no la tens instal·lada, carrega la base de dades **Sakila** al servidor de MySQL (local i Proxmox)

[Base de dades Sakila](https://dev.mysql.com/doc/sakila/en/sakila-installation.html)

---

## Tasques a implementar

### A) Servidor i dependències
1. Inicialitza el projecte amb npm.
2. Amb el mateix **package.json** dels exemples, instal·la les dependències:

```bash
npm install
```

### B) Ruta `/` (pàgina principal)
- Ruta: `GET /`
- Plantilla: `server/views/index.hbs`
- Ha de mostrar dues llistes de fitxes:
    * "Movies": 5 primeres pel·lícules amb títol, any, caràtula i actors
    * "Categories": 5 primeres categories

### C) Ruta `/movies` (pàgina de pel·lícules)
- Ruta: `GET /movies`
- Plantilla: `server/views/movies.hbs`
- Ha de mostrar les 15 primeres películes amb la seva informació i una llista amb els noms dels seus actors.

### D) Ruta `/customers` (pàgina de pel·lícules)
- Ruta: `GET /customers`
- Plantilla: `server/views/customers.hbs`
- Ha de mostrar els 25 primers clients, i per cada un la llista dels seus primers 5 lloguers.

---

## Estil i presentació
- Crea `public/estils.css` i enllaça’l perquè les dues pàgines es vegin correctament.
- Afegeix com a mínim una font base

Si et calen més estils personalitzats a cada pàgina, es poden afegir.

---

## Comprovacions que has de poder fer
- `npm run dev` (o el script que defineixis) engega el servidor
- `http://localhost:3000/` mostra la pàgina principal
- `http://localhost:3000/movies` mostra la pàgina de pel·lícules i actors
- `http://localhost:3000/customers` mostra la pàgina de clients i lloguers

---

## Entrega

Entrega l’exercici com un nou repositori a GitHub anomenat:

`DAM1M04-Exercici302`

I puja l’enllaç del repositori a l’espai d’entrega del Moodle de l’assignatura.

Hauràs de mostrar la pàgina **funcionant al Proxmox** al mestre.

http://nomUsuari.ieti.site

S'han de poder canviar dades a la base de dades del **Proxmox**, i veure instantàniament els canvis al refrescar la pàgina al navegador.