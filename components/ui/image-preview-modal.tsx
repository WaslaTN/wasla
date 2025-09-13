'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImagePreviewModalProps {
  isOpen: boolean
  imageUrl: string
  imageTitle: string
  onClose: () => void
}

export default function ImagePreviewModal({ isOpen, imageUrl, imageTitle, onClose }: ImagePreviewModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">{imageTitle}</h3>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="bg-white rounded-lg p-2">
          <img
            src={imageUrl}
            alt={imageTitle}
            className="w-full h-auto max-h-[80vh] object-contain rounded"
          />
        </div>
      </div>
    </div>
  )
}
