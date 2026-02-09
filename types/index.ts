/**
 * TypeScript типы и интерфейсы для приложения GoNext
 */

/**
 * Место - основная сущность для хранения информации о месте
 */
export interface Place {
  id: string;
  name: string;
  description?: string;
  visitlater: boolean;
  liked: boolean;
  dd?: string; // GPS-координаты в формате "latitude,longitude"
  createdAt: string; // ISO date string
}

/**
 * Поездка - конкретный маршрут с датами и упорядоченным списком мест
 */
export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  current: boolean; // признак текущей поездки
  createdAt: string; // ISO date string
}

/**
 * Место в поездке - связь между поездкой и местом с информацией о посещении
 */
export interface TripPlace {
  id: string;
  tripId: string;
  placeId: string;
  order: number; // порядок в маршруте
  visited: boolean;
  visitDate?: string; // ISO date string
  notes?: string;
}

/**
 * Фотография места или места в поездке
 */
export interface PlacePhoto {
  id: string;
  placeId: string;
  tripPlaceId?: string; // NULL если фото для места, не NULL если для места в поездке
  filePath: string;
  createdAt: string; // ISO date string
}

/**
 * Типы для работы с БД
 */
export interface DatabasePlace {
  id: string;
  name: string;
  description: string | null;
  visitlater: number; // SQLite хранит boolean как 0/1
  liked: number; // SQLite хранит boolean как 0/1
  dd: string | null;
  createdAt: string;
}

export interface DatabaseTrip {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  current: number; // SQLite хранит boolean как 0/1
  createdAt: string;
}

export interface DatabaseTripPlace {
  id: string;
  tripId: string;
  placeId: string;
  order: number;
  visited: number; // SQLite хранит boolean как 0/1
  visitDate: string | null;
  notes: string | null;
}

export interface DatabasePlacePhoto {
  id: string;
  placeId: string;
  tripPlaceId: string | null;
  filePath: string;
  createdAt: string;
}
