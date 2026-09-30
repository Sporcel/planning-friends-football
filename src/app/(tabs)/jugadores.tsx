import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Switch, Text, View } from 'react-native';
import { SinPena, useAlEnfocar } from '../../components/SinPena';
import { Avatar, BotonFlotante, Estrellas, Tarjeta, Texto, Vacio, useEstilos } from '../../components/ui';
import { estadisticasPena, listarJugadores } from '../../db/repositorio';
import { valorarJugador } from '../../lib/equipos';
import { usePena } from '../../lib/PenaActiva';
import { FUENTES, useColores } from '../../lib/tema';
import { HABILIDADES, POSICIONES, nombreVisible, type Jugador } from '../../lib/tipos';

interface Fila {
  jugador: Jugador;
  valoracion: number;
}

export default function PantallaJugadores() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const { pena } = usePena();
  const [filas, setFilas] = useState<Fila[]>([]);
  const [verBajas, setVerBajas] = useState(false);

  const cargar = useCallback(async () => {
    if (!pena) return;
    const [jugadores, stats] = await Promise.all([listarJugadores(db, pena.id, verBajas), estadisticasPena(db, pena.id)]);
    setFilas(jugadores.map((j) => ({ jugador: j, valoracion: valorarJugador(j, stats.get(j.id)).valoracion })));
  }, [db, pena, verBajas]);
  useAlEnfocar(cargar);

  if (!pena) return <SinPena />;

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={filas}
        keyExtractor={(f) => String(f.jugador.id)}
        contentContainerStyle={estilos.contenido}
        ListHeaderComponent={
          <View style={[estilos.fila, { justifyContent: 'flex-end', marginBottom: 8 }]}>
            <Texto style={estilos.textoSuave}>Mostrar bajas</Texto>
            <Switch value={verBajas} onValueChange={setVerBajas} trackColor={{ true: colores.primario }} />
          </View>
        }
        ListEmptyComponent={<Vacio icono="people-outline" texto="No hay jugadores. Pulsa + para registrar el primero." />}
        renderItem={({ item: { jugador: j, valoracion } }) => (
          <Pressable onPress={() => router.push(`/jugador/${j.id}`)}>
            <Tarjeta style={{ opacity: j.activo ? 1 : 0.5 }}>
              <View style={estilos.fila}>
                <Avatar nombre={j.nombre} foto={j.foto} color={j.activo ? colores.primario : colores.textoSuave} />
                <View style={{ flex: 1 }}>
                  <Texto style={estilos.negrita}>
                    {nombreVisible(j)}
                    {!j.activo && <Text style={[estilos.textoSuave, { fontFamily: FUENTES.regular }]}> (baja)</Text>}
                  </Texto>
                  <Texto style={estilos.textoSuave}>
                    {j.apodo ? `${j.nombre} · ` : ''}
                    {POSICIONES[j.posicion]}
                  </Texto>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Texto style={{ fontSize: 20, fontWeight: '800', color: colores.primario }}>{Math.round(valoracion)}</Texto>
                  <Texto style={[estilos.textoSuave, { fontSize: 11 }]}>valoración</Texto>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, rowGap: 4 }}>
                {HABILIDADES.map((h) => (
                  <View key={h.clave} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Texto style={[estilos.textoSuave, { width: 78 }]}>{h.nombre}</Texto>
                    <Estrellas valor={j[h.clave]} tamano={12} />
                  </View>
                ))}
              </View>
            </Tarjeta>
          </Pressable>
        )}
      />
      <BotonFlotante icono="person-add" onPress={() => router.push('/jugador/nuevo')} />
    </View>
  );
}
