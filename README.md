# ⚽ Prode Mundial 2026

Aplicación de pronósticos para el Mundial de Fútbol 2026. Sistema de dos capas de predicción, tabla de posiciones en tiempo real y panel de administración completo.

---

## Stack Técnico

- **Framework:** Next.js 14 (App Router)
- **Base de datos:** Supabase (PostgreSQL + Auth + Realtime)
- **Hosting:** Vercel (free tier)
- **API de fútbol:** API-Football v3 (RapidAPI)
- **Estilo:** Tailwind CSS — dark mode, paleta dorado/negro

---

## Deploy paso a paso (desde cero)

### Paso 1 — Clonar e instalar dependencias

```bash
git clone <tu-repo> prode-mundial-2026
cd prode-mundial-2026
npm install
```

---

### Paso 2 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → **Start your project** → crear cuenta gratuita
2. Click en **New Project**
   - Nombre: `prode-mundial-2026`
   - Contraseña de base de datos: anotala, la necesitás después
   - Región: elegí la más cercana (ej. `South America (São Paulo)`)
3. Esperar ~2 minutos mientras se provisiona el proyecto

#### 2a — Correr el schema SQL

1. En el dashboard de Supabase, ir a **SQL Editor** (ícono de terminal en el sidebar)
2. Click en **+ New query**
3. Pegar todo el contenido del archivo `supabase/schema.sql` de este proyecto
4. Click en **RUN** (o Ctrl+Enter)
5. Deberías ver `Success. No rows returned` — significa que todo se creó correctamente

#### 2b — Deshabilitar confirmación de email (IMPORTANTE)

1. En Supabase, ir a **Authentication** → **Providers** → **Email**
2. Desactivar el switch **"Confirm email"**
3. Click **Save**

Esto permite que los usuarios se registren sin verificar un email (como pide el proyecto).

#### 2c — Obtener las claves de Supabase

1. Ir a **Project Settings** → **API**
2. Copiar:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (hacer click en "Reveal") → es tu `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ La `service_role` key tiene acceso total. **Nunca la expongas en el frontend.**

---

### Paso 3 — Obtener API key de API-Football

1. Ir a [rapidapi.com](https://rapidapi.com) → crear cuenta gratuita
2. Buscar **"API-Football"** en el marketplace
3. Click en **Subscribe to Test** → elegir el plan **BASIC** (gratis, 100 req/día)
4. En la sección **Endpoints**, copiar el valor de `X-RapidAPI-Key`

> 💡 Con el plan gratuito tenés 100 requests/día. El cron corre cada hora = 24 requests/día, bien dentro del límite.

> ⚠️ El ID de la competición del Mundial 2026 en API-Football todavía puede no estar disponible. 
> Una vez que esté, buscalo con el endpoint `/leagues` filtrando por `name=FIFA World Cup&season=2026`.
> Por ahora podés cargar los partidos manualmente desde el panel admin.

---

### Paso 4 — Configurar variables de entorno localmente

1. Copiar el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Editar `.env.local` con tus valores reales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   RAPIDAPI_KEY=tu_rapidapi_key
   RAPIDAPI_HOST=api-football-v1.p.rapidapi.com
   WORLD_CUP_LEAGUE_ID=1
   WORLD_CUP_SEASON=2026
   CRON_SECRET=genera-un-string-largo-y-aleatorio-aqui
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Para generar el `CRON_SECRET` podés usar:
   ```bash
   openssl rand -base64 32
   ```

3. Correr en modo desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir [http://localhost:3000](http://localhost:3000)

---

### Paso 5 — Deploy en Vercel

#### 5a — Crear proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) → crear cuenta con GitHub
2. Click **Add New Project** → importar tu repositorio de GitHub

   > Si aún no lo subiste a GitHub:
   > ```bash
   > git init
   > git add .
   > git commit -m "Initial commit"
   > gh repo create prode-mundial-2026 --public --push
   > ```

3. Vercel detecta Next.js automáticamente. Click **Deploy** (sin cambiar nada)

#### 5b — Agregar variables de entorno en Vercel

1. En Vercel, ir al proyecto → **Settings** → **Environment Variables**
2. Agregar cada variable de `.env.local` (excepto `NEXT_PUBLIC_APP_URL`, que cambiará)
3. Para `NEXT_PUBLIC_APP_URL` usar la URL de producción: `https://tu-proyecto.vercel.app`
4. Click **Save** y hacer **Redeploy**

#### 5c — Configurar Vercel Cron

El archivo `vercel.json` ya está configurado para correr el cron cada hora:

```json
{
  "crons": [{
    "path": "/api/cron/update-results",
    "schedule": "0 * * * *"
  }]
}
```

