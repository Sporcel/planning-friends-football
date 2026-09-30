import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Avatar, Boton, Campo, Selector, Tarjeta, Texto, Titulo, Vacio, useEstilos } from '../../components/ui';
import { crearPartido, estadisticasPena, listarJugadores } from '../../db/repositorio';
import { construirReparto, generarEquipos, valorarJugador, type JugadorValorado, type Reparto } from '../../lib/equipos';
import { usePena } from '../../lib/PenaActiva';
import { crearEstilos, useColores } from '../../lib/tema';
import {
  LISTA_MODALIDADES,
  MODALIDADES,
  POSICIONES,
  hoyISO,
  nombreVisible,
  type Equipo,
  type Modalidad,
} from '../../lib/tipos';

export default function NuevoPartido() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const s = useS();
  const { pena } = usePena();
  const [fecha, setFecha] = useState(hoyISO());
  const [modalidad, setModalidad] = useState<Modalidad>(pena?.modalidad ?? 'f7');
  const [jugadores, setJugadores] = useState<JugadorValorado[]>([]);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [reparto, setReparto] = useState<Reparto | null>(null);
  const [marcado, setMarcado] = useState<{ equipo: Equipo; id: number } | null>(null);

  const porEquipo = MODALIDADES[modalidad].porEquipo;
  const necesarios = porEquipo * 2;

  useEffect(() => {
    if (!pena) return;
    (async () => {
      const [lista, stats] = await Promise.all([listarJugadores(db, pena.id), estadisticasPena(db, pena.id)]);
      setJugadores(lista.map((j) => ({ jugador: j, valoracion: valorarJugador(j, stats.get(j.id)).valoracion })));
    })();
  }, [db, pena]);

  const elegidos = useMemo(() => jugadores.filter((j) => seleccion.has(j.jugador.id)), [jugadores, seleccion]);

  function alternar(id: number) {
    setSeleccion((sel) => {
      const n = new Set(sel);
      if (n.has(id)) n.delete(id);
      else if (n.size < necesarios) n.add(id);
      return n;
    });
  }

  function cambiarModalidad(m: Modalidad) {
    setModalidad(m);
    setReparto(null);
    // Si sobran jugadores seleccionados, se quedan los primeros.
    setSeleccion((sel) => new Set([...sel].slice(0, MODALIDADES[m].porEquipo * 2)));
  }

  function generar(variar: boolean) {
    setMarcado(null);
    setReparto(generarEquipos(elegidos, porEquipo, { variar }));
  }

  /** Toca un jugador de cada equipo para intercambiarlos manualmente. */
  function tocarJugador(equipo: Equipo, id: number) {
    if (!reparto) return;
    if (!marcado || marcado.equipo === equipo) {
      setMarcado(marcado?.id === id ? null : { equipo, id });
      return;
    }
    const a = [...reparto.equipoA];
    const b = [...reparto.equipoB];
    const idA = equipo === 'A' ? id : marcado.id;
    const idB = equipo === 'B' ? id : marcado.id;
    const ia = a.findIndex((x) => x.jugador.id === idA);
    const ib = b.findIndex((x) => x.jugador.id === idB);
    [a[ia], b[ib]] = [b[ib], a[ia]];
    setReparto(construirReparto(a, b));
    setMarcado(null);
  }

  async function guardar() {
    if (!pena || !reparto) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      Alert.alert('Fecha no válida', 'Usa el formato AAAA-MM-DD.');
      return;
    }
    const id = await crearPartido(db, {
      penaId: pena.id,
      fecha,
      modalidad,
      equipoA: reparto.equipoA.map((x) => x.jugador.id),
      equipoB: reparto.equipoB.map((x) => x.jugador.id),
      valoracionA: reparto.totalA,
      valoracionB: reparto.totalB,
    });
    router.replace(`/partido/${id}`);
  }

  if (!pena) return null;

  if (reparto) {
    return (
      <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
        <Tarjeta style={{ alignItems: 'center' }}>
          <Texto style={estilos.textoSuave}>Equilibrio entre equipos</Texto>
          <Texto style={{ fontSize: 32, fontWeight: '800', color: colores.primario }}>{reparto.equilibrio.toFixed(1)}%</Texto>
          <Texto style={[estilos.textoSuave, { textAlign: 'center' }]}>
            Toca un jugador de cada equipo para intercambiarlos.
          </Texto>
        </Tarjeta>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['A', 'B'] as const).map((eq) => (
            <ColumnaEquipo
              key={eq}
              equipo={eq}
              jugadores={eq === 'A' ? reparto.equipoA : reparto.equipoB}
              total={eq === 'A' ? reparto.totalA : reparto.totalB}
              marcado={marcado}
              onTocar={tocarJugador}
            />
          ))}
        </View>
        <Boton titulo="Guardar partido" icono="save" onPress={guardar} style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Boton titulo="Regenerar" icono="shuffle" variante="secundario" onPress={() => generar(true)} style={{ flex: 1 }} />
          <Boton titulo="Jugadores" icono="arrow-back" variante="secundario" onPress={() => setReparto(null)} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled">
        <Campo etiqueta="Fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} />
        <Texto style={estilos.etiqueta}>Modalidad</Texto>
        <Selector<Modalidad>
          opciones={LISTA_MODALIDADES.map((m) => ({ valor: m, texto: MODALIDADES[m].nombre }))}
          valor={modalidad}
          onCambio={cambiarModalidad}
        />
        <Titulo>
          Convocados {seleccion.size}/{necesarios}
        </Titulo>
        {jugadores.length < necesarios && (
          <Texto style={[estilos.textoSuave, { marginBottom: 8, color: colores.roja }]}>
            Para {MODALIDADES[modalidad].nombre} necesitas {necesarios} jugadores y la peña tiene {jugadores.length} activos.
          </Texto>
        )}
        {jugadores.length === 0 ? (
          <Vacio icono="people-outline" texto="Registra jugadores en la pestaña Jugadores." />
        ) : (
          <Tarjeta style={{ paddingVertical: 4 }}>
            {jugadores.map(({ jugador: j, valoracion }, i) => {
              const elegido = seleccion.has(j.id);
              const bloqueado = !elegido && seleccion.size >= necesarios;
              return (
                <Pressable
                  key={j.id}
                  onPress={() => alternar(j.id)}
                  disabled={bloqueado}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: elegido, disabled: bloqueado }}
                >
                  {i > 0 && <View style={[estilos.separador, { marginVertical: 0 }]} />}
                  <View style={[estilos.fila, { paddingVertical: 10, opacity: bloqueado ? 0.4 : 1 }]}>
                    <Ionicons
                      name={elegido ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={elegido ? colores.primario : colores.textoSuave}
                    />
                    <Avatar nombre={j.nombre} foto={j.foto} tamano={34} />
                    <View style={{ flex: 1 }}>
                      <Texto style={estilos.texto}>{nombreVisible(j)}</Texto>
                      <Texto style={estilos.textoSuave}>{POSICIONES[j.posicion]}</Texto>
                    </View>
                    <Texto style={{ fontWeight: '700', color: colores.primario }}>{Math.round(valoracion)}</Texto>
                  </View>
                </Pressable>
              );
            })}
          </Tarjeta>
        )}
      </ScrollView>
      <View style={s.barraInferior}>
        <Boton
          titulo={seleccion.size === necesarios ? 'Generar equipos' : `Selecciona ${necesarios - seleccion.size} más`}
          icono="people"
          deshabilitado={seleccion.size !== necesarios}
          onPress={() => generar(false)}
        />
      </View>
    </View>
  );
}

