import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Boton, Campo, Selector, Texto, useEstilos } from '../../components/ui';
import {
  actualizarPena,
  crearPena,
  eliminarPena,
  listarJugadores,
  obtenerPena,
  type DatosPena,
} from '../../db/repositorio';
import { borrarFoto } from '../../lib/fotos';
import { usePena } from '../../lib/PenaActiva';
import { LISTA_MODALIDADES, MODALIDADES, type Modalidad } from '../../lib/tipos';

const VACIA: DatosPena = { nombre: '', descripcion: '', lugar: '', dia: '', hora: '', modalidad: 'f7' };

export default function EditarPena() {
  const db = useSQLiteContext();
  const estilos = useEstilos();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { seleccionarPena, recargarPena } = usePena();
  const [datos, setDatos] = useState<DatosPena>(VACIA);
  const editando = !!id;

  useEffect(() => {
    if (!id) return;
    obtenerPena(db, Number(id)).then((p) => {
      if (p) {
        const { id: _id, creada_en: _c, ...resto } = p;
        setDatos(resto);
      }
    });
  }, [db, id]);

  const cambiar = <K extends keyof DatosPena>(k: K, v: DatosPena[K]) => setDatos((d) => ({ ...d, [k]: v }));

  async function guardar() {
    const limpio = { ...datos, nombre: datos.nombre.trim() };
    if (!limpio.nombre) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a la peña.');
      return;
    }
    if (editando) {
      await actualizarPena(db, Number(id), limpio);
      await recargarPena();
    } else {
      const nuevoId = await crearPena(db, limpio);
      await seleccionarPena(nuevoId);
    }
    router.back();
  }

  function eliminar() {
    Alert.alert(
      'Eliminar peña',
      `Se borrarán la peña "${datos.nombre}", sus jugadores, partidos y estadísticas. No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const jugadores = await listarJugadores(db, Number(id), true);
            await eliminarPena(db, Number(id));
            jugadores.forEach((j) => borrarFoto(j.foto));
            await seleccionarPena(null);
            router.dismissAll();
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: editando ? 'Editar peña' : 'Nueva peña' }} />
      <Campo etiqueta="Nombre *" value={datos.nombre} onChangeText={(v) => cambiar('nombre', v)} placeholder="Peña Los Cracks" />
      <Campo
        etiqueta="Descripción"
        value={datos.descripcion}
        onChangeText={(v) => cambiar('descripcion', v)}
        placeholder="Amigos del barrio que juegan cada semana"
        multiline
        style={{ minHeight: 70, textAlignVertical: 'top' }}
      />
      <Campo etiqueta="Campo / lugar" value={datos.lugar} onChangeText={(v) => cambiar('lugar', v)} placeholder="Polideportivo Municipal" />
      <Campo etiqueta="Día habitual" value={datos.dia} onChangeText={(v) => cambiar('dia', v)} placeholder="Jueves" />
      <Campo etiqueta="Hora" value={datos.hora} onChangeText={(v) => cambiar('hora', v)} placeholder="21:00" />
      <Texto style={estilos.etiqueta}>Modalidad habitual</Texto>
      <Selector<Modalidad>
        opciones={LISTA_MODALIDADES.map((m) => ({ valor: m, texto: MODALIDADES[m].nombre }))}
        valor={datos.modalidad}
        onCambio={(v) => cambiar('modalidad', v)}
      />
      <Boton titulo="Guardar" icono="checkmark" onPress={guardar} style={{ marginTop: 8 }} />
      {editando && <Boton titulo="Eliminar peña" icono="trash" variante="peligro" onPress={eliminar} style={{ marginTop: 12 }} />}
    </ScrollView>
  );
}
