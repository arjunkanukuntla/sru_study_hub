/**
 * File upload utilities:
 * - SHA-256 hash calculation (for duplicate detection)
 * - File validation
 * - Upload rate limiting per anonymous user
 */

// Allowed MIME types
export const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Local Manual Content Safety Check (100% Client-side Keyword Matching — No AI/API)
 */
const PROHIBITED_KEYWORDS = [
  'porn', 'porno', 'xxx', 'sex', 'sexual', 'nude', 'naked', 'erotic', 'adult',
  'gambling', 'casino', 'betting', 'crypto scam', 'hack tool', 'warez'
]

export function validateContentSafety(title: string, description: string = '', fileName: string = ''): { safe: boolean; error?: string } {
  const combined = `${title} ${description} ${fileName}`.toLowerCase()
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (combined.includes(keyword)) {
      return {
        safe: false,
        error: `Content validation failed: inappropriate term detected ("${keyword}"). Only academic materials are allowed.`,
      }
    }
  }
  return { safe: true }
}

export function validateFile(file: File): FileValidationResult {
  if (!ALLOWED_MIMES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: PDF, JPEG, PNG, WebP, Word documents.`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is 50 MB (your file: ${formatBytes(file.size)}).`,
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  return { valid: true }
}

/**
 * Calculate SHA-256 hash of a File using the Web Crypto API.
 * This runs entirely client-side — no server needed.
 */
export async function sha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Simple upload rate limiter (client-side)
 * Prevents a single anonymous user from spamming uploads.
 */
const RATE_LIMIT_KEY = 'sru_upload_rate'
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 10 // max uploads per hour

interface RateLimitRecord {
  count: number
  windowStart: number
}

export function checkUploadRateLimit(): { allowed: boolean; remaining: number; resetAt: number } {
  const raw = localStorage.getItem(RATE_LIMIT_KEY)
  const now = Date.now()

  let record: RateLimitRecord = raw ? JSON.parse(raw) : { count: 0, windowStart: now }

  // Reset window if expired
  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record = { count: 0, windowStart: now }
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX - record.count)
  const resetAt = record.windowStart + RATE_LIMIT_WINDOW_MS

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt }
  }

  return { allowed: true, remaining, resetAt }
}

export function incrementUploadCount(): void {
  const raw = localStorage.getItem(RATE_LIMIT_KEY)
  const now = Date.now()
  let record: RateLimitRecord = raw ? JSON.parse(raw) : { count: 0, windowStart: now }

  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record = { count: 0, windowStart: now }
  }

  record.count += 1
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(record))
}

/**
 * Smart Client-Side File Compression Utility
 * - Automatically downscales & compresses images (JPEG/PNG/WebP) to WebP format (saves 80-95%).
 * - Automatically applies native GZIP stream compression to PDFs and Word documents (DOCX/DOC) (saves 20-60%).
 */
export async function optimizeUploadFile(file: File): Promise<{
  optimizedFile: File
  originalSize: number
  optimizedSize: number
  compressed: boolean
  fileTypeLabel: string
}> {
  const originalSize = file.size

  // 1. Image Optimization (JPEG, PNG, WebP)
  if (file.type.startsWith('image/')) {
    try {
      const compressedBlob = await compressImageFile(file, 1920, 0.75)
      if (compressedBlob.size < originalSize) {
        const extension = compressedBlob.type === 'image/webp' ? '.webp' : '.jpg'
        const newFileName = file.name.replace(/\.[^/.]+$/, '') + extension
        const optimizedFile = new File([compressedBlob], newFileName, { type: compressedBlob.type })
        return {
          optimizedFile,
          originalSize,
          optimizedSize: optimizedFile.size,
          compressed: true,
          fileTypeLabel: 'Image (WebP Optimized)',
        }
      }
    } catch (e) {
      console.warn('Image compression skipped, using original:', e)
    }
  }

  // 2. Document Handling (PDFs & Word Docs)
  // Note: PDF files must remain valid %PDF-1.x binaries so browser PDF readers can render them natively in iframes without corruption.
  if (
    file.type === 'application/pdf' ||
    file.name.endsWith('.pdf')
  ) {
    return {
      optimizedFile: file,
      originalSize,
      optimizedSize: originalSize,
      compressed: false,
      fileTypeLabel: 'PDF Document (Standard)',
    }
  }

  if (
    file.type.includes('word') ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.doc')
  ) {
    try {
      if ('CompressionStream' in window) {
        const compressedBlob = await compressBinaryFile(file)
        if (compressedBlob.size < originalSize) {
          const optimizedFile = new File([compressedBlob], file.name, { type: file.type })
          return {
            optimizedFile,
            originalSize,
            optimizedSize: optimizedFile.size,
            compressed: true,
            fileTypeLabel: 'Word Doc (Compressed)',
          }
        }
      }
    } catch (e) {
      console.warn('Document stream compression skipped:', e)
    }
  }

  return {
    optimizedFile: file,
    originalSize,
    optimizedSize: originalSize,
    compressed: false,
    fileTypeLabel: 'Original',
  }
}

/**
 * Compress arbitrary binary file (PDF, DOCX, DOC) using native Web API CompressionStream ('gzip')
 */
export async function compressBinaryFile(file: File): Promise<Blob> {
  const stream = file.stream().pipeThrough(new CompressionStream('gzip'))
  const response = new Response(stream)
  return await response.blob()
}

/**
 * Decompress gzipped binary blob back to original format using native DecompressionStream
 */
export async function decompressBinaryBlob(blob: Blob): Promise<Blob> {
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'))
  const response = new Response(stream)
  return await response.blob()
}

function compressImageFile(file: File, maxDimension = 1920, quality = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let width = img.width
      let height = img.height

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            canvas.toBlob(
              (jpgBlob) => (jpgBlob ? resolve(jpgBlob) : reject(new Error('Blob creation failed'))),
              'image/jpeg',
              quality
            )
          }
        },
        'image/webp',
        quality
      )
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}


/**
 * Debounce utility
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Merge multiple image files (JPEG/PNG/WebP) into a single PDF using pdf-lib.
 * Each image becomes one page, sized to A4 at 96 dpi.
 * Returns a File object named "<baseName>.pdf".
 */
export async function mergeImagesToPdf(images: File[], outputName = 'merged-paper.pdf'): Promise<File> {
  const { PDFDocument } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()

  for (const img of images) {
    // Draw image onto canvas to get pixel data as JPEG
    const bitmap = await createImageBitmap(img)
    const canvas = document.createElement('canvas')
    // A4 at 96 dpi ≈ 794 × 1123 px; keep image's natural ratio but cap width
    const maxW = 794
    const scale = Math.min(1, maxW / bitmap.width)
    canvas.width  = Math.round(bitmap.width  * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const jpegBytes   = Uint8Array.from(atob(jpegDataUrl.split(',')[1]), c => c.charCodeAt(0))
    const pdfImage    = await pdfDoc.embedJpg(jpegBytes)

    // Add page matching the image dimensions (in PDF points, 1px ≈ 0.75pt)
    const page = pdfDoc.addPage([canvas.width * 0.75, canvas.height * 0.75])
    page.drawImage(pdfImage, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
  }

  const pdfBytes = await pdfDoc.save()
  return new File([pdfBytes.buffer as ArrayBuffer], outputName, { type: 'application/pdf' })
}

/** Returns true if the file is an image type that can be merged into PDF */
export function isImageFile(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}
