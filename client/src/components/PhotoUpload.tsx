import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './PhotoUpload.css';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (photoUrl: string) => void;
  onPhotoDataChange: (file: File | null, cropData: PixelCrop | null) => void;
  onError: (error: string) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  currentPhotoUrl, 
  onPhotoChange, 
  onPhotoDataChange,
  onError 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCropper, setShowCropper] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        onError('File size must be less than 10MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        onError('Please select an image file');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Set default crop to center square - use 70% of the smaller dimension
    const minDimension = Math.min(width, height);
    const cropSize = minDimension * 0.7;
    const x = (width - cropSize) / 2;
    const y = (height - cropSize) / 2;
    
    const initialCrop = {
      unit: 'px' as const,
      width: cropSize,
      height: cropSize,
      x: x,
      y: y
    };
    
    console.log('🔍 onImageLoad - Setting initial crop:', {
      imageSize: { width, height },
      minDimension,
      cropSize,
      initialCrop
    });
    
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }, []);

  const onCropChange = (crop: Crop, percentCrop: Crop) => {
    // Ensure the crop stays square by using the minimum dimension
    if (crop.width !== crop.height) {
      const minDimension = Math.min(crop.width, crop.height);
      crop.width = minDimension;
      crop.height = minDimension;
    }
    
    setCrop(crop);
  };

  const handleCropComplete = () => {
    if (!selectedFile || !completedCrop || !completedCrop.width || !completedCrop.height) {
      onError('Please select and crop an image');
      return;
    }

    console.log('🔍 DEBUG: Starting crop processing...');
    console.log('  Selected file:', selectedFile.name, selectedFile.size);
    console.log('  Completed crop data:', completedCrop);

    // Generate a circular preview URL for display
    const reader = new FileReader();
    reader.onload = (e) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        console.log('🔍 DEBUG: Image loaded for processing, size:', img.width, 'x', img.height);
        console.log('🔍 DEBUG: Crop data received:', completedCrop);
        
        // Get the actual displayed image element to calculate scaling
        const imgElement = imgRef.current;
        if (!imgElement) {
          console.error('Image element not found');
          return;
        }
        
        const displayedWidth = imgElement.offsetWidth;
        const displayedHeight = imgElement.offsetHeight;
        const naturalWidth = img.width;
        const naturalHeight = img.height;
        
        // Calculate the scaling factors
        const scaleX = naturalWidth / displayedWidth;
        const scaleY = naturalHeight / displayedHeight;
        
        console.log('🔍 DEBUG: Scaling factors:', {
          displayed: { width: displayedWidth, height: displayedHeight },
          natural: { width: naturalWidth, height: naturalHeight },
          scaleX,
          scaleY
        });
        
        // Convert crop coordinates to natural image coordinates
        const scaledCropX = completedCrop.x * scaleX;
        const scaledCropY = completedCrop.y * scaleY;
        const scaledCropWidth = completedCrop.width * scaleX;
        const scaledCropHeight = completedCrop.height * scaleY;
        
        console.log('🔍 DEBUG: Scaled crop coordinates:', {
          original: { x: completedCrop.x, y: completedCrop.y, width: completedCrop.width, height: completedCrop.height },
          scaled: { x: scaledCropX, y: scaledCropY, width: scaledCropWidth, height: scaledCropHeight }
        });
        
        // Set canvas size to the scaled crop size
        canvas.width = scaledCropWidth;
        canvas.height = scaledCropHeight;
        
        if (!ctx) return;
        
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(scaledCropWidth / 2, scaledCropHeight / 2, Math.min(scaledCropWidth, scaledCropHeight) / 2, 0, 2 * Math.PI);
        ctx.clip();
        
        // Draw the exact cropped area using scaled coordinates
        ctx.drawImage(
          img,
          scaledCropX,
          scaledCropY,
          scaledCropWidth,
          scaledCropHeight,
          0,
          0,
          scaledCropWidth,
          scaledCropHeight
        );
        
        console.log('🔍 DEBUG: Drawing with scaled crop params:', {
          sourceX: scaledCropX,
          sourceY: scaledCropY,
          sourceWidth: scaledCropWidth,
          sourceHeight: scaledCropHeight,
          destWidth: scaledCropWidth,
          destHeight: scaledCropHeight
        });
        
        // Generate preview URL
        const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
        onPhotoChange(previewUrl);
        
        // Pass the scaled crop data to parent for upload
        const scaledCropData = {
          x: scaledCropX,
          y: scaledCropY,
          width: scaledCropWidth,
          height: scaledCropHeight,
          unit: 'px' as const
        };
        
        console.log('🔍 DEBUG: Passing scaled crop data:', scaledCropData);
        onPhotoDataChange(selectedFile, scaledCropData);
        
        setShowCropper(false);
        setSelectedFile(null);
        setImageSrc('');
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
    setImageSrc('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange('');
    onPhotoDataChange(null, null);
  };

  const clearPhotoData = () => {
    onPhotoDataChange(null, null);
  };

  return (
    <div className="photo-upload">
      <div className="photo-upload-container">
        {currentPhotoUrl && !showCropper && (
          <div className="current-photo">
            <img src={currentPhotoUrl} alt="Current photo" className="photo-preview" />
            <div className="photo-actions">
              <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-danger"
                onClick={handleRemovePhoto}
              >
                Remove Photo
              </button>
            </div>
          </div>
        )}

        {!currentPhotoUrl && !showCropper && (
          <div className="no-photo">
            <div className="photo-placeholder">
              <i className="bi bi-person-circle"></i>
              <p>No photo uploaded</p>
            </div>
            <button 
              type="button" 
              className="btn btn-outline-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="bi bi-upload"></i> Upload Photo
            </button>
          </div>
        )}

        {showCropper && (
          <div className="photo-cropper">
            <div className="cropper-header">
              <h4>Crop Your Photo</h4>
              <p>Drag to reposition, resize the corners to crop</p>
            </div>
            
            <div className="crop-container">
              <ReactCrop
                crop={crop}
                onChange={onCropChange}
                onComplete={(c) => {
                  console.log('🔍 Crop completed:', c);
                  setCompletedCrop(c);
                }}
                aspect={1} // Square aspect ratio
                minWidth={100}
                minHeight={100}
                keepSelection
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  className="crop-image"
                />
              </ReactCrop>
            </div>

            <div className="cropper-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleCropComplete}
                disabled={!completedCrop}
              >
                <i className="bi bi-check-lg"></i> Use This Photo
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export const uploadPhoto = async (file: File, cropData: PixelCrop): Promise<string> => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('cropData', JSON.stringify(cropData));

  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5001/api/photos/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    return `http://localhost:5001${data.photoUrl}`;
  } else {
    throw new Error(data.error || 'Failed to upload photo');
  }
};

export default PhotoUpload;
