import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  Equipo,
  EstadisticasJugador,
  Jugador,
  Modalidad,
  Participacion,
  Partido,
  Pena,
} from '../lib/tipos';

const ULTIMOS_RESULTADOS = 5;

// ---------- Ajustes ----------

export async function leerAjuste(db: SQLiteDatabase, clave: string): Promise<string | null> {
  const fila = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM ajustes WHERE clave = ?', clave);
  return fila?.valor ?? null;
}

export async function guardarAjuste(db: SQLiteDatabase, clave: string, valor: string) {
  await db.runAsync(
    'INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor',
    clave,
    valor,
  );
}

// ---------- Peñas ----------

export type DatosPena = Omit<Pena, 'id' | 'creada_en'>;

export function listarPenas(db: SQLiteDatabase) {
  return db.getAllAsync<Pena>('SELECT * FROM penas ORDER BY nombre COLLATE NOCASE');
}

export function obtenerPena(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Pena>('SELECT * FROM penas WHERE id = ?', id);
}

export async function crearPena(db: SQLiteDatabase, p: DatosPena): Promise<number> {
  const r = await db.runAsync(
    'INSERT INTO penas (nombre, descripcion, lugar, dia, hora, modalidad) VALUES (?, ?, ?, ?, ?, ?)',
    p.nombre, p.descripcion, p.lugar, p.dia, p.hora, p.modalidad,
  );
  return r.lastInsertRowId;
}

export async function actualizarPena(db: SQLiteDatabase, id: number, p: DatosPena) {
  await db.runAsync(
    'UPDATE penas SET nombre = ?, descripcion = ?, lugar = ?, dia = ?, hora = ?, modalidad = ? WHERE id = ?',
    p.nombre, p.descripcion, p.lugar, p.dia, p.hora, p.modalidad, id,
  );
}

export async function eliminarPena(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM penas WHERE id = ?', id);
}

// ---------- Jugadores ----------

export type DatosJugador = Omit<Jugador, 'id' | 'pena_id' | 'activo'>;

export function listarJugadores(db: SQLiteDatabase, penaId: number, incluirBajas = false) {
  return db.getAllAsync<Jugador>(
    `SELECT * FROM jugadores WHERE pena_id = ? ${incluirBajas ? '' : 'AND activo = 1'}
     ORDER BY activo DESC, nombre COLLATE NOCASE`,
    penaId,
  );
}

export function obtenerJugador(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Jugador>('SELECT * FROM jugadores WHERE id = ?', id);
}

export async function crearJugador(db: SQLiteDatabase, penaId: number, j: DatosJugador): Promise<number> {
  const r = await db.runAsync(
    `INSERT INTO jugadores (pena_id, nombre, apodo, posicion, pase, defensa, tiro, velocidad, resistencia, foto)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    penaId, j.nombre, j.apodo, j.posicion, j.pase, j.defensa, j.tiro, j.velocidad, j.resistencia, j.foto,
  );
  return r.lastInsertRowId;
}

export async function actualizarJugador(db: SQLiteDatabase, id: number, j: DatosJugador) {
  await db.runAsync(
    `UPDATE jugadores SET nombre = ?, apodo = ?, posicion = ?, pase = ?, defensa = ?, tiro = ?,
     velocidad = ?, resistencia = ?, foto = ? WHERE id = ?`,
    j.nombre, j.apodo, j.posicion, j.pase, j.defensa, j.tiro, j.velocidad, j.resistencia, j.foto, id,
  );
}

/** Las bajas no borran al jugador para conservar el histórico de partidos. */
export async function cambiarActivoJugador(db: SQLiteDatabase, id: number, activo: boolean) {
  await db.runAsync('UPDATE jugadores SET activo = ? WHERE id = ?', activo ? 1 : 0, id);
}

// ---------- Partidos ----------

export function listarPartidos(db: SQLiteDatabase, penaId: number) {
  return db.getAllAsync<Partido>(
    'SELECT * FROM partidos WHERE pena_id = ? ORDER BY fecha DESC, id DESC',
    penaId,
  );
}

export function obtenerPartido(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Partido>('SELECT * FROM partidos WHERE id = ?', id);
}

export function listarParticipaciones(db: SQLiteDatabase, partidoId: number) {
  return db.getAllAsync<Participacion>('SELECT * FROM partido_jugadores WHERE partido_id = ?', partidoId);
}

export interface NuevoPartido {
  penaId: number;
  fecha: string;
  modalidad: Modalidad;
  equipoA: number[];
  equipoB: number[];
  valoracionA: number;
  valoracionB: number;
}

export async function crearPartido(db: SQLiteDatabase, p: NuevoPartido): Promise<number> {
  let id = 0;
  await db.withTransactionAsync(async () => {
    const r = await db.runAsync(
      'INSERT INTO partidos (pena_id, fecha, modalidad, valoracion_a, valoracion_b) VALUES (?, ?, ?, ?, ?)',
      p.penaId, p.fecha, p.modalidad, p.valoracionA, p.valoracionB,
    );
    id = r.lastInsertRowId;
    const filas: [number, Equipo][] = [
      ...p.equipoA.map((j): [number, Equipo] => [j, 'A']),
      ...p.equipoB.map((j): [number, Equipo] => [j, 'B']),
    ];
    for (const [jugadorId, equipo] of filas) {
      await db.runAsync(
        'INSERT INTO partido_jugadores (partido_id, jugador_id, equipo) VALUES (?, ?, ?)',
        id, jugadorId, equipo,
      );
    }
  });
  return id;
}

export interface ResultadoPartido {
  fecha: string;
  notas: string;
  participaciones: Participacion[];
}

/** Guarda goles y tarjetas; el marcador se calcula sumando los goles de cada equipo. */
export async function guardarResultado(db: SQLiteDatabase, partidoId: number, r: ResultadoPartido) {
  const golesA = r.participaciones.filter((p) => p.equipo === 'A').reduce((s, p) => s + p.goles, 0);
  const golesB = r.participaciones.filter((p) => p.equipo === 'B').reduce((s, p) => s + p.goles, 0);
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE partidos SET estado = 'jugado', goles_a = ?, goles_b = ?, fecha = ?, notas = ? WHERE id = ?`,
      golesA, golesB, r.fecha, r.notas, partidoId,
    );
    for (const p of r.participaciones) {
      await db.runAsync(
        `UPDATE partido_jugadores SET goles = ?, amarillas = ?, rojas = ?
         WHERE partido_id = ? AND jugador_id = ?`,
        p.goles, p.amarillas, p.rojas, partidoId, p.jugador_id,
      );
    }
  });
}

