import { createContext, useContext, useReducer, useCallback } from 'react';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) => item.productId !== action.payload.productId
        ),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.payload.productId
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'SET_CUSTOMER':
      return { ...state, customer: action.payload };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    default:
      return state;
  }
}

const initialState = { items: [], customer: null, paymentMethod: 'cash' };

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback(
    (product) =>
      dispatch({
        type: 'ADD_ITEM',
        payload: { productId: product.id, name: product.name, price: product.price },
      }),
    []
  );

  const removeItem = useCallback(
    (productId) =>
      dispatch({ type: 'REMOVE_ITEM', payload: { productId } }),
    []
  );

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity },
    });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const setCustomer = useCallback(
    (customer) => dispatch({ type: 'SET_CUSTOMER', payload: customer }),
    []
  );

  const setPaymentMethod = useCallback(
    (method) => dispatch({ type: 'SET_PAYMENT_METHOD', payload: method }),
    []
  );

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        customer: state.customer,
        paymentMethod: state.paymentMethod,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCustomer,
        setPaymentMethod,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
