import { databaseService } from './database';
import { Trip, DatabaseTrip } from '../types';
import { booleanToInt, intToBoolean, generateId, getCurrentDate } from '../utils/database';

/**
 * Сервис для работы с поездками (CRUD операции)
 */
class TripService {
  /**
   * Создание новой поездки
   */
  async createTrip(trip: Omit<Trip, 'id' | 'createdAt'>): Promise<Trip> {
    const db = databaseService.getDatabase();
    const id = generateId();
    const createdAt = getCurrentDate();

    // Если новая поездка помечена как текущая, снимаем флаг с других поездок
    if (trip.current) {
      await db.runAsync('UPDATE trips SET current = 0 WHERE current = 1');
    }

    await db.runAsync(
      `INSERT INTO trips (id, title, description, startDate, endDate, current, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        trip.title,
        trip.description || null,
        trip.startDate || null,
        trip.endDate || null,
        booleanToInt(trip.current),
        createdAt,
      ]
    );

    return {
      ...trip,
      id,
      createdAt,
    };
  }

  /**
   * Получение поездки по ID
   */
  async getTripById(id: string): Promise<Trip | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync<DatabaseTrip>(
      'SELECT * FROM trips WHERE id = ?',
      [id]
    );

    if (!result) {
      return null;
    }

    return this.mapDatabaseTripToTrip(result);
  }

  /**
   * Получение всех поездок
   */
  async getAllTrips(): Promise<Trip[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync<DatabaseTrip>(
      'SELECT * FROM trips ORDER BY createdAt DESC'
    );

    return results.map((row) => this.mapDatabaseTripToTrip(row));
  }

  /**
   * Получение текущей поездки
   */
  async getCurrentTrip(): Promise<Trip | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync<DatabaseTrip>(
      'SELECT * FROM trips WHERE current = 1 LIMIT 1'
    );

    if (!result) {
      return null;
    }

    return this.mapDatabaseTripToTrip(result);
  }

  /**
   * Обновление поездки
   */
  async updateTrip(id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip> {
    const db = databaseService.getDatabase();
    const trip = await this.getTripById(id);

    if (!trip) {
      throw new Error(`Поездка с ID ${id} не найдена`);
    }

    // Если поездка помечена как текущая, снимаем флаг с других поездок
    if (updates.current === true) {
      await db.runAsync('UPDATE trips SET current = 0 WHERE current = 1 AND id != ?', [id]);
    }

    const updatedTrip: Trip = {
      ...trip,
      ...updates,
    };

    await db.runAsync(
      `UPDATE trips 
       SET title = ?, description = ?, startDate = ?, endDate = ?, current = ?
       WHERE id = ?`,
      [
        updatedTrip.title,
        updatedTrip.description || null,
        updatedTrip.startDate || null,
        updatedTrip.endDate || null,
        booleanToInt(updatedTrip.current),
        id,
      ]
    );

    return updatedTrip;
  }

  /**
   * Удаление поездки
   */
  async deleteTrip(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM trips WHERE id = ?', [id]);
  }

  /**
   * Преобразование DatabaseTrip в Trip
   */
  private mapDatabaseTripToTrip(dbTrip: DatabaseTrip): Trip {
    return {
      id: dbTrip.id,
      title: dbTrip.title,
      description: dbTrip.description || undefined,
      startDate: dbTrip.startDate || undefined,
      endDate: dbTrip.endDate || undefined,
      current: intToBoolean(dbTrip.current),
      createdAt: dbTrip.createdAt,
    };
  }
}

export const tripService = new TripService();
