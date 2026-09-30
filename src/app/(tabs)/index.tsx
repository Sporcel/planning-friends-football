import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SinPena, useAlEnfocar } from '../../components/SinPena';
import { Avatar, Boton, Estrellas, Tarjeta, Texto, Titulo, useEstilos } from '../../components/ui';
import { listarJugadores, listarPartidos } from '../../db/repositorio';
import { usePena } from '../../lib/PenaActiva';
import { useColores } from '../../lib/tema';
import {
  HABILIDADES,
  MODALIDADES,
  POSICIONES,
  formatearFecha,
  nombreVisible,
  type Jugador,
  type Partido,
} from '../../lib/tipos';

export default function PantallaPena() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const { pena, cargando } = usePena();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);

  const cargar = useCallback(async () => {
    if (!pena) return;
    setJugadores(await listarJugadores(db, pena.id));
    setPartidos(await listarPartidos(db, pena.id));
  }, [db, pena]);
  useAlEnfocar(cargar);

  if (cargando) return <ActivityIndicator style={{ flex: 1 }} color={colores.primario} />;
  if (!pena) return <SinPena />;

  const jugados = partidos.filter((p) => p.estado === 'jugado');
  const goles = jugados.reduce((s, p) => s + p.goles_a + p.goles_b, 0);
  const ultimo = jugados[0];
  const mediaHabilidad = (j: Jugador) => HABILIDADES.reduce((s, h) => s + j[h.clave], 0) / HABILIDADES.length;

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Tarjeta style={{ backgroundColor: colores.hero }}>
        <View style={estilos.fila}>
          <Ionicons name="shield" size={48} color={colores.sobrePrimario} />
          <View style={{ flex: 1 }}>
            <Texto style={{ color: colores.sobrePrimario, fontSize: 22, fontWeight: '800' }}>{pena.nombre}</Texto>
            <Texto style={{ color: colores.textoHeroSuave }}>{MODALIDADES[pena.modalidad].nombre}</Texto>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: '/pena/editar', params: { id: pena.id } })}
            hitSlop={8}
            accessibilityLabel="Editar peña"
          >
            <Ionicons name="create-outline" size={24} color={colores.sobrePrimario} />
          </Pressable>
        </View>
        {!!pena.descripcion && (
          <Texto style={{ color: colores.sobrePrimario, marginTop: 12 }}>{pena.descripcion}</Texto>
        )}
        <View style={{ marginTop: 12, gap: 6 }}>
          {!!pena.lugar && <Dato icono="location-outline" texto={pena.lugar} />}
          {!!(pena.dia || pena.hora) && (
            <Dato icono="calendar-outline" texto={[pena.dia, pena.hora].filter(Boolean).join(' · ')} />
          )}
        </View>
      </Tarjeta>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Cifra valor={jugadores.length} texto="Jugadores" />
        <Cifra valor={jugados.length} texto="Partidos" />
        <Cifra valor={goles} texto="Goles" />
      </View>

      {ultimo && (
        <>
          <Titulo>Último partido</Titulo>
          <Pressable onPress={() => router.push(`/partido/${ultimo.id}`)}>
            <Tarjeta style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Texto style={estilos.textoSuave}>
                {formatearFecha(ultimo.fecha)} · {MODALIDADES[ultimo.modalidad].nombre}
              </Texto>
              <Texto style={[estilos.negrita, { fontSize: 20 }]}>
                <Text style={{ color: colores.equipoA }}>{ultimo.goles_a}</Text> -{' '}
                <Text style={{ color: colores.equipoB }}>{ultimo.goles_b}</Text>
              </Texto>
            </Tarjeta>
          </Pressable>
        </>
      )}

      <Titulo>Plantilla</Titulo>
      <Tarjeta>
        {jugadores.length === 0 && <Texto style={estilos.textoSuave}>Todavía no hay jugadores registrados.</Texto>}
        {jugadores.map((j, i) => (
          <View key={j.id}>
            {i > 0 && <View style={estilos.separador} />}
            <View style={estilos.fila}>
              <Avatar nombre={j.nombre} foto={j.foto} />
              <View style={{ flex: 1 }}>
                <Texto style={estilos.negrita}>{nombreVisible(j)}</Texto>
                <Texto style={estilos.textoSuave}>{POSICIONES[j.posicion]}</Texto>
              </View>
              <Estrellas valor={Math.round(mediaHabilidad(j) * 2) / 2} tamano={14} />
            </View>
          </View>
        ))}
        <Boton
          titulo="Añadir jugador"
          icono="person-add"
          variante="secundario"
          style={{ marginTop: 12 }}
          onPress={() => router.push('/jugador/nuevo')}
        />
      </Tarjeta>

      <Boton
        titulo="Cambiar o crear peña"
        icono="swap-horizontal"
        variante="secundario"
        onPress={() => router.push('/pena/lista')}
      />
    </ScrollView>
  );
}

function Dato({ icono, texto }: { icono: 'location-outline' | 'calendar-outline'; texto: string }) {
  const colores = useColores();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icono} size={16} color={colores.textoHeroSuave} />
      <Texto style={{ color: colores.sobrePrimario }}>{texto}</Texto>
    </View>
  );
}

function Cifra({ valor, texto }: { valor: number; texto: string }) {
  const colores = useColores();
  const estilos = useEstilos();
  return (
    <Tarjeta style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
      <Texto style={{ fontSize: 24, fontWeight: '800', color: colores.primario }}>{valor}</Texto>
      <Texto style={estilos.textoSuave}>{texto}</Texto>
    </Tarjeta>
  );
}
