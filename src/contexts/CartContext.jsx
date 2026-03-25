import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState({}); // {productId: {qty, price}}

    const cartTotalItems = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

    const addToCart = (product) => {
        setCart(prev => {
            const current = prev[product.id] || { qty: 0, price: '' };
            if (current.qty >= product.stock_quantity) {
                return prev; // Should be handled by UI toast
            }
            return {
                ...prev,
                [product.id]: {
                    qty: current.qty + 1,
                    price: current.price || ''
                }
            };
        });
    };

    const updateCartPrice = (productId, price) => {
        setCart(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || { qty: 0 }),
                price
            }
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (!newCart[productId]) return prev;
            if (newCart[productId].qty > 1) {
                newCart[productId] = { ...newCart[productId], qty: newCart[productId].qty - 1 };
            } else {
                delete newCart[productId];
            }
            return newCart;
        });
    };

    const clearCart = () => setCart({});

    return (
        <CartContext.Provider value={{
            cart,
            cartTotalItems,
            addToCart,
            updateCartPrice,
            removeFromCart,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
