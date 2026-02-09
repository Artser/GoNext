import { Platform } from 'react-native';
import { databaseService } from './database';
import { PlacePhoto, DatabasePlacePhoto } from '../types';
import { generateId, getCurrentDate } from '../utils/database';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Сервис для работы с фотографиями мест
 */
class PhotoService {
  /**
   * Директория для хранения фотографий
   */
  private readonly photosDirectory = Platform.OS === 'web' 
    ? 'photos/' 
    : `${FileSystem.documentDirectory}photos/`;
  private isWeb = Platform.OS === 'web';

  /**
   * Инициализация директории для фотографий
   */
  async initializeDirectory(): Promise<void> {
    if (this.isWeb) {
      // На веб-платформе файловая система не поддерживается
      console.warn('Файловая система не поддерживается на веб-платформе');
      return;
    }

    const dirInfo = await FileSystem.getInfoAsync(this.photosDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.photosDirectory, { intermediates: true });
    }
  }

  /**
   * Выбор фотографии из галереи или камеры
   */
  async pickImage(): Promise<string | null> {
    if (this.isWeb) {
      throw new Error('Выбор фотографий не поддерживается на веб-платформе');
    }

    try {
      // Запрашиваем разрешения
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Разрешение на доступ к галерее не предоставлено');
      }

      // Запускаем выбор изображения
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      // Копируем файл в директорию приложения
      await this.initializeDirectory();
      const fileName = `${generateId()}.jpg`;
      const newPath = `${this.photosDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: newPath,
      });

      return newPath;
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
      throw error;
    }
  }

  /**
   * Сделать фото камерой
   */
  async takePhoto(): Promise<string | null> {
    if (this.isWeb) {
      throw new Error('Камера не поддерживается на веб-платформе');
    }

    try {
      // Запрашиваем разрешения
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Разрешение на доступ к камере не предоставлено');
      }

      // Запускаем камеру
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      // Копируем файл в директорию приложения
      await this.initializeDirectory();
      const fileName = `${generateId()}.jpg`;
      const newPath = `${this.photosDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: newPath,
      });

      return newPath;
    } catch (error) {
      console.error('Ошибка создания фото:', error);
      throw error;
    }
  }

  /**
   * Добавление фотографии к месту
   */
  async addPhotoToPlace(
    placeId: string,
    filePath: string,
    tripPlaceId?: string
  ): Promise<PlacePhoto> {
    if (this.isWeb) {
      throw new Error('Добавление фотографий не поддерживается на веб-платформе');
    }

    const db = databaseService.getDatabase();
    const id = generateId();
    const createdAt = getCurrentDate();

    await db.runAsync(
      `INSERT INTO place_photos (id, placeId, tripPlaceId, filePath, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [id, placeId, tripPlaceId || null, filePath, createdAt]
    );

    return {
      id,
      placeId,
      tripPlaceId: tripPlaceId || undefined,
      filePath,
      createdAt,
    };
  }

  /**
   * Получение всех фотографий места
   */
  async getPhotosByPlaceId(placeId: string): Promise<PlacePhoto[]> {
    if (this.isWeb) {
      return []; // На веб-платформе возвращаем пустой массив
    }

    const db = databaseService.getDatabase();
    const results = await db.getAllAsync<DatabasePlacePhoto>(
      'SELECT * FROM place_photos WHERE placeId = ? ORDER BY createdAt DESC',
      [placeId]
    );

    return results.map((row) => this.mapDatabasePhotoToPhoto(row));
  }

  /**
   * Получение фотографий места в поездке
   */
  async getPhotosByTripPlaceId(tripPlaceId: string): Promise<PlacePhoto[]> {
    if (this.isWeb) {
      return []; // На веб-платформе возвращаем пустой массив
    }

    const db = databaseService.getDatabase();
    const results = await db.getAllAsync<DatabasePlacePhoto>(
      'SELECT * FROM place_photos WHERE tripPlaceId = ? ORDER BY createdAt DESC',
      [tripPlaceId]
    );

    return results.map((row) => this.mapDatabasePhotoToPhoto(row));
  }

  /**
   * Удаление фотографии
   */
  async deletePhoto(id: string): Promise<void> {
    if (this.isWeb) {
      throw new Error('Удаление фотографий не поддерживается на веб-платформе');
    }

    const db = databaseService.getDatabase();

    // Получаем информацию о фотографии
    const photo = await db.getFirstAsync<DatabasePlacePhoto>(
      'SELECT * FROM place_photos WHERE id = ?',
      [id]
    );

    if (!photo) {
      throw new Error(`Фотография с ID ${id} не найдена`);
    }

    // Удаляем файл
    try {
      const fileInfo = await FileSystem.getInfoAsync(photo.filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(photo.filePath, { idempotent: true });
      }
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      // Продолжаем удаление записи из БД даже если файл не найден
    }

    // Удаляем запись из БД
    await db.runAsync('DELETE FROM place_photos WHERE id = ?', [id]);
  }

  /**
   * Удаление всех фотографий места
   */
  async deletePhotosByPlaceId(placeId: string): Promise<void> {
    const photos = await this.getPhotosByPlaceId(placeId);
    for (const photo of photos) {
      await this.deletePhoto(photo.id);
    }
  }

  /**
   * Удаление всех фотографий места в поездке
   */
  async deletePhotosByTripPlaceId(tripPlaceId: string): Promise<void> {
    const photos = await this.getPhotosByTripPlaceId(tripPlaceId);
    for (const photo of photos) {
      await this.deletePhoto(photo.id);
    }
  }

  /**
   * Преобразование DatabasePlacePhoto в PlacePhoto
   */
  private mapDatabasePhotoToPhoto(dbPhoto: DatabasePlacePhoto): PlacePhoto {
    return {
      id: dbPhoto.id,
      placeId: dbPhoto.placeId,
      tripPlaceId: dbPhoto.tripPlaceId || undefined,
      filePath: dbPhoto.filePath,
      createdAt: dbPhoto.createdAt,
    };
  }
}

export const photoService = new PhotoService();
