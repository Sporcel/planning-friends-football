import {
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  OpenSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/open-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrarBaseDatos } from '../db/esquema';
import { ProveedorPena } from '../lib/PenaActiva';
import { FUENTES, useTema } from '../lib/tema';
import { ProveedorTema } from '../lib/TemaActivo';

SplashScreen.preventAutoHideAsync();

const ocultarSplash = () => SplashScreen.hideAsync();

export default function RootLayout() {
  const [fuentesCargadas, errorFuentes] = useFonts({
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    OpenSans_800ExtraBold,
  });

  // Si la fuente falla se sigue adelante con la del sistema.
  if (!fuentesCargadas && !errorFuentes) return null;

  return (
    <SQLiteProvider databaseName="penas.db" onInit={migrarBaseDatos}>
      <ProveedorTema onListo={ocultarSplash}>
        <ProveedorPena>
          <Navegacion />
        </ProveedorPena>
      </ProveedorTema>
    </SQLiteProvider>
  );
}

function Navegacion() {
  const { tema, colores } = useTema();
  const base = tema === 'oscuro' ? DarkTheme : DefaultTheme;
  const fuente = (fontFamily: string) => ({ fontFamily, fontWeight: 'normal' as const });

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colores.primario,
          background: colores.fondo,
          card: colores.tarjeta,
          text: colores.texto,
          border: colores.borde,
        },
        fonts: {
          regular: fuente(FUENTES.regular),
          medium: fuente(FUENTES.seminegrita),
          bold: fuente(FUENTES.negrita),
          heavy: fuente(FUENTES.extranegrita),
        },
      }}
    >
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.cabecera },
          headerTintColor: colores.sobrePrimario,
          headerTitleStyle: { fontFamily: FUENTES.negrita },
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pena/editar" options={{ title: 'Peña' }} />
        <Stack.Screen name="pena/lista" options={{ title: 'Mis peñas' }} />
        <Stack.Screen name="jugador/[id]" options={{ title: 'Jugador' }} />
        <Stack.Screen name="partido/nuevo" options={{ title: 'Nuevo partido' }} />
        <Stack.Screen name="partido/[id]" options={{ title: 'Partido' }} />
        <Stack.Screen name="estadisticas/[id]" options={{ title: 'Ficha del jugador' }} />
      </Stack>
    </ThemeProvider>
  );
}
