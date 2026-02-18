// ---------------------------------------------------------------
// PRICE CHECK MEDIA RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------
const priceMediaDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

class PhotoCapture {
    constructor() {
        this.stream = null;
        this.photo = null;
        this.simulationMode = false;
    }

    async requestCamera() {
        try {
            // 1. Try with preferred back camera (ideal, not exact)
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            priceMediaDebugLog('[CAMERA] Requesting stream with constraints:', constraints);
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.simulationMode = false;
            return this.stream;
        } catch (error) {
            console.warn('[CAMERA] Preferred constraints failed, trying fallback...', error);
            try {
                // 2. Fallback: Request ANY available video stream
                this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
                this.simulationMode = false;
                return this.stream;
            } catch (fallbackError) {
                console.error('[CAMERA] All attempts failed:', fallbackError);

                // Check if it's a hardware issue (NotFoundError) or permission issue
                const isHardwareMissing = fallbackError.name === 'NotFoundError' ||
                    fallbackError.name === 'DevicesNotFoundError';

                // Trigger simulation if hardware missing OR simulation mode enabled
                if (isHardwareMissing || CONFIG.SIMULATION_MODE) {
                    priceMediaDebugLog('[CAMERA] Triggering simulation mode (hardware missing or forced)');
                    this.simulationMode = true;

                    // Dispatch custom event for UI to handle
                    window.dispatchEvent(new CustomEvent('camera:missing', {
                        detail: {
                            reason: isHardwareMissing ? 'NO_HARDWARE' : 'SIMULATION_MODE',
                            error: fallbackError
                        }
                    }));

                    // ? SURGICAL FIX: Removed throw error - Allow photo upload to proceed
                    // Previously: throw new Error('CAMERA_SIMULATION_MODE');
                }

                throw new Error('CAMERA_ERROR: Access denied or no device found.');
            }
        }
    }

    capturePhoto(videoElement) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoElement, 0, 0);

                canvas.toBlob(blob => {
                    if (blob) {
                        this.photo = blob;
                        priceMediaDebugLog('[CAMERA] Photo captured:', blob.size, 'bytes');
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to capture photo'));
                    }
                }, 'image/jpeg', 0.85);
            } catch (err) {
                reject(err);
            }
        });
    }

    // New method for file-based simulation
    captureFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Invalid file type. Please select an image.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                // Convert to blob
                fetch(e.target.result)
                    .then(res => res.blob())
                    .then(blob => {
                        this.photo = blob;
                        priceMediaDebugLog('[CAMERA:SIM] File loaded as photo:', blob.size, 'bytes');
                        resolve(blob);
                    })
                    .catch(reject);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    stopCamera() {
        if (this.stream) {
            const tracks = this.stream.getTracks();
            if (tracks && tracks.length > 0) {
                tracks.forEach(track => {
                    track.stop();
                    priceMediaDebugLog('[CAMERA] Track stopped:', track.kind);
                });
            }
            this.stream = null;
        }
    }
}


// ---------------------------------------------------------------
// CLASS: ImageProcessor (Legacy - kept for compatibility)
// ---------------------------------------------------------------

class ImageProcessor {
    loadImage(blob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            img.src = url;
        });
    }

    resizeImage(img, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        return canvas;
    }

    async preprocessImage(imageBlob) {
        const img = await this.loadImage(imageBlob);
        const resized = this.resizeImage(img, CONFIG.IMAGE_SIZE, CONFIG.IMAGE_SIZE);
        const material = this._detectMaterial(resized);
        priceMediaDebugLog('[VISION] Material Analysis:', material);
        if (typeof tf !== 'undefined') {
            return tf.tidy(() => {
                const tensor = tf.browser.fromPixels(resized)
                    .resizeNearestNeighbor([CONFIG.IMAGE_SIZE, CONFIG.IMAGE_SIZE])
                    .toFloat().div(255).expandDims(0);
                tensor.materialContext = material;
                return tensor;
            });
        }
        resized.materialContext = material;
        return resized;
    }

    _detectMaterial(canvas) {
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 40) {
            r += data[i]; g += data[i + 1]; b += data[i + 2];
        }
        const count = data.length / 40;
        const avgR = r / count;
        const avgB = b / count;
        if (avgR > 120 && avgB < 100) return 'LEATHER';
        if (avgR < 100 && avgB > 120) return 'TEXTILE';
        if (avgR > 180 && avgB > 180) return 'METAL';
        return 'CERAMIC';
    }
}


