Proyecto final cafecito

Modelo de datos

Este documento describe las entidades que el equipo senior ya definió para el MVP.

La implementación puede ser:

SQL (tablas y relaciones)
NoSQL (colecciones y documentos)
El objetivo es que entiendas qué datos necesitas guardar y cómo se relacionan.

Entidad: Product
Campos mínimos:

Campo	Tipo	Reglas
id	string o number	generado por backend
name	string	requerido
price	number	requerido, mayor a 0
stock	number	requerido, 0 o más
createdAt	date	opcional
updatedAt	date	opcional
Notas:

En SQL: tabla Products.
En NoSQL: colección products.
Entidad: Customer
Campos mínimos:

Campo	Tipo	Reglas
id	string o number	generado por backend
name	string	requerido
phoneOrEmail	string	requerido
purchasesCount	number	default 0
createdAt	date	opcional
updatedAt	date	opcional
Notas:

purchasesCount se incrementa al registrar una venta con customerId.
phoneOrEmail es un solo campo para simplificar el MVP.
Entidad: Sale
Una venta debe guardar:

quién compró (opcional)
qué compró (lista)
totales
método de pago
fecha
Campos:

Campo	Tipo	Reglas
id	string o number	generado por backend
customerId	string o number	opcional
paymentMethod	string	default "cash"
subtotal	number	calculado por backend
discountPercent	number	calculado por backend
discountAmount	number	calculado por backend
total	number	calculado por backend
createdAt	date	requerido
updatedAt	date	opcional
Entidad: SaleItem (detalle de venta)
Cada venta tiene 1 o más items.

Campos mínimos:

Campo	Tipo	Reglas
saleId	string o number	requerido
productId	string o number	requerido
productNameSnapshot	string	recomendado
unitPriceSnapshot	number	recomendado
quantity	number	requerido, >= 1
lineTotal	number	calculado
Notas:

En SQL: tabla SaleItems con relación a Sales y Products.
En NoSQL: Sale puede incluir un arreglo items con snapshots.
Reglas de consistencia recomendadas
No se puede registrar una venta sin items.
El backend valida que los productos existan.
El backend puede opcionalmente validar stock (si decides incluir esa regla).
El ticket se genera a partir de Sale + SaleItems.
Ticket (estructura sugerida)
El ticket es una representación para mostrar al usuario. Puede ser:

texto generado
o estructura con campos (más fácil de renderizar)
Campos sugeridos:

storeName: "Cafecito Feliz"
date
items: nombre, cantidad, precio, total
subtotal, descuento, total
paymentMethod
