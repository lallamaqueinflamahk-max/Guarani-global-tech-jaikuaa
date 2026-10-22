import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";

type PublishConfirmButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onConfirm: () => void;
  pending?: boolean;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  wordLabel?: string;
};

export function PublishConfirmButton({
  children,
  disabled,
  onConfirm,
  pending,
  className,
  variant = "default",
  size = "sm",
  wordLabel,
}: PublishConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} size={size} className={className} disabled={disabled || pending}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar publicación</AlertDialogTitle>
          <AlertDialogDescription>
            {wordLabel ? `«${wordLabel}»` : "Esta palabra"} quedará visible en el corpus. Después de publicar tendrás 15 minutos para deshacer esta acción.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Seguir revisando</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              setOpen(false);
              onConfirm();
            }}
          >
            Publicar palabra
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}