'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Wand2,
  ShieldCheck,
  Sparkles,
  X,
  RotateCcw,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { FAL_MODELS } from '@/lib/fal';
import { CREDIT_COSTS } from '@/lib/credits';
import {
  CHANNEL_CATEGORIES,
  getPresetsByCategory,
  type ChannelPreset,
  type ChannelCategory,
} from '@/lib/shared/channel-presets';

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

export interface CampaignFormat {
  id: string; // preset ID or custom ID
  label: string;
  channelId: string;
  logo: string;
  width: number;
  height: number;
  checked: boolean;
}

interface AssetGeneratorPanelProps {
  onGenerate?: () => void;
  onResults?: (assets: GeneratedAsset[]) => void;
  isGenerating?: boolean;
  onCaptureCanvas?: () => string | null;
  onFormatsChange?: (formats: CampaignFormat[]) => void;
}

// All models are Fal AI (including Gemini via nano-banana-pro)
interface UnifiedModel {
  id: string;
  name: string;
  description: string;
  creditTier: string;
}

const ALL_MODELS: UnifiedModel[] = FAL_MODELS.map((m) => ({
  id: m.id,
  name: m.name,
  description: m.description,
  creditTier: m.creditTier,
}));

export function AssetGeneratorPanel({ onGenerate, onResults, isGenerating, onCaptureCanvas, onFormatsChange }: AssetGeneratorPanelProps) {
  const [mode, setMode] = useState<'full' | 'layout'>('full');
  const [selectedModel, setSelectedModel] = useState<UnifiedModel>(ALL_MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [productName, setProductName] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [formats, setFormats] = useState<CampaignFormat[]>([]);
  const [customWidth, setCustomWidth] = useState('1080');
  const [customHeight, setCustomHeight] = useState('1080');
  const [resolution, setResolution] = useState('2K');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('assetProductName', productName);
      sessionStorage.setItem('assetMoods', JSON.stringify(selectedMoods));
      sessionStorage.setItem('assetPrompt', prompt);
    } catch { /* ignore */ }
  }, [productName, selectedMoods, prompt]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showModelDropdown && !showChannelDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (showModelDropdown && modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
      if (showChannelDropdown && channelDropdownRef.current && !channelDropdownRef.current.contains(e.target as Node)) {
        setShowChannelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showModelDropdown, showChannelDropdown]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;
    const previewUrl = URL.createObjectURL(file);
    setUploadedImage({ file, previewUrl });
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl);
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadedImage]);

  const handleReplaceImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Add a channel with its default preset
  const addChannel = useCallback((category: ChannelCategory) => {
    const presets = getPresetsByCategory(category.id);
    if (presets.length === 0 && category.id !== 'custom') return;

    // Check if already added
    const existing = formats.find((f) => f.channelId === category.id);
    if (existing) {
      setShowChannelDropdown(false);
      return;
    }

    let newFormat: CampaignFormat;
    if (category.id === 'custom') {
      newFormat = {
        id: 'custom',
        label: `Custom ${customWidth}×${customHeight}`,
        channelId: 'custom',
        logo: '',
        width: parseInt(customWidth) || 1080,
        height: parseInt(customHeight) || 1080,
        checked: true,
      };
    } else {
      const defaultPreset = presets[0];
      newFormat = {
        id: defaultPreset.id,
        label: `${category.nameKo} — ${defaultPreset.nameKo}`,
        channelId: category.id,
        logo: category.logo,
        width: defaultPreset.width,
        height: defaultPreset.height,
        checked: true,
      };
    }

    setFormats((prev) => {
      const next = [...prev, newFormat];
      onFormatsChange?.(next);
      return next;
    });
    setShowChannelDropdown(false);
  }, [formats, customWidth, customHeight, onFormatsChange]);

  // Change preset within a channel
  const changePreset = useCallback((channelId: string, preset: ChannelPreset) => {
    const category = CHANNEL_CATEGORIES.find((c) => c.id === channelId);
    setFormats((prev) => {
      const next = prev.map((f) =>
        f.channelId === channelId
          ? {
              ...f,
              id: preset.id,
              label: `${category?.nameKo ?? channelId} — ${preset.nameKo}`,
              width: preset.width,
              height: preset.height,
            }
          : f
      );
      onFormatsChange?.(next);
      return next;
    });
  }, [onFormatsChange]);

  // Remove a channel
  const removeChannel = useCallback((channelId: string) => {
    setFormats((prev) => {
      const next = prev.filter((f) => f.channelId !== channelId);
      onFormatsChange?.(next);
      return next;
    });
  }, [onFormatsChange]);

  // Update custom dimensions
  const updateCustomSize = useCallback(() => {
    const w = parseInt(customWidth) || 1080;
    const h = parseInt(customHeight) || 1080;
    setFormats((prev) => {
      const next = prev.map((f) =>
        f.channelId === 'custom'
          ? { ...f, width: w, height: h, label: `Custom ${w}×${h}` }
          : f
      );
      onFormatsChange?.(next);
      return next;
    });
  }, [customWidth, customHeight, onFormatsChange]);

  const MOOD_OPTIONS = ['Minimalist', 'Bold', 'Elegant', 'Playful', 'Premium', 'Natural', 'Modern', 'Retro'];

  const toggleMood = useCallback((mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  }, []);

  const selectedCount = formats.filter((f) => f.checked).length;

  // Channels already added
  const addedChannelIds = formats.map((f) => f.channelId);
  const availableChannels = CHANNEL_CATEGORIES.filter(
    (c) => !addedChannelIds.includes(c.id) && c.id !== 'custom'
  );
  const hasCustom = addedChannelIds.includes('custom');

  const handleGenerate = useCallback(async () => {
    onGenerate?.();

    const selectedFormats = formats.filter((f) => f.checked);
    if (selectedFormats.length === 0) return;

    let brandDna = null;
    try {
      const stored = sessionStorage.getItem('brandDna');
      if (stored) brandDna = JSON.parse(stored);
    } catch { /* no brand dna */ }

    let productImageBase64: string | undefined;
    if (uploadedImage) {
      productImageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(uploadedImage.file);
      });
    }

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
        const res = await fetch('/api/media/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            modelId: selectedModel.id,
            width: fmt.width,
            height: fmt.height,
            numImages: 1,
            resolution: selectedModel.id === 'nano-banana-pro' ? resolution : undefined,
            brandDna: brandDna ? { colors: brandDna.colors, tone: brandDna.tone } : undefined,
            productImageBase64,
            layoutImageBase64: mode === 'full' ? layoutImageBase64 : undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const firstImage = data.images?.[0];
          if (firstImage?.url) {
            results.push({
              id: `${fmt.channelId}-${Date.now()}`,
              image: firstImage.url,
              format: fmt.channelId,
              label: fmt.label,
            });
          }
        } else {
          const err = await res.json().catch(() => ({}));
          console.error(`Generation failed for ${fmt.channelId}:`, err);
        }
      } catch (err) {
        console.error(`Generation failed for ${fmt.channelId}:`, err);
      }
    }

    if (results.length > 0) {
      onResults?.(results);
    }
  }, [onGenerate, onResults, formats, prompt, productName, selectedMoods, uploadedImage, mode, onCaptureCanvas, selectedModel, resolution]);

  return (
    <aside className="w-80 bg-white border-r border-zinc-200 flex flex-col flex-shrink-0 z-10 overflow-y-auto">
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

      <div className="flex-1 p-4 flex flex-col gap-5">
        {/* Product Image Upload (top priority) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-700">Subject / Product Image</label>
          {uploadedImage ? (
            <div className="relative rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImage.previewUrl}
                alt="Uploaded product"
                className="w-full h-32 object-contain bg-white"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={handleReplaceImage} className="p-2 bg-white rounded-lg shadow-sm hover:bg-zinc-50 transition-colors" title="Replace">
                  <RotateCcw className="w-4 h-4 text-zinc-700" />
                </button>
                <button onClick={handleRemoveImage} className="p-2 bg-white rounded-lg shadow-sm hover:bg-zinc-50 transition-colors" title="Remove">
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <div className="px-3 py-1.5 border-t border-zinc-100 bg-white">
                <p className="text-[10px] text-zinc-500 truncate">{uploadedImage.file.name}</p>
              </div>
            </div>
          ) : (
            <div
              onClick={handleUploadClick}
              className="border border-dashed border-zinc-300 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer group flex flex-col items-center justify-center p-4 text-center h-24"
            >
              <div className="w-7 h-7 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center mb-1.5 group-hover:-translate-y-0.5 transition-transform">
                <Upload className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <span className="text-[11px] font-medium text-zinc-900">Click to upload</span>
              <span className="text-[9px] text-zinc-400 mt-0.5">PNG, JPG, WebP up to 10MB</span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <div className="flex flex-col gap-1.5">
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

        {/* AI Model Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-700">AI Model</label>
          <div className="relative" ref={modelDropdownRef}>
            <button
              onClick={() => setShowModelDropdown((v) => !v)}
              className="w-full flex items-center justify-between gap-2 p-2.5 border border-zinc-200 rounded-lg text-left hover:bg-zinc-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-zinc-900 truncate">{selectedModel.name}</div>
                <div className="text-[10px] text-zinc-400 truncate">{selectedModel.description}</div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 flex-shrink-0 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showModelDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {ALL_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(model); setShowModelDropdown(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      selectedModel.id === model.id
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium truncate">{model.name}</div>
                      <div className={`text-[9px] truncate ${selectedModel.id === model.id ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        {model.description}
                      </div>
                    </div>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                      selectedModel.id === model.id
                        ? 'bg-white/20 text-white'
                        : model.creditTier === 'ultra' ? 'bg-amber-50 text-amber-600' : model.creditTier === 'pro' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {model.creditTier === 'ultra' ? 'Ultra' : model.creditTier === 'pro' ? 'Pro' : 'Basic'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resolution dropdown for nano-banana-pro */}
          {selectedModel.id === 'nano-banana-pro' && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="flex-1 text-[10px] text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-zinc-900/10"
              >
                <option value="1K">1K</option>
                <option value="2K">2K (Recommended)</option>
                <option value="4K">4K</option>
              </select>
            </div>
          )}
        </div>

        {/* Campaign Channels */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700">Campaign Channels</label>
            <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 rounded">
              {selectedCount} channels
            </span>
          </div>

          {/* Selected channels list */}
          <div className="flex flex-col gap-1.5">
            {formats.map((fmt) => {
              const presets = getPresetsByCategory(fmt.channelId as ChannelPreset['category']);
              return (
                <div
                  key={fmt.channelId}
                  className="flex items-center gap-2 p-2 border border-zinc-200 rounded-lg bg-white group"
                >
                  {/* Channel logo */}
                  {fmt.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fmt.logo} alt="" className="w-5 h-5 rounded object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded bg-zinc-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-zinc-500">C</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {fmt.channelId === 'custom' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          onBlur={updateCustomSize}
                          className="w-14 text-[10px] text-zinc-700 border border-zinc-200 rounded px-1.5 py-0.5 text-center"
                          min={100}
                          max={4096}
                        />
                        <span className="text-[10px] text-zinc-400">×</span>
                        <input
                          type="number"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          onBlur={updateCustomSize}
                          className="w-14 text-[10px] text-zinc-700 border border-zinc-200 rounded px-1.5 py-0.5 text-center"
                          min={100}
                          max={4096}
                        />
                      </div>
                    ) : presets.length > 1 ? (
                      <select
                        value={fmt.id}
                        onChange={(e) => {
                          const preset = presets.find((p) => p.id === e.target.value);
                          if (preset) changePreset(fmt.channelId, preset);
                        }}
                        className="w-full text-[10px] text-zinc-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer truncate"
                      >
                        {presets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nameKo} ({p.width}×{p.height})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-[10px] text-zinc-700 truncate">
                        {presets[0]?.nameKo ?? fmt.label}
                      </div>
                    )}
                    <div className="text-[9px] text-zinc-400 font-mono">
                      {fmt.width}×{fmt.height}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeChannel(fmt.channelId)}
                    className="p-0.5 rounded text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add channel dropdown */}
          <div className="relative" ref={channelDropdownRef}>
            <button
              onClick={() => setShowChannelDropdown((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 p-2 border border-dashed border-zinc-300 rounded-lg text-xs text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Channel
            </button>

            {showChannelDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {availableChannels.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => addChannel(cat)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    {cat.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.logo} alt="" className="w-5 h-5 rounded object-contain" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-zinc-200" />
                    )}
                    <div className="flex-1">
                      <div className="text-[11px] font-medium">{cat.nameKo}</div>
                      <div className="text-[9px] text-zinc-400">{cat.nameEn}</div>
                    </div>
                  </button>
                ))}
                {!hasCustom && (
                  <button
                    onClick={() => addChannel({ id: 'custom', nameKo: '맞춤', nameEn: 'Custom', logo: '' })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                  >
                    <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center">
                      <Plus className="w-3 h-3 text-zinc-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-medium">맞춤 사이즈</div>
                      <div className="text-[9px] text-zinc-400">Custom size (W × H)</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
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
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none resize-none h-20 transition-all placeholder:text-zinc-400"
            placeholder="Describe the scene, background, or specific elements..."
          />
        </div>
      </div>

      {/* Sticky Generate Button */}
      <div className="p-4 border-t border-zinc-200 bg-white sticky bottom-0">
        {/* Credit cost estimate */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-between mb-2 text-[10px] text-zinc-500">
            <span>Estimated cost</span>
            <span className="font-medium text-zinc-700">
              {(CREDIT_COSTS[selectedModel.id] ?? 30) * selectedCount} credits ({selectedCount} format{selectedCount > 1 ? 's' : ''})
            </span>
          </div>
        )}
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
