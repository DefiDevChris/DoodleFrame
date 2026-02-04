/**
 * OpenCV-based UI object detection with smart background filling
 */

import { handleError } from './error-handler';

export interface DetectedObject {
  x: number;
  y: number;
  width: number;
  height: number;
  // Optional contour points for transparency masking
  contourPoints?: { x: number; y: number }[];
}

export interface DetectionResult {
  objects: DetectedObject[];
  backgroundInpainted: string;
}

// Check if OpenCV is available
export const isOpenCVReady = (): boolean => {
  return !!(window as any).cv && !!(window as any).cvReady;
};

// Wait for OpenCV to be ready with timeout
const waitForOpenCV = (timeoutMs = 30000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).cvReady && (window as any).cv) {
      resolve();
      return;
    }
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if ((window as any).cvReady && (window as any).cv) {
        clearInterval(checkInterval);
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        reject(new Error('OpenCV failed to load within timeout'));
      }
    }, 100);
  });
};

/**
 * Fill a region with color sampled from its surroundings
 * Uses a simple approach: sample from the border of the region
 */
const fillRegionWithSurroundingColor = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number,
  imgWidth: number,
  imgHeight: number
) => {
  const sampleWidth = Math.min(20, Math.floor(width * 0.2));
  const sampleHeight = Math.min(20, Math.floor(height * 0.2));
  
  // Sample from multiple directions around the region
  const samples: {r: number, g: number, b: number, a: number, count: number}[] = [];
  
  const trySample = (sx: number, sy: number, sw: number, sh: number) => {
    if (sx >= 0 && sy >= 0 && sx + sw <= imgWidth && sy + sh <= imgHeight) {
      try {
        const imageData = ctx.getImageData(sx, sy, sw, sh);
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          r += imageData.data[i];
          g += imageData.data[i + 1];
          b += imageData.data[i + 2];
          a += imageData.data[i + 3];
          count++;
        }
        
        if (count > 0) {
          samples.push({
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
            a: Math.round(a / count),
            count
          });
        }
      } catch (e) {
        // Skip invalid regions
      }
    }
  };
  
  // Sample from top
  trySample(x, Math.max(0, y - sampleHeight), width, sampleHeight);
  // Sample from bottom
  trySample(x, Math.min(imgHeight - sampleHeight, y + height), width, sampleHeight);
  // Sample from left
  trySample(Math.max(0, x - sampleWidth), y, sampleWidth, height);
  // Sample from right
  trySample(Math.min(imgWidth - sampleWidth, x + width), y, sampleWidth, height);
  
  // Average all samples
  if (samples.length > 0) {
    let totalR = 0, totalG = 0, totalB = 0, totalA = 0, totalCount = 0;
    for (const s of samples) {
      totalR += s.r * s.count;
      totalG += s.g * s.count;
      totalB += s.b * s.count;
      totalA += s.a * s.count;
      totalCount += s.count;
    }
    
    const avgR = Math.round(totalR / totalCount);
    const avgG = Math.round(totalG / totalCount);
    const avgB = Math.round(totalB / totalCount);
    const avgA = Math.round(totalA / totalCount);
    
    // Fill the region with the averaged color
    ctx.fillStyle = `rgba(${avgR},${avgG},${avgB},${avgA / 255})`;
    ctx.fillRect(x, y, width, height);
  }
};

/**
 * UI object detection using basic OpenCV.js functions
 * @param imageSrc - Image source URL
 * @param sensitivity - Detection sensitivity (0-100, default 50)
 * @param backgroundBlurRadius - Blur radius for inpainted background areas (0-20, default 0)
 */
