interface FormErrorBannerProps {
  message?: string
}

export function FormErrorBanner({ message }: FormErrorBannerProps) {
  if (!message || message.trim() === '') return null
  return (
    <div
      role="alert"
      className="p-4 rounded-xl text-sm font-medium"
      style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
    >
      {message}
    </div>
  )
}