// ---------------------------------------------------------------
// CLASS: DeepImageAnalyzer (ONE SHOT, DEEP ANALYSIS)
// Computer Vision Pipeline: Intelligent Zoom & Texture Detection
// ---------------------------------------------------------------

class DeepImageAnalyzer {
    constructor() {
        this.ZONE_SIZE = 512;       // Output size for each zone crop
        this.GRID_STEPS = 6;        // Sliding window grid resolution
        this.EDGE_SAMPLE_STEP = 2;  // Pixel step for edge detection (perf)
    }

    /**
     * Load an image from base64 or blob into an HTMLImageElement
     */
    _loadImage(source) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('DeepAnalyzer: image load failed'));
            if (source instanceof Blob) {
                const url = URL.createObjectURL(source);
                img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('DeepAnalyzer: blob load failed')); };
                img.src = url;
            } else {
                img.src = source; // base64 string
            }
        });
    }

    /**
     * Main entry: Extract 3 intelligent zones from a single photo
     * Returns { overall, detail, material } as base64 JPEG strings
     */
    async extractZones(imageSource) {
        const t0 = performance.now();
        priceMediaDebugLog('[DEEP] Starting intelligent zone extraction...');

        const img = await this._loadImage(imageSource);
        priceMediaDebugLog(`[DEEP] Image loaded: ${img.width}x${img.height}`);

        // 1. Create working canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // 2. Auto-crop to center 80% (remove background noise at edges)
        const overall = this._extractOverallZone(canvas);

        // 3. Find high-detail zone (craftsmanship area — highest edge density)
        const detail = this._extractDetailZone(canvas);

        // 4. Extract material/texture zone (lower region where grain/glaze is visible)
        const material = this._extractMaterialZone(canvas);

        const elapsed = (performance.now() - t0).toFixed(0);
        priceMediaDebugLog(`[DEEP] ? Zone extraction complete in ${elapsed}ms`);

        return { overall, detail, material };
    }

    /**
     * Overall Zone: Center 80% crop, resized to ZONE_SIZE
     * Removes distracting edges (vendor hands, background clutter)
     */
    _extractOverallZone(srcCanvas) {
        const margin = 0.10; // 10% margin on each side
        const sx = Math.round(srcCanvas.width * margin);
        const sy = Math.round(srcCanvas.height * margin);
        const sw = Math.round(srcCanvas.width * (1 - 2 * margin));
        const sh = Math.round(srcCanvas.height * (1 - 2 * margin));

        const out = document.createElement('canvas');
        out.width = this.ZONE_SIZE;
        out.height = this.ZONE_SIZE;
        const ctx = out.getContext('2d');
        ctx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, this.ZONE_SIZE, this.ZONE_SIZE);

        return out.toDataURL('image/jpeg', 0.88);
    }

    /**
     * Detail Zone: Sliding window to find area with highest edge density
     * This finds stitching, patterns, engravings — craftsmanship indicators
     */
    _extractDetailZone(srcCanvas) {
        const ctx = srcCanvas.getContext('2d');
        const w = srcCanvas.width;
        const h = srcCanvas.height;

        // Get grayscale luminance for edge detection
        const imgData = ctx.getImageData(0, 0, w, h);
        const gray = this._toGrayscale(imgData);

        // Compute edge magnitude map (Sobel-style)
        const edges = this._computeEdges(gray, w, h);

        // Sliding window: find window with max summed edge magnitude
        const windowW = Math.round(w * 0.30); // 30% of image width
        const windowH = Math.round(h * 0.30);
        const stepX = Math.max(1, Math.round((w - windowW) / this.GRID_STEPS));
        const stepY = Math.max(1, Math.round((h - windowH) / this.GRID_STEPS));

        let bestScore = -1, bestX = 0, bestY = 0;

        // Use integral image for O(1) window sums
        const integral = this._buildIntegralImage(edges, w, h);

        for (let y = 0; y <= h - windowH; y += stepY) {
            for (let x = 0; x <= w - windowW; x += stepX) {
                const score = this._integralSum(integral, w, x, y, x + windowW - 1, y + windowH - 1);
                if (score > bestScore) {
                    bestScore = score;
                    bestX = x;
                    bestY = y;
                }
            }
        }

        priceMediaDebugLog(`[DEEP] Detail zone: (${bestX},${bestY}) ${windowW}x${windowH}, edge score: ${bestScore.toFixed(0)}`);

        // Extract and upscale
        const out = document.createElement('canvas');
        out.width = this.ZONE_SIZE;
        out.height = this.ZONE_SIZE;
        const outCtx = out.getContext('2d');
        outCtx.drawImage(srcCanvas, bestX, bestY, windowW, windowH, 0, 0, this.ZONE_SIZE, this.ZONE_SIZE);

        return out.toDataURL('image/jpeg', 0.90);
    }

    /**
     * Material Zone: Crop focused on texture/surface
     * Strategy: Bottom-center 35% — where leather grain, ceramic glaze,
     * metal finish, and textile weave are most visible
     */
    _extractMaterialZone(srcCanvas) {
        const w = srcCanvas.width;
        const h = srcCanvas.height;

        // Bottom-center 35% crop
        const cropW = Math.round(w * 0.35);
        const cropH = Math.round(h * 0.35);
        const sx = Math.round((w - cropW) / 2);
        const sy = Math.round(h * 0.55); // Start from 55% down

        // Clamp to image bounds
        const clampedH = Math.min(cropH, h - sy);

        const out = document.createElement('canvas');
        out.width = this.ZONE_SIZE;
        out.height = this.ZONE_SIZE;
        const ctx = out.getContext('2d');
        ctx.drawImage(srcCanvas, sx, sy, cropW, clampedH, 0, 0, this.ZONE_SIZE, this.ZONE_SIZE);

        return out.toDataURL('image/jpeg', 0.90);
    }

    /**
     * Convert ImageData to flat grayscale Float32Array
     * Uses Rec. 709 luma coefficients
     */
    _toGrayscale(imgData) {
        const { data, width, height } = imgData;
        const gray = new Float32Array(width * height);
        for (let i = 0; i < gray.length; i++) {
            const p = i * 4;
            gray[i] = data[p] * 0.2126 + data[p + 1] * 0.7152 + data[p + 2] * 0.0722;
        }
        return gray;
    }

    /**
     * Compute edge magnitude using 3x3 Sobel operator
     * Returns Float32Array of gradient magnitudes
     */
    _computeEdges(gray, w, h) {
        const edges = new Float32Array(w * h);
        const step = this.EDGE_SAMPLE_STEP;

        for (let y = 1; y < h - 1; y += step) {
            for (let x = 1; x < w - 1; x += step) {
                // Sobel X kernel
                const gx =
                    -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)]
                    - 2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)]
                    - gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)];

                // Sobel Y kernel
                const gy =
                    -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)]
                    + gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];

                edges[y * w + x] = Math.sqrt(gx * gx + gy * gy);
            }
        }
        return edges;
    }

    /**
     * Build integral (summed-area) image for O(1) rectangle sums
     */
    _buildIntegralImage(data, w, h) {
        const integral = new Float64Array(w * h);
        for (let y = 0; y < h; y++) {
            let rowSum = 0;
            for (let x = 0; x < w; x++) {
                rowSum += data[y * w + x];
                integral[y * w + x] = rowSum + (y > 0 ? integral[(y - 1) * w + x] : 0);
            }
        }
        return integral;
    }

    /**
     * Sum over rectangle [x1,y1]->[x2,y2] using integral image
     */
    _integralSum(integral, w, x1, y1, x2, y2) {
        const A = (x1 > 0 && y1 > 0) ? integral[(y1 - 1) * w + (x1 - 1)] : 0;
        const B = (y1 > 0) ? integral[(y1 - 1) * w + x2] : 0;
        const C = (x1 > 0) ? integral[y2 * w + (x1 - 1)] : 0;
        const D = integral[y2 * w + x2];
        return D - B - C + A;
    }

    /**
     * Get color statistics for a region (used for material hints)
     */
    getColorStats(base64Image) {
        return new Promise(async (resolve) => {
            const img = await this._loadImage(base64Image);
            const c = document.createElement('canvas');
            c.width = 64; c.height = 64; // Small sample
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, 64, 64);
            const data = ctx.getImageData(0, 0, 64, 64).data;

            let rSum = 0, gSum = 0, bSum = 0, satSum = 0;
            const n = 64 * 64;
            for (let i = 0; i < data.length; i += 4) {
                rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2];
                const max = Math.max(data[i], data[i + 1], data[i + 2]);
                const min = Math.min(data[i], data[i + 1], data[i + 2]);
                satSum += max > 0 ? (max - min) / max : 0;
            }
            resolve({
                avgR: rSum / n, avgG: gSum / n, avgB: bSum / n,
                avgSaturation: satSum / n,
                dominantChannel: rSum > gSum && rSum > bSum ? 'R' : gSum > bSum ? 'G' : 'B'
            });
        });
    }
}
