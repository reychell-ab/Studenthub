import "./globals.css";
import { AuthProvider } from "../lib/authContext";

export const metadata = {
  title: "StudentHub — Tu vida universitaria organizada",
  description: "Gestión académica y financiera para estudiantes universitarios"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
