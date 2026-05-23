# StudentHub 🎓

Aplicación web de organización académica y financiera para estudiantes universitarios.

**Proyecto Final — Lenguajes de Programación | UCR Sede del Sur**

---

## 📋 Módulos

| Módulo | Descripción |
|--------|-------------|
| 🔐 Login | Autenticación con Firebase (registro e inicio de sesión) |
| 🏠 Dashboard | Resumen general: finanzas, agenda y progreso |
| 💰 Gastos | Control de ingresos y egresos, categorías, ahorro sugerido |
| 📅 Agenda | Tareas, exámenes, proyectos — con estado y filtros |
| 📈 Progreso | Cursos, créditos, promedio y calculadora de notas |

---

## 🚀 Instalación

### 1. Requisitos
- Node.js 18 o superior
- npm o yarn

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un proyecto nuevo
3. Activa **Authentication → Email/Password**
4. Activa **Firestore Database** (modo producción o test)
5. Ve a **Project Settings → General → Your apps → Web app**
6. Copia tu configuración en `lib/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 4. Reglas de Firestore

En Firebase Console → Firestore → Rules, pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000)

### 6. Construir para producción
```bash
npm run build
npm start
```

---

## 📁 Estructura del proyecto

```
studenthub/
├── app/
│   ├── layout.jsx          # Layout raíz con AuthProvider
│   ├── page.jsx            # Redirección automática
│   ├── globals.css         # Estilos globales
│   ├── login/page.jsx      # Página de login/registro
│   ├── dashboard/page.jsx  # Página principal
│   ├── gastos/page.jsx     # Control de gastos
│   ├── agenda/page.jsx     # Agenda académica
│   └── progreso/page.jsx   # Progreso de carrera
├── components/
│   └── Sidebar.jsx         # Barra lateral de navegación
├── lib/
│   ├── firebase.js         # Configuración Firebase
│   ├── authContext.js      # Contexto de autenticación
│   └── db.js               # Funciones Firestore (CRUD)
└── package.json
```

---

## 🧑‍💻 Conceptos de programación aplicados

| Concepto | Dónde |
|----------|-------|
| Variables y constantes | `TIPOS`, `CATEGORIAS_EGRESO`, estados locales |
| Funciones propias | `calcularTotales`, `calcularNotaNecesaria`, `promedioGeneral`, `agruparPorCategoria`, etc. |
| Condicionales | Estado de gastos, vencimiento, aprobación, saludo dinámico |
| Arreglos y `.filter`, `.map`, `.reduce` | Todos los módulos |
| Objetos | Documentos Firestore, formularios, cursos |
| Ciclos | `.map()` en listas y tablas |
| Eventos | `onClick`, `onChange`, `onSubmit` |
| Modularidad | Componentes separados, `lib/db.js`, `lib/authContext.js` |
| Tipos de datos | Strings, números, booleanos, objetos, arreglos |

---

## 🛠️ Tecnologías

- **Next.js 14** — Framework React con App Router
- **React 18** — UI con hooks (`useState`, `useEffect`, `useContext`)
- **Firebase** — Auth y Firestore
- **Tailwind CSS** — Utilidades de estilo
- **Lucide React** — Iconos


---

## 🚂 Deploy en Railway

### 1. Subir el código a GitHub
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/studenthub.git
git push -u origin main
```

### 2. Crear proyecto en Railway
1. Ve a [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Seleccioná tu repositorio `studenthub`
3. Railway detecta Next.js automáticamente

### 3. Agregar variables de entorno en Railway
Ve a tu proyecto → **Variables** → agrega cada una:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Tu API Key de Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `tu-proyecto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `tu-proyecto-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `tu-proyecto.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Tu Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Tu App ID |

### 4. Configurar Firebase para producción
En Firebase Console → Authentication → **Authorized domains**, agrega el dominio que te da Railway (ej: `studenthub-production.up.railway.app`).

### 5. Deploy automático
Cada `git push` a `main` dispara un redeploy automático en Railway.

### Notas
- El archivo `.env.local` **nunca** se sube a GitHub (está en `.gitignore`)
- Las variables `NEXT_PUBLIC_*` son visibles en el navegador — no pongas secretos privados ahí
- Railway asigna un dominio gratis en `.up.railway.app`
