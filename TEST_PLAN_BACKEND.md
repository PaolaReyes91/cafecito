# Plan de Pruebas — Backend Cafecito

## 1. Diagnóstico Inicial

### 1.1 Estado Actual

| Aspecto | Hallazgo |
|---|---|
| Test runner | ❌ No existe (`npm test` → placeholder que falla) |
| Framework de testing | ❌ No instalado (sin Jest, Mocha, Vitest) |
| Pruebas unitarias | ❌ Cero archivos `.test.js` o `.spec.js` |
| Pruebas de integración | ❌ No existen |
| Mocks / Fakes | ❌ No existe `mongodb-memory-server` ni librerías de mocking |
| Utilidades de test | ❌ No hay helpers, factories, fixtures ni seeders de prueba |
| CI/CD | ❌ No hay pipeline configurado |
| Cobertura (`--coverage`) | ❌ No configurado |
| Documentación de pruebas | ❌ No existe |
| Pruebas existentes | ⚠️ Solo Postman collection en `/postman/` (pruebas manuales) |

### 1.2 Riesgos Identificados

1. **Regresión silenciosa** — Sin pruebas, cualquier cambio puede romper funcionalidad existente sin detección.
2. **Validación frágil** — Las validaciones de entrada en controladores no tienen tests; un cambio en la lógica de saneamiento no se detecta.
3. **Modelos sin garantía** — Los hooks (`pre('save')`, `comparePassword`) y validaciones de Mongoose no están verificados.
4. **Discount tiers** — La lógica de descuentos progresivos (`DISCOUNT_TIERS` en `saleController.js`) es un punto crítico de negocio sin cobertura.
5. **Autenticación/Autorización** — El middleware JWT y el rol check son rutas críticas sin pruebas.
6. **Stock underflow** — La operación `$inc: { stock: -item.quantity }` en `createSale` puede llevar stock a negativo si hay race conditions.

---

## 2. Infraestructura de Testing Propuesta

### 2.1 Stack Tecnológico

| Herramienta | Versión | Propósito |
|---|---|---|
| **Jest** | ^29.x | Test runner + aserciones + mocks + cobertura |
| **Supertest** | ^7.x | Pruebas de integración HTTP sobre Express |
| **mongodb-memory-server** | ^10.x | Base de datos MongoDB efímera para integración |
| **@faker-js/faker** | ^9.x | Generación de datos de prueba realistas |

### 2.2 Instalación

```bash
npm install --save-dev jest supertest mongodb-memory-server @faker-js/faker
```

### 2.3 Configuración Mínima

**`jest.config.js`** en raíz del backend:

