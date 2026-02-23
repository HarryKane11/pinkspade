'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Wand2,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Maximize2,
  X,
  RotateCcw,
  Zap,
  Star,
  Crown,
} from 'lucide-react';
import { FAL_MODELS, type FalModel } from '@/lib/fal';

interface UploadedImage {
  file: File;
  previewUrl: string;
}

export interface GeneratedAsset {
  id: string;
  image: string; // base64 data URI or external URL
  format: string;
  label: string;
}

type AIEngine = 'gemini' | 'fal';

interface AssetGeneratorPanelProps {
  onGenerate?: () => void;
  onResults?: (assets: GeneratedAsset[]) => void;
  isGenerating?: boolean;
  /** Capture the current canvas as a base64 data URL for layout reference */
  onCaptureCanvas?: () => string | null;
}

const SPEED_ICONS: Record<FalModel['speed'], React.ReactNode> = {
  fast: <Zap className="w-3 h-3" />,
  standard: <Star className="w-3 h-3" />,
  slow: <Crown className="w-3 h-3" />,
};

const QUALITY_COLORS: Record<FalModel['quality'], string> = {
  standard: 'bg-zinc-100 text-zinc-600',
  high: 'bg-blue-50 text-blue-600',
  ultra: 'bg-amber-50 text-amber-600',
};

