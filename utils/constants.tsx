// utils/constants.ts
import React from 'react';
import { Apple, Beef, Milk, Croissant, CupSoda, SprayCan, Bath, Archive, Snowflake, PawPrint, Baby, Smartphone, Shirt, Package } from 'lucide-react';

export const CATEGORY_CONFIG: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
    'Frutas y Verduras': { color: '#30D158', icon: <Apple size={20} strokeWidth={2.5} />, bg: 'rgba(48,209,88,0.12)' },
    'Carnes y Pescados': { color: '#FF453A', icon: <Beef size={20} strokeWidth={2.5} />, bg: 'rgba(255,69,58,0.12)' },
    'Lácteos y Huevos': { color: '#FFD60A', icon: <Milk size={20} strokeWidth={2.5} />, bg: 'rgba(255,214,10,0.12)' },
    'Panadería': { color: '#FF9F0A', icon: <Croissant size={20} strokeWidth={2.5} />, bg: 'rgba(255,159,10,0.12)' },
    'Bebidas': { color: '#5AC8FA', icon: <CupSoda size={20} strokeWidth={2.5} />, bg: 'rgba(90,200,250,0.12)' },
    'Limpieza': { color: '#32ADE6', icon: <SprayCan size={20} strokeWidth={2.5} />, bg: 'rgba(50,173,230,0.12)' },
    'Cuidado Personal': { color: '#BF5AF2', icon: <Bath size={20} strokeWidth={2.5} />, bg: 'rgba(191,90,242,0.12)' },
    'Despensa': { color: '#A2845E', icon: <Archive size={20} strokeWidth={2.5} />, bg: 'rgba(162,132,94,0.12)' },
    'Congelados': { color: '#00C7BE', icon: <Snowflake size={20} strokeWidth={2.5} />, bg: 'rgba(0,199,190,0.12)' },
    'Mascotas': { color: '#FF6B9D', icon: <PawPrint size={20} strokeWidth={2.5} />, bg: 'rgba(255,107,157,0.12)' },
    'Bebés': { color: '#FF2D55', icon: <Baby size={20} strokeWidth={2.5} />, bg: 'rgba(255,45,85,0.12)' },
    'Electrónica': { color: '#0A84FF', icon: <Smartphone size={20} strokeWidth={2.5} />, bg: 'rgba(10,132,255,0.12)' },
    'Ropa': { color: '#BF5AF2', icon: <Shirt size={20} strokeWidth={2.5} />, bg: 'rgba(191,90,242,0.12)' },
    'Otros': { color: '#8E8E93', icon: <Package size={20} strokeWidth={2.5} />, bg: 'rgba(142,142,147,0.12)' },
};

export const ALL_CATEGORIES = [
    'Frutas y Verduras', 'Carnes y Pescados', 'Lácteos y Huevos', 'Panadería',
    'Bebidas', 'Limpieza', 'Cuidado Personal', 'Despensa', 'Congelados',
    'Mascotas', 'Bebés', 'Electrónica', 'Ropa', 'Otros',
];
