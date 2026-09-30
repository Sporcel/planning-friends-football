import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Avatar, Boton, Campo, Contador, Tarjeta, Texto, Titulo, useEstilos } from '../../components/ui';
import {
  eliminarPartido,
  guardarResultado,
  listarJugadores,
  listarParticipaciones,
  obtenerPartido,
} from '../../db/repositorio';
import { useColores } from '../../lib/tema';
import { MODALIDADES, nombreVisible, type Equipo, type Jugador, type Participacion, type Partido } from '../../lib/tipos';

export default function DetallePartido() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [partido, setPartido] = useState<Partido | null>(null);
  const [jugadores, setJugadores] = useState<Map<number, Jugador>>(new Map());
  const [part, setPart] = useState<Participacion[]>([]);
  const [fecha, setFecha] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    (async () => {
      const p = await obtenerPartido(db, Number(id));
      if (!p) return;
      const [lista, participaciones] = await Promise.all([
        listarJugadores(db, p.pena_id, true),
        listarParticipaciones(db, p.id),
      ]);
      setPartido(p);
      setFecha(p.fecha);
      setNotas(p.notas);
      setJugadores(new Map(lista.map((j) => [j.id, j])));
      setPart(participaciones);
    })();
  }, [db, id]);

  if (!partido) return null;

  const goles = (eq: Equipo) => part.filter((p) => p.equipo === eq).reduce((s, p) => s + p.goles, 0);
  const actualizar = (jugadorId: number, cambios: Partial<Participacion>) =>
    setPart((ps) => ps.map((p) => (p.jugador_id === jugadorId ? { ...p, ...cambios } : p)));

  async function guardar() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      Alert.alert('Fecha no válida', 'Usa el formato AAAA-MM-DD.');
      return;
    }
    await guardarResultado(db, partido!.id, { fecha, notas, participaciones: part });
    router.back();
  }

  function eliminar() {
    Alert.alert('Eliminar partido', 'Se borrará el partido y sus estadísticas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarPartido(db, partido!.id);
          router.back();
        },
      },
    ]);
  }

  const marcador = { fontSize: 48, fontWeight: '800' } as const;

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      <Tarjeta style={{ alignItems: 'center' }}>
        <Texto style={estilos.textoSuave}>
          {MODALIDADES[partido.modalidad].nombre} · {partido.estado === 'jugado' ? 'Jugado' : 'Pendiente de resultado'}
        </Texto>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 }}>
          <Texto style={[marcador, { color: colores.equipoA }]}>{goles('A')}</Texto>
          <Texto style={[marcador, { color: colores.textoSuave }]}>-</Texto>
          <Texto style={[marcador, { color: colores.equipoB }]}>{goles('B')}</Texto>
        </View>
        <Texto style={[estilos.textoSuave, { marginTop: 4 }]}>
          Valoración inicial {Math.round(partido.valoracion_a)} vs {Math.round(partido.valoracion_b)}
        </Texto>
      </Tarjeta>

      <Texto style={[estilos.textoSuave, { marginBottom: 12 }]}>
        Anota los goles y tarjetas de cada jugador; el marcador se calcula solo.
      </Texto>

      {(['A', 'B'] as const).map((eq) => (
        <View key={eq}>
          <Titulo>Equipo {eq}</Titulo>
          <Tarjeta style={{ borderLeftWidth: 5, borderLeftColor: eq === 'A' ? colores.equipoA : colores.equipoB }}>
            {part
              .filter((p) => p.equipo === eq)
              .map((p, i) => {
                const j = jugadores.get(p.jugador_id);
                const nombre = j ? nombreVisible(j) : 'Jugador eliminado';
                return (
                  <View key={p.jugador_id}>
                    {i > 0 && <View style={estilos.separador} />}
                    <View style={[estilos.fila, { marginBottom: 6, gap: 8 }]}>
                      <Avatar
                        nombre={j?.nombre ?? '?'}
                        foto={j?.foto}
                        color={eq === 'A' ? colores.equipoA : colores.equipoB}
                        tamano={28}
                      />
                      <Texto style={estilos.negrita}>{nombre}</Texto>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Contador icono="football" valor={p.goles} onCambio={(v) => actualizar(p.jugador_id, { goles: v })} />
                      <Contador
                        icono="square"
                        color={colores.amarilla}
                        valor={p.amarillas}
                        onCambio={(v) => actualizar(p.jugador_id, { amarillas: Math.min(v, 2) })}
                      />
                      <Contador
                        icono="square"
                        color={colores.roja}
                        valor={p.rojas}
                        onCambio={(v) => actualizar(p.jugador_id, { rojas: Math.min(v, 1) })}
                      />
                    </View>
                  </View>
                );
              })}
          </Tarjeta>
        </View>
      ))}

      <Campo etiqueta="Fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} />
      <Campo
        etiqueta="Notas"
        value={notas}
        onChangeText={setNotas}
        multiline
        placeholder="Crónica, MVP, incidencias..."
        style={{ minHeight: 70, textAlignVertical: 'top' }}
      />
      <Boton titulo="Guardar resultado" icono="checkmark" onPress={guardar} />
      <Boton titulo="Eliminar partido" icono="trash" variante="peligro" onPress={eliminar} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}
