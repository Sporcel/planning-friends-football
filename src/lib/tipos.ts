export type Modalidad = 'sala' | 'f7' | 'f11';

export const MODALIDADES: Record<Modalidad, { nombre: string; porEquipo: number }> = {
  sala: { nombre: 'Fútbol sala', porEquipo: 5 },
  f7: { nombre: 'Fútbol 7', porEquipo: 7 },
  f11: { nombre: 'Fútbol 11', porEquipo: 11 },
};

export const LISTA_MODALIDADES: Modalidad[] = ['sala', 'f7', 'f11'];

export type Posicion = 'portero' | 'defensa' | 'medio' | 'delantero';

export const POSICIONES: Record<Posicion, string> = {
  portero: 'Portero',
  defensa: 'Defensa',
  medio: 'Centrocampista',
  delantero: 'Delantero',
};

export const LISTA_POSICIONES: Posicion[] = ['portero', 'defensa', 'medio', 'delantero'];

export type Habilidad = 'pase' | 'defensa' | 'tiro' | 'velocidad' | 'resistencia';

export const HABILIDADES: { clave: Habilidad; nombre: string }[] = [
  { clave: 'pase', nombre: 'Pase' },
  { clave: 'defensa', nombre: 'Defensa' },
  { clave: 'tiro', nombre: 'Tiro' },
  { clave: 'velocidad', nombre: 'Velocidad' },
  { clave: 'resistencia', nombre: 'Resistencia' },
];

export interface Pena {
  id: number;
  nombre: string;
  descripcion: string;
  lugar: string;
  dia: string;
  hora: string;
  modalidad: Modalidad;
  creada_en: string;
}

export interface Jugador extends Record<Habilidad, number> {
  id: number;
  pena_id: number;
  nombre: string;
  apodo: string;
  posicion: Posicion;
  activo: number;
  /** Nombre del archivo de la foto (ver lib/fotos.ts) o null si no tiene. */
  foto: string | null;
}

export type Equipo = 'A' | 'B';

export interface Partido {
  id: number;
  pena_id: number;
  fecha: string;
  modalidad: Modalidad;
  estado: 'pendiente' | 'jugado';
  goles_a: number;
  goles_b: number;
  valoracion_a: number;
  valoracion_b: number;
  notas: string;
}

export interface Participacion {
  partido_id: number;
  jugador_id: number;
  equipo: Equipo;
  goles: number;
  amarillas: number;
  rojas: number;
}

export interface EstadisticasJugador {
  jugador_id: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  goles: number;
  amarillas: number;
  rojas: number;
  /** Resultados de los últimos partidos, del más reciente al más antiguo. */
  ultimos: ('G' | 'E' | 'P')[];
}

export function nombreVisible(j: Pick<Jugador, 'nombre' | 'apodo'>): string {
  return j.apodo.trim() ? j.apodo : j.nombre;
}

export function hoyISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function formatearFecha(iso: string): string {
  const [a, m, d] = iso.split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}
