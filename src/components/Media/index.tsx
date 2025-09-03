import React, { Fragment } from 'react'
import { ImageMedia } from './ImageMedia'
import { VideoMedia } from './VideoMedia'
import { Props } from './types'

export const Media: React.FC<Props> = ({ className, htmlElement = 'div', resource }) => {
  const Tag = htmlElement || Fragment

  if (!resource) return null

  // Determine type
  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const isImage = typeof resource === 'object' && resource?.mimeType?.includes('image')
  const isDocument = typeof resource === 'object' && ['pdf', 'docx', 'pptx'].some(ext => resource.mimeType?.includes(ext))

  return (
    <Tag className={className}>
      {isImage && <ImageMedia resource={resource} />}
      {isVideo && <VideoMedia resource={resource} />}
      {isDocument && (
        <a
          href={typeof resource === 'object' ? resource.url : '#'}
          className="document-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {resource.filename || 'Download document'}
        </a>
      )}
    </Tag>
  )
}