export function AssetGeneratorPanel({ onGenerate, onResults, isGenerating, onCaptureCanvas }: AssetGeneratorPanelProps) {
  const [mode, setMode] = useState<'full' | 'layout'>('full');
  const [aiEngine, setAiEngine] = useState<AIEngine>('fal');
  const [selectedModel, setSelectedModel] = useState<FalModel>(FAL_MODELS[1]); // flux-dev
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [productName, setProductName] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [formats, setFormats] = useState([
    { id: 'feed', label: 'IG Feed 1:1', icon: 'image', checked: true },
    { id: 'story', label: 'Story 9:16', icon: 'phone', checked: true },
    { id: 'banner', label: 'Banner 16:9', icon: 'monitor', checked: false },
    { id: 'custom', label: 'Custom', icon: 'maximize', checked: false },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state to sessionStorage so AI Copy Editor can access context
  useEffect(() => {
    try {
      sessionStorage.setItem('assetProductName', productName);
      sessionStorage.setItem('assetMoods', JSON.stringify(selectedMoods));
      sessionStorage.setItem('assetPrompt', prompt);
    } catch { /* ignore */ }
  }, [productName, selectedMoods, prompt]);

  const formatIcons: Record<string, React.ReactNode> = {
    image: <ImageIcon className="w-3.5 h-3.5" />,
    phone: <Smartphone className="w-3.5 h-3.5" />,
    monitor: <Monitor className="w-3.5 h-3.5" />,
    maximize: <Maximize2 className="w-3.5 h-3.5" />,
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return; // 10MB limit

    const previewUrl = URL.createObjectURL(file);
    setUploadedImage({ file, previewUrl });
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadedImage]);

  const handleReplaceImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const toggleFormat = useCallback((id: string) => {
    setFormats((prev) =>
      prev.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f))
    );
  }, []);

  const MOOD_OPTIONS = ['Minimalist', 'Bold', 'Elegant', 'Playful', 'Premium', 'Natural', 'Modern', 'Retro'];

  const toggleMood = useCallback((mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  }, []);

  const selectedCount = formats.filter((f) => f.checked).length;

  const handleGenerate = useCallback(async () => {
    onGenerate?.();

    const selectedFormats = formats.filter((f) => f.checked);
    if (selectedFormats.length === 0) return;

    // Load brand DNA from sessionStorage
    let brandDna = null;
    try {
      const stored = sessionStorage.getItem('brandDna');
      if (stored) brandDna = JSON.parse(stored);
    } catch { /* no brand dna */ }

    // Convert uploaded image to base64 if available
    let productImageBase64: string | undefined;
    if (uploadedImage) {
      productImageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(uploadedImage.file);
      });
    }

    // Capture canvas layout for Full Image mode
    let layoutImageBase64: string | undefined;
    if (mode === 'full' && onCaptureCanvas) {
      const captured = onCaptureCanvas();
      if (captured) layoutImageBase64 = captured;
    }

    const enhancedPrompt = [
      prompt || 'Create a professional marketing campaign asset',
      selectedMoods.length > 0 ? `Style: ${selectedMoods.join(', ')}` : '',
      productName ? `Product: ${productName}` : '',
    ].filter(Boolean).join('. ');

    const results: GeneratedAsset[] = [];

    for (const fmt of selectedFormats) {
      try {
        if (aiEngine === 'fal') {
          // Fal AI route
          const res = await fetch('/api/media/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: enhancedPrompt,
              modelId: selectedModel.id,
              format: fmt.id,
              numImages: 1,
              brandDna: brandDna ? {
                colors: brandDna.colors,
                tone: brandDna.tone,
              } : undefined,
              inputImageUrl: selectedModel.id === 'flux-kontext' && productImageBase64
                ? productImageBase64 : undefined,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const firstImage = data.images?.[0];
            if (firstImage?.url) {
              results.push({
                id: `${fmt.id}-${Date.now()}`,
                image: firstImage.url,
                format: fmt.id,
                label: fmt.label,
              });
            }
          } else {
            const err = await res.json().catch(() => ({}));
            console.error(`Fal AI generation failed for ${fmt.id}:`, err);
          }
        } else {
          // OpenRouter (Gemini) route
          const res = await fetch('/api/assets/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: enhancedPrompt,
              brandDna,
              productImageBase64,
              layoutImageBase64: mode === 'full' ? layoutImageBase64 : undefined,
              format: { id: fmt.id, label: fmt.label },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.image) {
              results.push({
                id: `${fmt.id}-${Date.now()}`,
                image: data.image.startsWith('data:') ? data.image : `data:image/png;base64,${data.image}`,
                format: fmt.id,
                label: fmt.label,
              });
            }
          }
        }
      } catch (err) {
        console.error(`Generation failed for ${fmt.id}:`, err);
      }
    }

    if (results.length > 0) {
      onResults?.(results);
    }
  }, [onGenerate, onResults, formats, prompt, productName, selectedMoods, uploadedImage, mode, onCaptureCanvas, aiEngine, selectedModel]);

  return (
    <aside className="w-80 bg-white border-r border-zinc-200 flex flex-col flex-shrink-0 z-10 overflow-y-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="p-4 border-b border-zinc-200 sticky top-0 bg-white/95 backdrop-blur z-10">
        <h1 className="text-sm font-medium tracking-tight text-zinc-900 mb-3">Asset Generator</h1>

        {/* Mode Switcher */}
        <div className="bg-zinc-100 p-1 rounded-lg flex items-center text-xs font-medium relative">
          <button
            onClick={() => setMode('full')}
            className={`flex-1 py-1.5 text-center transition-all rounded-md ${
              mode === 'full'
                ? 'text-zinc-900 bg-white shadow-sm border border-zinc-200/50'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Full Image
          </button>
          <button
            onClick={() => setMode('layout')}
            className={`flex-1 py-1.5 text-center transition-all rounded-md ${
              mode === 'layout'
                ? 'text-zinc-900 bg-white shadow-sm border border-zinc-200/50'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Layout & BG
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6">
        {/* AI Engine Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-700">AI Engine</label>
          <div className="bg-zinc-100 p-1 rounded-lg flex items-center text-xs font-medium">
            <button
              onClick={() => setAiEngine('fal')}
              className={`flex-1 py-1.5 text-center transition-all rounded-md ${
                aiEngine === 'fal'
                  ? 'text-zinc-900 bg-white shadow-sm border border-zinc-200/50'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Fal AI
            </button>
            <button
              onClick={() => setAiEngine('gemini')}
              className={`flex-1 py-1.5 text-center transition-all rounded-md ${
                aiEngine === 'gemini'
                  ? 'text-zinc-900 bg-white shadow-sm border border-zinc-200/50'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Gemini
            </button>
          </div>

          {/* Fal AI Model Cards */}
          {aiEngine === 'fal' && (
            <div className="flex flex-col gap-1.5 mt-1">
              {FAL_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`flex items-center gap-2.5 p-2 border rounded-lg text-left transition-all ${
                    selectedModel.id === model.id
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate">{model.nameKo}</div>
                    <div className={`text-[9px] truncate ${selectedModel.id === model.id ? 'text-zinc-400' : 'text-zinc-400'}`}>
                      {model.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      selectedModel.id === model.id ? 'bg-white/20 text-white' : QUALITY_COLORS[model.quality]
                    }`}>
                      {SPEED_ICONS[model.speed]}
                      {model.quality}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {aiEngine === 'gemini' && (
            <p className="text-[10px] text-zinc-400 mt-1">
              Gemini 3 Pro — layout reference + brand tone 지원
            </p>
          )}
        </div>

        <div className="w-full h-px bg-zinc-100" />

        {/* Image Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-700">Subject / Product Image</label>

          {uploadedImage ? (
            /* Uploaded state */
            <div className="relative rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 group">
              <img
                src={uploadedImage.previewUrl}
                alt="Uploaded product"
                className="w-full h-40 object-contain bg-white"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={handleReplaceImage}
                  className="p-2 bg-white rounded-lg shadow-sm hover:bg-zinc-50 transition-colors"
                  title="Replace image"
                >
                  <RotateCcw className="w-4 h-4 text-zinc-700" />
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="p-2 bg-white rounded-lg shadow-sm hover:bg-zinc-50 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="px-3 py-2 border-t border-zinc-100 bg-white">
                <p className="text-[10px] text-zinc-500 truncate">{uploadedImage.file.name}</p>
                <p className="text-[10px] text-zinc-400">
                  {(uploadedImage.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
          ) : (
            /* Empty upload state */
            <div
              onClick={handleUploadClick}
              className="border border-dashed border-zinc-300 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer group flex flex-col items-center justify-center p-6 text-center h-32"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center mb-2 group-hover:-translate-y-0.5 transition-transform">
                <Upload className="w-4 h-4 text-zinc-500" />
              </div>
              <span className="text-xs font-medium text-zinc-900">Click to upload</span>
              <span className="text-[10px] text-zinc-400 mt-1">PNG, JPG, WebP up to 10MB</span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-700">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none transition-all placeholder:text-zinc-400"
            placeholder="e.g. Aurora Skincare Serum"
          />
        </div>

        <div className="w-full h-px bg-zinc-100" />

        {/* Creative Direction */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-700">Creative Direction</label>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood}
                onClick={() => toggleMood(mood)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                  selectedMoods.includes(mood)
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-zinc-100" />

        {/* Campaign Formats */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700">Campaign Formats</label>
            <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 rounded">
              {selectedCount} selected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {formats.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => toggleFormat(fmt.id)}
                className={`flex items-center gap-2 p-2 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  fmt.checked
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {formatIcons[fmt.icon]}
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-zinc-100" />

        {/* Creative Prompt */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              Creative Prompt
            </label>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              Brand Tone Applied
            </span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none resize-none h-24 transition-all placeholder:text-zinc-400"
            placeholder="Describe the scene, background, or specific elements you want to include..."
          />
        </div>
      </div>

      {/* Sticky Generate Button */}
      <div className="p-4 border-t border-zinc-200 bg-white sticky bottom-0">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedCount === 0}
          className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Assets
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