```js
export default {
  testEnvironment: 'node',
  setupFilesAfterSetup: ['./tests/setup.js'],
  testPathPattern: 'tests/**/*.test.js',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/helpers/',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 2.4 Estructura de Directorios

```
backend/
├── jest.config.js
├── tests/
│   ├── setup.js                     # Conexión/desconexión MongoDB en memoria
│   ├── helpers/
│   │   ├── factories.js             # Fábricas para crear datos de prueba
│   │   ├── authHelper.js            # Crear usuario + token para tests
│   │   └── dbHelper.js              # Limpieza entre tests
│   ├── unit/
│   │   ├── models/
│   │   │   ├── User.test.js
│   │   │   ├── Product.test.js
│   │   │   ├── Customer.test.js
│   │   │   ├── Sale.test.js
│   │   │   ├── SaleItem.test.js
│   │   │   └── Ticket.test.js
│   │   ├── middleware/
│   │   │   └── auth.test.js
│   │   └── utils/
│   │       └── discount.test.js     # Lógica de descuentos (extraída)
│   └── integration/
│       ├── auth.test.js
│       ├── products.test.js
│       ├── customers.test.js
│       ├── sales.test.js
│       └── tickets.test.js
```

---

## 3. Matriz de Pruebas

### 3.1 Pruebas Unitarias

#### Modelos (Mongoose)

| # | Archivo | Escenario | Assert |
|---|---|---|---|
| U1 | `User.test.js` | Crear usuario válido | `name`, `email`, `role` correctos; `password` hasheado |
| U2 | `User.test.js` | password sin `select: false` | `user.password` es `undefined` con query normal |
| U3 | `User.test.js` | `comparePassword` — contraseña correcta | Retorna `true` |
| U4 | `User.test.js` | `comparePassword` — contraseña incorrecta | Retorna `false` |
| U5 | `User.test.js` | Email duplicado | Error `unique` de Mongoose |
| U6 | `User.test.js` | Role inválido | Error de validación |
| U7 | `Product.test.js` | Crear producto válido | `name`, `price`, `stock` correctos |
| U8 | `Product.test.js` | `price <= 0` | Error de validación |
| U9 | `Product.test.js` | `stock < 0` | Error de validación |
| U10 | `Product.test.js` | `name` vacío | Error de validación |
| U11 | `Customer.test.js` | Crear cliente válido | `name`, `phoneOrEmail`, `purchasesCount` default 0 |
| U12 | `Customer.test.js` | `phoneOrEmail` duplicado | Error de validación |
| U13 | `Sale.test.js` | Crear venta válida | `subtotal`, `total`, `paymentMethod`, `discountPercent` default 0 |
| U14 | `Sale.test.js` | `discountPercent` > 100 | Error de validación |
| U15 | `SaleItem.test.js` | Hook `pre('save')` calcula `lineTotal` | `lineTotal === unitPriceSnapshot * quantity` |
| U16 | `SaleItem.test.js` | `quantity < 1` | Error de validación |
| U17 | `Ticket.test.js` | Crear ticket con items embebidos | Items presentes con `name`, `qty`, `unitPrice`, `lineTotal` |
| U18 | `Ticket.test.js` | `saleId` único | Error si se crea segundo ticket para misma venta |

#### Middleware

| # | Archivo | Escenario | Assert |
|---|---|---|---|
| U19 | `auth.test.js` | `authenticate` — token válido | `req.user` poblado, llama `next()` |
| U20 | `auth.test.js` | `authenticate` — sin header | 401 |
| U21 | `auth.test.js` | `authenticate` — token inválido | 401 |
| U22 | `auth.test.js` | `authenticate` — usuario no existe | 401 |
| U23 | `auth.test.js` | `authorize('admin')` — rol admin | Llama `next()` |
| U24 | `auth.test.js` | `authorize('admin')` — rol seller | 403 |
| U25 | `auth.test.js` | `authorize('admin', 'seller')` — ambos roles pasan | Llama `next()` |

#### Lógica de Negocio (Utility)

| # | Archivo | Escenario | Assert |
|---|---|---|---|
| U26 | `discount.test.js` | `purchasesCount = 0` → 0% | `discountPercent = 0` |
| U27 | `discount.test.js` | `purchasesCount = 2` → 5% | `discountPercent = 5` |
| U28 | `discount.test.js` | `purchasesCount = 5` → 10% | `discountPercent = 10` |
| U29 | `discount.test.js` | `purchasesCount = 10` → 15% | `discountPercent = 15` |
| U30 | `discount.test.js` | Límites exactos (1, 3, 4, 7, 8) | Cada tier en su límite exacto funciona |

### 3.2 Pruebas de Integración

#### Autenticación

| # | Endpoint | Escenario | Código Esperado |
|---|---|---|---|
| I1 | `POST /api/auth/register` | Registro exitoso | 201 + `token` + `user` |
| I2 | `POST /api/auth/register` | Email ya registrado | 400 |
| I3 | `POST /api/auth/register` | Datos inválidos (sin email) | 400 |
| I4 | `POST /api/auth/register` | Auto-asignación role admin | 201 + `role: 'admin'` (bug conocido) |
| I5 | `POST /api/auth/login` | Login exitoso | 200 + `token` |
| I6 | `POST /api/auth/login` | Credenciales incorrectas | 401 |
| I7 | `POST /api/auth/login` | Sin email/password | 400 |
| I8 | `GET /api/auth/me` | Token válido | 200 + `user` |
| I9 | `GET /api/auth/me` | Sin token | 401 |

#### Productos

| # | Endpoint | Escenario | Código Esperado |
|---|---|---|---|
| I10 | `GET /api/products` | Listar productos sin filtro | 200 + `data[]`, `total`, `page`, `limit` |
| I11 | `GET /api/products?q=latte` | Búsqueda por nombre (case-insensitive) | 200, resultados filtrados |
| I12 | `GET /api/products?page=1&limit=5` | Paginación | 200, ≤5 items |
| I13 | `GET /api/products?page=-1` | Parámetros inválidos | 400 |
| I14 | `GET /api/products/:id` | Producto existe | 200 |
| I15 | `GET /api/products/:id` | Producto no existe | 404 |
| I16 | `GET /api/products/:id` | ID mal formado | 500 (o 400 con validación) |
| I17 | `POST /api/products` | Admin crea producto válido | 201 |
| I18 | `POST /api/products` | Seller intenta crear | 403 |
| I19 | `POST /api/products` | Sin token | 401 |
| I20 | `POST /api/products` | Datos inválidos (price ≤ 0) | 422 |
| I21 | `PUT /api/products/:id` | Admin actualiza producto | 200 |
| I22 | `PUT /api/products/:id` | Producto no existe | 404 |
| I23 | `PUT /api/products/:id` | Seller intenta actualizar | 403 |
| I24 | `PUT /api/products/:id` | Datos inválidos (stock negativo) | 422 |
| I25 | `DELETE /api/products/:id` | Admin elimina producto | 200 |
| I26 | `DELETE /api/products/:id` | Producto no existe | 404 |
| I27 | `DELETE /api/products/:id` | Seller intenta eliminar | 403 |

#### Clientes

| # | Endpoint | Escenario | Código Esperado |
|---|---|---|---|
| I28 | `GET /api/customers` | Listar clientes | 200 + `data[]`, paginación |
| I29 | `GET /api/customers?q=Juan` | Búsqueda por nombre/phoneOrEmail | 200, filtrados |
| I30 | `GET /api/customers/:id` | Cliente existe | 200 |
| I31 | `GET /api/customers/:id` | Cliente no existe | 404 |
| I32 | `POST /api/customers` | Crear cliente válido | 201 |
| I33 | `POST /api/customers` | phoneOrEmail duplicado | 400 |
| I34 | `POST /api/customers` | Sin token | 401 |
| I35 | `POST /api/customers` | phoneOrEmail inválido | 422 |
| I36 | `PUT /api/customers/:id` | Actualizar cliente | 200 |
| I37 | `PUT /api/customers/:id` | Cliente no existe | 404 |
| I38 | `DELETE /api/customers/:id` | Eliminar cliente | 200 |

#### Ventas

| # | Endpoint | Escenario | Código Esperado |
|---|---|---|---|
| I39 | `POST /api/sales` | Crear venta sin cliente | 201 + `items[]`, `total`, `ticket` |
| I40 | `POST /api/sales` | Crear venta con cliente (con descuento) | 201, descuento aplicado |
| I41 | `POST /api/sales` | Stock insuficiente | 400 |
| I42 | `POST /api/sales` | Producto no existe | 400 |
| I43 | `POST /api/sales` | Items vacío | 422 |
| I44 | `POST /api/sales` | paymentMethod inválido | 422 |
| I45 | `POST /api/sales` | Venta descuenta stock correctamente | Stock post-venta = stock inicial - cantidad |
| I46 | `POST /api/sales` | Venta incrementa `purchasesCount` del cliente | purchasesCount +1 |
| I47 | `GET /api/sales` | Listar ventas | 200 + `data[]`, paginación |
| I48 | `GET /api/sales/:id` | Venta existe | 200 + items + ticket |
| I49 | `GET /api/sales/:id` | Venta no existe | 404 |
| I50 | `POST /api/sales` | Sin token | 401 |

#### Tickets

| # | Endpoint | Escenario | Código Esperado |
|---|---|---|---|
| I51 | `POST /api/tickets/generate/:saleId` | Generar ticket para venta existente | 201 |
| I52 | `POST /api/tickets/generate/:saleId` | Venta no existe | 404 |
| I53 | `POST /api/tickets/generate/:saleId` | Ticket ya existe (idempotente) | 200 + ticket existente |
| I54 | `GET /api/tickets/sale/:saleId` | Ticket existe | 200 |
| I55 | `GET /api/tickets/sale/:saleId` | Ticket no existe | 404 |
| I56 | `GET /api/tickets` | Listar todos los tickets | 200 |

---

## 4. Plan de Implementación

### Fase 1 — Infraestructura (Día 1)

| # | Tarea | Dependencia |
|---|---|---|
| 1.1 | Instalar dependencias (`jest`, `supertest`, `mongodb-memory-server`, `@faker-js/faker`) | — |
| 1.2 | Crear `jest.config.js` con cobertura mínima | 1.1 |
| 1.3 | Crear `tests/setup.js` (conexión MongoDB en memoria, limpieza por test) | 1.1 |
| 1.4 | Crear `tests/helpers/factories.js` (funciones para crear productos, usuarios, clientes) | 1.3 |
| 1.5 | Crear `tests/helpers/authHelper.js` (registrar usuario + obtener token) | 1.4 |
| 1.6 | Crear `tests/helpers/dbHelper.js` (limpieza de colecciones entre tests) | 1.3 |
| 1.7 | Verificar que `npm test` ejecuta Jest correctamente | 1.2–1.6 |

### Fase 2 — Pruebas Unitarias de Modelos (Día 2)

| # | Tarea | Dependencia |
|---|---|---|
| 2.1 | `tests/unit/models/User.test.js` | 1.3 |
| 2.2 | `tests/unit/models/Product.test.js` | 1.3 |
| 2.3 | `tests/unit/models/Customer.test.js` | 1.3 |
| 2.4 | `tests/unit/models/Sale.test.js` | 1.3 |
| 2.5 | `tests/unit/models/SaleItem.test.js` | 1.3 |
| 2.6 | `tests/unit/models/Ticket.test.js` | 1.3 |

### Fase 3 — Pruebas Unitarias de Middleware y Lógica (Día 3)

| # | Tarea | Dependencia |
|---|---|---|
| 3.1 | `tests/unit/middleware/auth.test.js` | 1.5 |
| 3.2 | Refactorizar lógica de descuentos a `src/utils/discount.js` | — |
| 3.3 | `tests/unit/utils/discount.test.js` | 3.2 |
| 3.4 | Verificar cobertura unitaria ≥ 80% en modelos + middleware | 2.x, 3.x |

### Fase 4 — Pruebas de Integración por Módulo (Días 4–6)

| # | Tarea | Dependencia |
|---|---|---|
| 4.1 | `tests/integration/auth.test.js` (I1–I9) | 1.5 |
| 4.2 | `tests/integration/products.test.js` (I10–I27) | 4.1 |
| 4.3 | `tests/integration/customers.test.js` (I28–I38) | 4.1 |
| 4.4 | `tests/integration/sales.integration.test.js` (I39–I50) | 4.2, 4.3 |
| 4.5 | `tests/integration/tickets.integration.test.js` (I51–I56) | 4.4 |

> Nota: Se crearon y validaron los archivos `tests/integration/sales.integration.test.js` y `tests/integration/tickets.integration.test.js` con `17` pruebas exitosas.

### Fase 5 — Pipeline y Reportes (Día 7)

| # | Tarea | Dependencia |
|---|---|---|
| 5.1 | Agregar script `"test:ci": "jest --ci --coverage"` en `package.json` | 1.2 |
| 5.2 | Configurar GitHub Actions (`.github/workflows/test.yml`) con matriz de Node 18/20 | 5.1 |
| 5.3 | Configurar umbral de cobertura (falla si < 80% líneas) | 1.2 |
| 5.4 | Documentar en README cómo correr tests localmente | — |

> Resultado de la fase 5:
> - `npm run test:ci` pasó exitosamente en el entorno local.
> - `14` test suites ejecutadas.
> - `99` tests pasaron.
> - Cobertura global alcanzada: `84.27%` statements, `76.7%` branches, `93.47%` functions, `84.53%` lines.

---

## 5. Ejecución de la Matriz de Pruebas

### 5.1 Comandos

```bash
# Todas las pruebas
npm test

