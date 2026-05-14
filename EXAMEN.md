# EXAMEN.md - Reto F1: HTTP 409 correcto + soft delete coherente en albaranes

## Que detecte

En `src/controllers/deliverynote.controller.js` habia dos bugs semanticos y uno de inconsistencia de patron:

**Bug 1 (linea 242):** Se lanzaba `AppError('Este albaran ya esta firmado', 400)` cuando el albaran ya estaba firmado. Un 400 Bad Request indica que la peticion tiene un formato incorrecto o datos invalidos. Pero aqui la peticion era perfectamente valida; el problema era el estado actual del recurso. El codigo correcto es 409 Conflict.

**Bug 2 (linea 317):** Mismo problema: `AppError('No se puede eliminar un albaran firmado', 400)`. Borrar un recurso firmado no es un error de formato; es un conflicto de estado. El codigo correcto es 409 Conflict.

**Bug 3 (linea 320):** Se usaba `findByIdAndDelete(id)` (borrado fisico) para eliminar el albaran. Sin embargo, el modelo `DeliveryNote` tiene el campo `deleted: Boolean` y todos los listados filtran con `{ deleted: false }`. El borrado fisico rompe el patron soft delete ya establecido en todo el sistema.

---

## Como lo arregle

1. Cambie `AppError('Este albaran ya esta firmado', 400)` por `AppError('Este albaran ya esta firmado', 409)` en la linea 242.
2. Cambie `AppError('No se puede eliminar un albaran firmado', 400)` por `AppError('No se puede eliminar un albaran firmado', 409)` en la linea 317.
3. Reemplace `await DeliveryNote.findByIdAndDelete(id)` por `await DeliveryNote.findByIdAndUpdate(id, { deleted: true })` en la linea 320. La respuesta sigue siendo `200 OK` con el mismo mensaje.
4. Escribi 3 tests en `src/tests/deliverynote.test.js` que verifican los tres escenarios.

---

## Por que mi solucion es correcta

El estandar HTTP (RFC 7231) define claramente:
- **400 Bad Request**: la peticion no puede procesarse porque el servidor no entiende la sintaxis o los datos son invalidos.
- **409 Conflict**: la peticion no puede completarse por un conflicto con el estado actual del recurso.

Cuando un cliente intenta firmar un albaran ya firmado, la peticion esta bien formada; el conflicto es de estado. Lo mismo ocurre al borrar un albaran firmado. Usar 400 en ambos casos miente al cliente sobre la naturaleza del error y dificulta el manejo de errores en el frontend (que podria mostrar "error de formulario" en vez de "recurso en conflicto").

El soft delete es la unica forma coherente de eliminar registros en un sistema donde el modelo ya tiene `deleted: Boolean` y todos los filtros usan `{ deleted: false }`. Usar `findByIdAndDelete` en ese contexto crea una inconsistencia silenciosa: el documento desaparece pero los filtros asumen que si no esta en BD con `deleted: false` simplemente no existe, cuando en realidad fue borrado fisicamente sin dejar rastro.

---

## Por que el soft delete es preferible al hard delete en una API multi-tenant

En un sistema multi-tenant como BildyApp, varios usuarios de la misma compania comparten datos. El soft delete es preferible por cuatro razones:

1. **Auditoria**: Los albaranes son documentos fiscales/legales. Si un usuario los borra fisicamente, se pierde el rastro de que existieron. Con soft delete el historial queda intacto y puede ser consultado por auditores o en disputas.

2. **Integridad referencial**: Los albaranes firmados generan PDFs cuyos nombres en Cloudinary incluyen el `_id` del albaran (`albaran-{id}.pdf`). Si el documento se borra fisicamente, el PDF queda huerfano y no hay forma de saber a que albaran pertenecia. Con soft delete, el documento sigue existiendo y la referencia se mantiene.

3. **Recuperabilidad**: En un entorno multi-tenant, un usuario puede borrar algo por error. El soft delete permite restaurar el documento. Un borrado fisico es irreversible.

4. **Consistencia del patron**: Si todo el sistema usa `deleted: Boolean` y `{ deleted: false }` en los filtros, un `findByIdAndDelete` introduce una via de escape que rompe el patron. Otros modulos del sistema (como generacion de PDFs o reportes) podrian asumir que un albaran no encontrado con `deleted: false` simplemente no existe, cuando en realidad fue borrado fisicamente de forma inconsistente.

---

## Respuestas a las preguntas socraticas

### 1. Diferencia logica entre 400 y 409 en los dos casos del controlador

Un **400 Bad Request** indica que el servidor no puede procesar la peticion porque los datos estan mal formados, faltan campos obligatorios o los tipos son incorrectos. Es un error de formato, no de logica de negocio. Un **409 Conflict** indica que la peticion es correcta en sintaxis y datos, pero no se puede ejecutar porque entra en conflicto con el estado actual del recurso en el servidor.

