interface ErrorAlertProps {
  messages: string[];
}

export function ErrorAlert({ messages }: ErrorAlertProps) {
  if (messages.length === 0) return null;

  return (
    <div 
      className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm"
      role="alert"
      aria-live="polite"
    >
      {messages.length === 1 ? (
        <p>{messages[0]}</p>
      ) : (
        <ul className="list-disc list-inside space-y-1">
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

