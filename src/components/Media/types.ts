import type { ElementType, Ref } from 'react'
import type { Media as MediaType } from '@/payload-types'
import { StaticImageData } from 'next/image'

export interface Props {
  alt?: string
  className?: string
  fill?: boolean
  htmlElement?: ElementType | null
  pictureClassName?: string  // <--- add this
  imgClassName?: string
  onClick?: () => void
  onLoad?: () => void
  loading?: 'lazy' | 'eager'
  priority?: boolean
  ref?: Ref<HTMLImageElement | HTMLVideoElement | null>
  resource?: MediaType | string | number | null
  size?: string
  src?: StaticImageData
  videoClassName?: string
}
