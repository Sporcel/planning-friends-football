import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SinPena, useAlEnfocar } from '../../components/SinPena';
import { BotonFlotante, Tarjeta, Texto, Vacio, useEstilos } from '../../components/ui';
import { listarPartidos } from '../../db/repositorio';
import { usePena } from '../../lib/PenaActiva';
import { useColores } from '../../lib/tema';
import { MODALIDADES, formatearFecha, type Partido } from '../../lib/tipos';

export default function PantallaPartidos() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const { pena } = usePena();
  const [partidos, setPartidos] = useState<Partido[]>([]);

  const cargar = useCallback(async () => {
    if (pena) setPartidos(await listarPartidos(db, pena.id));
  }, [db, pena]);
  useAlEnfocar(cargar);

  if (!pena) return <SinPena />;

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={partidos}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={estilos.contenido}
        ListEmptyComponent={
          <Vacio icono="football-outline" texto="No hay partidos. Pulsa + para crear uno y generar los equipos." />
        }
        renderItem={({ item: p }) => (
          <Pressable onPress={() => router.push(`/partido/${p.id}`)}>
            <Tarjeta style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Texto style={estilos.negrita}>{formatearFecha(p.fecha)}</Texto>
                <Texto style={estilos.textoSuave}>{MODALIDADES[p.modalidad].nombre}</Texto>
              </View>
              {p.estado === 'jugado' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Marcador goles={p.goles_a} color={colores.equipoA} />
                  <Texto style={estilos.negrita}>-</Texto>
                  <Marcador goles={p.goles_b} color={colores.equipoB} />
                </View>
              ) : (
                <Texto style={{ color: colores.estrella, fontWeight: '700' }}>Pendiente</Texto>
              )}
            </Tarjeta>
          </Pressable>
        )}
      />
      <BotonFlotante onPress={() => router.push('/partido/nuevo')} />
    </View>
  );
}

function Marcador({ goles, color }: { goles: number; color: string }) {
  const colores = useColores();
  return (
    <View style={{ backgroundColor: color, borderRadius: 8, minWidth: 36, paddingVertical: 4, alignItems: 'center' }}>
      <Texto style={{ color: colores.sobrePrimario, fontWeight: '800', fontSize: 18 }}>{goles}</Texto>
    </View>
  );
}
