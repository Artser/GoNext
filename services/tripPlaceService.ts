import { databaseService } from './database';
import { TripPlace, DatabaseTripPlace, Place } from '../types';
import { booleanToInt, intToBoolean, generateId, getCurrentDate } from '../utils/database';
import { placeService } from './placeService';

/**
 * Сервис для работы с местами в поездках
 */
class TripPlaceService {
  /**
   * Добавление места в поездку
   */
  async addPlaceToTrip(
    tripId: string,
    placeId: string,
    order: number
  ): Promise<TripPlace> {
    const db = databaseService.getDatabase();
    const id = generateId();

    await db.runAsync(
      `INSERT INTO trip_places (id, tripId, placeId, order, visited, visitDate, notes)
       VALUES (?, ?, ?, ?, 0, NULL, NULL)`,
      [id, tripId, placeId, order]
    );

    return {
      id,
      tripId,
      placeId,
      order,
      visited: false,
    };
  }

  /**
   * Получение всех мест в поездке
   */
  async getTripPlaces(tripId: string): Promise<(TripPlace & { place: Place })[]> {
    const db = databaseService.getDatabase();
    const results = await db.getAllAsync<DatabaseTripPlace>(
      'SELECT * FROM trip_places WHERE tripId = ? ORDER BY order ASC',
      [tripId]
    );

    const tripPlaces = results.map((row) => this.mapDatabaseTripPlaceToTripPlace(row));

    // Загружаем информацию о местах
    const placesWithDetails = await Promise.all(
      tripPlaces.map(async (tripPlace) => {
        const place = await placeService.getPlaceById(tripPlace.placeId);
        if (!place) {
          throw new Error(`Место с ID ${tripPlace.placeId} не найдено`);
        }
        return {
          ...tripPlace,
          place,
        };
      })
    );

    return placesWithDetails;
  }

  /**
   * Получение места в поездке по ID
   */
  async getTripPlaceById(id: string): Promise<TripPlace | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync<DatabaseTripPlace>(
      'SELECT * FROM trip_places WHERE id = ?',
      [id]
    );

    if (!result) {
      return null;
    }

    return this.mapDatabaseTripPlaceToTripPlace(result);
  }

  /**
   * Обновление места в поездке
   */
  async updateTripPlace(
    id: string,
    updates: Partial<Omit<TripPlace, 'id' | 'tripId' | 'placeId'>>
  ): Promise<TripPlace> {
    const db = databaseService.getDatabase();
    const tripPlace = await this.getTripPlaceById(id);

    if (!tripPlace) {
      throw new Error(`Место в поездке с ID ${id} не найдено`);
    }

    const updatedTripPlace: TripPlace = {
      ...tripPlace,
      ...updates,
    };

    await db.runAsync(
      `UPDATE trip_places 
       SET order = ?, visited = ?, visitDate = ?, notes = ?
       WHERE id = ?`,
      [
        updatedTripPlace.order,
        booleanToInt(updatedTripPlace.visited),
        updatedTripPlace.visitDate || null,
        updatedTripPlace.notes || null,
        id,
      ]
    );

    return updatedTripPlace;
  }

  /**
   * Обновление порядка мест в поездке
   */
  async updateTripPlacesOrder(tripId: string, orders: { id: string; order: number }[]): Promise<void> {
    const db = databaseService.getDatabase();

    // Обновляем порядок для каждого места
    for (const item of orders) {
      await db.runAsync('UPDATE trip_places SET order = ? WHERE id = ? AND tripId = ?', [
        item.order,
        item.id,
        tripId,
      ]);
    }
  }

  /**
   * Отметка места как посещенного
   */
  async markAsVisited(id: string, visitDate?: string, notes?: string): Promise<TripPlace> {
    return this.updateTripPlace(id, {
      visited: true,
      visitDate: visitDate || getCurrentDate(),
      notes: notes || undefined,
    });
  }

  /**
   * Отметка места как непосещенного
   */
  async markAsNotVisited(id: string): Promise<TripPlace> {
    return this.updateTripPlace(id, {
      visited: false,
      visitDate: undefined,
    });
  }

  /**
   * Удаление места из поездки
   */
  async removePlaceFromTrip(id: string): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM trip_places WHERE id = ?', [id]);
  }

  /**
   * Получение следующего непосещенного места в поездке
   */
  async getNextPlace(tripId: string): Promise<(TripPlace & { place: Place }) | null> {
    const tripPlaces = await this.getTripPlaces(tripId);
    const nextPlace = tripPlaces.find((tp) => !tp.visited);

    return nextPlace || null;
  }

  /**
   * Преобразование DatabaseTripPlace в TripPlace
   */
  private mapDatabaseTripPlaceToTripPlace(dbTripPlace: DatabaseTripPlace): TripPlace {
    return {
      id: dbTripPlace.id,
      tripId: dbTripPlace.tripId,
      placeId: dbTripPlace.placeId,
      order: dbTripPlace.order,
      visited: intToBoolean(dbTripPlace.visited),
      visitDate: dbTripPlace.visitDate || undefined,
      notes: dbTripPlace.notes || undefined,
    };
  }
}

export const tripPlaceService = new TripPlaceService();
