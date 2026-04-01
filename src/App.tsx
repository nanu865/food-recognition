import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Camera as CameraIcon, 
  Upload, 
  Loader2, 
  History, 
  Info, 
  ChevronRight, 
  Utensils, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Heart,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

import { Camera } from '@/src/components/Camera';
import { analyzeFoodImage, FoodAnalysis } from '@/src/services/gemini';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b']; // Green, Blue, Amber

interface ScanHistoryItem extends FoodAnalysis {
  id: string;
  timestamp: number;
  image: string;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('scan');

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nutrilens_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('nutrilens_history', JSON.stringify(history));
  }, [history]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImage(base64);
        handleAnalyze(base64);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    noClick: false,
    noKeyboard: false
  } as any);

  const handleAnalyze = async (base64: string) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const analysis = await analyzeFoodImage(base64);
      setResult(analysis);
      
      // Add to history
      const newItem: ScanHistoryItem = {
        ...analysis,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        image: base64
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
      
      toast.success(`Identified: ${analysis.name}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  const chartData = result ? [
    { name: 'Protein', value: result.protein },
    { name: 'Carbs', value: result.carbs },
    { name: 'Fat', value: result.fat },
  ] : [];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-emerald-100">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Utensils className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NutriLens AI</h1>
              <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">Advanced Food Vision</p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Scan</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {!image ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-6 flex flex-col justify-center">
                    <div className="space-y-2">
                      <h2 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
                        Know what you <span className="text-emerald-600">eat.</span>
                      </h2>
                      <p className="text-lg text-neutral-600 leading-relaxed">
                        Snap a photo of your meal to get instant nutritional insights, 
                        health scores, and hidden ingredients using advanced AI.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        size="lg" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 shadow-xl shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
                        onClick={() => setShowCamera(true)}
                      >
                        <CameraIcon className="mr-2 h-5 w-5" />
                        Open Camera
                      </Button>
                      <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
                        <Separator orientation="vertical" className="h-4" />
                        <span>OR</span>
                        <Separator orientation="vertical" className="h-4" />
                      </div>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="rounded-full px-8 border-2 hover:bg-neutral-100 transition-all"
                        {...getRootProps()}
                      >
                        <input {...getInputProps()} />
                        <Upload className="mr-2 h-5 w-5" />
                        Upload Image
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-200 overflow-hidden">
                            <img 
                              src={`https://picsum.photos/seed/food${i}/100/100`} 
                              alt="User" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-500 font-medium">
                        Joined by <span className="text-neutral-900 font-bold">10k+</span> health enthusiasts
                      </p>
                    </div>
                  </div>

                  <div 
                    {...getRootProps()} 
                    className={`relative aspect-square rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center p-12 text-center cursor-pointer
                      ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'}
                    `}
                  >
                    <input {...getInputProps()} />
                    <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                      <Upload className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Drop your food photo here</h3>
                    <p className="text-neutral-500 max-w-[200px]">Drag and drop or click to browse your files</p>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-neutral-200 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-neutral-200 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-neutral-200 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-neutral-200 rounded-br-lg" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
                  {/* Image Preview & Quick Stats */}
                  <div className="space-y-6">
                    <Card className="overflow-hidden rounded-3xl border-0 shadow-2xl shadow-neutral-200">
                      <div className="relative aspect-square">
                        <img 
                          src={image} 
                          alt="Food to analyze" 
                          className="w-full h-full object-cover"
                        />
                        {isAnalyzing && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
                            <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-400" />
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                              className="text-lg font-bold"
                            >
                              AI is analyzing your meal...
                            </motion.p>
                            <p className="text-sm text-white/70 mt-2">Identifying ingredients and calculating nutrition</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {result && (
                      <Card className="rounded-3xl border-0 shadow-xl shadow-neutral-100 bg-emerald-600 text-white p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg">Health Score</h3>
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-xl">
                            {result.healthScore}
                          </div>
                        </div>
                        <Progress value={result.healthScore * 10} className="h-2 bg-white/20 mb-4" />
                        <p className="text-sm text-white/80 leading-relaxed">
                          {result.healthScore >= 7 
                            ? "This is a highly nutritious choice! Great for your energy levels." 
                            : result.healthScore >= 4 
                            ? "A balanced meal, but watch your portions of processed ingredients."
                            : "Consider pairing this with some fresh greens to balance the nutrients."}
                        </p>
                      </Card>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl h-12 border-2"
                      onClick={reset}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Scan Another
                    </Button>
                  </div>

                  {/* Analysis Results */}
                  <div className="space-y-6">
                    {result ? (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                              {Math.round(result.confidence * 100)}% Match
                            </Badge>
                            <Badge variant="outline" className="border-neutral-200">
                              Verified by AI
                            </Badge>
                          </div>
                          <h2 className="text-4xl font-black tracking-tight">{result.name}</h2>
                          <p className="text-neutral-500 text-lg leading-relaxed">{result.description}</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            { label: 'Calories', value: result.calories, unit: 'kcal', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
                            { label: 'Protein', value: result.protein, unit: 'g', icon: Beef, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { label: 'Carbs', value: result.carbs, unit: 'g', icon: Wheat, color: 'text-amber-500', bg: 'bg-amber-50' },
                            { label: 'Fat', value: result.fat, unit: 'g', icon: Droplets, color: 'text-rose-500', bg: 'bg-rose-50' },
                          ].map((stat) => (
                            <Card key={stat.label} className="border-0 shadow-sm bg-white p-4 rounded-2xl flex flex-col items-center text-center">
                              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-2`}>
                                <stat.icon className="w-5 h-5" />
                              </div>
                              <span className="text-2xl font-black">{stat.value}</span>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">{stat.label} ({stat.unit})</span>
                            </Card>
                          ))}
                        </div>

                        <Card className="rounded-3xl border-0 shadow-xl shadow-neutral-100 overflow-hidden">
                          <Tabs defaultValue="macros" className="w-full">
                            <TabsList className="w-full rounded-none h-12 bg-neutral-50 p-0">
                              <TabsTrigger value="macros" className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500">Macros</TabsTrigger>
                              <TabsTrigger value="ingredients" className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500">Ingredients</TabsTrigger>
                              <TabsTrigger value="fact" className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500">Fun Fact</TabsTrigger>
                            </TabsList>
                            <CardContent className="p-6">
                              <TabsContent value="macros" className="mt-0">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                  <div className="w-48 h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={chartData}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={60}
                                          outerRadius={80}
                                          paddingAngle={5}
                                          dataKey="value"
                                        >
                                          {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                        </Pie>
                                        <RechartsTooltip />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="flex-1 space-y-4 w-full">
                                    {chartData.map((item, i) => (
                                      <div key={item.name} className="space-y-1">
                                        <div className="flex justify-between text-sm font-bold">
                                          <span>{item.name}</span>
                                          <span>{item.value}g</span>
                                        </div>
                                        <Progress value={(item.value / (result.protein + result.carbs + result.fat)) * 100} className="h-1.5" style={{ '--progress-background': COLORS[i] } as any} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="ingredients" className="mt-0">
                                <div className="flex flex-wrap gap-2">
                                  {result.ingredients.map((ing, i) => (
                                    <Badge key={i} variant="secondary" className="rounded-full px-4 py-1 bg-neutral-100 text-neutral-700 border-0">
                                      {ing}
                                    </Badge>
                                  ))}
                                </div>
                              </TabsContent>
                              <TabsContent value="fact" className="mt-0">
                                <div className="flex gap-4 items-start bg-emerald-50 p-4 rounded-2xl">
                                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 text-emerald-600">
                                    <Info className="w-5 h-5" />
                                  </div>
                                  <p className="text-emerald-900 leading-relaxed italic">
                                    "{result.funFact}"
                                  </p>
                                </div>
                              </TabsContent>
                            </CardContent>
                          </Tabs>
                        </Card>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-neutral-300 space-y-4 py-20">
                        <Loader2 className="w-12 h-12 animate-spin" />
                        <p className="font-medium">Processing scan...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black tracking-tight">Your Scan History</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-neutral-500"
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('nutrilens_history');
                  }}
                >
                  Clear All
                </Button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-neutral-200">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                    <History className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">No scans yet</h3>
                  <p className="text-neutral-500 mt-2">Start scanning your meals to see them here.</p>
                  <Button 
                    className="mt-6 bg-emerald-600"
                    onClick={() => setActiveTab('scan')}
                  >
                    Go to Scanner
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {history.map((item) => (
                    <Card 
                      key={item.id} 
                      className="overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => {
                        setImage(item.image);
                        setResult(item);
                        setActiveTab('scan');
                      }}
                    >
                      <div className="flex h-32">
                        <div className="w-32 h-full shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg truncate pr-2">{item.name}</h3>
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                                {item.healthScore}/10
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{item.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Camera Overlay */}
      <AnimatePresence>
        {showCamera && (
          <Camera 
            onCapture={(base64) => {
              setShowCamera(false);
              setImage(base64);
              handleAnalyze(base64);
            }} 
            onClose={() => setShowCamera(false)} 
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t bg-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center">
              <Utensils className="text-white w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight">NutriLens AI</span>
          </div>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Powered by Google Gemini 2.5 Flash. This AI-generated analysis is for informational purposes only and should not replace professional medical advice.
          </p>
          <div className="flex justify-center gap-6 text-neutral-400">
            <Heart className="w-5 h-5 hover:text-rose-500 transition-colors cursor-pointer" />
            <Sparkles className="w-5 h-5 hover:text-amber-500 transition-colors cursor-pointer" />
            <Info className="w-5 h-5 hover:text-blue-500 transition-colors cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}
