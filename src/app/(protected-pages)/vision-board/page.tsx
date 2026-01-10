'use client';

/**
 * Vision Board Page
 * Comprehensive visual goal board with images, text, and affirmations
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Image as ImageIcon, 
  Type, 
  Sparkles, 
  Target, 
  Filter,
  Maximize2,
  Settings,
  Trash2,
  Edit3,
  X,
  Upload,
  Link as LinkIcon,
  Briefcase,
  Heart,
  DollarSign,
  Plane,
  Dumbbell,
  Home,
  GraduationCap,
  Star
} from 'lucide-react';

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

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text' | 'affirmation';
  content: string;
  caption?: string;
  category: string;
  width: number;
  height: number;
}

// Sample items for demo with locally generated images
const SAMPLE_ITEMS: VisionBoardItem[] = [
  { id: '1', type: 'image', content: '/vision-board/vision_luxury_lifestyle_1768041865403.png', caption: 'Luxury Lifestyle', category: 'finance', width: 200, height: 150 },
  { id: '2', type: 'affirmation', content: 'I am attracting wealth and abundance every day', category: 'finance', width: 250, height: 100 },
  { id: '3', type: 'image', content: '/vision-board/travel.png', caption: 'World Travel Adventures', category: 'travel', width: 200, height: 150 },
  { id: '4', type: 'text', content: 'Build a 7-figure business by 2027', category: 'career', width: 200, height: 80 },
  { id: '5', type: 'image', content: '/vision-board/vision_health_fitness_1768041899793.png', caption: 'Peak Fitness & Wellness', category: 'health', width: 180, height: 140 },
  { id: '6', type: 'affirmation', content: 'I am healthy, strong, and full of energy', category: 'health', width: 220, height: 100 },
  { id: '7', type: 'image', content: '/vision-board/family.png', caption: 'Loving Family', category: 'relationships', width: 200, height: 150 },
  { id: '8', type: 'image', content: '/vision-board/vision_success_career_1768041880581.png', caption: 'Career Success', category: 'career', width: 180, height: 140 },
  { id: '9', type: 'affirmation', content: 'I am worthy of love, success, and happiness', category: 'growth', width: 240, height: 100 },
  { id: '10', type: 'text', content: 'Own my dream home with ocean view', category: 'home', width: 200, height: 80 },
];

export default function VisionBoardPage() {
  const [items, setItems] = useState<VisionBoardItem[]>(SAMPLE_ITEMS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VisionBoardItem | null>(null);
  const [addType, setAddType] = useState<'image' | 'text' | 'affirmation'>('image');

  // Filter items by category
  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const getCategoryColor = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.color || '#FFD700';
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setSelectedItem(null);
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
            <p className="text-xs text-gray-500 mt-0.5">Visualize your dreams</p>
          </div>
          <div className="flex items-center gap-2">
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
                onClick={() => setSelectedItem(item)}
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

        {/* Empty State */}
        {filteredItems.length === 0 && (
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
                    { type: 'image', icon: ImageIcon, label: 'Image' },
                    { type: 'text', icon: Type, label: 'Goal Text' },
                    { type: 'affirmation', icon: Sparkles, label: 'Affirmation' },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        onClick={() => setAddType(option.type as any)}
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
                        placeholder="Paste image URL..."
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                      <Type className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
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
                    placeholder={addType === 'affirmation' ? 'I am...' : 'Describe your goal...'}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 outline-none resize-none"
                  />
                )}

                {/* Category Select */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent hover:border-white/10"
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: category.color }} />
                        {category.name}
                      </button>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-sm hover:brightness-110 transition-all"
                >
                  Add to Board
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
