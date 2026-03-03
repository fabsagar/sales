import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Plus, Minus, Package, ArrowRight, Loader2 } from 'lucide-react';
import { productsApi } from '../lib/api.js';
import { formatCurrency } from '../lib/format.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function GalleryPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState({}); // {productId: quantity}

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await productsApi.list({ search, limit: 100 });
            setProducts(data.products || []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const addToCart = (product) => {
        if (product.stock_quantity <= 0) {
            toast.error('Out of stock');
            return;
        }
        setCart(prev => {
            const currentQty = prev[product.id] || 0;
            if (currentQty >= product.stock_quantity) {
                toast.error('Cannot add more than available stock');
                return prev;
            }
            return { ...prev, [product.id]: currentQty + 1 };
        });
        toast.success(`Added ${product.name} to order`, { duration: 1500 });
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[productId] > 1) {
                newCart[productId] -= 1;
            } else {
                delete newCart[productId];
            }
            return newCart;
        });
    };

    const cartTotalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    const goToOrder = () => {
        if (cartTotalItems === 0) {
            toast.error('Please add products to your order first');
            return;
        }
        // In a real app, we might pass the cart state via context or navigation state
        // For now, we'll just navigate to the new order page.
        // If the NewOrderPage doesn't support pre-filling, the user will have to add them again.
        // A better improvement would be a shared Cart Context, but for this task,
        // we'll focus on the gallery UI.
        navigate('/orders/new', { state: { selectedProducts: cart } });
    };

    const isAdmin = user?.role === 'admin';

    return (
        <div className="animate-fade-in pb-20">
            <div className="page-header sticky top-0 bg-surface-900/80 backdrop-blur-md z-10 py-4 mb-6">
                <div>
                    <h1 className="page-title">Product Gallery</h1>
                    <p className="text-slate-400 text-sm mt-1">Quickly add products to your next order</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative max-w-xs hidden sm:block">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            className="input pl-9 h-10 py-0"
                            placeholder="Search products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={goToOrder}
                        className="btn-primary relative"
                    >
                        <ShoppingCart size={18} />
                        <span className="hidden sm:inline">Go to Cart</span>
                        {cartTotalItems > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-surface-900 animate-bounce">
                                {cartTotalItems}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="sm:hidden mb-6">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        className="input pl-9"
                        placeholder="Search products..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 size={40} className="text-primary-500 animate-spin" />
                    <p className="text-slate-500 animate-pulse">Loading gallery...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="section-card text-center py-20 bg-surface-950/30 border-dashed border-2 border-surface-700">
                    <Package size={64} className="mx-auto mb-4 text-slate-700" />
                    <h3 className="text-xl font-bold text-white mb-2">No Products Found</h3>
                    <p className="text-slate-500">Try adjusting your search terms</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {products.map(product => {
                        const cartQty = cart[product.id] || 0;
                        return (
                            <div
                                key={product.id}
                                className="group bg-surface-950/50 border border-surface-700/50 rounded-3xl overflow-hidden hover:border-primary-500/50 hover:bg-surface-800 transition-all duration-300 flex flex-col h-full"
                            >
                                {/* Image Container */}
                                <div className="aspect-square relative overflow-hidden bg-surface-900">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                                            <Package size={64} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-lg ${product.stock_quantity > 10 ? 'bg-black/50 text-emerald-400' :
                                                product.stock_quantity > 0 ? 'bg-black/50 text-yellow-500' : 'bg-red-500/80 text-white'
                                            }`}>
                                            {product.stock_quantity > 0 ? `${product.stock_quantity} In Stock` : 'Out of Stock'}
                                        </span>
                                    </div>
                                    {cartQty > 0 && (
                                        <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center backdrop-blur-[1px]">
                                            <div className="bg-primary-600 text-white font-bold px-4 py-2 rounded-2xl shadow-2xl">
                                                {cartQty} Added
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-1">{product.category}</p>
                                    <h3 className="font-bold text-white text-base leading-tight mb-2 flex-1 group-hover:text-primary-400 transition-colors">
                                        {product.name}
                                    </h3>

                                    <div className="mt-auto pt-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-500 mb-0.5 font-medium">Selling Price</p>
                                            <p className="text-lg font-black text-white">{formatCurrency(product.default_selling_price)}</p>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {cartQty > 0 ? (
                                                <div className="flex items-center bg-surface-900 rounded-2xl p-1 border border-surface-700">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFromCart(product.id); }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-800 text-white hover:bg-surface-700 transition-colors"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-white">{cartQty}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                                        disabled={cartQty >= product.stock_quantity}
                                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors disabled:opacity-50"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                                    disabled={product.stock_quantity <= 0}
                                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-900 text-white border border-surface-700 hover:bg-primary-600 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-900/30 transition-all transform hover:-translate-y-1 disabled:opacity-50"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Mobile Bottom Bar for Cart */}
            {cartTotalItems > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm animate-slide-up sm:hidden">
                    <button
                        onClick={goToOrder}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white py-4 px-6 rounded-3xl font-bold flex items-center justify-between shadow-2xl shadow-primary-900/50 border border-primary-500/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <ShoppingCart size={20} />
                            </div>
                            <span className="text-lg">Checkout Order</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-black/20 px-3 py-1 rounded-full text-xs">{cartTotalItems} items</span>
                            <ArrowRight size={20} />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
