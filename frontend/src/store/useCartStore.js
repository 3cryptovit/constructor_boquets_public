import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_URL = "http://localhost:5000";

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isLoading: false,
      error: null,

      // Добавление товара в корзину
      addToCart: async (item) => {
        // Всегда обновляем состояние локально для быстрого UI отклика
        set((state) => ({
          cart: [...state.cart, { ...item, localId: Date.now() }],
          isLoading: true,
          error: null
        }));

        // Если токен есть, отправляем на сервер
        const token = localStorage.getItem("token");
        if (token && !item.isCustom) {
          try {
            const response = await fetch(`${API_URL}/api/cart`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                bouquetId: item.id,
                quantity: item.quantity || 1
              })
            });

            if (!response.ok) {
              throw new Error("Не удалось добавить товар в корзину");
            }

            // Обновляем корзину из API
            get().fetchCart();
          } catch (error) {
            set({ error: error.message, isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },

      // Удаление товара из корзины
      removeFromCart: async (id, cartItemId) => {
        // Всегда обновляем состояние локально для быстрого UI отклика
        set((state) => ({
          cart: state.cart.filter((item) =>
            (item.id !== id) && // Для кастомных букетов
            (item.cartId !== cartItemId) // Для серверных элементов
          ),
          isLoading: true
        }));

        // Если есть cartItemId и токен, удаляем с сервера
        const token = localStorage.getItem("token");
        if (token && cartItemId) {
          try {
            const response = await fetch(`${API_URL}/api/cart/item/${cartItemId}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });

            if (!response.ok) {
              throw new Error("Не удалось удалить товар из корзины");
            }
          } catch (error) {
            set({ error: error.message });
            // В случае ошибки восстанавливаем состояние
            get().fetchCart();
          } finally {
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },

      // Обновление количества товара
      updateQuantity: async (id, cartItemId, newQuantity) => {
        if (newQuantity < 1) return;

        // Обновляем локально
        set((state) => ({
          cart: state.cart.map(item => {
            if ((item.id === id && !cartItemId) || (item.cartId === cartItemId)) {
              return { ...item, quantity: newQuantity };
            }
            return item;
          }),
          isLoading: true
        }));

        // Если есть cartItemId и токен, обновляем на сервере
        const token = localStorage.getItem("token");
        if (token && cartItemId) {
          try {
            const response = await fetch(`${API_URL}/api/cart/item/${cartItemId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ quantity: newQuantity })
            });

            if (!response.ok) {
              throw new Error("Не удалось обновить количество товара");
            }
          } catch (error) {
            set({ error: error.message });
            // В случае ошибки восстанавливаем состояние
            get().fetchCart();
          } finally {
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },

      // Получение корзины с сервера
      fetchCart: async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await fetch(`${API_URL}/api/cart`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error("Не удалось получить корзину");
          }

          const serverCart = await response.json();

          // Объединяем с локальной корзиной (кастомные букеты)
          const localCart = get().cart.filter(item => item.isCustom);

          set({
            cart: [
              ...serverCart.map(item => ({ ...item, cartId: item.id })),
              ...localCart
            ],
            isLoading: false
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Очистка корзины
      clearCart: async () => {
        set({ cart: [], isLoading: false, error: null });

        // Если есть токен, очищаем корзину и на сервере
        const token = localStorage.getItem("token");
        if (token) {
          try {
            // Получаем текущую корзину
            const response = await fetch(`${API_URL}/api/cart`, {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });

            if (!response.ok) {
              throw new Error("Не удалось получить корзину");
            }

            const serverCart = await response.json();

            // Удаляем каждый элемент корзины
            for (const item of serverCart) {
              await fetch(`${API_URL}/api/cart/item/${item.id}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              });
            }
          } catch (error) {
            set({ error: error.message });
          }
        }
      }
    }),
    {
      name: "cart-storage", // название ключа в localstorage
      getStorage: () => localStorage, // использовать localStorage
    }
  )
);

export default useCartStore;
