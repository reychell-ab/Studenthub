"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        if (!form.nombre.trim()) throw new Error("Ingresa tu nombre completo.");
        if (form.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.nombre });
      }
      router.push("/dashboard");
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No existe una cuenta con ese correo.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/email-already-in-use": "Ese correo ya está registrado.",
        "auth/invalid-email": "El correo no es válido.",
        "auth/invalid-credential": "Correo o contraseña incorrectos."
      };
      setError(msgs[err.code] || err.message || "Ocurrió un error.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen"
      style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6">

        <h2 className="text-2xl font-bold text-gray-200 mb-4">
          {mode === "login" ? "Login" : "Sign up"}
        </h2>

        {error && (
          <p style={{ color: "#fca5a5", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>
            {error}
          </p>
        )}

        <form className="flex flex-col" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              placeholder="Full name"
              className="bg-gray-700 text-gray-200 border-0 rounded-md p-2 mb-4 focus:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              required
            />
          )}

          <input
            placeholder="Email address"
            className="bg-gray-700 text-gray-200 border-0 rounded-md p-2 mb-4 focus:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />

          <input
            placeholder="Password"
            className="bg-gray-700 text-gray-200 border-0 rounded-md p-2 mb-4 focus:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
          />

          <div className="flex items-center justify-between flex-wrap">
            <label className="text-sm text-gray-200 cursor-pointer" htmlFor="remember-me">
              <input className="mr-2" id="remember-me" type="checkbox" />
              Remember me
            </label>
            <p className="text-white mt-4">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <a
                className="text-sm text-blue-500 hover:underline mt-4"
                href="#"
                onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "register" : "login"); setError(""); }}>
                {mode === "login" ? "Signup" : "Login"}
              </a>
            </p>
          </div>

          <button
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-4 hover:bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150"
            type="submit"
            disabled={loading}>
            {loading ? "Loading..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
