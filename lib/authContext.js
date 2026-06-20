"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Vuelve a leer los datos del usuario de Firebase Auth y fuerza un
  // re-render. Necesario tras updateProfile/updateEmail, ya que Firebase
  // muta el mismo objeto `currentUser` en lugar de crear uno nuevo, por lo
  // que React no detecta el cambio si no creamos una referencia nueva.
  const refreshUser = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
