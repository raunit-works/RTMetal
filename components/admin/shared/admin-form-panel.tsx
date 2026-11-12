import type { FormHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminFormPanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  panelClassName?: string;
  formProps?: FormHTMLAttributes<HTMLFormElement>;
}

export function AdminFormPanel({
  title,
  icon,
  children,
  footer,
  panelClassName,
  formProps = {},
}: AdminFormPanelProps) {
  return (
    <div
      className={cn(
        'flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm backdrop-blur-xl',
        panelClassName
      )}
    >
      <div className="shrink-0 border-b border-border/80 bg-card/40 px-5 py-4 sm:px-6">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </h3>
      </div>

      <form {...formProps} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        <div className="shrink-0 border-t border-border/80 bg-background/60 px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        </div>
      </form>
    </div>
  );
}
