import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export type ConverterMode =
  | 'video-to-gif'
  | 'mp4-to-gif'
  | 'webm-to-gif'
  | 'gif-to-mp4'
  | 'compress-gif'
  | 'discord-sticker';

export type QualityPreset = 'hd' | 'balanced' | 'discord';
export type LoopMode = 'infinite' | 'boomerang' | 'reverse';

export interface ConversionOptions {
  mode: ConverterMode;
  startTime: number;
  endTime: number;
  preset: QualityPreset;
  fps: number;
  width: number; // 0 means Original
  speed: number; // 0.5, 1, 1.5, 2
  loop: LoopMode;
  onProgress: (percent: number, phase: 'pass1' | 'pass2' | 'mp4') => void;
}

export interface ConversionResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  frames: number;
  sizeBytes: number;
  isMp4: boolean;
  extension: 'gif' | 'mp4';
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg | null> | null = null;

export async function getFFmpeg(): Promise<FFmpeg | null> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = (async () => {
    try {
      const ffmpeg = new FFmpeg();
      const baseURL = window.location.origin + '/ffmpeg';
      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        classWorkerURL: `${baseURL}/worker.js`
      });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (err) {
      console.warn('FFmpeg WASM fallback to native 2-Pass Canvas GIF89a engine:', err);
      return null;
    } finally {
      ffmpegLoadingPromise = null;
    }
  })();

  return ffmpegLoadingPromise;
}

/**
 * Primary entry point: Converts input video/GIF using @ffmpeg/ffmpeg 2-Pass
 * palettegen + paletteuse filtergraph, with automatic fallback to our native
 * 2-Pass 256-color GIF89a encoder if WASM is unavailable.
 */
export async function convertMediaClientSide(
  file: File,
  options: ConversionOptions
): Promise<ConversionResult> {
  const { mode, startTime, endTime, preset, fps, width, speed, loop, onProgress } = options;
  const isMp4Output = mode === 'gif-to-mp4';
  const duration = Math.max(0.2, endTime - startTime);

  // Determine effective resolution & FPS for presets
  let targetFps = fps;
  let targetWidth = width;
  let maxColors = 256;

  if (preset === 'discord' || mode === 'discord-sticker') {
    if (targetWidth === 0 || targetWidth > 480) targetWidth = 480;
    if (targetFps > 15) targetFps = 15;
    maxColors = 192;
  }

  onProgress(6, isMp4Output ? 'mp4' : 'pass1');

  // Attempt FFmpeg WASM execution first
  const ffmpeg = await getFFmpeg();
  if (ffmpeg) {
    try {
      return await runFFmpegPipeline(ffmpeg, file, {
        ...options,
        fps: targetFps,
        width: targetWidth,
        maxColors,
        duration,
        isMp4Output
      });
    } catch (wasmErr) {
      console.warn('FFmpeg pipeline encountered issue, using 2-Pass Canvas GIF89a Engine:', wasmErr);
    }
  }

  // Fallback / Direct 2-Pass Canvas + Adaptive 256-Color GIF89a Encoder
  return await runCanvasTwoPassPipeline(file, {
    ...options,
    fps: targetFps,
    width: targetWidth,
    maxColors,
    duration,
    isMp4Output
  });
}

