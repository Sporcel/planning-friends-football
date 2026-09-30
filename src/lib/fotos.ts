import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/*
 * Las fotos se copian a una carpeta propia de la app y en la base de datos solo se guarda
 * el nombre del archivo: en iOS la ruta absoluta de documentos cambia al actualizar la app.
 */

const CARPETA = 'fotos';

const OPCIONES: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.6,
};

export class PermisoDenegado extends Error {}

/** Abre la cámara o la galería. Devuelve la URI temporal de la imagen o null si se cancela. */
export async function elegirFoto(origen: 'camara' | 'galeria'): Promise<string | null> {
  let resultado: ImagePicker.ImagePickerResult;
  if (origen === 'camara') {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) throw new PermisoDenegado('camara');
    resultado = await ImagePicker.launchCameraAsync(OPCIONES);
  } else {
    resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES);
  }
  return resultado.canceled ? null : (resultado.assets[0]?.uri ?? null);
}

/** Una foto recién elegida es una URI; una ya guardada es solo el nombre del archivo. */
export function esFotoTemporal(foto: string) {
  return foto.includes('/');
}

/** URI que se puede pasar a <Image> tanto para fotos guardadas como temporales. */
export function uriFoto(foto: string) {
  return esFotoTemporal(foto) ? foto : new File(Paths.document, CARPETA, foto).uri;
}

/** Copia una foto temporal a la carpeta de la app y devuelve el nombre del archivo. */
export async function guardarFoto(uriTemporal: string): Promise<string> {
  const carpeta = new Directory(Paths.document, CARPETA);
  if (!carpeta.exists) carpeta.create({ intermediates: true });
  const extension = uriTemporal.split('.').pop()?.toLowerCase() || 'jpg';
  const nombre = `jugador-${Date.now()}.${extension}`;
  await new File(uriTemporal).copy(new File(carpeta, nombre));
  return nombre;
}

export function borrarFoto(foto: string | null) {
  if (!foto || esFotoTemporal(foto)) return;
  try {
    const archivo = new File(Paths.document, CARPETA, foto);
    if (archivo.exists) archivo.delete();
  } catch {
    // Si no se puede borrar solo queda un archivo huérfano; no debe bloquear al usuario.
  }
}
