import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],

      // Добавить букет в избранное
      addToFavorites: (bouquet) => {
        const { favorites } = get();
        // Проверяем, есть ли уже такой букет в избранном
        const existingIndex = favorites.findIndex(item => item.id === bouquet.id);

        if (existingIndex === -1) {
          set(state => ({ favorites: [...state.favorites, bouquet] }));
        }
      },

      // Удалить букет из избранного
      removeFromFavorites: (bouquetId) => {
        set(state => ({
          favorites: state.favorites.filter(item => item.id !== bouquetId)
        }));
      },

      // Проверить, есть ли букет в избранном
      isFavorite: (bouquetId) => {
        const { favorites } = get();
        return favorites.some(item => item.id === bouquetId);
      },

      // Очистить избранное
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'bouquet-favorites-storage', // имя в localStorage
    }
  )
);

export default useFavoritesStore; 