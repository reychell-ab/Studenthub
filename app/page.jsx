"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/authContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [user, loading, router]);
  return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#64748b" }}>Cargando...</div>;
}
