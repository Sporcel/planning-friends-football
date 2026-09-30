import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useAlEnfocar } from '../../components/SinPena';
import { Avatar, Boton, Estrellas, Resultado, Tarjeta, Texto, Titulo, useEstilos } from '../../components/ui';
import { estadisticasPena, obtenerJugador, partidosDeJugador, type PartidoDeJugador } from '../../db/repositorio';
import { valorarJugador, type Valoracion } from '../../lib/equipos';
import { useColores } from '../../lib/tema';
import {
  HABILIDADES,
  MODALIDADES,
  POSICIONES,
  formatearFecha,
  nombreVisible,
  type EstadisticasJugador,
  type Jugador,
} from '../../lib/tipos';

export default function FichaJugador() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [stats, setStats] = useState<EstadisticasJugador | null>(null);
  const [valoracion, setValoracion] = useState<Valoracion | null>(null);
  const [partidos, setPartidos] = useState<PartidoDeJugador[]>([]);

  const cargar = useCallback(async () => {
    const j = await obtenerJugador(db, Number(id));
    if (!j) return;
    const [mapa, lista] = await Promise.all([estadisticasPena(db, j.pena_id), partidosDeJugador(db, j.id)]);
    const e = mapa.get(j.id) ?? null;
    setJugador(j);
    setStats(e);
    setValoracion(valorarJugador(j, e ?? undefined));
    setPartidos(lista);
  }, [db, id]);
  useAlEnfocar(cargar);

  if (!jugador || !valoracion) return null;
  const e = stats ?? { pj: 0, pg: 0, pe: 0, pp: 0, goles: 0, amarillas: 0, rojas: 0 };

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: nombreVisible(jugador) }} />
      <Tarjeta>
        <View style={estilos.fila}>
          <Avatar nombre={jugador.nombre} foto={jugador.foto} tamano={64} />
          <View style={{ flex: 1 }}>
            <Texto style={estilos.negrita}>{jugador.nombre}</Texto>
            <Texto style={estilos.textoSuave}>{POSICIONES[jugador.posicion]}</Texto>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Texto style={{ fontSize: 28, fontWeight: '800', color: colores.primario }}>
              {Math.round(valoracion.valoracion)}
            </Texto>
            <Texto style={[estilos.textoSuave, { fontSize: 11 }]}>valoración</Texto>
          </View>
        </View>
        <View style={estilos.separador} />
        <Texto style={estilos.textoSuave}>
          Habilidades {Math.round(valoracion.habilidad)}
          {valoracion.rendimiento !== null &&
            ` · Rendimiento ${Math.round(valoracion.rendimiento)} (pesa un ${Math.round(valoracion.pesoRendimiento * 100)}%)`}
        </Texto>
      </Tarjeta>

      <Titulo>Estadísticas</Titulo>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Cifra valor={e.pj} texto="Jugados" color={colores.texto} />
        <Cifra valor={e.pg} texto="Ganados" color={colores.victoria} />
        <Cifra valor={e.pe} texto="Empatados" color={colores.empate} />
        <Cifra valor={e.pp} texto="Perdidos" color={colores.derrota} />
        <Cifra valor={e.goles} texto="Goles" color={colores.primario} />
        <Cifra valor={e.pj ? +(e.goles / e.pj).toFixed(2) : 0} texto="Goles/partido" color={colores.primario} />
        <Cifra valor={e.amarillas} texto="Amarillas" color={colores.textoAmarilla} />
        <Cifra valor={e.rojas} texto="Rojas" color={colores.roja} />
      </View>

      <Titulo>Habilidades</Titulo>
      <Tarjeta>
        {HABILIDADES.map((h) => (
          <View key={h.clave} style={[estilos.fila, { justifyContent: 'space-between', paddingVertical: 4 }]}>
            <Texto style={estilos.texto}>{h.nombre}</Texto>
            <Estrellas valor={jugador[h.clave]} />
          </View>
        ))}
        <Boton
          titulo="Editar jugador"
          icono="create-outline"
          variante="secundario"
          style={{ marginTop: 10 }}
          onPress={() => router.push(`/jugador/${jugador.id}`)}
        />
      </Tarjeta>

      <Titulo>Historial</Titulo>
      {partidos.length === 0 && <Texto style={estilos.textoSuave}>Aún no ha jugado ningún partido.</Texto>}
      {partidos.map((p) => {
        const propios = p.equipo === 'A' ? p.goles_a : p.goles_b;
        const rivales = p.equipo === 'A' ? p.goles_b : p.goles_a;
        const res = propios > rivales ? 'G' : propios < rivales ? 'P' : 'E';
        return (
          <Pressable key={p.id} onPress={() => router.push(`/partido/${p.id}`)}>
            <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
              {p.estado === 'jugado' ? <Resultado r={res} /> : <View style={{ width: 20 }} />}
              <View style={{ flex: 1 }}>
                <Texto style={estilos.texto}>
                  {formatearFecha(p.fecha)} · Equipo {p.equipo}
                </Texto>
                <Texto style={estilos.textoSuave}>{MODALIDADES[p.modalidad].nombre}</Texto>
              </View>
              {p.estado === 'jugado' ? (
                <Texto style={estilos.negrita}>
                  {propios}-{rivales}
                </Texto>
              ) : (
                <Texto style={{ color: colores.estrella, fontWeight: '700' }}>Pendiente</Texto>
              )}
              <Texto style={estilos.textoSuave}>
                {p.goles_jugador > 0 ? `⚽${p.goles_jugador} ` : ''}
                {p.amarillas > 0 ? `🟨${p.amarillas} ` : ''}
                {p.rojas > 0 ? '🟥' : ''}
              </Texto>
            </Tarjeta>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Cifra({ valor, texto, color }: { valor: number; texto: string; color: string }) {
  const estilos = useEstilos();
  return (
    <View style={[estilos.tarjeta, { width: '23%', flexGrow: 1, alignItems: 'center', padding: 10, marginBottom: 0 }]}>
      <Texto style={{ fontSize: 20, fontWeight: '800', color }}>{valor}</Texto>
      <Texto style={[estilos.textoSuave, { fontSize: 11 }]} numberOfLines={1}>
        {texto}
      </Texto>
    </View>
  );
}
