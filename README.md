# Food Store — TPI Programación IV

Alumno: Gabriel Maximiliano Montaña. Aplicación de pedidos con FastAPI, SQLModel, React y TypeScript.

## Requisitos

- Python 3.11, 3.12 o 3.13 (no Python 3.14 para las versiones fijadas de SQLModel).
- Node.js 20.19 o superior y pnpm 9 o superior.
- SQLite para la demostración local; PostgreSQL 15 o superior si se cambia `DATABASE_URL`.

## Backend

Desde `backend/`:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m app.db.seed
uvicorn app.main:app --reload
```

En Linux/macOS: `python3.13 -m venv .venv`, `source .venv/bin/activate` y `cp .env.example .env`.

El servidor escucha en http://localhost:8000. Documentación: http://localhost:8000/docs y http://localhost:8000/redoc. El seed se puede ejecutar nuevamente sin duplicar datos.

### Configuración del backend

`backend/.env.example` incluye todas las variables. `DATABASE_URL=sqlite:///./food_store.db` crea una base local; para PostgreSQL se puede usar `postgresql+psycopg2://usuario:clave@localhost:5432/food_store`. Cambiar `SECRET_KEY` por una cadena aleatoria de al menos 32 caracteres antes de publicar una instancia. `FRONTEND_ORIGIN` debe ser el origen exacto del navegador (por defecto `http://localhost:5173`). `COOKIE_SECURE=true` cuando se usa HTTPS; en desarrollo HTTP queda `false`. `ACCESS_TOKEN_EXPIRE_MINUTES=30` controla la duración del login; `ALGORITHM=HS256` firma el JWT. `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` son las credenciales del administrador creado por el seed.

**Administrador del seed local:** usuario `admin`, contraseña `Admin12345` y correo `admin@foodstore.local`. Cambiar la contraseña en `.env.example` **antes del primer seed** si se comparte la base. El seed incluye Hamburguesas, Pizzas, Bebidas y tres productos con stock inicial 20.

## Frontend

En otra terminal, desde `frontend/`:

```powershell
Copy-Item .env.example .env
pnpm install
pnpm build
pnpm dev
```

En Linux/macOS se copia con `cp .env.example .env`. Abrir http://localhost:5173. La variable `VITE_API_URL` vale `http://localhost:8000/api/v1`; cambiarla si el backend usa otra dirección. Iniciar backend y frontend al mismo tiempo; abrir siempre el frontend en `localhost` para que la cookie de desarrollo coincida con el origen.

## Arquitectura y explicación del código

En `backend/app/main.py`, `lifespan` crea tablas y los routers se montan bajo `/api/v1`; CORS acepta el origen del front con credenciales. `core/config.py` lee `.env`, `database.py` crea el engine y las sesiones, `security.py` firma el JWT y calcula/verifica hashes bcrypt, `deps.py` lee la cookie y comprueba sesión, estado y rol. `base_repository.py` concentra operaciones básicas. `unit_of_work.py` abre la sesión al entrar y confirma o revierte **al salir**, cerrándola aun ante errores.

Cada módulo de `backend/app/modules/` separa `models.py` (tablas y relaciones), `schemas.py` (validación y respuesta), `repository.py` (consultas), `unit_of_work.py` (repositorios que comparten sesión), `service.py` (reglas) y `router.py` (HTTP). `auth/` reutiliza el modelo y repositorio de usuarios. En pedidos, `service.py` verifica repetidos, disponibilidad y stock, bloquea la fila en PostgreSQL, copia nombre y precio a cada línea, descuenta stock y calcula el total en una única transacción. El mapa `TRANSICIONES` permite únicamente los cuatro estados indicados; cancelar devuelve el stock en esa misma transacción. El detalle y el total no tienen endpoint de edición.

En `frontend/src/shared/api/api.ts`, Axios envía la cookie y transforma errores. `features/auth/store.ts` recupera `/auth/me`, limpia la sesión si caduca y guarda en Zustand únicamente datos del usuario, nunca el token. `features/cart/store.ts` persiste productos y cantidades en el navegador. `features/catalog/` consulta el catálogo paginado con TanStack Query; `features/orders/` contiene checkout con TanStack Form, pedidos, cancelación y resumen; `features/admin/` reúne los formularios de ABM y las tablas de TanStack Table. Las mutaciones invalidan las consultas correspondientes. `routes/AppRouter.tsx` define páginas públicas y rutas protegidas por sesión y rol; el backend vuelve a comprobar cada permiso.

## Repositorio y video

**Repositorio público:** https://github.com/gabito00/FOODSTORE

**Video:** [VIDEO](https://leautneduar-my.sharepoint.com/:v:/g/personal/gabriel_montana_tupad_utn_edu_ar/IQA9MbZ7cYngRqZBLbe87W5_AT0_20LbIMewkqGRaN7w6ck?e=QDZNE9)
