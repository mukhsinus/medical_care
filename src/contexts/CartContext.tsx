import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  ReactNode,
} from "react";

type ID = string | number;

export type Product = {
  id: ID;
  name: string;
  price: number;
  image?: string; // Optional fields for common product properties
  sku?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

type State = {
  items: CartItem[];
};

type Action =
  | { type: "ADD_ITEM"; payload: { product: Product; quantity?: number } }
  | { type: "REMOVE_ITEM"; payload: { id: ID } }
  | { type: "UPDATE_QUANTITY"; payload: { id: ID; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; payload: { items: CartItem[] } };

const LOCAL_STORAGE_KEY = "app_cart_v1";

const initialState: State = { items: [] };

// Validate cart item to ensure it has required fields and correct types
const isValidCartItem = (item: unknown): item is CartItem => {
  if (typeof item !== "object" || item === null) return false;
  const { product, quantity } = item as CartItem;
  return (
    typeof product === "object" &&
    product !== null &&
    typeof product.id === "string" || typeof product.id === "number" &&
    typeof product.name === "string" &&
    typeof product.price === "number" &&
    typeof quantity === "number" &&
    quantity > 0
  );
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CART": {
      // Filter out invalid items
      const validItems = action.payload.items.filter(isValidCartItem);
      return { ...state, items: validItems };
    }
    case "ADD_ITEM": {
      const { product, quantity = 1 } = action.payload;
      if (!isValidCartItem({ product, quantity })) {
        console.warn("Invalid product or quantity in ADD_ITEM:", { product, quantity });
        return state;
      }
      const existingIndex = state.items.findIndex((i) => i.product.id === product.id);
      if (existingIndex >= 0) {
        const items = [...state.items];
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: items[existingIndex].quantity + quantity,
        };
        return { ...state, items };
      }
      return { ...state, items: [...state.items, { product, quantity }] };
    }
    case "REMOVE_ITEM": {
      const items = state.items.filter((i) => i.product.id !== action.payload.id);
      return { ...state, items };
    }
    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.product.id !== id) };
      }
      const items = state.items.map((i) =>
        i.product.id === id ? { ...i, quantity } : i
      );
      return { ...state, items };
    }
    case "CLEAR_CART":
      return { ...state, items: [] };
    default:
      return state;
  }
}

export type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: ID) => void;
  updateQuantity: (id: ID, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

// Default context value for TypeScript safety (not used at runtime due to provider)
const defaultCartContext: CartContextValue = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
};

export const CartContext = createContext<CartContextValue>(defaultCartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter(isValidCartItem);
          if (validItems.length !== parsed.length) {
            console.warn(
              `Filtered out ${parsed.length - validItems.length} invalid cart items from localStorage`
            );
          }
          dispatch({ type: "SET_CART", payload: { items: validItems } });
        }
      }
    } catch (error) {
      console.error("Failed to hydrate cart from localStorage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error("Failed to persist cart to localStorage:", error);
    }
  }, [state.items]);

  const addItem = (product: Product, quantity = 1) =>
    dispatch({ type: "ADD_ITEM", payload: { product, quantity } });

  const removeItem = (id: ID) => dispatch({ type: "REMOVE_ITEM", payload: { id } });

  const updateQuantity = (id: ID, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  // Memoize totals to prevent recalculation on every render
  const totalItems = useMemo(
    () => state.items.reduce((s, i) => s + i.quantity, 0),
    [state.items]
  );
  const totalPrice = useMemo(
    () => state.items.reduce((s, i) => s + i.quantity * i.product.price, 0),
    [state.items]
  );

  const value: CartContextValue = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (ctx === defaultCartContext) {
    console.error(
      "useCart: CartContext is using default value. Ensure useCart is called within a CartProvider."
    );
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
};