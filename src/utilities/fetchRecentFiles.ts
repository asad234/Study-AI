interface Document {
  id: string
  title: string
  file_name: string
  file_type: string
  status: string
  createdAt: string
}

export const fetchRecentFiles = async (
  setRecentFiles: (files: Document[]) => void,
  setLoading: (loading: boolean) => void,
  userEmail?: string,
) => {
  if (!userEmail) return

  try {
    const response = await fetch("/api/documents")
    if (response.ok) {
      const data = await response.json()
      console.log("API response:", data)
      const documents = data.documents || []
      console.log("Documents array:", documents)
      setRecentFiles(documents.slice(0, 3)) // Show only 3 most recent
    }
  } catch (error) {
    console.error("Failed to fetch documents:", error)
  } finally {
    setLoading(false)
  }
}
