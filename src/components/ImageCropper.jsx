import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import Modal from './Modal'
import getCroppedImg from '../utils/cropImage'

export default function ImageCropper({ image, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropChange = useCallback((crop) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteInternal = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleDone = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels)
      onCropComplete(croppedImage)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Modal isOpen={!!image} onClose={onCancel} title="Crop Student Photo" maxWidth="max-w-2xl">
      <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1 / 1}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
          <button type="button" onClick={handleDone} className="btn btn-primary px-8">Done</button>
        </div>
      </div>
    </Modal>
  )
}
