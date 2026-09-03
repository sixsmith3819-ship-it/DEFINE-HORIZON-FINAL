'use client'

interface FieldErrorProps {
  message?: string
  id?: string
}

export function FieldError({ message, id }: FieldErrorProps) {
  if (!message || message.trim() === '') return null
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="text-red-600 text-xs font-medium mt-1 flex items-center gap-1"
    >
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  )
}