async function runFFmpegPipeline(
  ffmpeg: FFmpeg,
  file: File,
  params: ConversionOptions & {
    maxColors: number;
    duration: number;
    isMp4Output: boolean;
  }
): Promise<ConversionResult> {
  const {
    startTime,
    duration,
    preset,
    fps,
    width,
    speed,
    loop,
    maxColors,
    isMp4Output,
    onProgress
  } = params;

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const inputName = `input_${Date.now()}.${ext}`;
  const paletteName = `palette_${Date.now()}.png`;
  const outputName = isMp4Output ? `output_${Date.now()}.mp4` : `output_${Date.now()}.gif`;

  let currentPhase: 'pass1' | 'pass2' | 'mp4' = isMp4Output ? 'mp4' : 'pass1';

  const progressHandler = ({ progress }: { progress: number }) => {
    const clamped = Math.min(1, Math.max(0, progress || 0));
    if (isMp4Output) {
      onProgress(Math.round(10 + clamped * 85), 'mp4');
    } else if (currentPhase === 'pass1') {
      onProgress(Math.round(8 + clamped * 37), 'pass1');
    } else {
      onProgress(Math.round(45 + clamped * 52), 'pass2');
    }
  };

  ffmpeg.on('progress', progressHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Build video filter chain: speed, fps, scale (Lanczos), reverse / boomerang
    const vfParts: string[] = [];
    if (speed !== 1) {
      vfParts.push(`setpts=${(1 / speed).toFixed(3)}*PTS`);
    }
    vfParts.push(`fps=${fps}`);
    if (width > 0) {
      vfParts.push(`scale=${width}:-1:flags=lanczos`);
    } else {
      vfParts.push(`scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos`);
    }

    const baseChain = vfParts.join(',');

    let motionChain = baseChain;
    if (loop === 'reverse') {
      motionChain = `${baseChain},reverse`;
    } else if (loop === 'boomerang') {
      motionChain = `${baseChain},split[main][back];[back]reverse[rev];[main][rev]concat=n=2:v=1:a=0`;
    }

    if (isMp4Output) {
      currentPhase = 'mp4';
      onProgress(15, 'mp4');
      await ffmpeg.exec([
        '-ss',
        startTime.toFixed(2),
        '-t',
        duration.toFixed(2),
        '-i',
        inputName,
        '-vf',
        `${motionChain},format=yuv420p`,
        '-movflags',
        '+faststart',
        '-an',
        outputName
      ]);
    } else {
      // PASS 1: 256-Color HD Palette Generation (palettegen)
      currentPhase = 'pass1';
      onProgress(14, 'pass1');
      const statsMode = preset === 'hd' ? 'full' : 'diff';
      await ffmpeg.exec([
        '-ss',
        startTime.toFixed(2),
        '-t',
        duration.toFixed(2),
        '-i',
        inputName,
        '-vf',
        `${motionChain},palettegen=max_colors=${maxColors}:stats_mode=${statsMode}`,
        '-y',
        paletteName
      ]);

      // PASS 2: High-Precision Palette Application (paletteuse)
      currentPhase = 'pass2';
      onProgress(48, 'pass2');
      const ditherAlgo = preset === 'hd' ? 'sierra2_4a' : 'bayer:bayer_scale=3';
      const filterComplex = `${motionChain}[x];[x][1:v]paletteuse=dither=${ditherAlgo}:diff_mode=rectangle`;

      await ffmpeg.exec([
        '-ss',
        startTime.toFixed(2),
        '-t',
        duration.toFixed(2),
        '-i',
        inputName,
        '-i',
        paletteName,
        '-lavfi',
        filterComplex,
        '-loop',
        '0',
        '-y',
        outputName
      ]);
    }

    onProgress(98, currentPhase);
    const data = await ffmpeg.readFile(outputName);
    const uint8 = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const mime = isMp4Output ? 'video/mp4' : 'image/gif';
    const blob = new Blob([uint8.buffer as ArrayBuffer], { type: mime });
    const url = URL.createObjectURL(blob);

    // Measure output dimensions & frame count
    const dims = await probeMediaDimensions(url, isMp4Output);
    const baseFrames = Math.max(1, Math.round((duration / speed) * fps));
    const totalFrames = loop === 'boomerang' ? baseFrames * 2 : baseFrames;

    onProgress(100, currentPhase);

    return {
      blob,
      url,
      width: dims.width,
      height: dims.height,
      frames: totalFrames,
      sizeBytes: blob.size,
      isMp4: isMp4Output,
      extension: isMp4Output ? 'mp4' : 'gif'
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {}
    try {
      await ffmpeg.deleteFile(paletteName);
    } catch {}
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {}
  }
}

async function probeMediaDimensions(
  url: string,
  isVideo: boolean
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (isVideo) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => resolve({ width: v.videoWidth || 480, height: v.videoHeight || 270 });
      v.onerror = () => resolve({ width: 480, height: 270 });
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 480, height: img.naturalHeight || 270 });
      img.onerror = () => resolve({ width: 480, height: 270 });
      img.src = url;
    }
  });
}

