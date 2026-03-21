import { File, Directory, Paths } from 'expo-file-system';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function persistPhoto(tempUri: string): Promise<string> {
  const photosDir = new Directory(Paths.document, 'photos');
  photosDir.create({ intermediates: true });

  const ext = tempUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const dest = new File(photosDir, generateId() + '.' + ext);

  new File(tempUri).copy(dest);
  return dest.uri;
}

export function deletePhoto(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    // ignore
  }
}