El endpoint está protegido con `CRON_SECRET`. Vercel envía el header `Authorization: Bearer {CRON_SECRET}` automáticamente.

> **Importante:** Los cron jobs en Vercel solo funcionan en el **Production deployment** (no en Preview).
> Asegurate de que `CRON_SECRET` esté seteado en las variables de entorno de producción.

---

### Paso 6 — Primer uso

1. Ir a tu URL de producción
2. Click en **Registrarse**
3. **El primer usuario que se registra queda como ADMIN automáticamente**
4. Podés acceder al panel admin desde el navbar (solo visible para admins)

#### 6a — Cargar partidos manualmente (mientras la API no tiene datos del 2026)

1. Panel Admin → **Partidos** → **Agregar partido**
2. Completar: equipos, fecha, fase, grupo (si aplica)
3. Una vez que tengas la API key y el league ID correcto, el cron los cargará automáticamente

#### 6b — Configurar fechas de cierre

1. Panel Admin → **Resumen**
2. En la sección **"Cierre Pronóstico Inicial"**, ingresar la fecha/hora del primer partido del Mundial
3. Guardar — después de esa fecha, los usuarios no podrán modificar su pronóstico inicial

---

## Estructura del proyecto

```
prode-mundial-2026/
├── app/
│   ├── (auth)/          — Login y registro
│   ├── (main)/          — Páginas principales (predictions, standings, stats, profile)
│   ├── admin/           — Panel de administración
│   └── api/             — Rutas API (auth, cron, predictions, admin)
├── components/
│   ├── admin/           — Componentes del panel admin
│   ├── layout/          — Navbar, Footer
│   ├── predictions/     — Formularios de pronósticos
│   ├── providers/       — Context (Auth, Toast)
│   ├── standings/       — Tabla de posiciones, gráficos
│   └── ui/              — Componentes base (Button, Card, Input, etc.)
├── lib/
│   ├── supabase/        — Clientes de Supabase (browser y server)
│   ├── api-football.ts  — Integración con API-Football
│   ├── auth.ts          — Helpers de autenticación
│   ├── scoring.ts       — Lógica de cálculo de puntos
│   └── utils.ts         — Utilidades generales
├── supabase/
│   └── schema.sql       — Schema completo de base de datos
├── types/
│   └── index.ts         — TypeScript types y constantes
├── middleware.ts         — Protección de rutas
├── vercel.json          — Configuración de Cron
└── .env.example         — Variables de entorno de ejemplo
```

---

## Sistema de puntuación

### Capa 1 — Pronóstico Inicial (congelado)
- Se completa ANTES del inicio del torneo
- Incluye todos los partidos de grupos + campeón
- **Queda inmutable** y es la base para los bonus de cadena

### Capa 2 — Pronósticos en Vivo (actualizables)
- Se pueden modificar hasta **1 hora antes** de cada partido
- Bloqueados automáticamente cuando empieza el partido

### Tabla de puntos (configurable desde admin)

| Acción | Puntos por defecto |
|--------|-------------------|
| Ganador correcto (1/X/2) | 2 |
| Resultado exacto | 3 |
| Equipo avanza en eliminatorias | 3 |
| Campeón correcto | 10 |
| Bonus racha (3+ consecutivos) | 1/partido |
| **Bonus cadena:** clasificado de grupo | 2 |
| **Bonus cadena:** cruce Ronda 32 | 3 |
| **Bonus cadena:** cruce Octavos | 4 |
| **Bonus cadena:** cruce Cuartos | 5 |
| **Bonus cadena:** cruce Semis | 6 |
| **Bonus cadena:** cruce Final | 8 |
| **Bonus cadena:** ganador de llave | 3 |
| **Bonus cadena:** camino completo | 5 |

---

## FAQ

**¿Cómo actualizo los resultados manualmente?**
Panel Admin → Partidos → click "Editar" en el partido → cambiar marcador y estado a "Finalizado" → los puntos se calculan automáticamente.

**¿Qué pasa si el cron falla?**
El admin puede cargar resultados manualmente. Los puntos se calculan igual.

**¿Se pueden cambiar los puntos durante el torneo?**
Sí. Al modificar una regla en el panel admin, automáticamente se recalculan todos los puntos.

**¿La Capa 1 se puede corregir después de cerrado?**
No. Queda congelada. El usuario puede hacer pronósticos nuevos en Capa 2, pero los bonus de cadena siempre comparan contra Capa 1.

**¿El primer usuario siempre es admin?**
Sí. Si querés cambiar eso, podés editar el rol directamente en Supabase o desde el panel admin con otro usuario admin.

---

## Licencia

MIT — libre para uso personal.
