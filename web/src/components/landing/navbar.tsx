"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function LandingNavbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between",
        scrolled ? "bg-bg/80 backdrop-blur-md border-b border-border-base" : "bg-transparent"
      )}
    >
      <Link href="/" className="flex items-center gap-2.5 group z-50">
        <Image src="/logo.png" alt="Curaiva Logo" width={28} height={28} className="object-contain group-hover:scale-110 transition-transform" />
        <span className="font-display text-xl font-bold tracking-tight text-text-white">Curaiva</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {['Mission', 'Architecture', 'Tools', 'Demo'].map((item) => (
          <Link 
            key={item} 
            href={`#${item.toLowerCase()}`}
            className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted hover:text-brand-lime transition-colors"
          >
            {item}
          </Link>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-4">
        <Link 
          href="/login" 
          className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted hover:text-text-white transition-colors px-4"
        >
          Login
        </Link>
        <Link 
          href="/login?signup=true" 
          className="bg-brand-lime text-bg text-[10px] font-mono font-bold uppercase tracking-widest px-6 py-2.5 rounded-full hover:bg-brand-lime/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(132,204,22,0.2)]"
        >
          Get Started
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden p-2 text-text-white z-50 relative"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-bg/95 backdrop-blur-xl border-b border-border-base p-6 flex flex-col gap-6 md:hidden shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex flex-col gap-4">
            {['Mission', 'Architecture', 'Tools', 'Demo'].map((item) => (
              <Link 
                key={item} 
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-mono font-bold uppercase tracking-widest text-text-muted hover:text-brand-lime transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="h-px w-full bg-white/10" />
          <div className="flex flex-col gap-4">
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-mono font-bold uppercase tracking-widest text-text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/login?signup=true" 
              onClick={() => setMobileMenuOpen(false)}
              className="bg-brand-lime text-bg text-sm font-mono font-bold uppercase tracking-widest px-6 py-3 rounded-full text-center hover:bg-brand-lime/90 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
