import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { guardarAjuste, leerAjuste, listarPenas, obtenerPena } from '../db/repositorio';
import type { Pena } from './tipos';

const CLAVE = 'pena_activa';

interface ContextoPena {
  pena: Pena | null;
  cargando: boolean;
  seleccionarPena: (id: number | null) => Promise<void>;
  recargarPena: () => Promise<void>;
}

const Contexto = createContext<ContextoPena | null>(null);

async function leerPenaActiva(db: SQLiteDatabase): Promise<Pena | null> {
  const guardada = await leerAjuste(db, CLAVE);
  let p = guardada ? await obtenerPena(db, Number(guardada)) : null;
  if (!p) {
    // La peña guardada ya no existe: usar la primera disponible.
    p = (await listarPenas(db))[0] ?? null;
    if (p) await guardarAjuste(db, CLAVE, String(p.id));
  }
  return p;
}

/** Guarda qué peña está seleccionada; todas las pestañas muestran datos de esa peña. */
export function ProveedorPena({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [pena, setPena] = useState<Pena | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setPena(await leerPenaActiva(db));
    setCargando(false);
  }, [db]);

  useEffect(() => {
    leerPenaActiva(db).then((p) => {
      setPena(p);
      setCargando(false);
    });
  }, [db]);

  const seleccionarPena = useCallback(
    async (id: number | null) => {
      await guardarAjuste(db, CLAVE, id === null ? '' : String(id));
      await cargar();
    },
    [db, cargar],
  );

  return (
    <Contexto.Provider value={{ pena, cargando, seleccionarPena, recargarPena: cargar }}>
      {children}
    </Contexto.Provider>
  );
}

export function usePena() {
  const c = useContext(Contexto);
  if (!c) throw new Error('usePena debe usarse dentro de ProveedorPena');
  return c;
}
