import { useEffect, useRef } from 'react';
import { RotateCcw, X } from 'lucide-react';

export function ResetDialog({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    cancelButton.current?.focus();
    return () => {
      element.close();
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="reset-dialog"
      aria-labelledby="reset-title"
      aria-describedby="reset-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
    >
      <button className="dialog-close" aria-label="Close reset dialog" onClick={onClose}>
        <X size={18} />
      </button>
      <RotateCcw className="green" size={25} />
      <h2 id="reset-title">A fresh start?</h2>
      <p id="reset-description">
        This resets all missions and removes the files you created in this course’s simulated
        workspace on this device.
      </p>
      <div>
        <button ref={cancelButton} className="button-secondary" onClick={onClose}>
          Keep learning
        </button>
        <button className="button-primary" onClick={onReset}>
          Reset course
        </button>
      </div>
    </dialog>
  );
}
