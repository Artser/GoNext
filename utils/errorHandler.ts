/**
 * Утилиты для обработки ошибок
 */

import { Alert } from 'react-native';

export interface AppError {
  message: string;
  code?: string;
  originalError?: Error;
}

/**
 * Обработка ошибок базы данных
 */
export function handleDatabaseError(error: unknown): AppError {
  const err = error as Error;
  
  // Проверяем типичные ошибки SQLite
  if (err.message.includes('UNIQUE constraint')) {
    return {
      message: 'Запись с такими данными уже существует',
      code: 'UNIQUE_CONSTRAINT',
      originalError: err,
    };
  }

  if (err.message.includes('FOREIGN KEY constraint')) {
    return {
      message: 'Невозможно выполнить операцию: связанные данные не найдены',
      code: 'FOREIGN_KEY_CONSTRAINT',
      originalError: err,
    };
  }

  if (err.message.includes('NOT NULL constraint')) {
    return {
      message: 'Обязательные поля не заполнены',
      code: 'NOT_NULL_CONSTRAINT',
      originalError: err,
    };
  }

  if (err.message.includes('no such table')) {
    return {
      message: 'Ошибка базы данных: таблица не найдена. Попробуйте перезапустить приложение',
      code: 'TABLE_NOT_FOUND',
      originalError: err,
    };
  }

  return {
    message: err.message || 'Произошла ошибка при работе с базой данных',
    code: 'DATABASE_ERROR',
    originalError: err,
  };
}

/**
 * Обработка ошибок файловой системы
 */
export function handleFileSystemError(error: unknown): AppError {
  const err = error as Error;

  if (err.message.includes('permission')) {
    return {
      message: 'Нет доступа к файловой системе. Проверьте разрешения приложения',
      code: 'PERMISSION_DENIED',
      originalError: err,
    };
  }

  if (err.message.includes('not found') || err.message.includes('ENOENT')) {
    return {
      message: 'Файл не найден',
      code: 'FILE_NOT_FOUND',
      originalError: err,
    };
  }

  return {
    message: err.message || 'Ошибка при работе с файлами',
    code: 'FILE_SYSTEM_ERROR',
    originalError: err,
  };
}

/**
 * Обработка ошибок геолокации
 */
export function handleLocationError(error: unknown): AppError {
  const err = error as Error;

  if (err.message.includes('permission') || err.message.includes('разрешение')) {
    return {
      message: 'Разрешение на геолокацию не предоставлено',
      code: 'LOCATION_PERMISSION_DENIED',
      originalError: err,
    };
  }

  if (err.message.includes('timeout')) {
    return {
      message: 'Превышено время ожидания определения местоположения',
      code: 'LOCATION_TIMEOUT',
      originalError: err,
    };
  }

  return {
    message: err.message || 'Ошибка определения местоположения',
    code: 'LOCATION_ERROR',
    originalError: err,
  };
}

/**
 * Показать ошибку пользователю
 */
export function showError(error: AppError | string, title: string = 'Ошибка'): void {
  const message = typeof error === 'string' ? error : error.message;
  Alert.alert(title, message);
}

/**
 * Показать успешное сообщение
 */
export function showSuccess(message: string, title: string = 'Успешно'): void {
  Alert.alert(title, message);
}

/**
 * Обработка ошибок с логированием
 */
export function handleError(error: unknown, context: string): AppError {
  console.error(`[${context}]`, error);

  if (error instanceof Error) {
    // Определяем тип ошибки и обрабатываем соответственно
    if (context.includes('database') || context.includes('БД')) {
      return handleDatabaseError(error);
    }

    if (context.includes('file') || context.includes('photo') || context.includes('фото')) {
      return handleFileSystemError(error);
    }

    if (context.includes('location') || context.includes('геолокация')) {
      return handleLocationError(error);
    }

    return {
      message: error.message || 'Произошла неизвестная ошибка',
      code: 'UNKNOWN_ERROR',
      originalError: error,
    };
  }

  return {
    message: 'Произошла неизвестная ошибка',
    code: 'UNKNOWN_ERROR',
  };
}
