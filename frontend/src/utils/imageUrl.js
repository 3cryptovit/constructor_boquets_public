/**
 * Форматирует URL изображения, добавляя базовый URL API если необходимо
 * 
 * @param {string} url - Исходный URL изображения
 * @param {string} fallbackUrl - URL по умолчанию, если основной URL не указан
 * @returns {string} - Отформатированный URL изображения
 */
export const formatImageUrl = (url, fallbackUrl = '/assets/default-bouquet.jpg') => {
  if (!url) return fallbackUrl;

  // Если URL уже начинается с http или https, возвращаем его как есть
  if (url.startsWith('http')) {
    return url;
  }

  // Для локальных ассетов, возвращаем как есть
  if (url.startsWith('/assets')) {
    return url;
  }

  // Для загруженных изображений с сервера, добавляем базовый URL API
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${apiUrl}${url}`;
};

export default formatImageUrl; 