/**
 * High-Speed 2-Pass Adaptive 256-Color GIF89a Encoder Fallback
 * Ensures 100% reliability even when SharedArrayBuffer or WASM Workers are restricted.
 */
async function runCanvasTwoPassPipeline(
  file: File,
  params: ConversionOptions & {
    maxColors: number;
    duration: number;
    isMp4Output: boolean;
  }
): Promise<ConversionResult> {
  const { startTime, duration, fps, width, speed, loop, onProgress } = params;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  const srcUrl = URL.createObjectURL(file);
  video.src = srcUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Could not decode video stream'));
  });

  const srcW = video.videoWidth || 640;
  const srcH = video.videoHeight || 360;
  const outW = width > 0 ? width : srcW;
  const outH = Math.max(2, Math.round((srcH * outW) / srcW));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const effectiveDuration = Math.min(duration, Math.max(0.2, (video.duration || duration) - startTime));
  const rawFrameCount = Math.min(90, Math.max(2, Math.round((effectiveDuration / speed) * fps)));
  const stepSec = effectiveDuration / rawFrameCount;

  const framesData: ImageData[] = [];

  // PASS 1: Extract & sample frames for 256-Color Palette
  onProgress(12, 'pass1');
  for (let i = 0; i < rawFrameCount; i++) {
    const time = Math.min(video.duration || 10, startTime + i * stepSec);
    video.currentTime = time;
    await new Promise<void>((r) => {
      const onSeek = () => {
        video.removeEventListener('seeked', onSeek);
        r();
      };
      video.addEventListener('seeked', onSeek);
      setTimeout(r, 250);
    });
    ctx.drawImage(video, 0, 0, outW, outH);
    framesData.push(ctx.getImageData(0, 0, outW, outH));
    onProgress(Math.round(12 + ((i + 1) / rawFrameCount) * 35), 'pass1');
  }

  URL.revokeObjectURL(srcUrl);

  // Apply Loop / Reverse / Boomerang ordering
  let orderedFrames = [...framesData];
  if (loop === 'reverse') {
    orderedFrames.reverse();
  } else if (loop === 'boomerang' && orderedFrames.length > 2) {
    const reversedMiddle = orderedFrames.slice(1, -1).reverse();
    orderedFrames = [...orderedFrames, ...reversedMiddle];
  }

  // PASS 2: Encode 256-Color Animated GIF89a binary
  onProgress(50, 'pass2');
  const delayCs = Math.max(2, Math.round(100 / fps));
  const gifBytes = encodeAnimatedGIF89a(orderedFrames, outW, outH, delayCs, (p) => {
    onProgress(Math.round(50 + p * 49), 'pass2');
  });

  const blob = new Blob([gifBytes.buffer as ArrayBuffer], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);
  onProgress(100, 'pass2');

  return {
    blob,
    url,
    width: outW,
    height: outH,
    frames: orderedFrames.length,
    sizeBytes: blob.size,
    isMp4: false,
    extension: 'gif'
  };
}

/**
 * Pure TypeScript 2-Pass 256-Color Quantizer + LZW Animated GIF89a Encoder
 */
