# Seeder de datos – Qualifica o seu Professor

Este documento explica en detalle el script de seeding que genera datos de ejemplo para el proyecto. Cubre requisitos, configuración, ejecución, variables, volúmenes de datos, relaciones, resolución de problemas y buenas prácticas.

## 1. ¿Qué hace el seeder?

Genera datos sintéticos y coherentes para las entidades principales del sistema:
- Users (incluye un superadmin y muchos usuarios regulares)
- Universities
- Professors (relacionados a universidades)
- Students (relacionados a universidades)
- Comments (relacionados a usuarios y profesores)

Además:
- Respeta las restricciones de unicidad (por ejemplo, email de usuario, nombre de universidad)
- Aplica relaciones válidas entre entidades
- Permite ajustar cantidades con variables de entorno
- Opción de limpieza previa de colecciones (reset)
- Modo determinista opcional (semilla de Faker)

## 2. Requisitos previos

- Node.js 18+ y npm
- MongoDB en ejecución (local con Docker recomendado)
- Variables de entorno para conectar a la base de datos

Para Docker local, en el repo existe `docker-compose.yml` y `.env.db` (con root user/password):
- Usuario: `qualifica`
- Password: `qualifica`
- Base: `qualifica-professor`

Puedes usar la siguiente URI local:
```
MONGODB_URI=mongodb://qualifica:qualifica@localhost:27017/qualifica-professor?authSource=admin
```

## 3. Archivos relevantes

- `src/scripts/seed.ts`: script de seeding (TypeScript)
- `.env.example`: variables de entorno de ejemplo, incluidas las de seeding
- `package.json` → scripts:
  - `npm run seed`: compila el proyecto y ejecuta `dist/scripts/seed.js`

## 4. Variables de entorno

Obligatorias
- `MONGODB_URI`: cadena de conexión a MongoDB.

Opcionales (con valores por defecto):
- `SEED_RESET` (default: `true`): si es `true`, limpia colecciones antes de poblar.
- `SEED_USERS` (default: `150`): cantidad de usuarios regulares a crear (además del superadmin).
- `SEED_UNIVERSITIES` (default: `120`): cantidad de universidades.
- `SEED_PROFESSORS` (default: `200`): cantidad de profesores.
- `SEED_STUDENTS` (default: `150`): cantidad de estudiantes.
- `SEED_COMMENTS` (default: `500`): cantidad de comentarios.
- `SEED_ADMIN_PASSWORD` (default: `admin123`): password del superadmin `admin@example.com`.
- `FAKER_SEED` (sin default): si se define con un número, genera datos deterministas/reproducibles.

Sugerencia: copia `.env.example` a `.env` y ajusta lo necesario.

## 5. Ejecución (Windows, cmd.exe)

- Arranca MongoDB con Docker (si usas Docker):
```cmd
docker compose up -d
```

- Configura variables de entorno en tu consola:
```cmd
set MONGODB_URI=mongodb://qualifica:qualifica@localhost:27017/qualifica-professor?authSource=admin
set SEED_RESET=true
set SEED_USERS=150
set SEED_UNIVERSITIES=120
set SEED_PROFESSORS=200
set SEED_STUDENTS=150
set SEED_COMMENTS=500
set SEED_ADMIN_PASSWORD=admin123
set FAKER_SEED=42
```

- Ejecuta el seeder:
```cmd
npm run seed
```

Al finalizar, verás un resumen con conteos por colección.

## 6. Datos generados y relaciones

- Users
  - 1 superadmin fijo: `admin@example.com` con `role=superadmin` y password configurable por `SEED_ADMIN_PASSWORD`.
  - `SEED_USERS` usuarios con `role=user`, contraseña hash (bcrypt) con valor base de prueba.
- Universities
  - `SEED_UNIVERSITIES` registros con `name` único, `country` y `city`.
- Professors
  - `SEED_PROFESSORS` registros, cada uno vinculado a una `University`.
- Students
  - `SEED_STUDENTS` registros, cada uno vinculado a una `University`.
  - Nota: el modelo actual de Student almacena `password` en texto plano; es solo para data de prueba.
