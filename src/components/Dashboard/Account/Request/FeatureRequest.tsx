"use client"
import { useState } from "react"

const FeatureRequest = () => {
  const [formData, setFormData] = useState({
    featureName: "",
    featureDescription: "",
    experienceRating: "",
    contactInfo: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState("")
  const [errorDetails, setErrorDetails] = useState("")

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitStatus("")
    setErrorDetails("")

    try {
      console.log("Submitting form data:", formData)
      const response = await fetch("/api/submit-feature-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("Response status:", response.status)
      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (response.ok) {
        setSubmitStatus("success")
        setFormData({
          featureName: "",
          featureDescription: "",
          experienceRating: "",
          contactInfo: "",
        })
      } else {
        setSubmitStatus("error")
        const errorMsg = responseData.message || `HTTP ${response.status}: ${response.statusText}`
        const details = responseData.details ? JSON.stringify(responseData.details, null, 2) : ""
        setErrorDetails(`${errorMsg}${details ? "\n\nDetails:\n" + details : ""}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setSubmitStatus("error")
      setErrorDetails((error as Error).message || "Network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Feature Request</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        We’d love to hear your ideas! Please fill out the form below to request a new feature.
      </p>

      {submitStatus === "success" && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 rounded">
          Thank you! Your feature request has been submitted successfully.
        </div>
      )}

      {submitStatus === "error" && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          <div className="font-semibold">There was a problem submitting your request.</div>
          {errorDetails && (
            <div className="mt-2 text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap">
              {errorDetails}
            </div>
          )}
          <div className="mt-2">Please try again later or contact support if the issue persists.</div>
        </div>
      )}

      <div>
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2" htmlFor="featureName">
            Feature Name
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Give your feature request a short and descriptive name.
          </p>
          <input
            type="text"
            id="featureName"
            name="featureName"
            value={formData.featureName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter feature name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2" htmlFor="featureDescription">
            Feature Description
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Describe the feature in detail and how it would help you.
          </p>
          <textarea
            id="featureDescription"
            name="featureDescription"
            value={formData.featureDescription}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded h-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter feature description"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">Your Experience Rating</label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            How would you rate your overall experience so far?
          </p>
          <select
            name="experienceRating"
            value={formData.experienceRating}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="">Select a rating</option>
            <option value="1">Poor</option>
            <option value="2">Fair</option>
            <option value="3">Good</option>
            <option value="4">Very Good</option>
            <option value="5">Excellent</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2" htmlFor="contactInfo">
            Contact Information (Optional)
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Leave your email or phone if you’d like us to follow up with you about this feature.
          </p>
          <input
            type="text"
            id="contactInfo"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email or phone"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`py-2 px-6 rounded transition-colors ${
            isSubmitting
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          } text-white`}
        >
          {isSubmitting ? "Submitting..." : "Submit Feature Request"}
        </button>
      </div>
    </div>
  )
}

export default FeatureRequest
