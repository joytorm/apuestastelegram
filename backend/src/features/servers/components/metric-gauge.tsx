'use client';

import React from 'react';

interface MetricGaugeProps {
  label: string;
  percent: number;
  subtitle?: string;
  size?: number;
  thresholds?: { warn: number; critical: number };
}

function getColor(
  percent: number,
  thresholds: { warn: number; critical: number }
) {
  if (percent >= thresholds.critical) return 'text-red-500';
  if (percent >= thresholds.warn) return 'text-yellow-500';
  return 'text-green-500';
}

function getStrokeColor(
  percent: number,
  thresholds: { warn: number; critical: number }
) {
  if (percent >= thresholds.critical) return 'stroke-red-500';
  if (percent >= thresholds.warn) return 'stroke-yellow-500';
  return 'stroke-green-500';
}

export function MetricGauge({
  label,
  percent,
  subtitle,
  size = 100,
  thresholds = { warn: 50, critical: 80 },
}: MetricGaugeProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-700 ease-out ${getStrokeColor(percent, thresholds)}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-lg font-semibold ${getColor(percent, thresholds)}`}
          >
            {percent}%
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {subtitle && (
        <span className="text-[10px] text-muted-foreground/70">{subtitle}</span>
      )}
    </div>
  );
}
