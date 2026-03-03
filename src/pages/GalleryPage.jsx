import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Plus, Minus, Package, ArrowRight, Loader2, ArrowUp, ArrowDown, Building2, GripVertical, CheckCircle2 } from 'lucide-react';
import { productsApi, retailersApi } from '../lib/api.js';
import { formatCurrency } from '../lib/format.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    MouseSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableProductCard({
    product,
    cartItem,
    isSelected,
    onSelect,
    onAddToCart,
    onRemoveFromCart,
    onUpdatePrice
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-surface-950/50 border rounded-3xl overflow-hidden hover:bg-surface-800 transition-all duration-300 flex flex-col h-full relative
                ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/20 bg-surface-800' : 'border-surface-700/50 hover:border-primary-500/50'}
            `}
            onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    onSelect(product.id, e.shiftKey);
                }
            }}
        >
            {/* Multi-select overlay */}
            {isSelected && (
                <div className="absolute top-4 left-4 z-20 bg-primary-500 text-white rounded-full p-1 shadow-lg">
                    <CheckCircle2 size={16} />
                </div>
            )}

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 bg-black/50 text-white p-1.5 rounded-lg backdrop-blur-md cursor-grab active:cursor-grabbing transition-opacity"
                onClick={e => e.stopPropagation()}
                title="Drag to reorder"
            >
                <GripVertical size={14} />
            </div>

            {/* Image Container */}
            <div className="aspect-square relative overflow-hidden bg-surface-900 pointer-events-none sm:pointer-events-auto">
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
                {cartItem.qty > 0 && (
                    <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-primary-600 text-white font-bold px-4 py-2 rounded-2xl shadow-2xl">
                            {cartItem.qty} Added
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

                <div className="mt-auto pt-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-[10px] text-slate-500 mb-0.5 font-medium">Sales Price (₹)</p>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-2 py-1 text-sm font-bold text-white focus:ring-1 focus:ring-primary-500/50 outline-none"
                            value={cartItem.price}
                            onChange={(e) => onUpdatePrice(product.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        {cartItem.qty > 0 ? (
                            <div className="flex items-center bg-surface-900 rounded-2xl p-1 border border-surface-700">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveFromCart(product.id); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-800 text-white hover:bg-surface-700 transition-colors"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="w-8 text-center font-bold text-white">{cartItem.qty}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                                    disabled={cartItem.qty >= product.stock_quantity}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors disabled:opacity-50"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
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
}

export default function GalleryPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [retailers, setRetailers] = useState([]);
    const [selectedShop, setSelectedShop] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [cart, setCart] = useState({}); // {productId: {qty, price}}
    const [ranks, setRanks] = useState(() => {
        const saved = localStorage.getItem(`gallery_ranks_${user.id}`);
        return saved ? JSON.parse(saved) : {};
    }); // {productId: rankValue}

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );


    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const [pData, rData] = await Promise.all([
                productsApi.list({ search, limit: 100 }),
                retailersApi.list()
            ]);

            setRetailers(rData.retailers || []);

            let sorted = pData.products || [];

            // Sort based on custom ranks (higher rank first)
            sorted.sort((a, b) => {
                const rankA = ranks[a.id] || 0;
                const rankB = ranks[b.id] || 0;
                if (rankA !== rankB) return rankB - rankA;
                return b.id - a.id; // stable fallback
            });

            setProducts(sorted);
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
            const current = prev[product.id] || { qty: 0, price: '' };
            if (current.qty >= product.stock_quantity) {
                toast.error('Cannot add more than available stock');
                return prev;
            }
            return {
                ...prev,
                [product.id]: {
                    qty: current.qty + 1,
                    price: current.price || ''
                }
            };
        });
        toast.success(`Added ${product.name} to order`, { duration: 1500 });
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

    const cartTotalItems = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

    const updateRank = (productId, direction) => {
        setRanks(prev => {
            const newRanks = { ...prev };
            const currentRank = newRanks[productId] || 0;
            newRanks[productId] = currentRank + direction;
            localStorage.setItem(`gallery_ranks_${user.id}`, JSON.stringify(newRanks));
            return newRanks;
        });
        // Trigger a re-sort (in a real app this might be more efficient, 
        // but re-fetching or re-sorting local state works here)
        setTimeout(fetchProducts, 0);
    };

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
        navigate('/orders/new', { state: { selectedProducts: cart, selectedShop } });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setProducts((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                let newOrder;

                // Multi-drag logic: if dragging one of the selected items, move all of them
                if (selectedProductIds.includes(active.id)) {
                    const selectedItems = items.filter(i => selectedProductIds.includes(i.id));
                    const remainingItems = items.filter(i => !selectedProductIds.includes(i.id));

                    // Re-calculate the insert index in the remaining items list
                    const adjustedIndex = items[newIndex] ? remainingItems.findIndex(i => i.id === items[newIndex].id) : remainingItems.length;

                    newOrder = [
                        ...remainingItems.slice(0, adjustedIndex),
                        ...selectedItems,
                        ...remainingItems.slice(adjustedIndex)
                    ];
                } else {
                    // Standard single drag
                    newOrder = arrayMove(items, oldIndex, newIndex);
                }

                // Update ranks in state and localStorage based on NEW array order
                const newRanks = { ...ranks };
                newOrder.forEach((product, index) => {
                    newRanks[product.id] = (newOrder.length - index) * 10;
                });

                setRanks(newRanks);
                localStorage.setItem(`gallery_ranks_${user.id}`, JSON.stringify(newRanks));

                return newOrder;
            });

            setSelectedProductIds([]); // Clear selection after successful move
            toast.success('Order updated');
        }
    };

    const toggleSelection = (productId, isShift) => {
        setSelectedProductIds(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            }
            if (isShift && prev.length > 0) {
                // Batch select between last selection and this one
                const lastId = prev[prev.length - 1];
                const currentIndex = products.findIndex(p => p.id === productId);
                const lastIndex = products.findIndex(p => p.id === lastId);
                const start = Math.min(currentIndex, lastIndex);
                const end = Math.max(currentIndex, lastIndex);
                const batch = products.slice(start, end + 1).map(p => p.id);
                return Array.from(new Set([...prev, ...batch]));
            }
            return [...prev, productId];
        });
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
                    <div className="relative max-w-xs hidden xl:flex items-center gap-2">
                        <Building2 size={16} className="text-slate-500" />
                        <select
                            className="bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-primary-500 min-w-[150px]"
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                        >
                            <option value="">-- Generic Shop --</option>
                            {retailers.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
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

            <div className="sm:hidden mb-6 space-y-4">
                <div className="xl:hidden flex items-center gap-2 bg-surface-800/50 p-3 rounded-2xl border border-surface-700/50">
                    <Building2 size={18} className="text-primary-500" />
                    <select
                        className="flex-1 bg-transparent text-sm text-white outline-none"
                        value={selectedShop}
                        onChange={(e) => setSelectedShop(e.target.value)}
                    >
                        <option value="">Select Shop (Optional)</option>
                        {retailers.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={products.map(p => p.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {products.map(product => {
                                const cartItem = cart[product.id] || { qty: 0, price: '' };
                                return (
                                    <SortableProductCard
                                        key={product.id}
                                        product={product}
                                        cartItem={cartItem}
                                        isSelected={selectedProductIds.includes(product.id)}
                                        onSelect={toggleSelection}
                                        onAddToCart={addToCart}
                                        onRemoveFromCart={removeFromCart}
                                        onUpdatePrice={updateCartPrice}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
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
