import { createContext, useContext } from 'react';
import { StyleSheet, type TextStyle } from 'react-native';

const claro = {
  primario: '#1B7F3B',
  /** Texto sobre `primarioSuave` (selector, cabecera de tabla). */
  primarioOscuro: '#12592A',
  primarioSuave: '#E3F3E8',
  /** Barra de navegación superior. */
  cabecera: '#1B7F3B',
  /** Tarjeta destacada de la peña; lleva texto blanco en ambos modos. */
  hero: '#12592A',
  textoHeroSuave: '#CFE8D6',
  /** Texto sobre fondos de color (botones, cabeceras); blanco en ambos modos. */
  sobrePrimario: '#FFFFFF',
  fondo: '#F4F6F5',
  tarjeta: '#FFFFFF',
  texto: '#1C2321',
  textoSuave: '#66706C',
  borde: '#DDE3E0',
  equipoA: '#1565C0',
  equipoASuave: '#E3EEFB',
  equipoB: '#C62828',
  equipoBSuave: '#FBE6E6',
  estrella: '#F5A623',
  amarilla: '#F2C200',
  /** Cifras de tarjetas amarillas (legible sobre el fondo). */
  textoAmarilla: '#B08900',
  roja: '#D32F2F',
  victoria: '#2E7D32',
  empate: '#8D8D8D',
  derrota: '#C62828',
};

export type Colores = Record<keyof typeof claro, string>;

const oscuro: Colores = {
  primario: '#2E9B55',
  primarioOscuro: '#A8DDB8',
  primarioSuave: '#1D3326',
  cabecera: '#14532A',
  hero: '#14532A',
  textoHeroSuave: '#B5DCC1',
  sobrePrimario: '#FFFFFF',
  fondo: '#0F1412',
  tarjeta: '#1A211E',
  texto: '#E8EEEB',
  textoSuave: '#9AA6A1',
  borde: '#2C3531',
  equipoA: '#4A90E2',
  equipoASuave: '#1A2A3F',
  equipoB: '#E05555',
  equipoBSuave: '#3A1F1F',
  estrella: '#F5A623',
  amarilla: '#F2C200',
  textoAmarilla: '#E0B400',
  roja: '#EF5350',
  victoria: '#43A047',
  empate: '#9E9E9E',
  derrota: '#E05555',
};

export const PALETAS = { claro, oscuro } as const;
export type NombreTema = keyof typeof PALETAS;

interface ValorTema {
  tema: NombreTema;
  colores: Colores;
  alternarTema: () => void;
}

export const ContextoTema = createContext<ValorTema>({
  tema: 'claro',
  colores: claro,
  alternarTema: () => {},
});

export function useTema() {
  return useContext(ContextoTema);
}

export function useColores() {
  return useContext(ContextoTema).colores;
}

/**
 * Crea un hook de estilos que depende de los colores del tema.
 * Las hojas de estilo de los dos temas se generan una sola vez, al cargar el módulo.
 */
export function crearEstilos<T extends StyleSheet.NamedStyles<T>>(fabrica: (c: Colores) => T) {
  const hojas = { claro: StyleSheet.create(fabrica(claro)), oscuro: StyleSheet.create(fabrica(oscuro)) };
  return function useEstilosTema(): T {
    return hojas[useContext(ContextoTema).tema];
  };
}

// ---------- Tipografía: Open Sans ----------

export const FUENTES = {
  regular: 'OpenSans_400Regular',
  medio: 'OpenSans_500Medium',
  seminegrita: 'OpenSans_600SemiBold',
  negrita: 'OpenSans_700Bold',
  extranegrita: 'OpenSans_800ExtraBold',
} as const;

/**
 * Con fuentes personalizadas cada grosor es un archivo distinto, así que el grosor
 * se elige con `fontFamily` y no con `fontWeight` (Android ignora el grosor si no).
 */
export function fuentePara(peso: TextStyle['fontWeight']): string {
  switch (String(peso ?? '400')) {
    case '500':
      return FUENTES.medio;
    case '600':
      return FUENTES.seminegrita;
    case '700':
    case 'bold':
      return FUENTES.negrita;
    case '800':
    case '900':
      return FUENTES.extranegrita;
    default:
      return FUENTES.regular;
  }
}
