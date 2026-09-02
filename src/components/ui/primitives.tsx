import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center whitespace-nowrap rounded-[2px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1B2A4A] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const variants = {
      default: 'bg-[#1B2A4A] text-[#F7F5F0] hover:bg-[#15223C] active:bg-[#0F192E] font-serif',
      outline:
        'border border-[#C5BFB5] bg-white text-[#1B2A4A] hover:bg-[#F7F5F0] hover:border-[#1B2A4A]',
      secondary: 'bg-[#EAE6DF] text-[#1B2A4A] hover:bg-[#DCD7CD]',
      ghost: 'text-[#1B2A4A] hover:bg-[#EAE6DF]/60',
      destructive: 'bg-[#7A2E2E] text-white hover:bg-[#632424]',
      link: 'text-[#1B2A4A] underline-offset-4 hover:underline p-0 h-auto font-normal',
    };

    const sizes = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-8 px-3.5 py-1.5 gap-2 text-xs',
      lg: 'h-9 px-4 text-sm gap-2',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// Badge
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'muted'
    | 'purple';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-[2px] px-2 py-0.5 text-xs font-normal whitespace-nowrap transition-colors border';

  const variants = {
    default: 'bg-[#1B2A4A] text-[#F7F5F0] border-[#1B2A4A]',
    secondary: 'bg-[#EAE6DF] text-[#1B2A4A] border-[#DCD7CD]',
    outline: 'text-[#1B2A4A] border-[#C5BFB5] bg-white',
    success: 'bg-[#F2F7F3] text-[#2E6F40] border-[#C8E0CD]',
    warning: 'bg-[#FDF9F0] text-[#8C6214] border-[#ECDAB0]',
    danger: 'bg-[#FDF6F6] text-[#7A2E2E] border-[#E8C4C4]',
    info: 'bg-[#F3F6FA] text-[#1B2A4A] border-[#C5D2E2]',
    muted: 'bg-[#F7F5F0] text-[#5A6270] border-[#DCD7CD]',
    purple: 'bg-[#F7F5F9] text-[#4A2B68] border-[#D5C6E4]',
  };

  return <div className={cn(base, variants[variant], className)} {...props} />;
}

// Card
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[2px] border border-[#DCD7CD] bg-white text-[#1B2A4A]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1 p-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-serif font-medium text-[#1B2A4A] leading-snug', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-[#5A6270]', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-5 pt-0 border-t border-[#EAE6DF]', className)} {...props} />;
}

// Modal / Dialog Primitives
export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/40">
      <div
        className={cn(
          'relative w-full rounded-[2px] border border-[#DCD7CD] bg-white p-6 shadow-none',
          maxWidth
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-3.5 mb-4 border-b border-[#EAE6DF]">
          <div>
            <h2 className="text-lg font-serif font-medium text-[#1B2A4A]">{title}</h2>
            {description && <p className="text-xs text-[#5A6270] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-[#5A6270] hover:text-[#1B2A4A] hover:bg-[#EAE6DF]/60 transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