function ColumnaEquipo({
  equipo,
  jugadores,
  total,
  marcado,
  onTocar,
}: {
  equipo: Equipo;
  jugadores: JugadorValorado[];
  total: number;
  marcado: { equipo: Equipo; id: number } | null;
  onTocar: (e: Equipo, id: number) => void;
}) {
  const colores = useColores();
  const estilos = useEstilos();
  const s = useS();
  const color = equipo === 'A' ? colores.equipoA : colores.equipoB;
  const suave = equipo === 'A' ? colores.equipoASuave : colores.equipoBSuave;
  return (
    <View style={{ flex: 1 }}>
      <View style={[s.cabeceraEquipo, { backgroundColor: color }]}>
        <Texto style={s.cabeceraTexto}>Equipo {equipo}</Texto>
        <Texto style={{ color: colores.sobrePrimario, fontSize: 12 }}>Valoración {Math.round(total)}</Texto>
      </View>
      {jugadores.map(({ jugador: j, valoracion }) => {
        const sel = marcado?.id === j.id;
        return (
          <Pressable
            key={j.id}
            onPress={() => onTocar(equipo, j.id)}
            accessibilityState={{ selected: sel }}
            style={[s.jugador, { backgroundColor: sel ? colores.estrella : suave }]}
          >
            <Avatar nombre={j.nombre} foto={j.foto} color={color} tamano={28} />
            <View style={{ flex: 1 }}>
              <Texto style={[estilos.texto, { fontWeight: '600' }, sel && { color: colores.sobrePrimario }]} numberOfLines={1}>
                {nombreVisible(j)}
              </Texto>
              <Texto style={[estilos.textoSuave, sel && { color: colores.sobrePrimario }]}>
                {POSICIONES[j.posicion].slice(0, 3)} · {Math.round(valoracion)}
              </Texto>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const useS = crearEstilos((c) => ({
  barraInferior: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: c.tarjeta,
    borderTopWidth: 1,
    borderTopColor: c.borde,
  },
  cabeceraEquipo: { borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 6 },
  cabeceraTexto: { color: c.sobrePrimario, fontWeight: '800', fontSize: 16 },
  jugador: { borderRadius: 8, padding: 8, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
}));
