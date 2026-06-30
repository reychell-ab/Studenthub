# StudentHub

StudentHub es una aplicación web diseñada para ayudar a los estudiantes a organizar su vida académica, financiera y personal desde una sola plataforma. Permite llevar un control más claro de sus tareas, gastos, metas escolares y tiempo, facilitando la planificación diaria y reduciendo el desorden de tener múltiples herramientas separadas.

**Proyecto final — Lenguajes de Programación | UCR, Sede del Sur**

---

## ¿Qué ofrece?

StudentHub es una plataforma integral pensada para que los estudiantes puedan organizar su día a día de forma más sencilla y eficiente. La idea principal es reunir en un solo lugar las herramientas que normalmente se manejan por separado: finanzas personales, agenda académica, seguimiento de rendimiento y planificación del tiempo.

Con StudentHub, el usuario puede:

- gestionar ingresos y gastos personales con una visión clara de su situación financiera;
- llevar control de tareas, exámenes y proyectos sin perder de vista lo más importante;
- visualizar su progreso académico mediante cursos, créditos y calificaciones;
- organizar mejor su tiempo con un horario semanal y recordatorios de actividades;
- recibir sugerencias básicas de organización con apoyo de IA para tomar mejores decisiones.

StudentHub nace como una solución práctica para estudiantes que necesitan equilibrar estudios, responsabilidades económicas y rutina diaria, ofreciendo una experiencia más ordenada y útil.

---

## Cómo funciona cada módulo

### Login
Permite crear una cuenta o iniciar sesión con Firebase. Una vez autenticado, el usuario accede al contenido privado de la aplicación.

### Dashboard
Es la página principal del sistema. Muestra un resumen rápido de los gastos, las tareas próximas, el progreso académico y accesos a las secciones más importantes.

### Gastos
Sirve para registrar ingresos y egresos, organizar los movimientos por categorías y visualizar el ahorro sugerido según el comportamiento financiero del estudiante.

### Agenda
Permite llevar un control de tareas, exámenes y proyectos. Cada elemento puede marcarse como completado o pendiente, y se pueden aplicar filtros para ver lo más relevante.

### Progreso
Ayuda a registrar cursos, créditos y calificaciones. Con esa información, la app calcula promedios y permite estimar qué nota sería necesaria para alcanzar una meta académica.

### Horario
Muestra el horario semanal del estudiante para organizar mejor sus clases y tener una visión general de su carga académica.

### IA
Ofrece sugerencias automáticas basadas en la información registrada para apoyar la organización personal y académica.

---

## Tecnologías utilizadas

- Next.js 14
- React 18
- Firebase Auth + Firestore
- Tailwind CSS
- Lucide React
- Recharts, jsPDF y html2canvas

---

## Instalación

### Requisitos
- Node.js 18 o superior
- npm, pnpm o yarn

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd studenthub
```

### 2. Instalar dependencias
```bash
npm install
```

O, si prefieres pnpm:
```bash
pnpm install
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

Luego abre: http://localhost:3000

### 4. Construir para producción
```bash
npm run build
npm start
```

> Asegúrate de tener configurada correctamente la conexión con Firebase en la carpeta de utilidades del proyecto.

---

## 📁 Estructura del proyecto

```text
studenthub/
├── app/                  # Páginas y rutas principales
│   ├── api/              # Endpoints de IA y procesamiento
│   ├── agenda/           # Vista de agenda
│   ├── dashboard/        # Panel principal
│   ├── gastos/           # Gestión de gastos
│   ├── horario/          # Horario académico
│   ├── login/            # Autenticación
│   └── progreso/         # Seguimiento académico
├── components/           # Componentes reutilizables de la UI
├── lib/                  # Configuración y lógica de acceso a datos
└── package.json          # Dependencias y scripts
```

---

## 🧠 Conceptos de programación aplicados

| Concepto | Ejemplo en el proyecto |
|----------|-------------------------|
| Variables y constantes | estados, listas de categorías y tipos |
| Funciones | cálculos de totales, promedios y notas necesarias |
| Condicionales | validaciones de formularios y estados de tareas |
| Arreglos | filtrado, mapeo y reducción de datos |
| Objetos | documentos de Firestore y datos de formularios |
| Eventos | onClick, onChange y onSubmit |
| Modularidad | componentes y módulos separados en lib/ |
| Tipos de datos | strings, números, booleanos, arreglos y objetos |

---

## 👥 Autores

- Carlos M. Rodriguez Esquivel
- Meylin Iliana López Solera
- Reychell V. Acuña Barboza
- Yesly Figueroa Arauz
- Yileidy Rivera Granados