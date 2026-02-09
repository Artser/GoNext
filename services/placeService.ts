import { Platform } from 'react-native';
import { databaseService } from './database';
import { Place, DatabasePlace } from '../types';
import { booleanToInt, intToBoolean, generateId, getCurrentDate } from '../utils/database';

/**
 * Сервис для работы с местами (CRUD операции)
 */
class PlaceService {
  private isWeb = Platform.OS === 'web';
  /**
   * Создание нового места
   */
  async createPlace(place: Omit<Place, 'id' | 'createdAt'>): Promise<Place> {
    const db = databaseService.getDatabase();
    const id = generateId();
    const createdAt = getCurrentDate();

    await db.runAsync(
      `INSERT INTO places (id, name, description, visitlater, liked, dd, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        place.name,
        place.description || null,
        booleanToInt(place.visitlater),
        booleanToInt(place.liked),
        place.dd || null,
        createdAt,
      ]
    );

    return {
      ...place,
      id,
      createdAt,
    };
  }

  /**
   * Получение места по ID
   */
  async getPlaceById(id: string): Promise<Place | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync<DatabasePlace>(
      'SELECT * FROM places WHERE id = ?',
      [id]
    );

    if (!result) {
      return null;
    }

    return this.mapDatabasePlaceToPlace(result);
  }

  /**
   * Получение всех мест
   */
  async getAllPlaces(): Promise<Place[]> {
    if (this.isWeb) {
      return []; // На веб-платформе возвращаем пустой массив
    }

    const db = databaseService.getDatabase();
    const results = await db.getAllAsync<DatabasePlace>(
      'SELECT * FROM places ORDER BY createdAt DESC'
    );

    return results.map((row) => this.mapDatabasePlaceToPlace(row));
  }

  /**
   * Получение мест с фильтрацией
   */
  async getPlaces(filters?: {
    visitlater?: boolean;
    liked?: boolean;
    search?: string;
  }): Promise<Place[]> {
    const db = databaseService.getDatabase();
    let query = 'SELECT * FROM places WHERE 1=1';
    const params: any[] = [];

    if (filters?.visitlater !== undefined) {
      query += ' AND visitlater = ?';
      params.push(booleanToInt(filters.visitlater));
    }

    if (filters?.liked !== undefined) {
      query += ' AND liked = ?';
      params.push(booleanToInt(filters.liked));
    }

    if (filters?.search) {
      query += ' AND name LIKE ?';
      params.push(`%${filters.search}%`);
    }

    query += ' ORDER BY createdAt DESC';

    const results = await db.getAllAsync<DatabasePlace>(query, params);
    return results.map((row) => this.mapDatabasePlaceToPlace(row));
  }

  /**
   * Обновление места
   */
  async updatePlace(id: string, updates: Partial<Omit<Place, 'id' | 'createdAt'>>): Promise<Place> {
    const db = databaseService.getDatabase();
    const place = await this.getPlaceById(id);

    if (!place) {
      throw new Error(`Место с ID ${id} не найдено`);
    }

    const updatedPlace: Place = {
      ...place,
      ...updates,
    };

    await db.runAsync(
      `UPDATE places 
       SET name = ?, description = ?, visitlater = ?, liked = ?, dd = ?
       WHERE id = ?`,
      [
        updatedPlace.name,
        updatedPlace.description || null,
        booleanToInt(updatedPlace.visitlater),
        booleanToInt(updatedPlace.liked),
        updatedPlace.dd || null,
        id,
      ]
    );

    return updatedPlace;
  }

  /**
   * Удаление места
   */
  async deletePlace(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM places WHERE id = ?', [id]);
  }

  /**
   * Преобразование DatabasePlace в Place
   */
  private mapDatabasePlaceToPlace(dbPlace: DatabasePlace): Place {
    return {
      id: dbPlace.id,
      name: dbPlace.name,
      description: dbPlace.description || undefined,
      visitlater: intToBoolean(dbPlace.visitlater),
      liked: intToBoolean(dbPlace.liked),
      dd: dbPlace.dd || undefined,
      createdAt: dbPlace.createdAt,
    };
  }
}

export const placeService = new PlaceService();
