import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Plus, Minus, Package, ArrowRight, Loader2, ArrowUp, ArrowDown, Building2, GripVertical, CheckCircle2, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import { productsApi, retailersApi } from '../lib/api.js';
import { formatCurrency } from '../lib/format.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import toast from 'react-hot-toast';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
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
    onUpdatePrice,
    onUpdateQty,
    isAdmin
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
                className="absolute top-3 left-3 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-black/50 text-white p-1.5 rounded-lg backdrop-blur-md cursor-grab active:cursor-grabbing transition-opacity touch-none"
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

                <div className="mt-auto pt-4 flex flex-col gap-3">
                    <div className="w-full">
                        <p className="text-[10px] text-slate-500 mb-1 font-medium italic">Sales Price (₹)</p>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={`w-full bg-surface-900 border rounded-xl px-3 py-2 text-sm font-bold text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all ${!isAdmin && cartItem.price && parseFloat(cartItem.price) < product.purchase_price ? 'border-red-500 text-red-500 animate-pulse' : 'border-surface-700/50 hover:border-surface-600'}`}
                            value={cartItem.price}
                            placeholder={product.default_selling_price || '0.00'}
                            onChange={(e) => onUpdatePrice(product.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="w-full">
                        {cartItem.qty > 0 ? (
                            <div className="flex items-center bg-surface-900 rounded-2xl p-1 border border-surface-700 w-full justify-between">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveFromCart(product.id); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-800 text-white hover:bg-surface-700 transition-colors"
                                >
                                    <Minus size={14} />
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max={product.stock_quantity}
                                    className="w-16 bg-transparent text-center font-bold text-white text-base outline-none focus:ring-1 focus:ring-primary-500/50 rounded-lg"
                                    value={cartItem.qty}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        onUpdateQty(product.id, isNaN(val) ? 0 : Math.min(val, product.stock_quantity));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                                    disabled={cartItem.qty >= product.stock_quantity}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors disabled:opacity-50"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                                disabled={product.stock_quantity <= 0}
                                className="w-full h-12 flex items-center justify-center rounded-2xl bg-surface-900 text-white border border-surface-700 hover:bg-primary-600 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-900/30 transition-all transform hover:-translate-y-1 disabled:opacity-50 gap-2"
                            >
                                <Plus size={20} />
                                <span className="font-bold text-sm">Add to Cart</span>
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
    const { user, activeRole } = useAuth();
    const isAdmin = activeRole === 'admin';
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [gridCols, setGridCols] = useState(() => {
        const saved = localStorage.getItem(`gallery_grid_${user.id}`);
        return saved ? parseInt(saved) : 2;
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [retailers, setRetailers] = useState([]);
    const [selectedShop, setSelectedShop] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const { cart, cartTotalItems, addToCart: ctxAddToCart, removeFromCart, updateCartPrice, updateCartQty } = useCart();
    const [ranks, setRanks] = useState(() => {
        const saved = localStorage.getItem(`gallery_ranks_${user.id}`);
        return saved ? JSON.parse(saved) : {};
    }); // {productId: rankValue}
    const [sortBy, setSortBy] = useState(() => {
        const saved = localStorage.getItem(`gallery_sort_${user.id}`);
        return saved || 'oldest';
    });



    // Prevent drag from activating when interacting with inputs, buttons, etc.
    function shouldHandleEvent(element) {
        let cur = element;
        while (cur) {
            if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'A'].includes(cur.tagName)) {
                return false;
            }
            cur = cur.parentElement;
        }
        return true;
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
            onActivation: ({ event }) => shouldHandleEvent(event.target)
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const [pData, rData, cData] = await Promise.all([
                productsApi.list({ limit: 5000 }),
                retailersApi.list(),
                productsApi.categories()
            ]);

            setRetailers(rData.retailers || []);
            setCategories(['All', ...(cData.categories || [])]);

            setProducts(pData.products || []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);


    const addToCart = (product) => {
        if (product.stock_quantity <= 0) {
            toast.error('Out of stock');
            return;
        }

        const currentItem = cart[product.id] || { qty: 0, price: '' };
        if (currentItem.qty >= product.stock_quantity) {
            toast.error('Cannot add more than available stock');
            return;
        }

        if (!isAdmin) {
            const currentPrice = currentItem.price || product.default_selling_price || 0;
            if (parseFloat(currentPrice) < product.purchase_price) {
                if (currentItem.price && parseFloat(currentItem.price) < product.purchase_price) {
                    toast.error('Please correct prices.');
                    return;
                }
            }
        }

        ctxAddToCart(product);
        toast.success(`Added ${product.name} to order`, { duration: 1500 });
    };

    // removeFromCart and updateCartPrice are now from context

    // cartTotalItems is now from context

    const updateRank = (productId, direction) => {
        setRanks(prev => {
            const newRanks = { ...prev };
            const currentRank = newRanks[productId] || 0;
            newRanks[productId] = currentRank + direction;
            localStorage.setItem(`gallery_ranks_${user.id}`, JSON.stringify(newRanks));
            return newRanks;
        });
        setSortBy('manual');
        localStorage.setItem(`gallery_sort_${user.id}`, 'manual');
    };

    const goToOrder = () => {
        if (cartTotalItems === 0) {
            toast.error('Please add products to your order first');
            return;
        }

        // Removed local price validation to allow navigating to checkout even if prices need correction
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

                setSortBy('manual');
                localStorage.setItem(`gallery_sort_${user.id}`, 'manual');

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

    const sortedProducts = useMemo(() => {
        let items = [...products];

        if (selectedCategory !== 'All') {
            items = items.filter(p => p.category === selectedCategory);
        }
        if (search.trim()) {
            const s = search.toLowerCase();
            items = items.filter(p => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
        }

        if (sortBy === 'manual') {
            items.sort((a, b) => {
                const rankA = ranks[a.id] || 0;
                const rankB = ranks[b.id] || 0;
                if (rankA !== rankB) return rankB - rankA;
                return a.id - b.id; // Default oldest first
            });
        } else if (sortBy === 'newest') {
            items.sort((a, b) => b.id - a.id);
        } else if (sortBy === 'oldest') {
            items.sort((a, b) => a.id - b.id);
        } else if (sortBy === 'name_asc') {
            items.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'name_desc') {
            items.sort((a, b) => b.name.localeCompare(a.name));
        }
        return items;
    }, [products, sortBy, ranks, selectedCategory, search]);

    const filteredProducts = sortedProducts;

    const getGridClass = () => {
        if (gridCols === 1) return 'grid-cols-1 max-w-xl mx-auto';
        if (gridCols === 2) return 'grid-cols-2 lg:grid-cols-2';
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
    };

    return (
        <div className="pb-20">
            <div className="animate-fade-in">
                <div className="page-header sm:sticky sm:top-0 bg-surface-900/80 backdrop-blur-md z-30 py-4 mb-6 transition-all">
                    <div className="hidden sm:block">
                        <h1 className="page-title">Product Gallery</h1>
                        <p className="text-slate-400 text-sm mt-1">Quickly add products to your next order</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Grid Switcher */}
                        <div className="hidden md:flex items-center bg-surface-800 rounded-lg p-1 border border-surface-700/50 mr-4">
                            {[1, 2, 4].map(cols => (
                                <button
                                    key={cols}
                                    onClick={() => {
                                        setGridCols(cols);
                                        localStorage.setItem(`gallery_grid_${user.id}`, cols);
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${gridCols === cols ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {cols === 1 ? '1 x 1' : cols === 2 ? '2 x 2' : '4 x 4'}
                                </button>
                            ))}
                        </div>

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
                            className="hidden sm:flex btn-primary relative"
                        >
                            <ShoppingCart size={18} />
                            <span>Go to Cart</span>
                            {cartTotalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-surface-900 animate-bounce">
                                    {cartTotalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Category Filter & Sort Controls */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                            className="bg-surface-800 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none focus:ring-1 focus:ring-primary-500 flex-1 sm:max-w-xs transition-all"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'All' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                        <select
                            className="bg-surface-800 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none focus:ring-1 focus:ring-primary-500 flex-1 sm:max-w-xs transition-all"
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                localStorage.setItem(`gallery_sort_${user.id}`, e.target.value);
                            }}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="name_asc">Name (A-Z)</option>
                            <option value="name_desc">Name (Z-A)</option>
                            <option value="manual">Manual Order</option>
                        </select>
                    </div>

                    <div className="sm:hidden flex flex-col gap-3">
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
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    className="input pl-9"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>


                            <div className="flex items-center bg-surface-800 rounded-xl p-1 border border-surface-700/50">
                                {[1, 2].map(cols => (
                                    <button
                                        key={cols}
                                        onClick={() => setGridCols(cols)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${gridCols === cols ? 'bg-primary-600 text-white' : 'text-slate-500'}`}
                                    >
                                        {cols}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 size={40} className="text-primary-500 animate-spin" />
                        <p className="text-slate-500 animate-pulse">Loading gallery...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="section-card text-center py-20 bg-surface-950/30 border-dashed border-2 border-surface-700">
                        <Package size={64} className="mx-auto mb-4 text-slate-700" />
                        <h3 className="text-xl font-bold text-white mb-2">No Products Found</h3>
                        <p className="text-slate-500">Try adjusting your filters or search terms</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={filteredProducts.map(p => p.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className={`grid gap-6 ${getGridClass()}`}>
                                {filteredProducts.map(product => {
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
                                            onUpdateQty={updateCartQty}
                                            isAdmin={isAdmin}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Mobile Bottom Bar for Cart removed as it's now in the header */}
        </div>
    );
}
