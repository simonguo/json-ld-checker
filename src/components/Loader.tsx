import { Loader2 } from 'lucide-react';

interface LoaderProps {
  message?: string;
  subMessage?: string;
}

export default function Loader({ message, subMessage }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
      {message && <p className="text-gray-700 font-medium">{message}</p>}
      {subMessage && <p className="text-gray-500 text-sm mt-1">{subMessage}</p>}
    </div>
  );
}
