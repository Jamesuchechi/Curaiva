import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "./card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

export interface MetricCardProps {
  label: string
  value: string | number
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down'
  }
  icon?: React.ReactNode
  className?: string
  color?: 'green' | 'red' | 'amber' | 'purple' | 'teal' | 'coral'
}

function MetricCard({ label, value, trend, icon, className, color = 'green' }: MetricCardProps) {
  const colors = {
    green: "text-brand-green",
    red: "text-red",
    amber: "text-amber",
    purple: "text-purple",
    teal: "text-teal",
    coral: "text-coral",
  }

  return (
    <Card className={cn("transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group p-5", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-text-muted mb-1">{label}</p>
          <h3 className="text-3xl font-display font-bold">{value}</h3>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend.direction === 'up' ? "text-brand-green" : "text-red"
            )}>
              {trend.direction === 'up' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
              <span>{trend.value}%</span>
              <span className="text-text-muted ml-0.5">{trend.label}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={cn(
            "p-2.5 rounded-xl bg-surface-2 group-hover:scale-110 transition-transform duration-200",
            colors[color]
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

export { MetricCard }