En `client.controller.js:21`, se usa 409 cuando el CIF ya existe: la peticion de crear un cliente es valida, pero el recurso ya esta ocupado. Exactamente igual ocurre en `deliverynote.controller.js:242`: la peticion de firmar el albaran esta perfectamente formada (tiene el id correcto, el token valido, etc.), pero el recurso ya esta en un estado que impide la operacion (ya esta firmado). La diferencia con un 400 es que un 400 le dice al cliente "tu peticion esta mal escrita", mientras que un 409 le dice "tu peticion es correcta pero el servidor no puede ejecutarla ahora mismo por el estado del recurso". El primero es un error del cliente al formular la peticion; el segundo es un conflicto de estado que el cliente puede manejar de forma diferente (por ejemplo, informar al usuario de que el albaran ya esta firmado en vez de mostrar un error de validacion generico).

### 2. Borrado fisico vs integridad referencial en multi-tenant

Si un albaran se borra fisicamente con `findByIdAndDelete` y otro usuario de la misma compania intenta acceder a su `_id` por una ruta diferente (por ejemplo, para descargar el PDF firmado), el servidor devolvera 404 aunque el PDF exista en Cloudinary. En un sistema multi-tenant, esto es especialmente grave porque el PDF puede estar siendo referenciado en correos enviados a clientes, en sistemas contables externos o en logs de auditoria. Con soft delete, el documento sigue existiendo en BD y puede ser consultado por procesos internos con permisos especiales. Ademas, en BildyApp los PDFs se generan con el nombre `albaran-{_id}.pdf` en Cloudinary; si el documento de BD desaparece, esa URL queda huerfana y no hay forma de asociarla a un albaran concreto. El soft delete protege la integridad referencial porque el `_id` sigue apuntando a un documento real, aunque marcado como eliminado.

### 3. Que devuelve populate si el cliente fue eliminado fisicamente

Si el cliente fue eliminado con hard delete, `populate('client')` devolvera `null` para ese campo porque Mongoose busca el `ObjectId` referenciado en la coleccion `clients` y no lo encuentra. En el servicio de generacion de PDF (`pdf.service.js`), si se accede a `deliveryNote.client.name` sin comprobar null, se lanzara un `TypeError: Cannot read properties of null` que llegaria al middleware de errores como un 500 inesperado. Con soft delete, el cliente sigue existiendo en BD (`deleted: true`) y `populate` devuelve el documento completo. Esto protege la integridad del PDF porque puede incluir los datos del cliente tal y como estaban cuando se creo el albaran, aunque el cliente haya sido dado de baja posteriormente. En un entorno multi-tenant, esto es especialmente importante porque un usuario podria archivar un cliente sin saber que otros usuarios o procesos tienen albaranes que lo referencian.

### 4. Los tests actuales detectarian el cambio de findByIdAndDelete a findByIdAndUpdate?

No. Los tests de `test/auth.test.js` solo prueban registro y login de usuario; no tocan los endpoints de albaranes en absoluto. Incluso si existieran tests que llamasen al endpoint `DELETE /api/deliverynote/:id` y verificasen solo el codigo de respuesta (200 OK), tampoco detectarian la diferencia, porque ambas implementaciones devuelven 200 con el mismo mensaje. El unico tipo de test que detectaria la diferencia con certeza es un test de integracion que: (1) cree un albaran via API o directamente en BD, (2) lo borre via API, y (3) consulte directamente el modelo `DeliveryNote.findById(id)` para verificar que el documento todavia existe con `deleted: true`. Sin esa consulta directa a la BD, el test no puede distinguir entre un borrado fisico y un soft delete, porque la respuesta HTTP es identica en ambos casos.

### 5. El 409 de user.controller.js depende del error 11000 de Mongoose o se maneja antes?

En `user.controller.js:38-41`, el 409 se lanza manualmente antes del insert: se hace `User.findOne({ email })` y si el usuario ya existe se lanza `AppError('Ya existe un usuario con ese email', 409)` sin llegar al `User.create()`. No depende del error 11000 de MongoDB. Esto es mas predecible porque el codigo de error siempre sera 409 sin necesidad de capturar y transformar errores de Mongoose en el middleware global. Sin embargo, esta estrategia tiene una **condicion de carrera**: en un sistema con alta concurrencia, dos peticiones de registro con el mismo email podrian pasar el `findOne` al mismo tiempo (ambas no encontrarian el usuario) y ambas intentarian el `create`, fallando la segunda con un error 11000 de indice unico. La estrategia mas robusta combina ambas: validar antes del insert para el caso comun Y capturar el error 11000 en el middleware de errores global como respaldo para la condicion de carrera. Dependiendo solo del `findOne` previo, el error 11000 llegaria sin transformar al cliente como un 500 generico en esa situacion de concurrencia.

---

## Proceso

Tiempo total invertido: ~2 horas

Herramientas usadas: VS Code, Claude Code (claude-sonnet-4-6)

Prompts a IA:
- "Bien: La arquitectura MVC esta bien separada... A mejorar: Swagger muy escueta... Reto: F1 - HTTP 409 correcto + soft delete coherente en albaranes [...] hazlo pon comentarios faciles en espanol y luego quiero que uses otra rama main2"