# Solo unitarias
npx jest tests/unit/

# Solo integración
npx jest tests/integration/

# Con reporte de cobertura
npx jest --coverage

# En modo watch (desarrollo)
npx jest --watch

# CI (con umbrales)
npm run test:ci
```

### 5.2 Criterios de Aceptación

| Métrica | Objetivo |
|---|---|
| Pruebas unitarias — modelos | 18 escenarios (U1–U18) |
| Pruebas unitarias — middleware | 7 escenarios (U19–U25) |
| Pruebas unitarias — descuentos | 5 escenarios (U26–U30) |
| Pruebas de integración — auth | 9 escenarios (I1–I9) |
| Pruebas de integración — productos | 18 escenarios (I10–I27) |
| Pruebas de integración — clientes | 11 escenarios (I28–I38) |
| Pruebas de integración — ventas | 12 escenarios (I39–I50) |
| Pruebas de integración — tickets | 6 escenarios (I51–I56) |
| **Total** | **86 escenarios** |
| Cobertura de líneas | ≥ 80% |
| Cobertura de ramas | ≥ 70% |
| Tiempo de ejecución total | < 30 segundos |

### 5.3 Cobertura por Archivo (Objetivo)

| Archivo | Líneas | Ramas |
|---|---|---|
| `src/controllers/authController.js` | 90% | 85% |
| `src/controllers/productController.js` | 95% | 90% |
| `src/controllers/customerController.js` | 90% | 85% |
| `src/controllers/saleController.js` | 85% | 80% |
| `src/controllers/ticketController.js` | 80% | 70% |
| `src/middleware/auth.js` | 95% | 90% |
| `src/models/*.js` | 90% | 85% |

---

## 6. Deficiencias y Huecos Identificados

### 6.1 Bugs Conocidos (sin test)

| ID | Descripción | Archivo | Línea(s) |
|---|---|---|---|
| B1 | `register` permite `role: 'admin'` sin restricción | `authController.js` | 19 |
| B2 | `getAllProducts` sin límite superior en `q` (posible DoS por regex) | `productController.js` | 69 |
| B3 | `getAllCustomers` usa `$regex` sobre `phoneOrEmail` sin escapar input (peligro ReDoS) | `customerController.js` | 67–70 |
| B4 | `deleteProduct` no verifica si el producto está referenciado en ventas (pérdida de integridad referencial) | `productController.js` | 162–171 |
| B5 | `createSale` decrementa stock con `$inc` pero no hay transacción atómica (race condition en stock) | `saleController.js` | 162–164 |
| B6 | `formatTicketResponse` en `ticketController.js` usa `i.total` y `i.price` para items, pero los campos reales son `lineTotal` y `unitPrice` | `ticketController.js` | 72–74 |

### 6.2 Mejoras Propuestas (Previas a Tests)

1. Extraer lógica de descuentos a `src/utils/discount.js` para testabilidad
2. Agregar validación de ID de MongoDB en rutas de parámetro (`:id`) para evitar 500 genéricos
3. Sanitizar input de regex para prevenir ReDoS
4. Agregar transacciones de Mongoose en `createSale` para atomicidad de stock

---

## 7. Scripts Propuestos en `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --forceExit",
    "test:unit": "jest tests/unit/",
    "test:integration": "jest tests/integration/ --forceExit"
  }
}
```
