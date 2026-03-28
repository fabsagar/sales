import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : {};
    });

    useEffect(() => {
        // Only persist items with quantity > 0
        const filteredCart = Object.entries(cart).reduce((acc, [id, item]) => {
            if (item.qty > 0) acc[id] = item;
            return acc;
        }, {});
        localStorage.setItem('cart', JSON.stringify(filteredCart));
    }, [cart]);

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

    const updateCartQty = (productId, qty) => {
        setCart(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || { price: '' }),
                qty: isNaN(qty) ? 0 : qty
            }
        }));
    };

    const deleteFromCart = (productId) => {
        setCart(prev => {
            const newCart = { ...prev };
            delete newCart[productId];
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
            updateCartQty,
            removeFromCart,
            deleteFromCart,
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
