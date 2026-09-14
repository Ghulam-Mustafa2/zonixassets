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

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") return false;

  const cartItem = item as Partial<CartItem>;

  return (
    typeof cartItem.id === "string" &&
    typeof cartItem.slug === "string" &&
    typeof cartItem.title === "string" &&
    typeof cartItem.category === "string" &&
    typeof cartItem.price === "number" &&
    Number.isFinite(cartItem.price) &&
    typeof cartItem.quantity === "number" &&
    Number.isInteger(cartItem.quantity) &&
    cartItem.quantity > 0
  );
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Load cart from localStorage once
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("pakstore-cart");

      if (!savedCart) {
        setIsCartLoaded(true);
        return;
      }

      const parsedCart: unknown = JSON.parse(savedCart);

      if (!Array.isArray(parsedCart)) {
        localStorage.removeItem("pakstore-cart");
        setIsCartLoaded(true);
        return;
      }

      const validCart = parsedCart.filter(isValidCartItem);

      setCart(validCart);
    } catch (error) {
      console.error("CART_LOAD_ERROR:", error);

      localStorage.removeItem("pakstore-cart");
      setCart([]);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    if (!isCartLoaded) return;

    try {
      localStorage.setItem(
        "pakstore-cart",
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error("CART_SAVE_ERROR:", error);
    }
  }, [cart, isCartLoaded]);

  function addToCart(product: CartProduct) {
    if (
      !product.id ||
      !product.slug ||
      !product.title ||
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
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  }

  function increaseQuantity(id: string) {
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

  const value = useMemo(
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