- Comments
  - `SEED_COMMENTS` registros, cada uno vinculado a un `User` (no admin) y a un `Professor`.

### Integridad
- El seeder garantiza que: 
  - Los `professors.university` apunten a universidades existentes.
  - Los `comments.user` apunten a usuarios con `role=user`.
  - Los `comments.professor` apunten a profesores existentes.

## 7. Modos de uso frecuentes

- Semilla limpia (reset) con cantidades por defecto:
```cmd
set MONGODB_URI=...
npm run seed
```

- Semilla incremental (sin limpiar):
```cmd
set MONGODB_URI=...
set SEED_RESET=false
npm run seed
```

- Dataset pequeño y determinista (útil para QA):
```cmd
set MONGODB_URI=...
set SEED_RESET=true
set SEED_USERS=10
set SEED_UNIVERSITIES=5
set SEED_PROFESSORS=12
set SEED_STUDENTS=8
set SEED_COMMENTS=30
set FAKER_SEED=123
npm run seed
```

## 8. Comprobaciones rápidas post-seed

- Via API (servidor levantado en otro terminal):
  - GET `http://localhost:3000/api/universities`
  - GET `http://localhost:3000/api/professors?limit=5`
  - GET `http://localhost:3000/api/comments?limit=5`
- Via Mongo Shell (ejemplos genéricos):
```js
use qualifica-professor;
db.users.countDocuments();
db.universities.countDocuments();
db.professors.countDocuments();
db.students.countDocuments();
db.comments.countDocuments();
```

## 9. Resolución de problemas

- Error: `MONGODB_URI no está definido`
  - Debes exportar/definir `MONGODB_URI` antes de ejecutar el seeder.

- `E11000 duplicate key error` (duplicados)
  - Suele ocurrir si `SEED_RESET=false` y ya existen registros (p.ej., `admin@example.com` o nombres de universidades). 
  - Soluciones: poner `SEED_RESET=true` o cambiar emails/nombres generados/ajustar cantidades.

- Fallos de conexión a Mongo
  - Verifica que el contenedor está arriba: `docker ps`.
  - Verifica puertos y credenciales.
  - Asegúrate de usar `authSource=admin` en la URI si te conectas con usuario root.

- Memoria/tiempos altos con datasets grandes
  - Reduce cantidades (`SEED_*`) o sube recursos de Docker.

## 10. Buenas prácticas y notas de seguridad

- Este seeder es para desarrollo y pruebas. No usar en producción.
- La cuenta `admin@example.com` existe para conveniencia en desarrollo; cámbiale la contraseña con `SEED_ADMIN_PASSWORD` o elimínala en entornos compartidos.
- Students: el campo `password` se guarda en claro según el modelo actual. Considera migrarlo a hash si planeas usarlo más allá de datos falsos.
- Evita ejecutar el seeder contra una base con datos reales.
- Usa `FAKER_SEED` para obtener datasets reproducibles en QA y debugging.

## 11. Extensión del seeder

Si agregas nuevos modelos, puedes extender el seeder siguiendo este orden:
1) Crear entidades raíz sin dependencias (p.ej., `Universities`).
2) Crear entidades dependientes (p.ej., `Professors` con referencia a `Universities`).
3) Crear entidades transaccionales/comentarios/relacionales (p.ej., `Comments`).
4) Ajustar `counts` y variables `SEED_*`.
5) Añadir comprobaciones de integridad y populate si necesitas verificaciones cruzadas.

## 12. Implementación interna (resumen)

- Conexión Mongo: `mongoose.connect(MONGODB_URI, { dbName: 'qualifica-professor' })`.
- Limpieza opcional: `deleteMany({})` por colección si `SEED_RESET !== 'false'`.
- Inserciones masivas eficientes: `insertMany(data, { ordered: false })`.
- Passwords:
  - Users: hash con `bcrypt`.
  - Students: texto plano (modelo actual).
- Datos deterministas: `faker.seed(Number(FAKER_SEED))` si está definida.
- Resumen final con `countDocuments()` y `console.table(...)`.

---

Para dudas o mejoras, revisa `src/scripts/seed.ts` y las variables en `.env.example`. Si quieres, puedes enlazar este documento desde el README para que sea más visible para el equipo.

