/**
 * Утилиты для валидации данных
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Валидация координат в формате DD (Decimal Degrees)
 */
export function validateCoordinates(coords: string): ValidationResult {
  if (!coords || !coords.trim()) {
    return { isValid: true }; // Координаты необязательны
  }

  const parts = coords.trim().split(',');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Неверный формат координат. Используйте формат: широта,долгота (например: 55.7558,37.6173)',
    };
  }

  const lat = parseFloat(parts[0].trim());
  const lon = parseFloat(parts[1].trim());

  if (isNaN(lat) || isNaN(lon)) {
    return {
      isValid: false,
      error: 'Координаты должны быть числами',
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      isValid: false,
      error: 'Широта должна быть в диапазоне от -90 до 90',
    };
  }

  if (lon < -180 || lon > 180) {
    return {
      isValid: false,
      error: 'Долгота должна быть в диапазоне от -180 до 180',
    };
  }

  return { isValid: true };
}

/**
 * Валидация даты в формате ГГГГ-ММ-ДД
 */
export function validateDate(dateString: string): ValidationResult {
  if (!dateString || !dateString.trim()) {
    return { isValid: true }; // Дата необязательна
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString.trim())) {
    return {
      isValid: false,
      error: 'Неверный формат даты. Используйте формат ГГГГ-ММ-ДД (например: 2024-06-15)',
    };
  }

  const date = new Date(dateString);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Неверная дата',
    };
  }

  return { isValid: true };
}

/**
 * Валидация диапазона дат (startDate < endDate)
 */
export function validateDateRange(startDate?: string, endDate?: string): ValidationResult {
  if (!startDate || !endDate) {
    return { isValid: true }; // Если одна из дат не указана, валидация проходит
  }

  const startValidation = validateDate(startDate);
  if (!startValidation.isValid) {
    return startValidation;
  }

  const endValidation = validateDate(endDate);
  if (!endValidation.isValid) {
    return endValidation;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return {
      isValid: false,
      error: 'Дата начала не может быть позже даты окончания',
    };
  }

  return { isValid: true };
}

/**
 * Валидация обязательного поля
 */
export function validateRequired(value: string | undefined | null, fieldName: string): ValidationResult {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: `Поле "${fieldName}" обязательно для заполнения`,
    };
  }

  return { isValid: true };
}

/**
 * Валидация длины строки
 */
export function validateLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): ValidationResult {
  const length = value.trim().length;

  if (length < minLength) {
    return {
      isValid: false,
      error: `Поле "${fieldName}" должно содержать минимум ${minLength} символов`,
    };
  }

  if (length > maxLength) {
    return {
      isValid: false,
      error: `Поле "${fieldName}" должно содержать максимум ${maxLength} символов`,
    };
  }

  return { isValid: true };
}

/**
 * Комплексная валидация места
 */
export function validatePlace(data: {
  name?: string;
  description?: string;
  coordinates?: string;
}): ValidationResult {
  // Валидация названия
  const nameValidation = validateRequired(data.name || '', 'Название места');
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  const nameLengthValidation = validateLength(data.name || '', 1, 200, 'Название места');
  if (!nameLengthValidation.isValid) {
    return nameLengthValidation;
  }

  // Валидация описания (если указано)
  if (data.description) {
    const descLengthValidation = validateLength(data.description, 0, 2000, 'Описание');
    if (!descLengthValidation.isValid) {
      return descLengthValidation;
    }
  }

  // Валидация координат (если указаны)
  if (data.coordinates) {
    const coordsValidation = validateCoordinates(data.coordinates);
    if (!coordsValidation.isValid) {
      return coordsValidation;
    }
  }

  return { isValid: true };
}

/**
 * Комплексная валидация поездки
 */
export function validateTrip(data: {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}): ValidationResult {
  // Валидация названия
  const titleValidation = validateRequired(data.title || '', 'Название поездки');
  if (!titleValidation.isValid) {
    return titleValidation;
  }

  const titleLengthValidation = validateLength(data.title || '', 1, 200, 'Название поездки');
  if (!titleLengthValidation.isValid) {
    return titleLengthValidation;
  }

  // Валидация описания (если указано)
  if (data.description) {
    const descLengthValidation = validateLength(data.description, 0, 2000, 'Описание');
    if (!descLengthValidation.isValid) {
      return descLengthValidation;
    }
  }

  // Валидация дат
  if (data.startDate) {
    const startDateValidation = validateDate(data.startDate);
    if (!startDateValidation.isValid) {
      return startDateValidation;
    }
  }

  if (data.endDate) {
    const endDateValidation = validateDate(data.endDate);
    if (!endDateValidation.isValid) {
      return endDateValidation;
    }
  }

  // Валидация диапазона дат
  const dateRangeValidation = validateDateRange(data.startDate, data.endDate);
  if (!dateRangeValidation.isValid) {
    return dateRangeValidation;
  }

  return { isValid: true };
}
