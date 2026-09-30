import { HABILIDADES, type EstadisticasJugador, type Jugador, type Posicion } from './tipos';

/**
 * Valoración de un jugador (escala 0-100) que combina:
 *  - Habilidades declaradas (estrellas 1-5 de pase, defensa, tiro, velocidad y resistencia).
 *  - Rendimiento real en los partidos de la peña (puntos, forma reciente y goles).
 * El peso del rendimiento crece con los partidos jugados, hasta un máximo del 50%,
 * para que unos pocos partidos no distorsionen la valoración.
 */
export interface Valoracion {
  valoracion: number;
  habilidad: number;
  rendimiento: number | null;
  /** Peso (0-0.5) que se da al rendimiento sobre las habilidades. */
  pesoRendimiento: number;
}

const PESO_MAX_RENDIMIENTO = 0.5;
const PARTIDOS_CONFIANZA = 6;
const GOLES_REFERENCIA = 1.5;

export function valorarJugador(j: Jugador, e?: EstadisticasJugador): Valoracion {
  const media = HABILIDADES.reduce((s, h) => s + j[h.clave], 0) / HABILIDADES.length;
  const habilidad = media * 20;

  if (!e || e.pj === 0) {
    return { valoracion: habilidad, habilidad, rendimiento: null, pesoRendimiento: 0 };
  }

  const puntos = (e.pg + 0.5 * e.pe) / e.pj;
  const recientes = e.ultimos.length
    ? e.ultimos.reduce((s, r) => s + (r === 'G' ? 1 : r === 'E' ? 0.5 : 0), 0) / e.ultimos.length
    : puntos;
  const ataque = Math.min(e.goles / e.pj, GOLES_REFERENCIA) / GOLES_REFERENCIA;
  const rendimiento = 100 * (0.55 * puntos + 0.2 * recientes + 0.25 * ataque);

  const pesoRendimiento = PESO_MAX_RENDIMIENTO * (e.pj / (e.pj + PARTIDOS_CONFIANZA));
  const valoracion = habilidad * (1 - pesoRendimiento) + rendimiento * pesoRendimiento;
  return { valoracion, habilidad, rendimiento, pesoRendimiento };
}

export interface JugadorValorado {
  jugador: Jugador;
  valoracion: number;
}

export interface Reparto {
  equipoA: JugadorValorado[];
  equipoB: JugadorValorado[];
  totalA: number;
  totalB: number;
  /** 100 = perfectamente igualados. */
  equilibrio: number;
}

// Pesos de la función de coste: cuanto menor, más igualados.
const PESO_HABILIDAD = 3; // por estrella de diferencia en la suma de cada habilidad
const PESO_PORTEROS = 40; // por portero de más en un equipo
const PESO_POSICION = 2; // por defensa/delantero de diferencia
const REINICIOS = 60;

function coste(a: JugadorValorado[], b: JugadorValorado[]): number {
  const suma = (eq: JugadorValorado[], f: (x: JugadorValorado) => number) => eq.reduce((s, x) => s + f(x), 0);
  const cuenta = (eq: JugadorValorado[], p: Posicion) => eq.filter((x) => x.jugador.posicion === p).length;

  let c = Math.abs(suma(a, (x) => x.valoracion) - suma(b, (x) => x.valoracion));

  for (const h of HABILIDADES) {
    c += PESO_HABILIDAD * Math.abs(suma(a, (x) => x.jugador[h.clave]) - suma(b, (x) => x.jugador[h.clave]));
  }

  const porA = cuenta(a, 'portero');
  const porB = cuenta(b, 'portero');
  c += PESO_PORTEROS * (Math.abs(porA - porB) - ((porA + porB) % 2));

  for (const p of ['defensa', 'delantero'] as const) {
    c += PESO_POSICION * Math.abs(cuenta(a, p) - cuenta(b, p));
  }
  return c;
}

function barajar<T>(arr: T[], aleatorio: () => number): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const k = Math.floor(aleatorio() * (i + 1));
    [r[i], r[k]] = [r[k], r[i]];
  }
  return r;
}

/** Mejora un reparto intercambiando parejas de jugadores mientras baje el coste. */
function busquedaLocal(a: JugadorValorado[], b: JugadorValorado[]) {
  let actual = coste(a, b);
  let mejora = true;
  while (mejora) {
    mejora = false;
    for (let i = 0; i < a.length; i++) {
      for (let k = 0; k < b.length; k++) {
        [a[i], b[k]] = [b[k], a[i]];
        const c = coste(a, b);
        if (c < actual - 1e-9) {
          actual = c;
          mejora = true;
        } else {
          [a[i], b[k]] = [b[k], a[i]];
        }
      }
    }
  }
  return actual;
}

const ORDEN_POSICION: Record<Posicion, number> = { portero: 0, defensa: 1, medio: 2, delantero: 3 };

function ordenar(eq: JugadorValorado[]) {
  return [...eq].sort(
    (x, y) =>
      ORDEN_POSICION[x.jugador.posicion] - ORDEN_POSICION[y.jugador.posicion] || y.valoracion - x.valoracion,
  );
}

export function construirReparto(a: JugadorValorado[], b: JugadorValorado[]): Reparto {
  const totalA = a.reduce((s, x) => s + x.valoracion, 0);
  const totalB = b.reduce((s, x) => s + x.valoracion, 0);
  const max = Math.max(totalA, totalB);
  const equilibrio = max === 0 ? 100 : (Math.min(totalA, totalB) / max) * 100;
  return { equipoA: ordenar(a), equipoB: ordenar(b), totalA, totalB, equilibrio };
}

/**
 * Divide a los jugadores en dos equipos de `porEquipo` lo más igualados posible.
 * Hace varios reinicios aleatorios con búsqueda local; con `variar` elige al azar entre
 * los repartos casi óptimos para que "Regenerar" proponga combinaciones distintas.
 */
export function generarEquipos(
  jugadores: JugadorValorado[],
  porEquipo: number,
  opciones: { variar?: boolean; aleatorio?: () => number } = {},
): Reparto {
  if (jugadores.length !== porEquipo * 2) {
    throw new Error(`Se necesitan ${porEquipo * 2} jugadores y hay ${jugadores.length}`);
  }
  const aleatorio = opciones.aleatorio ?? Math.random;

  const candidatos = new Map<string, { a: JugadorValorado[]; b: JugadorValorado[]; coste: number }>();
  for (let r = 0; r < REINICIOS; r++) {
    const mezcla = barajar(jugadores, aleatorio);
    const a = mezcla.slice(0, porEquipo);
    const b = mezcla.slice(porEquipo);
    const c = busquedaLocal(a, b);
    const idsA = a.map((x) => x.jugador.id).sort((x, y) => x - y);
    const idsB = b.map((x) => x.jugador.id).sort((x, y) => x - y);
    // Misma división con los equipos intercambiados = misma clave.
    const clave = idsA[0] < idsB[0] ? idsA.join(',') : idsB.join(',');
    if (!candidatos.has(clave)) candidatos.set(clave, { a, b, coste: c });
  }

  const lista = [...candidatos.values()].sort((x, y) => x.coste - y.coste);
  let elegido = lista[0];
  if (opciones.variar) {
    const umbral = lista[0].coste * 1.25 + 4;
    const buenos = lista.filter((x) => x.coste <= umbral);
    elegido = buenos[Math.floor(aleatorio() * buenos.length)];
  }
  return construirReparto(elegido.a, elegido.b);
}
