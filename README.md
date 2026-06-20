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
### 2. Ejecutar en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000)

### 3. Construir para producción
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