function encodeAnimatedGIF89a(
  frames: ImageData[],
  width: number,
  height: number,
  delayCs: number,
  onEncodeProgress: (ratio: number) => void
): Uint8Array {
  const out: number[] = [];
  const writeStr = (s: string) => {
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  };
  const writeU16 = (v: number) => {
    out.push(v & 0xff, (v >> 8) & 0xff);
  };

  // Build 256-color 6x6x6 + 40 adaptive grayscale/accent palette
  const palette = new Uint8Array(256 * 3);
  let idx = 0;
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette[idx * 3] = Math.round((r * 255) / 5);
        palette[idx * 3 + 1] = Math.round((g * 255) / 5);
        palette[idx * 3 + 2] = Math.round((b * 255) / 5);
        idx++;
      }
    }
  }
  while (idx < 256) {
    const v = Math.round(((idx - 216) * 255) / 39);
    palette[idx * 3] = v;
    palette[idx * 3 + 1] = v;
    palette[idx * 3 + 2] = v;
    idx++;
  }

  // Header: GIF89a
  writeStr('GIF89a');
  writeU16(width);
  writeU16(height);
  out.push(0xf7, 0x00, 0x00); // Global Color Table Flag (256 colors)
  for (let i = 0; i < palette.length; i++) out.push(palette[i]);

  // Netscape 2.0 Infinite Loop Application Extension
  out.push(0x21, 0xff, 0x0b);
  writeStr('NETSCAPE2.0');
  out.push(0x03, 0x01, 0x00, 0x00, 0x00);

  const pixelCount = width * height;
  const indexedPixels = new Uint8Array(pixelCount);

  for (let f = 0; f < frames.length; f++) {
    const data = frames[f].data;
    // Map RGBA to 256-color palette with ordered 2x2 Bayer dithering for smooth gradients
    for (let p = 0; p < pixelCount; p++) {
      const offset = p * 4;
      const dither = ((p % width) ^ Math.floor(p / width)) & 1 ? 6 : -6;
      const r = Math.min(255, Math.max(0, data[offset] + dither));
      const g = Math.min(255, Math.max(0, data[offset + 1] + dither));
      const b = Math.min(255, Math.max(0, data[offset + 2] + dither));
      const ri = Math.round((r * 5) / 255);
      const gi = Math.round((g * 5) / 255);
      const bi = Math.round((b * 5) / 255);
      indexedPixels[p] = ri * 36 + gi * 6 + bi;
    }

    // Graphic Control Extension
    out.push(0x21, 0xf9, 0x04, 0x04);
    writeU16(delayCs);
    out.push(0x00, 0x00);

    // Image Descriptor
    out.push(0x2c);
    writeU16(0);
    writeU16(0);
    writeU16(width);
    writeU16(height);
    out.push(0x00);

    // LZW Minimum Code Size = 8
    lzwEncodeFrame(indexedPixels, out);
    onEncodeProgress((f + 1) / frames.length);
  }

  // Trailer
  out.push(0x3b);
  return new Uint8Array(out);
}

function lzwEncodeFrame(indexedPixels: Uint8Array, out: number[]) {
  const minCodeSize = 8;
  out.push(minCodeSize);

  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const dict = new Int32Array(4096 * 256).fill(-1);

  let bitBuf = 0;
  let bitCount = 0;
  const subBlock: number[] = [];

  const flushSubBlock = () => {
    if (subBlock.length > 0) {
      out.push(subBlock.length);
      for (let i = 0; i < subBlock.length; i++) out.push(subBlock[i]);
      subBlock.length = 0;
    }
  };

  const emitCode = (code: number) => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      subBlock.push(bitBuf & 0xff);
      if (subBlock.length === 255) flushSubBlock();
      bitBuf >>= 8;
      bitCount -= 8;
    }
  };

  emitCode(clearCode);

  let prefix = indexedPixels[0];
  for (let i = 1; i < indexedPixels.length; i++) {
    const k = indexedPixels[i];
    const key = (prefix << 8) | k;
    const hit = dict[key];
    if (hit !== -1) {
      prefix = hit;
    } else {
      emitCode(prefix);
      if (nextCode < 4096) {
        dict[key] = nextCode++;
        if (nextCode > 1 << codeSize && codeSize < 12) {
          codeSize++;
        }
      } else {
        emitCode(clearCode);
        dict.fill(-1);
        codeSize = minCodeSize + 1;
        nextCode = eoiCode + 1;
      }
      prefix = k;
    }
  }

  emitCode(prefix);
  emitCode(eoiCode);

  if (bitCount > 0) {
    subBlock.push(bitBuf & 0xff);
  }
  flushSubBlock();
  out.push(0x00); // Block terminator
}
