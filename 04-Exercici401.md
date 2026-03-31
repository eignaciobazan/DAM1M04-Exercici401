## “MiniERP” d'una botiga

### Objectiu

Crear un **backoffice web** per gestionar una botiga amb tres blocs principals:

* **Productes**
* **Clients**
* **Vendes**

Podeu escollir la temàtica de la botiga.

---

## Estructura de pàgines (mínim viable)

### Pàgina principal (`/`)

Mostra un *"Panell de control"* (Dashboard) amb el resum “executiu” del negoci. Té dues pestanyes:

* **KPI**:

  * Vendes d’avui
  * Vendes del mes
  * Comandes (avui/mes)
  * Productes amb **stock baix**

* **Llistats**:

  * Últimes 5 vendes (data, client, total)
  * Top 5 productes més venuts

A la pestanya "KPI" hi ha d'haver un botó tipus "toggle" per escollir entre "tauler compacte/tauler complert" que permet "mostrar/restaurar" una versió resumida o completa del tauleer.

A la pestanya "Llistats" hi ha d'haver un botó tipus "toggle" per activar/desactiva el codi de colors segons si hi ha molt, normal o poc stock: "Verd (ok), Taronja (baix), Vermell (crític)"

---

### Productes

#### Llistat (`/productes`)

Taula amb:

* Nom, categoria, preu, stock, actiu, accions (editar)

**Paginació**

No ha de mostrar més de 10 productes per pàgina, ha de tenir enllaços a veure els 10 següents o 10 anteriors si escau. El filtre de pàgina és de l'estil:

```text
/productes?pagina=3
```

*Si no s'informa de la pàgina, mostrarà la 0 per defecte*

**Cerca**

Ha de tenir un buscador per filtrar productes per nom i categoria, El filtre del cercador és de l'estil:

```text
/productes?cerca=patates
/productes?pagina=3&cerca=patates
```

A de tenir un botó tipus "toggle" per activar/desactiva el codi de colors segons si hi ha molt, normal o poc stock: "Verd (ok), Taronja (baix), Vermell (crític)"

#### Afegir (`/producteAfegir`) i editar (`/producteEditar`) productes

Formulari:

* Nom (obligatori)
* Categoria (obligatori)
* Preu (decimal > 0)
* Stock (enter >= 0)
* Actiu (sí/no)

**Validació amb JavaScript del formulari**

* Errors sota cada camp + contorn del camp en error
* No permetre enviar si:

  * Nom buit o massa curt
  * Preu <= 0
  * Stock no enter o negatiu

La pàgina per editar producte, rep l'identificador del producte a editar:

```text
/producteEditar?id=4
```

Fan crides al CRUD amb el camp amagat (hidden) taula = 'productes':

- El formulari de la web "/producteAfegir" crida amb un POST a "/create"
- El formulari de la web "/productesEditar" crida amb un POST a "/Update"

La pàgina d'editar producte ha de tenir un botó per esborrar un producte amb un POST a "/Delete"

---

### Clients

#### Llistat (`/clients`)

Taula amb:

* Nom, email, telèfon, # compres, total gastat (opcional), accions

Filtres:

* 10 clients per pàgina
* Cercador (nom/email)
* Mostrar només “Clients VIP”

#### Fitxa client (`/clientFitxa`)

* Dades del client
* **Historial de compres** (últimes 10 vendes)
* Total gastat + ticket mitjà (opcional)

#### Afegir (`/clientAfegir`) i editar (`/clientEditar`) productes

La mateixa lògica que amb els productes, però amb les dades dels clients.

Fan crides al CRUD amb el camp amagat (hidden) taula = 'clients':

- El formulari de la web "/clientAfegir" crida amb un POST a "/create"
- El formulari de la web "/clientEditar" crida amb un POST a "/Update"

Validació del formulari amb JavaScript:

* email amb format bàsic
* telèfon longitud mínima
* nom obligatori

La pàgina d'editar client ha de tenir un botó per esborrar un client amb un POST a "/Delete"

---

### Vendes

#### Llistat (`/vendes`)

Taula:

* Data, client, total, estat (opcional), accions (veure)

Lògica de funcionament i gestió igual que "productes" i "clients"

---

## Parcials HBS obligatoris (comuns)

* `partials/header.hbs` (títol + logo)
* `partials/menu.hbs` (links a Dashboard, Productes, Clients, Vendes)
* `partials/footer.hbs` (copyright)
* Altres parcials que cregueu necessaris

Totes les pàgines han de compartir **layout**:

* `layouts/main.hbs` amb el mateix CSS i JS global

---

## Interactivitat JS “d’estètica coherent” (requisit explícit)

Implementa un “Sistema de visualització” (afecta totes les pantalles):

### Selector de tema (3 opcions)

* **Clar**
* **Nit suau**
* **Alt contrast**

Requisits:

* Canvia variables CSS (o classes al `body`)
* Es guarda a `localStorage`
* Afecta:

  * fons, cards, taules, botons
  * colors d’alerta (stock, errors formulari)

---

## Esquema MySQL recomanat (MVP)

* `products`

  * `id` PK
  * `name`
  * `category`
  * `price`
  * `stock`
  * `active`
  * `created_at`
* `customers`

  * `id` PK
  * `name`
  * `email`
  * `phone`
  * `created_at`
* `sales`

  * `id` PK
  * `customer_id` FK
  * `sale_date`
  * `payment_method`
  * `total`
* `sale_items`

  * `id` PK
  * `sale_id` FK
  * `product_id` FK
  * `qty`
  * `unit_price`
  * `line_total`

---

## Criteris d’avaluació (checklist)

* MySQL amb relacions correctes i integritat bàsica
* HBS amb layout + parcials compartits
* Llistats amb filtres i cercador
* Formularis amb validació JS (errors clars)
* Venda amb línies + control d’stock
* Interactivitat estètica coherent (tema + compacte + components visuals)
* Codi ordenat per carpetes (views, public, routes, db)

---

## Entrega

Emleneu la base de dades amb més de 25 clients/vendes/productes per validar correctament la paginació (també al Proxmox).

Entregueu l’exercici com un nou repositori a GitHub anomenat:

`DAM1M04-Exercici401`

I pujeu l’enllaç del repositori a l’espai d’entrega del Moodle.

Haureu d'ensenyar l'exercici funcionant al Proxmox el dia de l'entrega presencial.

Aquest Exercici es fa amb grups de dues persones, els grups han de ser diferents a treballs anteriors.
