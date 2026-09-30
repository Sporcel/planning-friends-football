import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { guardarAjuste, leerAjuste } from '../db/repositorio';
import { ContextoTema, PALETAS, type NombreTema } from './tema';

const CLAVE = 'tema';

/**
 * Tema claro/oscuro. Mientras el usuario no pulse el botón se sigue el tema del sistema;
 * después se guarda su elección en la base de datos.
 */
export function ProveedorTema({ children, onListo }: { children: ReactNode; onListo?: () => void }) {
  const db = useSQLiteContext();
  const sistema = useColorScheme();
  const [elegido, setElegido] = useState<NombreTema | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    leerAjuste(db, CLAVE).then((v) => {
      setElegido(v === 'claro' || v === 'oscuro' ? v : null);
      setCargado(true);
    });
  }, [db]);

  useEffect(() => {
    if (cargado) onListo?.();
  }, [cargado, onListo]);

  const tema: NombreTema = elegido ?? (sistema === 'dark' ? 'oscuro' : 'claro');

  function alternarTema() {
    const nuevo: NombreTema = tema === 'oscuro' ? 'claro' : 'oscuro';
    setElegido(nuevo);
    guardarAjuste(db, CLAVE, nuevo);
  }

  if (!cargado) return null;

  return (
    <ContextoTema.Provider value={{ tema, colores: PALETAS[tema], alternarTema }}>{children}</ContextoTema.Provider>
  );
}
