'use client';

interface FormActionsProps {
  isSubmitting: boolean;
  isDisabled: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * Komponent z akcjami formularza (Submit, Cancel)
 * Wydzielony dla reusability
 */
export function FormActions({
  isSubmitting,
  isDisabled,
  onCancel,
  submitLabel = 'Utwórz zgłoszenie',
}: FormActionsProps) {
  return (
    <div className="flex gap-3 pt-4">
      <button
        type="submit"
        disabled={isSubmitting || isDisabled}
        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isSubmitting ? 'Tworzenie...' : submitLabel}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          Anuluj
        </button>
      )}
    </div>
  );
}

