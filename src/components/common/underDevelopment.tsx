import type React from "react"
import { AlertTriangle } from "lucide-react"

interface UnderDevelopmentBannerProps {
  /**
   * Custom message to display in the banner
   * Default: Uses translation system
   */
  message?: string
}

const UnderDevelopmentBanner: React.FC<UnderDevelopmentBannerProps> = ({ message }) => {
  return (
    <div
      className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg mb-6"
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Under Development
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-100 mt-1">
            {message || "We are actively working to improve our platform."}
          </p>
        </div>
      </div>
    </div>
  )
}

export default UnderDevelopmentBanner
