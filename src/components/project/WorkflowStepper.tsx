import React from "react";
import { Check, MapPin, Calculator, ClipboardCheck, Bell, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkflowStep {
  id: number;
  label: string;
  tabs: string[];
  icon: React.ElementType;
  completed: boolean;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  activeStep: number;
  onStepClick: (stepId: number) => void;
}

export const WORKFLOW_STEPS = [
  { id: 0, label: "Grundlage", tabs: ["overview", "sitemap"], icon: MapPin },
  { id: 1, label: "Berechnung", tabs: ["usetypes", "calculator"], icon: Calculator },
  { id: 2, label: "Nachweis", tabs: ["compliance", "concepts", "scenarios"], icon: ClipboardCheck },
  { id: 3, label: "Monitoring", tabs: ["monitoring"], icon: Bell },
  { id: 4, label: "Einreichung", tabs: ["documents", "drawing"], icon: FileText },
];

export function WorkflowStepper({ steps, activeStep, onStepClick }: WorkflowStepperProps) {
  return (
    <div className="px-6 py-3 border-b border-border bg-card">
      <div className="flex items-center w-full">
        {steps.map((step, idx) => {
          const isActive = activeStep === step.id;
          const isCompleted = step.completed;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step circle + label */}
              <button
                onClick={() => onStepClick(step.id)}
                className="flex flex-col items-center gap-1 group cursor-pointer shrink-0"
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors border-2",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted-foreground/30 text-muted-foreground group-hover:border-muted-foreground/60"
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] whitespace-nowrap transition-colors",
                    isActive
                      ? "font-semibold text-foreground"
                      : isCompleted
                      ? "font-medium text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] mx-2 mt-[-14px]",
                    steps[idx + 1].completed || (isCompleted && steps[idx + 1].id <= activeStep)
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
