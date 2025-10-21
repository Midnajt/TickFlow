'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

interface DialogOverlayProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {}

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={`fixed inset-0 z-50 bg-black/60 ${className ?? ''}`}
      {...props}
    />
  );
});

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={`fixed z-50 grid w-full max-w-2xl gap-4 border border-gray-700 bg-gray-800 p-0 text-gray-100 shadow-lg duration-200 rounded-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className ?? ''}`}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 p-5 border-b border-gray-700 ${className ?? ''}`} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center p-5 pt-0 gap-2 ${className ?? ''}`} {...props} />;
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={`text-xl font-semibold leading-none tracking-tight text-white ${className ?? ''}`}
      {...props}
    />
  );
});

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={`text-sm text-gray-400 ${className ?? ''}`}
      {...props}
    />
  );
});