export async function eliminarPartido(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM partidos WHERE id = ?', id);
}

// ---------- Estadísticas ----------

interface FilaHistorial {
  jugador_id: number;
  equipo: Equipo;
  goles: number;
  amarillas: number;
  rojas: number;
  goles_a: number;
  goles_b: number;
}

/** Estadísticas de todos los jugadores de la peña (solo partidos jugados). */
export async function estadisticasPena(
  db: SQLiteDatabase,
  penaId: number,
): Promise<Map<number, EstadisticasJugador>> {
  const filas = await db.getAllAsync<FilaHistorial>(
    `SELECT pj.jugador_id, pj.equipo, pj.goles, pj.amarillas, pj.rojas, p.goles_a, p.goles_b
     FROM partido_jugadores pj
     JOIN partidos p ON p.id = pj.partido_id
     WHERE p.pena_id = ? AND p.estado = 'jugado'
     ORDER BY p.fecha DESC, p.id DESC`,
    penaId,
  );

  const mapa = new Map<number, EstadisticasJugador>();
  for (const f of filas) {
    let e = mapa.get(f.jugador_id);
    if (!e) {
      e = { jugador_id: f.jugador_id, pj: 0, pg: 0, pe: 0, pp: 0, goles: 0, amarillas: 0, rojas: 0, ultimos: [] };
      mapa.set(f.jugador_id, e);
    }
    const propios = f.equipo === 'A' ? f.goles_a : f.goles_b;
    const rivales = f.equipo === 'A' ? f.goles_b : f.goles_a;
    const res = propios > rivales ? 'G' : propios < rivales ? 'P' : 'E';
    e.pj++;
    if (res === 'G') e.pg++;
    else if (res === 'E') e.pe++;
    else e.pp++;
    e.goles += f.goles;
    e.amarillas += f.amarillas;
    e.rojas += f.rojas;
    if (e.ultimos.length < ULTIMOS_RESULTADOS) e.ultimos.push(res);
  }
  return mapa;
}

export interface PartidoDeJugador extends Partido {
  equipo: Equipo;
  goles_jugador: number;
  amarillas: number;
  rojas: number;
}

export function partidosDeJugador(db: SQLiteDatabase, jugadorId: number) {
  return db.getAllAsync<PartidoDeJugador>(
    `SELECT p.*, pj.equipo, pj.goles AS goles_jugador, pj.amarillas, pj.rojas
     FROM partido_jugadores pj
     JOIN partidos p ON p.id = pj.partido_id
     WHERE pj.jugador_id = ?
     ORDER BY p.fecha DESC, p.id DESC`,
    jugadorId,
  );
}