export const detectUIObjects = async (
  imageSrc: string,
  sensitivity: number = 50,
  backgroundBlurRadius: number = 0
): Promise<DetectionResult> => {
  try {
    await waitForOpenCV(10000);
  } catch (e) {
    throw new Error('OpenCV not loaded. Please wait a few seconds and try again.');
  }
  
  const cv = (window as any).cv;
  if (!cv) {
    throw new Error('OpenCV not available');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const mats: any[] = [];

      try {
        // Create canvas and load image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // Load into OpenCV
        const src = cv.imread(canvas);
        mats.push(src);

        const gray = new cv.Mat();
        mats.push(gray);

        const edges = new cv.Mat();
        mats.push(edges);

        const dilated = new cv.Mat();
        mats.push(dilated);

        // Step 1: Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Step 2: Apply Gaussian blur
        const blurred = new cv.Mat();
        mats.push(blurred);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

        // Step 3: Edge detection - adjust thresholds based on sensitivity
        // Higher sensitivity = lower thresholds = more edges detected
        const lowThreshold = Math.max(1, 30 - (sensitivity * 0.4));
        const highThreshold = Math.max(10, 100 - (sensitivity * 1.2));
        cv.Canny(blurred, edges, lowThreshold, highThreshold);

        // Step 4: Dilate to connect edges
        const kernelSize = Math.max(3, 11 - Math.floor(sensitivity * 0.04));
        const kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
        mats.push(kernel);
        const iterations = Math.max(2, 7 - Math.floor(sensitivity * 0.05));
        cv.dilate(edges, dilated, kernel, new cv.Point(-1, -1), iterations);

        // Step 5: Find contours
        const contours = new cv.MatVector();
        mats.push(contours);

        const hierarchy = new cv.Mat();
        mats.push(hierarchy);
        cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Step 6: Extract bounding boxes and contour points
        const detectedObjects: DetectedObject[] = [];
        const imgArea = img.width * img.height;

        // Adjust thresholds based on sensitivity
        const minArea = Math.max(10, 300 - (sensitivity * 5));
        const minSize = Math.max(5, 15 - Math.floor(sensitivity * 0.1));

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);

          // Area thresholds - more sensitive with higher sensitivity value
          if (area > minArea && area < imgArea * 0.95) {
            const rect = cv.boundingRect(contour);

            // Lenient aspect ratio to catch various UI elements
            const aspectRatio = rect.width / rect.height;
            if (aspectRatio > 0.01 && aspectRatio < 100 &&
                rect.width > minSize && rect.height > minSize) {
              
              // Extract contour points for transparency masking
              const contourPoints: { x: number; y: number }[] = [];
              const data = contour.data32S;
              for (let j = 0; j < data.length; j += 2) {
                contourPoints.push({
                  x: data[j],
                  y: data[j + 1]
                });
              }
              
              detectedObjects.push({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                contourPoints
              });
            }
          }
        }
        
        // Step 7: Create background by ONLY inpainting detected object regions
        // Start with a copy of the original image
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = img.width;
        bgCanvas.height = img.height;
        const bgCtx = bgCanvas.getContext('2d')!;
        
        // Copy original image as base
        bgCtx.drawImage(img, 0, 0);
        
        // Only fill the detected object regions with surrounding color
        // This preserves gradients and background details everywhere else
        detectedObjects.forEach(obj => {
          fillRegionWithSurroundingColor(
            bgCtx, 
            obj.x, 
            obj.y, 
            obj.width, 
            obj.height,
            img.width,
            img.height
          );
        });
        
        // Apply blur to the filled regions if blur radius > 0
        if (backgroundBlurRadius > 0) {
          detectedObjects.forEach(obj => {
            // Extract the filled region
            const imageData = bgCtx.getImageData(obj.x, obj.y, obj.width, obj.height);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = obj.width;
            tempCanvas.height = obj.height;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.putImageData(imageData, 0, 0);
            
            // Apply blur using CSS filter on a temporary canvas
            tempCtx.filter = `blur(${backgroundBlurRadius}px)`;
            tempCtx.drawImage(tempCanvas, 0, 0);
            
            // Put the blurred image back
            bgCtx.drawImage(tempCanvas, obj.x, obj.y);
          });
        }
        
        const backgroundInpainted = bgCanvas.toDataURL('image/png');
        
        // Sort and filter
        const sorted = detectedObjects.sort((a, b) => (b.width * b.height) - (a.width * a.height));


        resolve({
          objects: sorted.slice(0, 50),
          backgroundInpainted
        });

      } catch (error: any) {
        const errorMessage = 'OpenCV processing failed: ' + (error.message || 'Unknown error');
        handleError('OpenCV error', error);
        reject(new Error(errorMessage));
      } finally {
        // Guaranteed cleanup of all OpenCV mats
        mats.forEach(mat => {
          try {
            mat.delete();
          } catch (e) {
            // Ignore cleanup errors
          }
        });
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
};

/**
 * Crop image to specific region with contour-based transparency
 * Uses the contour points to create a transparency mask
 */
export const cropImageWithMask = (imageSrc: string, region: DetectedObject): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = region.width;
      canvas.height = region.height;
      const ctx = canvas.getContext('2d')!;
      
      // If we have contour points, use them to create a mask
      if (region.contourPoints && region.contourPoints.length > 0) {
        // Create a temporary canvas for the mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = region.width;
        maskCanvas.height = region.height;
        const maskCtx = maskCanvas.getContext('2d')!;
        
        // Draw the mask path
        maskCtx.beginPath();
        let first = true;
        for (const pt of region.contourPoints) {
          const x = pt.x - region.x;
          const y = pt.y - region.y;
          if (first) {
            maskCtx.moveTo(x, y);
            first = false;
          } else {
            maskCtx.lineTo(x, y);
          }
        }
        maskCtx.closePath();
        
        // Fill the mask (white = visible, black = transparent)
        maskCtx.fillStyle = 'white';
        maskCtx.fill();
        
        // Minimal padding (1px) to avoid cutting into the object edges
        // Users can adjust sensitivity if the detection is too aggressive
        // maskCtx.strokeStyle = 'white';
        // maskCtx.lineWidth = 1;
        // maskCtx.stroke();
        
        // Draw the image
        ctx.drawImage(
          img,
          region.x, region.y, region.width, region.height,
          0, 0, region.width, region.height
        );
        
        // Apply the mask using composite operation
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // No contour points, just do a regular crop
        ctx.drawImage(
          img,
          region.x, region.y, region.width, region.height,
          0, 0, region.width, region.height
        );
      }
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
};

/**
 * Crop image to specific region (simple rectangular crop)
 * Kept for backward compatibility
 */
export const cropImage = (imageSrc: string, region: DetectedObject): Promise<string> => {
  return cropImageWithMask(imageSrc, region);
};
