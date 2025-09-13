'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, MapPin, CheckCircle, RotateCcw, X, Eye, Users, ArrowRight, AlertCircle } from 'lucide-react'
import Map from '@/components/map/Map'
import ImagePreviewModal from '@/components/ui/image-preview-modal'
import { TunisiaMunicipalityService, type Governorate, type Delegation } from '@/lib/tunisia-municipality'
import { StationPartnershipService } from '@/lib/station-partnership'

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits'),
  cin: z.string().min(8, 'CIN must be at least 8 characters').max(20, 'CIN must be less than 20 characters'),
  governorate: z.string().min(1, 'Please select a governorate'),
  delegation: z.string().min(1, 'Please select a delegation'),
  cinFront: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'File size must be less than 5MB'
  ),
  cinBack: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'File size must be less than 5MB'
  ),
})

type FormData = z.infer<typeof formSchema>

interface StationPartnershipFormProps {
  onSuccess?: (data: any) => void
}

export default function StationPartnershipForm({ onSuccess }: StationPartnershipFormProps) {
  const [governorates, setGovernorates] = useState<Governorate[]>([])
  const [selectedGovernorate, setSelectedGovernorate] = useState<Governorate | null>(null)
  const [delegations, setDelegations] = useState<Delegation[]>([])
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null)
  const [mapLocation, setMapLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [customLocation, setCustomLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isLocationCustomized, setIsLocationCustomized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [requestNumber, setRequestNumber] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [cinFrontPreview, setCinFrontPreview] = useState<string | null>(null)
  const [cinBackPreview, setCinBackPreview] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState<{ front: boolean; back: boolean }>({
    front: false,
    back: false
  })
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; imageUrl: string; title: string }>({
    isOpen: false,
    imageUrl: '',
    title: ''
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  })

  const watchedGovernorate = watch('governorate')
  const watchedDelegation = watch('delegation')

  // Load governorates on component mount
  useEffect(() => {
    const loadGovernorates = async () => {
      try {
        const data = await TunisiaMunicipalityService.getAllMunicipalities()
        setGovernorates(data)
      } catch (error) {
        console.error('Failed to load governorates:', error)
        setError('Failed to load location data. Please refresh the page.')
      }
    }
    loadGovernorates()
  }, [])

  // Update delegations when governorate changes
  useEffect(() => {
    if (watchedGovernorate && governorates.length > 0) {
      const governorate = governorates.find(gov => gov.Value === watchedGovernorate)
      if (governorate) {
        setSelectedGovernorate(governorate)
        setDelegations(governorate.Delegations)
        setValue('delegation', '') // Reset delegation selection
        setSelectedDelegation(null)
        setMapLocation(null)
      }
    }
  }, [watchedGovernorate, governorates, setValue])

  // Update map location when delegation changes
  useEffect(() => {
    if (watchedDelegation && selectedGovernorate) {
      const delegation = delegations.find(del => del.Value === watchedDelegation)
      if (delegation) {
        setSelectedDelegation(delegation)
        const newLocation = {
          latitude: delegation.Latitude,
          longitude: delegation.Longitude
        }
        setMapLocation(newLocation)
        setCustomLocation(null)
        setIsLocationCustomized(false)
      }
    }
  }, [watchedDelegation, selectedGovernorate, delegations])

  // Handle marker drag
  const handleMarkerDrag = (lat: number, lng: number) => {
    setCustomLocation({ latitude: lat, longitude: lng })
    setIsLocationCustomized(true)
  }

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    setCustomLocation({ latitude: lat, longitude: lng })
    setIsLocationCustomized(true)
  }

  // Reset to original location
  const resetToOriginalLocation = () => {
    setCustomLocation(null)
    setIsLocationCustomized(false)
  }

  // Get the current display location (custom or original)
  const currentLocation = customLocation || mapLocation

  // Handle file upload and preview
  const handleFileUpload = (file: File, type: 'front' | 'back') => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type for CIN ${type}. Please upload a JPEG, PNG, or WebP image.`)
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File size too large for CIN ${type}. Maximum size is 5MB.`)
        return
      }

      // Clear any previous error
      setError('')
      
      // Set loading state
      if (type === 'front') {
        setImageLoading(prev => ({ ...prev, front: true }))
      } else {
        setImageLoading(prev => ({ ...prev, back: true }))
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      
      if (type === 'front') {
        // Clean up previous preview
        if (cinFrontPreview) {
          URL.revokeObjectURL(cinFrontPreview)
        }
        setCinFrontPreview(previewUrl)
        setValue('cinFront', file)
      } else {
        // Clean up previous preview
        if (cinBackPreview) {
          URL.revokeObjectURL(cinBackPreview)
        }
        setCinBackPreview(previewUrl)
        setValue('cinBack', file)
      }
    }
  }

  // Remove file preview
  const removeFilePreview = (type: 'front' | 'back') => {
    if (type === 'front') {
      if (cinFrontPreview) {
        URL.revokeObjectURL(cinFrontPreview)
        setCinFrontPreview(null)
      }
      setImageLoading(prev => ({ ...prev, front: false }))
      setValue('cinFront', undefined as any)
    } else {
      if (cinBackPreview) {
        URL.revokeObjectURL(cinBackPreview)
        setCinBackPreview(null)
      }
      setImageLoading(prev => ({ ...prev, back: false }))
      setValue('cinBack', undefined as any)
    }
  }

  // Open preview modal
  const openPreviewModal = (imageUrl: string, title: string) => {
    setPreviewModal({ isOpen: true, imageUrl, title })
  }

  // Close preview modal
  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, imageUrl: '', title: '' })
  }

  // Cleanup preview URLs on component unmount
  useEffect(() => {
    return () => {
      if (cinFrontPreview) URL.revokeObjectURL(cinFrontPreview)
      if (cinBackPreview) URL.revokeObjectURL(cinBackPreview)
    }
  }, [cinFrontPreview, cinBackPreview])

  const onSubmit = async (data: FormData) => {
    if (!currentLocation) {
      setError('Please select both governorate and delegation to determine the location.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Generate request number
      const newRequestNumber = StationPartnershipService.generateRequestNumber()
      
      // Upload CIN images
      const { frontUrl, backUrl } = await StationPartnershipService.uploadCinImages(
        newRequestNumber,
        data.cinFront,
        data.cinBack
      )

      // Create the request
      await StationPartnershipService.createRequest({
        request_number: newRequestNumber,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phoneNumber,
        cin: data.cin,
        governorate: data.governorate,
        delegation: data.delegation,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        cin_front_url: frontUrl,
        cin_back_url: backUrl
      })

      // Prepare success data
      const successData = {
        requestNumber: newRequestNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        cin: data.cin,
        governorate: data.governorate,
        delegation: data.delegation,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        cinFrontUrl: frontUrl,
        cinBackUrl: backUrl
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(successData)
      } else {
        // Fallback to original behavior
        setRequestNumber(newRequestNumber)
        setIsSubmitted(true)
      }

      // Clear previews and reset form
      if (cinFrontPreview) {
        URL.revokeObjectURL(cinFrontPreview)
        setCinFrontPreview(null)
      }
      if (cinBackPreview) {
        URL.revokeObjectURL(cinBackPreview)
        setCinBackPreview(null)
      }
      setImageLoading({ front: false, back: false })

      reset()
    } catch (error) {
      console.error('Error submitting form:', error)
      setError('Failed to submit request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur-sm border border-green-500/30 rounded-xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Application Submitted Successfully!
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Your station partnership request has been submitted for review.
            </p>

            <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-6 mb-8 max-w-md mx-auto">
              <h3 className="text-blue-400 font-semibold mb-2">Request Number</h3>
              <div className="text-3xl font-bold text-white font-mono tracking-wider">
                {requestNumber}
              </div>
              <p className="text-blue-400 text-sm mt-2">
                Save this number to track your application status.
              </p>
            </div>

            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6 mb-8">
              <h3 className="text-green-400 font-semibold mb-3">What's Next?</h3>
              <div className="text-gray-300 space-y-2 text-left max-w-md mx-auto">
                <p>• Our team will review your application within 2-3 business days</p>
                <p>• We'll contact you via the provided information</p>
                <p>• Check your email for updates on your application status</p>
                <p>• Use your request number to track your application</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  setIsSubmitted(false)
                  setRequestNumber('')
                  setCinFrontPreview(null)
                  setCinBackPreview(null)
                  setImageLoading({ front: false, back: false })
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200"
              >
                Submit Another Application
              </Button>
            </div>

            <p className="text-gray-400 text-sm mt-6">
              Need help? Contact our partnership team at{' '}
              <a href="mailto:partnerships@wasla.tn" className="text-blue-400 hover:text-blue-300">
                partnerships@wasla.tn
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Personal Information Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Enter your first name"
                className="bg-black/20 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-sm text-red-400">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Enter your last name"
                className="bg-black/20 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.lastName && (
                <p className="text-sm text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter your email address"
                className="bg-black/20 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-white font-medium">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                {...register('phoneNumber')}
                placeholder="Enter your phone number"
                className="bg-black/20 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-400">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="space-y-2">
              <Label htmlFor="cin" className="text-white font-medium">
                CIN Number
              </Label>
              <Input
                id="cin"
                {...register('cin')}
                placeholder="Enter your CIN (Carte d'Identité Nationale) number"
                className="bg-black/20 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.cin && (
                <p className="text-sm text-red-400">{errors.cin.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter your 8-digit CIN number as shown on your national identity card
              </p>
            </div>
          </div>
        </div>

        {/* Identity Documents Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Identity Documents</h3>
          </div>

          <p className="text-gray-400 mb-6">
            Please upload clear, high-quality images of your CIN (Carte d'Identité Nationale) front and back.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="cinFront" className="text-white font-medium">
                CIN Front Side
              </Label>
              {cinFrontPreview ? (
                <div className="relative border-2 border-blue-500/30 rounded-lg p-3 bg-black/20">
                  <div className="relative group">
                    <div className="w-full h-40 bg-gray-800 rounded overflow-hidden">
                      <img
                        src={cinFrontPreview}
                        alt="CIN Front Preview"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openPreviewModal(cinFrontPreview, 'CIN Front')}
                        onLoad={() => setImageLoading(prev => ({ ...prev, front: false }))}
                        onError={(e) => {
                          console.error('Error loading front image:', e)
                          setError('Failed to load CIN front image. Please try uploading again.')
                          removeFilePreview('front')
                        }}
                        style={{
                          display: imageLoading.front ? 'none' : 'block',
                          minHeight: '160px'
                        }}
                      />
                      {imageLoading.front && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 rounded flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openPreviewModal(cinFrontPreview, 'CIN Front')
                        }}
                        className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFilePreview('front')
                        }}
                        className="opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all duration-200 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-green-400 mt-2 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    CIN Front uploaded successfully
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors bg-black/10">
                  <Upload className="mx-auto w-8 h-8 text-gray-400 mb-3" />
                  <Input
                    id="cinFront"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file, 'front')
                      }
                    }}
                  />
                  <Label htmlFor="cinFront" className="cursor-pointer">
                    <span className="text-blue-400 hover:text-blue-300 font-medium">
                      Upload CIN Front Image
                    </span>
                  </Label>
                  <p className="text-xs text-gray-500 mt-2">Max file size: 5MB (JPEG, PNG, WebP)</p>
                </div>
              )}
              {errors.cinFront && (
                <p className="text-sm text-red-400">{errors.cinFront.message}</p>
              )}
              </div>
              
            <div className="space-y-3">
              <Label htmlFor="cinBack" className="text-white font-medium">
                CIN Back Side
              </Label>
              {cinBackPreview ? (
                <div className="relative border-2 border-blue-500/30 rounded-lg p-3 bg-black/20">
                  <div className="relative group">
                    <div className="w-full h-40 bg-gray-800 rounded overflow-hidden">
                      <img
                        src={cinBackPreview}
                        alt="CIN Back Preview"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openPreviewModal(cinBackPreview, 'CIN Back')}
                        onLoad={() => setImageLoading(prev => ({ ...prev, back: false }))}
                        onError={(e) => {
                          console.error('Error loading back image:', e)
                          setError('Failed to load CIN back image. Please try uploading again.')
                          removeFilePreview('back')
                        }}
                        style={{
                          display: imageLoading.back ? 'none' : 'block',
                          minHeight: '160px'
                        }}
                      />
                      {imageLoading.back && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 rounded flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openPreviewModal(cinBackPreview, 'CIN Back')
                        }}
                        className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFilePreview('back')
                        }}
                        className="opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all duration-200 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-green-400 mt-2 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    CIN Back uploaded successfully
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors bg-black/10">
                  <Upload className="mx-auto w-8 h-8 text-gray-400 mb-3" />
                  <Input
                    id="cinBack"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file, 'back')
                      }
                    }}
                  />
                  <Label htmlFor="cinBack" className="cursor-pointer">
                    <span className="text-blue-400 hover:text-blue-300 font-medium">
                      Upload CIN Back Image
                    </span>
                  </Label>
                  <p className="text-xs text-gray-500 mt-2">Max file size: 5MB (JPEG, PNG, WebP)</p>
                </div>
              )}
              {errors.cinBack && (
                <p className="text-sm text-red-400">{errors.cinBack.message}</p>
              )}
              </div>
            </div>
          </div>

        {/* Station Location Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Station Location</h3>
          </div>

          <p className="text-gray-400 mb-6">
            Select your station's location. You can also drag the marker on the map to set the exact position.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="governorate" className="text-white font-medium">
                Governorate
              </Label>
              <Select onValueChange={(value) => setValue('governorate', value)}>
                <SelectTrigger className="bg-black/20 border-white/20 text-white">
                  <SelectValue placeholder="Select governorate" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  {governorates.map((gov) => (
                    <SelectItem key={gov.Value} value={gov.Value} className="text-white hover:bg-white/10">
                      {gov.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.governorate && (
                <p className="text-sm text-red-400">{errors.governorate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="delegation" className="text-white font-medium">
                Delegation
              </Label>
              <Select
                onValueChange={(value) => setValue('delegation', value)}
                disabled={!selectedGovernorate}
              >
                <SelectTrigger className="bg-black/20 border-white/20 text-white">
                  <SelectValue placeholder="Select delegation" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  {delegations.map((del, index) => (
                    <SelectItem key={`${del.Value}-${index}`} value={del.Value} className="text-white hover:bg-white/10">
                      {del.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.delegation && (
                <p className="text-sm text-red-400">{errors.delegation.message}</p>
              )}
            </div>
          </div>

          {/* Map */}
          {currentLocation && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium">Station Location Preview</h4>
                {isLocationCustomized && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetToOriginalLocation}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-xs"
                  >
                    Reset to Original
                  </Button>
                )}
              </div>
              <div className="border border-white/20 rounded-lg overflow-hidden">
                <Map
                  latitude={currentLocation.latitude}
                  longitude={currentLocation.longitude}
                  zoom={14}
                  className="h-64"
                  showMarker={true}
                  markerColor="#3B82F6"
                  draggable={true}
                  clickable={true}
                  onMarkerDrag={handleMarkerDrag}
                  onMapClick={handleMapClick}
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-400">
                  Location: <span className="text-white font-medium">{selectedDelegation?.Name}, {selectedGovernorate?.Name}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Coordinates: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
                {isLocationCustomized && (
                  <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Location has been customized by dragging the marker
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Drag the marker or click anywhere on the map to set your station's exact location
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Ready to Submit</h3>
          </div>

          <p className="text-gray-400 mb-6">
            Please review all your information before submitting your partnership request. Our team will contact you within 2-3 business days.
          </p>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                Submit Partnership Request
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            By submitting this request, you agree to our partnership terms and conditions.
          </p>
        </div>
      </form>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={previewModal.isOpen}
        imageUrl={previewModal.imageUrl}
        imageTitle={previewModal.title}
        onClose={closePreviewModal}
      />
    </div>
  )
}
