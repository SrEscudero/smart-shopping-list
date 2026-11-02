# Mi despensa · Compras mensuales

Aplicación web instalable con listas, presupuesto, productos recurrentes e historial.
## Revisión y uso local

```bash
npm install
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

La compilación de producción usa Webpack para generar el service worker de la PWA.
La información se guarda en este navegador (clave `shopping-v3`); usa las copias de
seguridad antes de borrar datos del navegador o cambiar de dispositivo. En Inicio,
abre **Personaliza tu experiencia** para exportar o restaurar una copia.

El respaldo v5 incluye la lista principal, listas adicionales, lista activa y
preferencias. Se siguen aceptando respaldos v4 válidos. El historial nuevo registra
solo compras completadas y respeta precios finales de cero; no se reescribe el
historial anterior. Los productos recurrentes pasan a la siguiente lista al cerrar
el mes. Los datos ya perdidos por la versión anterior no pueden recuperarse sin una copia.

### IA opcional

Para el reconocimiento de imágenes, configura en `.env.local` una clave válida
`GOOGLE_GENERATIVE_AI_API_KEY` y el identificador de un modelo de visión disponible
en tu cuenta como `GOOGLE_GENERATIVE_AI_MODEL`. Reinicia el servidor tras cambiarlo.
No se incluyen credenciales en el repositorio. Sin esa configuración, la categorización
usa el diccionario local y el escáner informa que no está disponible: no inventa productos.
Las funciones de IA necesitan conexión; cámara, voz e instalación PWA deben probarse
con permisos reales en un teléfono y con HTTPS.

### Validación de esta revisión

Pruebas automatizadas de conservación de listas/presupuestos, recarga, eliminación,
respaldo/restauración, rechazo de archivos inválidos, gasto real, recurrentes,
deshacer/rehacer e importaciones. El navegador de escritorio con vista móvil también
comprueba agregar un producto, cambiar de lista y recargar; no sustituye una prueba
física en el celular.

## Planificación, tickets y compra familiar

- **Plan → Prepara el próximo mes:** elige la lista actual o un mes archivado,
  calcula lo que falta tras descontar la despensa y revisa cantidades antes de crear
  una lista nueva. La anterior y sus productos se conservan.
- **Lo que hay en casa:** guarda existencias en unidades, kg o litros. Se comparan
  nombres iguales (sin diferencias de mayúsculas o tildes), nunca unidades incompatibles.
  Cambiar una existencia es manual; la aplicación no adivina cuánto has consumido.
- **Comparador:** introduce precio y contenido de dos presentaciones. Gramos y
  mililitros se convierten a kg/l. La compra admite cantidades fraccionadas y paquetes.
- **Presupuesto:** previsto al terminar = precios pagados + estimaciones pendientes.
  Se señalan precios pendientes en cero y productos opcionales que puedes aplazar.
- **Tickets:** puedes escribirlos o usar la cámara con IA configurada. Revisa los
  precios unitarios y selecciona las coincidencias con la lista. Confirmar registra
  el gasto, los precios y la despensa de forma atómica. Las compras parciales conservan
  el resto pendiente. El mismo identificador de ticket no se procesa dos veces;
  una foto distinta del mismo recibo necesita revisión humana para evitar duplicados.
- **Precios:** se guardan al marcar una compra o confirmar un ticket. Las comparaciones
  usan nombre, moneda y unidad equivalentes. No convierten monedas ni comparan marcas
  diferentes automáticamente. Los datos antiguos no se reinterpretan como precios nuevos.
- **Modo supermercado:** pendientes primero, agrupados por sección; muestra el gasto
  previsto durante la compra y mantiene controles grandes.

El respaldo **v6** incorpora despensa, precios y tickets. Los respaldos v4 y v5 siguen
siendo aceptados. Las invitaciones familiares no se incluyen en el respaldo.

### Servidor para la familia

En **Plan → Compra en familia**, comparte la lista activa o pega una invitación para
unirte en una lista nueva. Ambos dispositivos necesitan la misma dirección del
servidor. Una dirección `127.0.0.1` solo sirve en el equipo donde corre la aplicación;
para usar celulares, publica el servidor Node con HTTPS y almacenamiento persistente.
No se ha desplegado ningún servicio externo como parte de esta implementación.

La sincronización consulta cambios cada 3 segundos mientras la aplicación está abierta
con la lista conectada. Al cambiar de lista se pausa. Desconectada de internet, conserva
los cambios locales y reintenta al volver. Combina cambios independientes; si dos
personas cambian el mismo dato, pide conservar una copia local antes de recibir la
versión familiar. **Desconectar** solo separa este dispositivo; **Cerrar acceso para
todos** revoca la invitación y elimina la copia del servidor, conservando las locales.

Las listas familiares se almacenan en `.shopping-data/`, excluido de Git. Configura
`SHOPPING_DATA_DIR` con un directorio persistente y privado en producción. El servidor
usa escrituras atómicas y control de revisión; está pensado para un despliegue Node
con almacenamiento de archivos, no para réplicas con discos efímeros. Límite: 500
productos por lista, 256 KB por solicitud y 1000 listas en el servidor. El enlace es
la credencial de lectura y edición: no hay cuentas ni identificación de cada familiar.
El servidor guarda los datos de la lista compartida, no la despensa ni las fotos.
La lectura de imágenes con IA sí envía la imagen al proveedor configurado.

Ante una interrupción abrupta durante una escritura, puede quedar un archivo `.lock`:
retíralo solamente con el servidor detenido y tras comprobar que no hay otra escritura.
Conserva copias del directorio de datos del servidor para recuperar listas compartidas.

### Prueba de navegador reproducible

`tests/browser-smoke.cjs` prueba planificación, despensa, tickets, comparador, dos
navegadores independientes, persistencia, recarga offline y posterior sincronización.
Requiere Playwright y Chromium disponibles. Con la aplicación compilada y arrancada:

```bash
SHOPPING_TEST_URL=http://127.0.0.1:3000 node tests/browser-smoke.cjs
```

Puedes indicar `PLAYWRIGHT_MODULE` y `CHROMIUM_PATH` si usas un runtime externo.
La prueba usa contextos nuevos y datos ficticios; no usa el perfil personal del navegador.
La cámara física, el reconocimiento de tickets reales y la instalación en un teléfono
siguen requiriendo validación en el dispositivo.
