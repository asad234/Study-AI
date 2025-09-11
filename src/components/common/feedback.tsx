"use client"
import type React from "react"
import { useState } from "react"
import { Card } from "../ui/card"
import UnderDevelopmentBanner from "./underDevelopment"

interface FeedbackFormData {
  helpfulness: string
  improvement: string
}

const FeedbackForm: React.FC = () => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    helpfulness: "",
    improvement: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })

  const options = ["Very helpful", "Helpful", "Neutral", "Not helpful"]

  const handleSubmit = async (): Promise<void> => {
    if (!formData.helpfulness) {
      alert("Please select an option before submitting.")
      return
    }

    setIsSubmitting(true)
    setStatus({ type: null, message: "" })

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setStatus({
          type: "success",
          message: "Thank you! Your feedback has been submitted.",
        })
        setFormData({ helpfulness: "", improvement: "" })
      } else {
        setStatus({
          type: "error",
          message: result.error || "Something went wrong. Please try again.",
        })
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Network error. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md p-6 gap-6 text-gray-900 dark:text-gray-100">
        <UnderDevelopmentBanner/>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
          Quick Feedback
        </h2>

        {status.type && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
                : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800"
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Question 1 */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            How helpful was Study AI in preparing for your exam/project?
          </p>
          <div className="grid grid-cols-1 gap-2">
            {options.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="helpfulness"
                  value={option}
                  checked={formData.helpfulness === option}
                  onChange={() => setFormData((prev) => ({ ...prev, helpfulness: option }))}
                  disabled={isSubmitting}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question 2 */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What’s one thing we can improve?
          </p>
          <textarea
            value={formData.improvement}
            onChange={(e) => setFormData((prev) => ({ ...prev, improvement: e.target.value }))}
            placeholder="Your suggestion..."
            disabled={isSubmitting}
            className="w-full h-20 rounded-md border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </Card>
  )
}

export default FeedbackForm
