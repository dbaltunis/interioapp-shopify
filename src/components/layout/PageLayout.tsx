import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageLayoutProps {
  title: string;
  description?: string;
  backTo?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
  };
  children: ReactNode;
}

export function PageLayout({
  title,
  description,
  backTo,
  action,
  children,
}: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
          >
            {action.label}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
