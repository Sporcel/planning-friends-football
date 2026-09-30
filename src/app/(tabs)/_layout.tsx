import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { BotonTema } from '../../components/ui';
import { usePena } from '../../lib/PenaActiva';
import { FUENTES, useColores } from '../../lib/tema';

export default function TabsLayout() {
  const { pena } = usePena();
  const colores = useColores();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colores.cabecera },
        headerTintColor: colores.sobrePrimario,
        headerTitleStyle: { fontFamily: FUENTES.negrita },
        headerRight: () => <BotonTema />,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
        tabBarStyle: { backgroundColor: colores.tarjeta, borderTopColor: colores.borde },
        tabBarLabelStyle: { fontFamily: FUENTES.seminegrita },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Peña',
          headerTitle: pena?.nombre ?? 'Mi peña',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="partidos"
        options={{
          title: 'Partidos',
          tabBarIcon: ({ color, size }) => <Ionicons name="football" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jugadores"
        options={{
          title: 'Jugadores',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
