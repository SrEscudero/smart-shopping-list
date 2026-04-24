// app/components/CameraScanner.tsx
"use client";

import { useState, useRef, useCallback } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { getCategoryFromAI } from '../../actions/categorize';

interface ScannedProduct {
  name: string;
  price?: number;
  quantity: number;
  category?: string;
}

interface CameraScannerProps {
  onClose: () => void;
}

export default function CameraScanner({ onClose }: CameraScannerProps) {
  const addProduct = useShoppingStore(s => s.addProduct);
  const theme = useShoppingStore(s => s.theme);
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<'idle' | 'camera' | 'preview' | 'processing' | 'results'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardBg = isDark ? 'bg-[#13131A] border-white/5' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = `w-full text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'}`;

  // Open camera
  const openCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      setMode('camera');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setError('No se pudo acceder a la cámara. Usa la opción de subir imagen.');
    }
  };

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const MAX_WIDTH = 1000;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    // Stop camera
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setMode('preview');
  }, [stream]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
        setMode('preview');
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Send to Claude API for OCR analysis
  const analyzeImage = async () => {
    if (!capturedImage) return;
    setMode('processing');
    setError(null);

    try {
      const base64Data = capturedImage.split(',')[1];

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64Data }),
      });

      if (!response.ok) throw new Error('Error al analizar la imagen');

      const data = await response.json();

      if (data.products && data.products.length > 0) {
        // Enrich with AI categories
        const enriched = await Promise.all(
          data.products.map(async (p: ScannedProduct) => ({
            ...p,
            category: await getCategoryFromAI(p.name),
          }))
        );
        setScannedProducts(enriched);
        setSelectedProducts(new Set(enriched.map((_: ScannedProduct, i: number) => i)));
        setMode('results');
      } else {
        setError('No se detectaron productos. Intenta con una imagen más clara.');
        setMode('preview');
      }
    } catch (err) {
      setError('Error al procesar la imagen. Verifica tu conexión.');
      setMode('preview');
    }
  };

  // Add selected products to list
  const addSelectedProducts = async () => {
    for (const idx of selectedProducts) {
      const p = scannedProducts[idx];
      addProduct({
        name: p.name,
        estimatedPrice: p.price || 0,
        quantity: p.quantity || 1,
        category: p.category || 'Otros',
        store: 'Varias',
      });
    }
    onClose();
  };

  // Toggle product selection
  const toggleProduct = (idx: number) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Update scanned product
  const updateScanned = (idx: number, field: keyof ScannedProduct, value: string | number) => {
    setScannedProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={mode === 'idle' ? onClose : undefined} />

      {/* Modal */}
      <div className={`relative z-10 mt-auto mx-auto w-full max-w-lg ${isDark ? 'bg-[#0D0D14]' : 'bg-gray-50'} rounded-t-3xl overflow-hidden`}
        style={{ maxHeight: '92vh' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h2 className={`text-base font-bold ${text}`}>Escanear productos</h2>
            <p className={`text-xs ${subtext}`}>
              {mode === 'idle' && 'Fotografía una lista o etiqueta'}
              {mode === 'camera' && 'Apunta la cámara al texto'}
              {mode === 'preview' && 'Confirma la imagen'}
              {mode === 'processing' && 'Analizando con IA...'}
              {mode === 'results' && `${scannedProducts.length} productos detectados`}
            </p>
          </div>
          <button
            onClick={() => { stream?.getTracks().forEach(t => t.stop()); onClose(); }}
            className={`p-2 rounded-xl ${isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 80px)' }}>

          {/* IDLE STATE */}
          {mode === 'idle' && (
            <div className="space-y-3 py-2">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className={`${cardBg} border rounded-2xl p-5 flex flex-col items-center text-center gap-3`}>
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${text}`}>Funciona con cualquier imagen</p>
                  <p className={`text-xs ${subtext} mt-1`}>Tickets, etiquetas de precio, listas escritas a mano, o fotos de supermercado</p>
                </div>
              </div>

              <button
                onClick={openCamera}
                className="w-full flex items-center gap-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold py-4 px-5 rounded-2xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Abrir cámara
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center gap-3 font-semibold py-4 px-5 rounded-2xl transition-all border ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Subir foto de galería
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* CAMERA STATE */}
          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {/* Viewfinder overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-3/5 border-2 border-white/50 rounded-xl relative">
                    <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                    <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                  </div>
                </div>
                <p className="absolute bottom-3 left-0 right-0 text-center text-white/60 text-xs">Apunta al texto de la lista</p>
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <button
                onClick={capturePhoto}
                className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm"
              >
                <div className="w-5 h-5 rounded-full bg-gray-900" />
                Capturar foto
              </button>

              <button
                onClick={() => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setMode('idle'); }}
                className={`w-full py-3 rounded-2xl text-sm font-medium ${subtext}`}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* PREVIEW STATE */}
          {mode === 'preview' && capturedImage && (
            <div className="space-y-3">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
              </div>

              <button
                onClick={analyzeImage}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analizar con IA
              </button>

              <button
                onClick={() => { setCapturedImage(null); setMode('idle'); setError(null); }}
                className={`w-full py-3 rounded-2xl text-sm font-medium ${subtext}`}
              >
                Tomar otra foto
              </button>
            </div>
          )}

          {/* PROCESSING STATE */}
          {mode === 'processing' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-sm font-semibold ${text}`}>Analizando imagen...</p>
                <p className={`text-xs ${subtext} mt-1`}>La IA está detectando productos y precios</p>
              </div>
              {capturedImage && (
                <div className="w-24 h-24 rounded-xl overflow-hidden opacity-40">
                  <img src={capturedImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* RESULTS STATE */}
          {mode === 'results' && (
            <div className="space-y-3">
              <div className={`${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'} border rounded-xl p-3 flex items-center gap-2`}>
                <span className="text-green-400">✓</span>
                <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  {scannedProducts.length} productos detectados — selecciona los que quieres agregar
                </span>
              </div>

              <div className="space-y-2">
                {scannedProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className={`${cardBg} border rounded-2xl p-3 transition-all ${
                      selectedProducts.has(idx)
                        ? 'border-blue-500/40 bg-blue-500/5'
                        : isDark ? 'opacity-40' : 'opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleProduct(idx)}
                        className={`mt-0.5 w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedProducts.has(idx) ? 'border-blue-500 bg-blue-500' : isDark ? 'border-gray-600' : 'border-gray-300'
                        }`}
                      >
                        {selectedProducts.has(idx) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={product.name}
                          onChange={e => updateScanned(idx, 'name', e.target.value)}
                          className={`${inputCls} font-medium`}
                        />
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${subtext}`}>R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={product.price || ''}
                              onChange={e => updateScanned(idx, 'price', parseFloat(e.target.value))}
                              placeholder="0,00"
                              className={`w-full text-xs pl-7 pr-2 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'}`}
                            />
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={e => updateScanned(idx, 'quantity', parseInt(e.target.value))}
                            className={`w-14 text-xs text-center py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'}`}
                          />
                          {product.category && (
                            <span className={`text-xs px-2 py-2 rounded-xl ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'} flex-shrink-0`}>
                              {product.category.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setSelectedProducts(new Set(scannedProducts.map((_, i) => i)))}
                  className={`text-xs px-3 py-2 rounded-xl font-medium ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                >
                  Seleccionar todos
                </button>
                <button
                  onClick={() => setSelectedProducts(new Set())}
                  className={`text-xs px-3 py-2 rounded-xl font-medium ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                >
                  Deseleccionar
                </button>
              </div>

              <button
                onClick={addSelectedProducts}
                disabled={selectedProducts.size === 0}
                className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all"
              >
                ➕ Agregar {selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''} a la lista
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}