import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { getDoc } from "firebase/firestore";
import { setDoc } from "firebase/firestore";

// ── GASTOS ──────────────────────────────────────────────
export async function agregarGasto(uid, gasto) {
  return addDoc(collection(db, "usuarios", uid, "gastos"), {
    ...gasto,
    fecha: serverTimestamp()
  });
}

export async function obtenerPerfil(uid) {
  const ref = doc(db, "usuarios", uid, "perfil", "info");

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data();
}

export async function obtenerGastos(uid) {
  const q = query(
    collection(db, "usuarios", uid, "gastos"),
    orderBy("fecha", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function eliminarGasto(uid, gastoId) {
  return deleteDoc(doc(db, "usuarios", uid, "gastos", gastoId));
}

export async function actualizarGasto(uid, gastoId, datos) {
  return updateDoc(doc(db, "usuarios", uid, "gastos", gastoId), datos);
}

// ── AGENDA ──────────────────────────────────────────────
export async function agregarActividad(uid, actividad) {
  return addDoc(collection(db, "usuarios", uid, "agenda"), {
    ...actividad,
    creadoEn: serverTimestamp()
  });
}

export async function obtenerAgenda(uid) {
  const q = query(
    collection(db, "usuarios", uid, "agenda"),
    orderBy("fecha", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function eliminarActividad(uid, actId) {
  return deleteDoc(doc(db, "usuarios", uid, "agenda", actId));
}

export async function actualizarActividad(uid, actId, datos) {
  return updateDoc(doc(db, "usuarios", uid, "agenda", actId), datos);
}

// ── CURSOS / PROGRESO ────────────────────────────────────
export async function agregarCurso(uid, curso) {
  return addDoc(collection(db, "usuarios", uid, "cursos"), {
    ...curso,
    creadoEn: serverTimestamp()
  });
}

export async function obtenerCursos(uid) {
  const snap = await getDocs(collection(db, "usuarios", uid, "cursos"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function actualizarCurso(uid, cursoId, datos) {
  return updateDoc(doc(db, "usuarios", uid, "cursos", cursoId), datos);
}

export async function eliminarCurso(uid, cursoId) {
  return deleteDoc(doc(db, "usuarios", uid, "cursos", cursoId));
}

// ── HORARIO ──────────────────────────────────────────────
export async function agregarEntradaHorario(uid, entrada) {
  return addDoc(collection(db, "usuarios", uid, "horario"), {
    ...entrada,
    creadoEn: serverTimestamp()
  });
}

export async function obtenerHorario(uid) {
  const snap = await getDocs(collection(db, "usuarios", uid, "horario"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function eliminarEntradaHorario(uid, entradaId) {
  return deleteDoc(doc(db, "usuarios", uid, "horario", entradaId));
}

export async function actualizarEntradaHorario(uid, entradaId, datos) {
  return updateDoc(doc(db, "usuarios", uid, "horario", entradaId), datos);
}

// ── PERFIL ────────────────────────────────────────────────
export async function guardarPerfil(uid, datos) {
  const ref = doc(db, "usuarios", uid, "perfil", "info");

  return setDoc(ref, datos, { merge: true });
}

// ── PLAN DE CARRERA ───────────────────────────────────────

export async function obtenerPlanCarrera(uid) {
  const ref = doc(db, "planes", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data();
}


