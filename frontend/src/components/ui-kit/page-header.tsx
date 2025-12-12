import { ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  action,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-4 text-sm text-muted-foreground">
          {breadcrumb.map((item, index) => (
            <span key={index}>
              {item.href ? (
                <a href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
              {index < breadcrumb.length - 1 && <span className="mx-2">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-2 text-muted-foreground">{description}</p>}
        </div>
        {action && (
          <Button variant={action.variant || 'default'} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}

