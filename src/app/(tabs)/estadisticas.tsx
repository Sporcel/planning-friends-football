import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SinPena, useAlEnfocar } from '../../components/SinPena';
import { Resultado, Texto, Vacio, useEstilos } from '../../components/ui';
import { estadisticasPena, listarJugadores } from '../../db/repositorio';
import { usePena } from '../../lib/PenaActiva';
import { crearEstilos, useColores } from '../../lib/tema';
import { nombreVisible, type EstadisticasJugador, type Jugador } from '../../lib/tipos';

type Orden = 'pj' | 'pg' | 'porcentaje' | 'goles' | 'amarillas' | 'rojas';

const ORDENES: { clave: Orden; texto: string }[] = [
  { clave: 'goles', texto: 'Goles' },
  { clave: 'pg', texto: 'Victorias' },
  { clave: 'porcentaje', texto: '% Victorias' },
  { clave: 'pj', texto: 'Partidos' },
  { clave: 'amarillas', texto: 'Amarillas' },
  { clave: 'rojas', texto: 'Rojas' },
];

interface Fila extends EstadisticasJugador {
  jugador: Jugador;
  porcentaje: number;
}

const VACIAS = { pj: 0, pg: 0, pe: 0, pp: 0, goles: 0, amarillas: 0, rojas: 0, ultimos: [] };

export default function PantallaEstadisticas() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const s = useS();
  const { pena } = usePena();
  const [datos, setDatos] = useState<Fila[]>([]);
  const [orden, setOrden] = useState<Orden>('goles');

  const cargar = useCallback(async () => {
    if (!pena) return;
    const [jugadores, stats] = await Promise.all([listarJugadores(db, pena.id, true), estadisticasPena(db, pena.id)]);
    setDatos(
      jugadores
        // Las bajas solo aparecen si llegaron a jugar algún partido.
        .filter((j) => j.activo || stats.has(j.id))
        .map((j) => {
          const e = stats.get(j.id) ?? { ...VACIAS, jugador_id: j.id };
          return { ...e, jugador: j, porcentaje: e.pj ? (e.pg / e.pj) * 100 : 0 };
        }),
    );
  }, [db, pena]);
  useAlEnfocar(cargar);

  const filas = useMemo(
    () => [...datos].sort((a, b) => b[orden] - a[orden] || b.pj - a.pj || a.jugador.nombre.localeCompare(b.jugador.nombre)),
    [datos, orden],
  );

  if (!pena) return <SinPena />;

  return (
    <View style={estilos.pantalla}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
          {ORDENES.map((o) => (
            <Pressable
              key={o.clave}
              onPress={() => setOrden(o.clave)}
              accessibilityRole="button"
              accessibilityState={{ selected: orden === o.clave }}
              style={[s.chip, orden === o.clave && { backgroundColor: colores.primario, borderColor: colores.primario }]}
            >
              <Texto style={[s.chipTexto, orden === o.clave && { color: colores.sobrePrimario }]}>{o.texto}</Texto>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={[s.fila, s.cabecera]}>
        <Texto style={[s.nombre, s.cab]}>Jugador</Texto>
        {['PJ', 'PG', 'PE', 'PP', 'G', 'TA', 'TR'].map((c) => (
          <Texto key={c} style={[s.celda, s.cab]}>
            {c}
          </Texto>
        ))}
      </View>

      <FlatList
        data={filas}
        keyExtractor={(f) => String(f.jugador.id)}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={<Vacio icono="stats-chart-outline" texto="Registra jugadores y partidos para ver estadísticas." />}
        renderItem={({ item: f, index }) => (
          <Pressable
            onPress={() => router.push(`/estadisticas/${f.jugador.id}`)}
            style={[s.fila, { backgroundColor: index % 2 ? colores.fondo : colores.tarjeta }]}
          >
            <View style={s.nombre}>
              <Texto style={estilos.texto} numberOfLines={1}>
                <Text style={estilos.textoSuave}>{index + 1}. </Text>
                {nombreVisible(f.jugador)}
              </Texto>
              <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                {f.ultimos.map((r, i) => (
                  <Resultado key={i} r={r} />
                ))}
              </View>
            </View>
            <Texto style={s.celda}>{f.pj}</Texto>
            <Texto style={[s.celda, { color: colores.victoria }]}>{f.pg}</Texto>
            <Texto style={[s.celda, { color: colores.empate }]}>{f.pe}</Texto>
            <Texto style={[s.celda, { color: colores.derrota }]}>{f.pp}</Texto>
            <Texto style={[s.celda, { fontWeight: '800' }]}>{f.goles}</Texto>
            <Texto style={[s.celda, { color: colores.textoAmarilla }]}>{f.amarillas}</Texto>
            <Texto style={[s.celda, { color: colores.roja }]}>{f.rojas}</Texto>
          </Pressable>
        )}
      />
    </View>
  );
}

const useS = crearEstilos((c) => ({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.borde,
    backgroundColor: c.tarjeta,
  },
  chipTexto: { color: c.texto, fontWeight: '600', fontSize: 13 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  cabecera: { backgroundColor: c.primarioSuave, paddingVertical: 8 },
  cab: { fontWeight: '800', color: c.primarioOscuro, fontSize: 12 },
  nombre: { flex: 1, paddingRight: 4 },
  celda: { width: 30, textAlign: 'center', color: c.texto, fontSize: 14 },
}));
