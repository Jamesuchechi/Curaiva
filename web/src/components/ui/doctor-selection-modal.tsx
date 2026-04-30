"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, Star, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/loading"
import { useDoctorsData, DoctorProfile } from "@/hooks/use-doctors-data"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface DoctorSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (doctorId: string) => void
  patientKeywords?: string[]
}

export function DoctorSelectionModal({ isOpen, onClose, onSelect, patientKeywords = [] }: DoctorSelectionModalProps) {
  const { doctors, loading } = useDoctorsData(patientKeywords)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[85vh] bg-surface border border-border-base rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-border-base flex items-center justify-between shrink-0 bg-surface/50 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-display font-bold text-text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-lime" />
              AI Match: Select a Specialist
            </h2>
            <p className="text-sm text-text-muted mt-1">Based on your recent activity, we recommend these available doctors.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-surface-2">
            <X className="w-5 h-5 text-text-muted" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner size="lg" />
              <p className="text-sm text-brand-lime animate-pulse font-mono uppercase tracking-widest">Running Match Algorithm...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-text-muted">No doctors are currently available. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doctor, idx) => (
                <DoctorCard 
                  key={doctor.id} 
                  doctor={doctor} 
                  isTopMatch={idx === 0} 
                  onSelect={() => onSelect(doctor.id)} 
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function DoctorCard({ doctor, isTopMatch, onSelect }: { doctor: DoctorProfile, isTopMatch: boolean, onSelect: () => void }) {
  return (
    <div className={cn(
      "relative p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col h-full",
      isTopMatch 
        ? "bg-brand-lime/5 border-brand-lime/30 hover:border-brand-lime/60 shadow-[0_0_30px_-10px_rgba(204,255,0,0.15)]" 
        : "bg-surface-2 border-border-base hover:border-text-muted"
    )}
    onClick={onSelect}>
      
      {isTopMatch && (
        <div className="absolute -top-3 -right-3 bg-brand-lime text-bg text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
          <Sparkles className="w-3 h-3" />
          Best Match
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-border-base bg-surface">
          {doctor.avatar_url ? (
            <Image src={doctor.avatar_url} alt={doctor.full_name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-2 text-xl font-bold text-text-muted">
              {doctor.full_name.charAt(0)}
            </div>
          )}
          <div className="absolute bottom-1 right-1 w-3 h-3 bg-brand-lime border-2 border-surface rounded-full" />
        </div>
        
        <div>
          <h3 className="font-bold text-text-white text-lg leading-tight group-hover:text-brand-lime transition-colors">
            {doctor.full_name}
          </h3>
          <p className="text-sm font-mono text-text-muted mt-0.5">{doctor.specialty || "General Practice"}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs font-bold text-amber">
              <Star className="w-3.5 h-3.5 fill-amber" />
              {doctor.rating}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
              {doctor.years_experience} Yrs Exp
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-text-light/80 line-clamp-3 mb-4 flex-1">
        {doctor.bio || "Dedicated healthcare professional committed to patient-centered care and positive clinical outcomes."}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-base/50">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-teal">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Available Now
        </div>
        <div className="text-brand-lime text-sm font-bold opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all flex items-center gap-1">
          Select <span className="text-lg leading-none">→</span>
        </div>
      </div>
    </div>
  )
}
