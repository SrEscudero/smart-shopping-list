// app/components/VoiceInput.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
  onResult: (data: { name: string; price?: number; quantity?: number }) => void;
  currency?: string;
}

export default function VoiceInput({ onResult, currency = 'R$' }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const parseVoiceInput = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    let name = lower;
    let price: number | undefined;
    let quantity: number | undefined;

    // Parse quantity patterns: "2 kilos de arroz", "3 litros de leche", "5 arroz"
    const qtyPatterns = [
      /^(\d+)\s*(?:kilos?|kg)\s+(?:de\s+)?(.+)/i,
      /^(\d+)\s*(?:litros?|lt?)\s+(?:de\s+)?(.+)/i,
      /^(\d+)\s*(?:unidades?|paquetes?|cajas?|latas?|bolsas?|piezas?)\s+(?:de\s+)?(.+)/i,
      /^(\d+)\s+(.+)/i,
    ];

    for (const pattern of qtyPatterns) {
      const match = lower.match(pattern);
      if (match) {
        quantity = parseInt(match[1]);
        name = match[2].trim();
        break;
      }
    }

    // Parse price patterns: "a 5 reales", "por 10", "a 5.50", "precio 3"
    const pricePatterns = [
      /\s+(?:a|por|precio|custa|cuesta)\s+(\d+(?:[.,]\d+)?)\s*(?:reales?|pesos?|dolares?|euros?)?$/i,
      /\s+(\d+(?:[.,]\d+)?)\s*(?:reales?|pesos?|dolares?)$/i,
    ];

    for (const pattern of pricePatterns) {
      const match = name.match(pattern);
      if (match) {
        price = parseFloat(match[1].replace(',', '.'));
        name = name.replace(match[0], '').trim();
        break;
      }
    }

    // Clean up common filler words
    name = name.replace(/^(?:agregar|añadir|comprar|poner)\s+/i, '').trim();
    name = name.replace(/\s+$/,'').trim();

    // Capitalize first letter
    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    return { name, price, quantity: quantity || 1 };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);

      if (result.isFinal) {
        const parsed = parseVoiceInput(text);
        if (parsed.name) {
          onResult(parsed);
        }
        setListening(false);
        setTranscript('');
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setTranscript('');
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult, parseVoiceInput]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  }, []);

  if (!supported) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: listening ? 'rgba(255,69,58,0.15)' : 'var(--accent-soft)',
          color: listening ? '#FF453A' : 'var(--accent)',
          border: listening ? '1px solid rgba(255,69,58,0.3)' : '1px solid transparent',
          minHeight: 'unset',
        }}
        title="Agregar por voz"
      >
        {listening ? (
          <>
            <MicOff size={20} className="relative z-10" />
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ background: 'rgba(255,69,58,0.1)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </>
        ) : (
          <Mic size={20} />
        )}
      </button>

      {/* Floating transcript */}
      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2.5 rounded-2xl whitespace-nowrap max-w-[280px] truncate z-50"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
              <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {transcript || 'Escuchando...'}
              </span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Ej: "3 litros de leche a 5 reales"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
