/**
 * Утилиты для работы с базой данных
 */

/**
 * Преобразование boolean в число для SQLite (0 или 1)
 */
export function booleanToInt(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Преобразование числа из SQLite в boolean
 */
export function intToBoolean(value: number): boolean {
  return value === 1;
}

/**
 * Генерация уникального ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Получение текущей даты в формате ISO
 */
export function getCurrentDate(): string {
  return new Date().toISOString();
}
