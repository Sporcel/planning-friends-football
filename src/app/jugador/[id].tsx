import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Avatar, Boton, Campo, Estrellas, Selector, Tarjeta, Texto, Titulo, useEstilos } from '../../components/ui';
import {
  actualizarJugador,
  cambiarActivoJugador,
  crearJugador,
  obtenerJugador,
  type DatosJugador,
} from '../../db/repositorio';
import { PermisoDenegado, borrarFoto, elegirFoto, esFotoTemporal, guardarFoto } from '../../lib/fotos';
import { usePena } from '../../lib/PenaActiva';
import { useColores } from '../../lib/tema';
import { HABILIDADES, LISTA_POSICIONES, POSICIONES, type Posicion } from '../../lib/tipos';

const NUEVO: DatosJugador = {
  nombre: '',
  apodo: '',
  posicion: 'medio',
  pase: 3,
  defensa: 3,
  tiro: 3,
  velocidad: 3,
  resistencia: 3,
  foto: null,
};

export default function FormularioJugador() {
  const db = useSQLiteContext();
  const colores = useColores();
  const estilos = useEstilos();
  const { pena } = usePena();
  const { id } = useLocalSearchParams<{ id: string }>();
  const esNuevo = id === 'nuevo';
  const [datos, setDatos] = useState<DatosJugador>(NUEVO);
  const [fotoOriginal, setFotoOriginal] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (esNuevo) return;
    obtenerJugador(db, Number(id)).then((j) => {
      if (!j) return;
      const { id: _i, pena_id: _p, activo: a, ...resto } = j;
      setDatos(resto);
      setFotoOriginal(j.foto);
      setActivo(!!a);
    });
  }, [db, id, esNuevo]);

  const cambiar = <K extends keyof DatosJugador>(k: K, v: DatosJugador[K]) => setDatos((d) => ({ ...d, [k]: v }));

  async function ponerFoto(origen: 'camara' | 'galeria') {
    try {
      const uri = await elegirFoto(origen);
      if (uri) cambiar('foto', uri);
    } catch (e) {
      if (e instanceof PermisoDenegado) {
        Alert.alert('Sin permiso', 'Activa el permiso de cámara para Planning Friends Football en los ajustes del móvil.');
      } else {
        Alert.alert('Error', 'No se pudo cargar la foto.');
      }
    }
  }

  async function guardar() {
    const limpio = { ...datos, nombre: datos.nombre.trim(), apodo: datos.apodo.trim() };
    if (!limpio.nombre) {
      Alert.alert('Falta el nombre', 'Indica el nombre del jugador.');
      return;
    }
    setGuardando(true);
    try {
      // La foto nueva se copia a la carpeta de la app solo al guardar.
      if (limpio.foto && esFotoTemporal(limpio.foto)) limpio.foto = await guardarFoto(limpio.foto);
      if (esNuevo) {
        if (!pena) return;
        await crearJugador(db, pena.id, limpio);
      } else {
        await actualizarJugador(db, Number(id), limpio);
      }
      if (fotoOriginal && fotoOriginal !== limpio.foto) borrarFoto(fotoOriginal);
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el jugador.');
    } finally {
      setGuardando(false);
    }
  }

  async function alternarBaja() {
    await cambiarActivoJugador(db, Number(id), !activo);
    router.back();
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo jugador' : 'Editar jugador' }} />

      <View style={{ alignItems: 'center', marginBottom: 16, gap: 10 }}>
        <Pressable onPress={() => ponerFoto('galeria')} accessibilityLabel="Elegir foto de la galería">
          <Avatar nombre={datos.nombre} foto={datos.foto} tamano={110} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Boton titulo="Cámara" icono="camera" variante="secundario" onPress={() => ponerFoto('camara')} />
          <Boton titulo="Galería" icono="images" variante="secundario" onPress={() => ponerFoto('galeria')} />
        </View>
        {datos.foto && (
          <Pressable onPress={() => cambiar('foto', null)} hitSlop={8}>
            <Texto style={{ color: colores.roja, fontWeight: '600' }}>Quitar foto</Texto>
          </Pressable>
        )}
      </View>

      <Campo etiqueta="Nombre *" value={datos.nombre} onChangeText={(v) => cambiar('nombre', v)} placeholder="Nombre y apellido" />
      <Campo etiqueta="Apodo" value={datos.apodo} onChangeText={(v) => cambiar('apodo', v)} placeholder="Opcional" />

      <Texto style={estilos.etiqueta}>Posición</Texto>
      <Selector<Posicion>
        opciones={LISTA_POSICIONES.map((p) => ({ valor: p, texto: p === 'medio' ? 'Medio' : POSICIONES[p] }))}
        valor={datos.posicion}
        onCambio={(v) => cambiar('posicion', v)}
      />

      <Titulo>Habilidades</Titulo>
      <Tarjeta>
        {HABILIDADES.map((h, i) => (
          <View key={h.clave}>
            {i > 0 && <View style={estilos.separador} />}
            <View style={[estilos.fila, { justifyContent: 'space-between', paddingVertical: 4 }]}>
              <Texto style={estilos.negrita}>{h.nombre}</Texto>
              <Estrellas valor={datos[h.clave]} onCambio={(v) => cambiar(h.clave, v)} tamano={28} />
            </View>
          </View>
        ))}
      </Tarjeta>
      <Texto style={[estilos.textoSuave, { marginBottom: 16 }]}>
        Las estrellas se combinan con los resultados reales de los partidos para calcular la valoración que se usa al
        hacer los equipos.
      </Texto>

      <Boton titulo={guardando ? 'Guardando…' : 'Guardar'} icono="checkmark" onPress={guardar} deshabilitado={guardando} />
      {!esNuevo && (
        <>
          <Boton
            titulo="Ver estadísticas"
            icono="stats-chart"
            variante="secundario"
            style={{ marginTop: 12 }}
            onPress={() => router.push(`/estadisticas/${id}`)}
          />
          <Boton
            titulo={activo ? 'Dar de baja' : 'Reactivar jugador'}
            icono={activo ? 'person-remove' : 'person-add'}
            variante={activo ? 'peligro' : 'secundario'}
            style={{ marginTop: 12 }}
            onPress={alternarBaja}
          />
          {activo && (
            <Texto style={[estilos.textoSuave, { marginTop: 6, textAlign: 'center' }]}>
              Al dar de baja se conserva su histórico de partidos.
            </Texto>
          )}
        </>
      )}
    </ScrollView>
  );
}
