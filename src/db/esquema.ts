import type { SQLiteDatabase } from 'expo-sqlite';

const VERSION_BD = 2;

/** Crea o actualiza las tablas. Se ejecuta al abrir la base de datos. */
export async function migrarBaseDatos(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = fila?.user_version ?? 0;
  if (version >= VERSION_BD) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE IF NOT EXISTS penas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT NOT NULL DEFAULT '',
        lugar TEXT NOT NULL DEFAULT '',
        dia TEXT NOT NULL DEFAULT '',
        hora TEXT NOT NULL DEFAULT '',
        modalidad TEXT NOT NULL DEFAULT 'f7' CHECK (modalidad IN ('sala','f7','f11')),
        creada_en TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS jugadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pena_id INTEGER NOT NULL REFERENCES penas(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        apodo TEXT NOT NULL DEFAULT '',
        posicion TEXT NOT NULL DEFAULT 'medio',
        pase INTEGER NOT NULL DEFAULT 3 CHECK (pase BETWEEN 1 AND 5),
        defensa INTEGER NOT NULL DEFAULT 3 CHECK (defensa BETWEEN 1 AND 5),
        tiro INTEGER NOT NULL DEFAULT 3 CHECK (tiro BETWEEN 1 AND 5),
        velocidad INTEGER NOT NULL DEFAULT 3 CHECK (velocidad BETWEEN 1 AND 5),
        resistencia INTEGER NOT NULL DEFAULT 3 CHECK (resistencia BETWEEN 1 AND 5),
        activo INTEGER NOT NULL DEFAULT 1,
        creado_en TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS partidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pena_id INTEGER NOT NULL REFERENCES penas(id) ON DELETE CASCADE,
        fecha TEXT NOT NULL,
        modalidad TEXT NOT NULL CHECK (modalidad IN ('sala','f7','f11')),
        estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','jugado')),
        goles_a INTEGER NOT NULL DEFAULT 0,
        goles_b INTEGER NOT NULL DEFAULT 0,
        valoracion_a REAL NOT NULL DEFAULT 0,
        valoracion_b REAL NOT NULL DEFAULT 0,
        notas TEXT NOT NULL DEFAULT '',
        creado_en TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS partido_jugadores (
        partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
        jugador_id INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
        equipo TEXT NOT NULL CHECK (equipo IN ('A','B')),
        goles INTEGER NOT NULL DEFAULT 0,
        amarillas INTEGER NOT NULL DEFAULT 0,
        rojas INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (partido_id, jugador_id)
      );

      CREATE TABLE IF NOT EXISTS ajustes (
        clave TEXT PRIMARY KEY NOT NULL,
        valor TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_jugadores_pena ON jugadores(pena_id);
      CREATE INDEX IF NOT EXISTS idx_partidos_pena ON partidos(pena_id, fecha);
      CREATE INDEX IF NOT EXISTS idx_pj_jugador ON partido_jugadores(jugador_id);
    `);
    version = 1;
  }

  if (version === 1) {
    // Nombre del archivo de la foto dentro de la carpeta de documentos (null = sin foto).
    await db.execAsync('ALTER TABLE jugadores ADD COLUMN foto TEXT;');
    version = 2;
  }

  // Futuras migraciones: if (version === 2) { ...; version = 3; }

  await db.execAsync(`PRAGMA user_version = ${VERSION_BD}`);
}
