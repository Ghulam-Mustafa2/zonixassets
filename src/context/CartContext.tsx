"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type CartProduct = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
};

export type CartItem = CartProduct & {
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartLoaded: boolean;
};

const CART_STORAGE_KEY = "zonixassets-cart";
const LEGACY_CART_STORAGE_KEY = "pakstore-cart";

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") return false;

  const cartItem = item as Partial<CartItem>;

  return (
    typeof cartItem.id === "string" &&
    cartItem.id.trim().length > 0 &&
    typeof cartItem.slug === "string" &&
    cartItem.slug.trim().length > 0 &&
    typeof cartItem.title === "string" &&
    cartItem.title.trim().length > 0 &&
    typeof cartItem.category === "string" &&
    typeof cartItem.price === "number" &&
    Number.isFinite(cartItem.price) &&
    cartItem.price >= 0 &&
    typeof cartItem.quantity === "number" &&
    Number.isInteger(cartItem.quantity) &&
    cartItem.quantity > 0
  );
}

function normalizeCart(items: CartItem[]) {
  const merged = new Map<string, CartItem>();

  for (const item of items) {
    const existing = merged.get(item.id);

    if (existing) {
      merged.set(item.id, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });

      continue;
    }

    merged.set(item.id, item);
  }

  return Array.from(merged.values());
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  useEffect(() => {
    try {
      const currentCart =
        localStorage.getItem(CART_STORAGE_KEY);

      const legacyCart =
        localStorage.getItem(LEGACY_CART_STORAGE_KEY);

      const savedCart = currentCart || legacyCart;

      if (!savedCart) {
        return;
      }

      const parsedCart: unknown = JSON.parse(savedCart);

      if (!Array.isArray(parsedCart)) {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
        return;
      }

      const validCart = normalizeCart(
        parsedCart.filter(isValidCartItem)
      );

      setCart(validCart);

      if (!currentCart && legacyCart) {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(validCart)
        );

        localStorage.removeItem(
          LEGACY_CART_STORAGE_KEY
        );
      }
    } catch (error) {
      console.error("CART_LOAD_ERROR:", error);

      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);

      setCart([]);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isCartLoaded) return;

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );

      localStorage.removeItem(
        LEGACY_CART_STORAGE_KEY
      );
    } catch (error) {
      console.error("CART_SAVE_ERROR:", error);
    }
  }, [cart, isCartLoaded]);

  function addToCart(product: CartProduct) {
    if (
      !product.id?.trim() ||
      !product.slug?.trim() ||
      !product.title?.trim() ||
      !Number.isFinite(product.price) ||
      product.price < 0
    ) {
      console.error(
        "INVALID_PRODUCT_ADDED_TO_CART:",
        product
      );

      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(id: string) {
    if (!id) return;

    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  }

  function increaseQuantity(id: string) {
    if (!id) return;

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(id: string) {
    if (!id) return;

    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
  }

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  }, [cart]);

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      cartCount,
      cartTotal,
      isCartLoaded,
    }),
    [cart, cartCount, cartTotal, isCartLoaded]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
