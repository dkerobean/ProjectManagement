'use client';

/**
 * Vision Board Page
 * Comprehensive visual goal board with images, text, and affirmations
 * Full CRUD functionality with Supabase backend
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Image as ImageIcon, 
  Type, 
  Sparkles, 
  Maximize2,
  Trash2,
  X,
  Link as LinkIcon,
  Briefcase,
  Heart,
  DollarSign,
  Plane,
  Dumbbell,
  Home,
  GraduationCap,
  Star,
  Loader2,
  RefreshCw,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

// Category definitions with icons and colors
const CATEGORIES = [
  { id: 'all', name: 'All', icon: Star, color: '#FFD700' },
  { id: 'career', name: 'Career', icon: Briefcase, color: '#3B82F6' },
  { id: 'finance', name: 'Finance', icon: DollarSign, color: '#10B981' },
  { id: 'health', name: 'Health', icon: Dumbbell, color: '#EF4444' },
  { id: 'relationships', name: 'Love', icon: Heart, color: '#EC4899' },
  { id: 'travel', name: 'Travel', icon: Plane, color: '#8B5CF6' },
  { id: 'home', name: 'Home', icon: Home, color: '#F59E0B' },
  { id: 'growth', name: 'Growth', icon: GraduationCap, color: '#06B6D4' },
];

// Default sample items (shown when no database items exist)
const DEFAULT_ITEMS = [
  { id: 'demo-1', type: 'image' as const, content: '/vision-board/vision_luxury_lifestyle_1768041865403.png', caption: 'Luxury Lifestyle', category: 'finance' },
  { id: 'demo-2', type: 'affirmation' as const, content: 'I am attracting wealth and abundance every day', caption: '', category: 'finance' },
  { id: 'demo-3', type: 'image' as const, content: '/vision-board/travel.png', caption: 'World Travel Adventures', category: 'travel' },
  { id: 'demo-4', type: 'text' as const, content: 'Build a 7-figure business by 2027', caption: '', category: 'career' },
  { id: 'demo-5', type: 'image' as const, content: '/vision-board/vision_health_fitness_1768041899793.png', caption: 'Peak Fitness & Wellness', category: 'health' },
  { id: 'demo-6', type: 'image' as const, content: '/vision-board/family.png', caption: 'Loving Family', category: 'relationships' },
  { id: 'demo-7', type: 'image' as const, content: '/vision-board/vision_success_career_1768041880581.png', caption: 'Career Success', category: 'career' },
];

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text' | 'affirmation';
  content: string;
  caption?: string;
  category: string;
  board_id?: string;
}

interface VisionBoard {
  id: string;
  name: string;
  user_id: string;
  vision_board_items?: VisionBoardItem[];
}

export default function VisionBoardPage() {
  const [items, setItems] = useState<VisionBoardItem[]>(DEFAULT_ITEMS);
  const [board, setBoard] = useState<VisionBoard | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [addType, setAddType] = useState<'image' | 'text' | 'affirmation'>('image');
  const [formContent, setFormContent] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formCategory, setFormCategory] = useState('general');

  // Fetch vision board and items
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vision-board');
      const json = await res.json();
      
      if (json.success && json.data && json.data.length > 0) {
        const userBoard = json.data[0];
        setBoard(userBoard);
        if (userBoard.vision_board_items && userBoard.vision_board_items.length > 0) {
          setItems(userBoard.vision_board_items);
        }
      }
    } catch (error) {
      console.log('Using demo data - API not connected or user not logged in');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create board if user doesn't have one
  const ensureBoard = async (): Promise<string | null> => {
    if (board?.id) return board.id;
    
    try {
      const res = await fetch('/api/vision-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Vision Board' }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBoard(json.data);
        return json.data.id;
      }
    } catch (error) {
      console.error('Failed to create board:', error);
    }
    return null;
  };

  // Add new item
  const handleAddItem = async () => {
    if (!formContent.trim()) {
      toast.error('Please enter content');
      return;
    }

    setSaving(true);
    try {
      const boardId = await ensureBoard();
      
      if (boardId) {
        // Save to database
        const res = await fetch('/api/vision-board/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            board_id: boardId,
            type: addType,
            content: formContent,
            caption: formCaption,
            category: formCategory,
          }),
        });
        const json = await res.json();
        
        if (json.success) {
          setItems([json.data, ...items.filter(i => !i.id.startsWith('demo-'))]);
          toast.success('Item added!');
        } else {
          throw new Error(json.error);
        }
      } else {
        // Demo mode - add locally
        const newItem: VisionBoardItem = {
          id: `local-${Date.now()}`,
          type: addType,
          content: formContent,
          caption: formCaption,
          category: formCategory,
        };
        setItems([newItem, ...items]);
        toast.success('Item added (demo mode)');
      }
      
      // Reset form
      setFormContent('');
      setFormCaption('');
      setFormCategory('general');
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    // Optimistic update
    const previousItems = [...items];
    setItems(items.filter(item => item.id !== id));

    try {
      if (!id.startsWith('demo-') && !id.startsWith('local-')) {
        const res = await fetch(`/api/vision-board/items?id=${id}`, {
          method: 'DELETE',
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error);
        }
      }
      toast.success('Item deleted');
    } catch (error) {
      // Revert on error
      setItems(previousItems);
      toast.error('Failed to delete');
    }
  };

  // Filter items by category
  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const getCategoryColor = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.color || '#FFD700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-4 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Vision Board
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {board ? board.name : 'Visualize your dreams'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowVisualization(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 max-w-7xl mx-auto">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? category.color : undefined }} />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vision Board Grid */}
      <main className="px-4 py-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="relative group cursor-pointer"
                >
                  {/* Item Card */}
                  <div 
                    className={`rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-xl ${
                      item.type === 'affirmation' ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30' : ''
                    }`}
                    style={{ 
                      borderLeftColor: getCategoryColor(item.category),
                      borderLeftWidth: '3px'
                    }}
                  >
                    {item.type === 'image' ? (
                      <div className="relative">
                        <img 
                          src={item.content} 
                          alt={item.caption || 'Vision'} 
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/vision-board/vision_luxury_lifestyle_1768041865403.png';
                          }}
                        />
                        {item.caption && (
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-sm font-medium text-white">{item.caption}</p>
                          </div>
                        )}
                      </div>
                    ) : item.type === 'affirmation' ? (
                      <div className="p-5 min-h-[120px] flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-purple-200 italic">"{item.content}"</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 min-h-[100px] flex items-center">
                        <p className="text-sm font-medium text-gray-200">{item.content}</p>
                      </div>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                      className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No items in this category</h3>
            <p className="text-sm text-gray-500 mb-4">Add images, goals, or affirmations to visualize your dreams</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-bold text-sm"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1a2e] rounded-3xl border border-white/10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Add to Vision Board</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type Selection */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'image' as const, icon: ImageIcon, label: 'Image' },
                    { type: 'text' as const, icon: Type, label: 'Goal Text' },
                    { type: 'affirmation' as const, icon: Sparkles, label: 'Affirmation' },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        onClick={() => setAddType(option.type)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                          addType === option.type
                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Image URL Input */}
                {addType === 'image' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Paste image URL..."
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                      <Type className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={formCaption}
                        onChange={(e) => setFormCaption(e.target.value)}
                        placeholder="Caption (optional)"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Text Input */}
                {(addType === 'text' || addType === 'affirmation') && (
                  <textarea
                    rows={3}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder={addType === 'affirmation' ? 'I am...' : 'Describe your goal...'}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 outline-none resize-none"
                  />
                )}

                {/* Category Select */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map((category) => {
                    const Icon = category.icon;
                    const isSelected = formCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setFormCategory(category.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: category.color }} />
                        {category.name}
                        {isSelected && <Check className="w-3 h-3 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleAddItem}
                  disabled={saving || !formContent.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to Board
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualization Mode */}
      <AnimatePresence>
        {showVisualization && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <button
              onClick={() => setShowVisualization(false)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Auto-rotating slideshow */}
            <div className="w-full max-w-4xl p-8">
              <motion.div
                key={items[0]?.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                {items.length > 0 && items[0].type === 'image' ? (
                  <img 
                    src={items[0].content} 
                    alt={items[0].caption || ''} 
                    className="max-h-[70vh] mx-auto rounded-2xl shadow-2xl"
                  />
                ) : (
                  <p className="text-4xl font-bold text-white italic">"{items[0]?.content}"</p>
                )}
                {items[0]?.caption && (
                  <p className="text-2xl text-gray-300 mt-6">{items[0].caption}</p>
                )}
              </motion.div>
            </div>
            
            <p className="absolute bottom-8 text-gray-500 text-sm">Press ESC or click X to exit</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
