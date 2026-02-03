/**
 * OpenCV-based UI object detection with smart background filling
 */

import { handleError } from './error-handler';

export interface DetectedObject {
  x: number;
  y: number;
  width: number;
  height: number;
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
 * Sample background color from multiple edge regions
 */
const sampleBackgroundColor = (ctx: CanvasRenderingContext2D, width: number, height: number): {r: number, g: number, b: number} => {
  const samples: {r: number, g: number, b: number, count: number}[] = [];
  const sampleSize = 30;
  
  // Sample edges and corners
  const regions = [
    { x: 0, y: 0, w: sampleSize, h: sampleSize }, // Top-left
    { x: width - sampleSize, y: 0, w: sampleSize, h: sampleSize }, // Top-right
    { x: 0, y: height - sampleSize, w: sampleSize, h: sampleSize }, // Bottom-left
    { x: width - sampleSize, y: height - sampleSize, w: sampleSize, h: sampleSize }, // Bottom-right
    { x: Math.floor(width/2 - sampleSize/2), y: 0, w: sampleSize, h: sampleSize }, // Top center
    { x: Math.floor(width/2 - sampleSize/2), y: height - sampleSize, w: sampleSize, h: sampleSize }, // Bottom center
    { x: 0, y: Math.floor(height/2 - sampleSize/2), w: sampleSize, h: sampleSize }, // Left center
    { x: width - sampleSize, y: Math.floor(height/2 - sampleSize/2), w: sampleSize, h: sampleSize }, // Right center
  ];
  
  for (const region of regions) {
    try {
      const imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        r += imageData.data[i];
        g += imageData.data[i + 1];
        b += imageData.data[i + 2];
        count++;
      }
      
      if (count > 0) {
        samples.push({
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
          count
        });
      }
    } catch (e) {
      // Skip invalid regions
    }
  }
  
  if (samples.length === 0) {
    return { r: 255, g: 255, b: 255 }; // Default white
  }
  
  // Find the most common color range (mode clustering)
  // Group similar colors together
  const clusters: {r: number, g: number, b: number, totalCount: number}[] = [];
  const threshold = 30; // Color similarity threshold
  
  for (const sample of samples) {
    let added = false;
    for (const cluster of clusters) {
      const dist = Math.abs(sample.r - cluster.r) + Math.abs(sample.g - cluster.g) + Math.abs(sample.b - cluster.b);
      if (dist < threshold * 3) {
        cluster.r = (cluster.r * cluster.totalCount + sample.r * sample.count) / (cluster.totalCount + sample.count);
        cluster.g = (cluster.g * cluster.totalCount + sample.g * sample.count) / (cluster.totalCount + sample.count);
        cluster.b = (cluster.b * cluster.totalCount + sample.b * sample.count) / (cluster.totalCount + sample.count);
        cluster.totalCount += sample.count;
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push({ r: sample.r, g: sample.g, b: sample.b, totalCount: sample.count });
    }
  }
  
  // Return the largest cluster
  const largest = clusters.reduce((max, c) => c.totalCount > max.totalCount ? c : max, clusters[0]);
  return {
    r: Math.round(largest.r),
    g: Math.round(largest.g),
    b: Math.round(largest.b)
  };
};

/**
 * UI object detection using basic OpenCV.js functions
 */
export const detectUIObjects = async (imageSrc: string): Promise<DetectionResult> => {
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

        // Step 3: Edge detection with lower thresholds for dark themes
        cv.Canny(blurred, edges, 15, 60);

        // Step 4: Dilate to connect edges
        const kernel = cv.Mat.ones(9, 9, cv.CV_8U);
        mats.push(kernel);
        cv.dilate(edges, dilated, kernel, new cv.Point(-1, -1), 5);

        // Step 5: Find contours
        const contours = new cv.MatVector();
        mats.push(contours);

        const hierarchy = new cv.Mat();
        mats.push(hierarchy);
        cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Step 6: Extract bounding boxes
        const detectedObjects: DetectedObject[] = [];
        const imgArea = img.width * img.height;

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);

          // Very lenient area thresholds
          if (area > 200 && area < imgArea * 0.95) {
            const rect = cv.boundingRect(contour);

            // Very lenient aspect ratio
            const aspectRatio = rect.width / rect.height;
            if (aspectRatio > 0.01 && aspectRatio < 100 && rect.width > 10 && rect.height > 10) {
              detectedObjects.push({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              });
            }
          }
        }
        
        // Step 7: Create background with smart filling
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = img.width;
        bgCanvas.height = img.height;
        const bgCtx = bgCanvas.getContext('2d')!;
        
        // Get dominant background color
        const bgColor = sampleBackgroundColor(ctx, img.width, img.height);
        
        // Fill entire canvas with background color
        bgCtx.fillStyle = `rgb(${bgColor.r},${bgColor.g},${bgColor.b})`;
        bgCtx.fillRect(0, 0, img.width, img.height);
        
        // For larger regions, try to preserve some texture by copying from nearby
        // but only for areas that aren't where objects were detected
        detectedObjects.forEach(obj => {
          // Just fill with solid color for now - could be enhanced with texture synthesis
          bgCtx.fillStyle = `rgb(${bgColor.r},${bgColor.g},${bgColor.b})`;
          bgCtx.fillRect(obj.x, obj.y, obj.width, obj.height);
        });
        
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
 * Crop image to specific region
 */
export const cropImage = (imageSrc: string, region: DetectedObject): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = region.width;
      canvas.height = region.height;
      const ctx = canvas.getContext('2d')!;
      
      ctx.drawImage(
        img,
        region.x, region.y, region.width, region.height,
        0, 0, region.width, region.height
      );
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
};
