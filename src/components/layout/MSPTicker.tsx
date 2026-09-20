import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Commodity } from '@/types/procurement.types'
import { CheckCircle2, ChevronLeft, ChevronRight, Pause, Play, TrendingUp, Wheat } from 'lucide-react'

interface MSPTickerProps {
  commodities: Commodity[]
}

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`

export const MSPTicker: React.FC<MSPTickerProps> = ({ commodities }) => {
  const active = useMemo(
    () => commodities.filter((commodity) => commodity.isActive),
    [commodities],
  )

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(active.map((commodity) => commodity.category).filter(Boolean)))],
    [active],
  )

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [paused, setPaused] = useState(false)
  const [offset, setOffset] = useState(0)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const hoveredRef = useRef(false)

  const filtered = useMemo(() => {
    const list =
      selectedCategory === 'All'
        ? active
        : active.filter((commodity) => commodity.category === selectedCategory)

    return list.length > 0 ? list : active
  }, [active, selectedCategory])

  const loopItems = useMemo(() => [...filtered, ...filtered], [filtered])

  useEffect(() => {
    setOffset(0)
  }, [selectedCategory, filtered.length])

  useEffect(() => {
    const animate = (time: number) => {
      const previous = lastTimeRef.current ?? time
      const delta = Math.min(32, time - previous)
      lastTimeRef.current = time

      if (!paused && !hoveredRef.current && filtered.length > 1) {
        setOffset((current) => {
          const speed = 0.035 * delta
          const oneLoopApprox = Math.max(filtered.length * 196, 196)
          const next = current + speed
          return next >= oneLoopApprox ? next - oneLoopApprox : next
        })
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      lastTimeRef.current = null
    }
  }, [filtered.length, paused])

  const nudge = (direction: 'left' | 'right') => {
    setOffset((current) => {
      const delta = 196
      return direction === 'left'
        ? Math.max(0, current - delta)
        : current + delta
    })
  }

  if (!active.length) return null

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-4 w-4" />
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-50" />
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Live MSP feed
              </p>
            </div>

            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
              Today&apos;s procurement reference rates
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Auto-scrolling rates from your Mandi Setu commodity catalogue.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800"
              aria-label={paused ? 'Resume MSP ticker' : 'Pause MSP ticker'}
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {paused ? 'Resume' : 'Pause'}
            </button>

            <button
              type="button"
              onClick={() => nudge('left')}
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:text-emerald-800 sm:flex"
              aria-label="Previous MSP cards"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => nudge('right')}
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:text-emerald-800 sm:flex"
              aria-label="Next MSP cards"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const activeCategory = selectedCategory === category

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold transition ${
                  activeCategory
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-800'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="relative overflow-hidden px-4 py-4 sm:px-5"
        onMouseEnter={() => {
          hoveredRef.current = true
        }}
        onMouseLeave={() => {
          hoveredRef.current = false
        }}
        onFocus={() => {
          hoveredRef.current = true
        }}
        onBlur={() => {
          hoveredRef.current = false
        }}
      >
        <div
          className="flex w-max gap-3 will-change-transform"
          style={{ transform: `translate3d(-${offset}px, 0, 0)` }}
        >
          {loopItems.map((commodity, index) => (
            <div
              key={`${commodity.id}-${index}`}
              className="w-[190px] shrink-0 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3.5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_30px_-22px_rgba(5,150,105,0.5)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Wheat className="h-4 w-4" />
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  {commodity.category}
                </span>
              </div>

              <p className="mt-3 truncate text-xs font-black text-slate-950">
                {commodity.name}
              </p>

              <p className="mt-1 truncate text-[10px] text-slate-500">
                {commodity.variety || 'Standard grade'}
              </p>

              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <p className="font-mono text-base font-black text-emerald-800">
                    {formatCurrency(commodity.mspPricePerQuintal)}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-400">/ Quintal</p>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  MSP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[9px] font-semibold text-slate-400 sm:px-5">
        <span>Hover or focus to pause</span>
        <span>{paused ? 'Ticker paused' : 'Live auto-scroll'}</span>
      </div>
    </section>
  )
}
