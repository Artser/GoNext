import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, DATABASE_VERSION } from '../constants';

/**
 * Сервис для работы с SQLite базой данных
 */
class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Инициализация базы данных
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await this.createTables();
    } catch (error) {
      console.error('Ошибка инициализации БД:', error);
      throw error;
    }
  }

  /**
   * Получение экземпляра базы данных
   */
  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('База данных не инициализирована. Вызовите initialize() сначала.');
    }
    return this.db;
  }

  /**
   * Создание таблиц базы данных
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('База данных не инициализирована');
    }

    // Таблица мест
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS places (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        visitlater INTEGER NOT NULL DEFAULT 0,
        liked INTEGER NOT NULL DEFAULT 0,
        dd TEXT,
        createdAt TEXT NOT NULL
      );
    `);

    // Таблица поездок
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        startDate TEXT,
        endDate TEXT,
        current INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );
    `);

    // Таблица мест в поездках
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS trip_places (
        id TEXT PRIMARY KEY NOT NULL,
        tripId TEXT NOT NULL,
        placeId TEXT NOT NULL,
        order INTEGER NOT NULL,
        visited INTEGER NOT NULL DEFAULT 0,
        visitDate TEXT,
        notes TEXT,
        FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE CASCADE
      );
    `);

    // Таблица фотографий мест
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS place_photos (
        id TEXT PRIMARY KEY NOT NULL,
        placeId TEXT NOT NULL,
        tripPlaceId TEXT,
        filePath TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE CASCADE,
        FOREIGN KEY (tripPlaceId) REFERENCES trip_places(id) ON DELETE CASCADE
      );
    `);

    // Создание индексов для оптимизации запросов
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_trip_places_tripId ON trip_places(tripId);
      CREATE INDEX IF NOT EXISTS idx_trip_places_placeId ON trip_places(placeId);
      CREATE INDEX IF NOT EXISTS idx_trip_places_order ON trip_places(tripId, order);
      CREATE INDEX IF NOT EXISTS idx_place_photos_placeId ON place_photos(placeId);
      CREATE INDEX IF NOT EXISTS idx_place_photos_tripPlaceId ON place_photos(tripPlaceId);
      CREATE INDEX IF NOT EXISTS idx_trips_current ON trips(current);
    `);
  }

  /**
   * Закрытие соединения с базой данных
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Экспорт singleton экземпляра
export const databaseService = new DatabaseService();
