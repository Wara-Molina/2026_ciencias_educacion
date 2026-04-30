// src/components/CalendarWidget.tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CalendarWidgetProps {
  colores?: {
    color_primario: string;
    color_secundario: string;
  };
  eventos: any[];
}

export default function CalendarWidget({ colores, eventos }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  const obtenerDiasDelMes = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const obtenerPrimerDiaDelMes = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const tieneEvento = (day: number) => {
    return eventos.some(evento => {
      const eventDate = new Date(evento.evento_fecha);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const mesActual = currentDate.toLocaleDateString('es-BO', { 
    month: 'long', 
    year: 'numeric',
    timeZone: 'UTC'
  });

  const diasDelMes = obtenerDiasDelMes(currentDate.getFullYear(), currentDate.getMonth());
  const primerDia = obtenerPrimerDiaDelMes(currentDate.getFullYear(), currentDate.getMonth());

  const mesAnterior = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const mesSiguiente = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const dias = [];
  
  // Espacios vacíos antes del primer día
  for (let i = 0; i < primerDia; i++) {
    dias.push(<div key={`empty-${i}`} className="h-10" />);
  }

  // Días del mes
  for (let day = 1; day <= diasDelMes; day++) {
    const hasEvent = tieneEvento(day);
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

    dias.push(
      <div
        key={day}
        className={`h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
          isToday 
            ? 'ring-2 ring-offset-2' 
            : ''
        } ${
          hasEvent
            ? 'text-white font-bold'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{
          backgroundColor: hasEvent ? (colores?.color_primario || '#f56224') : isToday ? 'transparent' : 'transparent',
        }}
      >
        {day}
      </div>
    );
  }

  return (
    <div>
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="text-xl font-bold capitalize"
          style={{ color: colores?.color_secundario || '#0A02B0' }}
        >
          {mesActual}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={mesAnterior}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: colores?.color_primario || '#f56224' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={mesSiguiente}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: colores?.color_primario || '#f56224' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map(dia => (
          <div key={dia} className="h-10 flex items-center justify-center text-xs font-semibold text-gray-500">
            {dia}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {dias}
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colores?.color_primario || '#f56224' }}
          />
          <span className="text-gray-600">Evento</span>
        </div>
      </div>
    </div>
  );
}