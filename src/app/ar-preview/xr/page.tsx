'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  recognizeArtwork,
  fetchAudio,
  fetchArtwork3DAssets,
  fetchArtistAvatar,
  fetchRecentArtworks,
  logRecognitionEvent,
} from './api';
import type {
  AppState,
  XRMode,
  FrameStyle,
  PlacedArtwork,
  AudioResponse,
  ArtistAvatar,
} from './types';
import styles from './xr.module.css';

// ============================================================
// Frame style definitions
// ============================================================
const FRAME_STYLES: FrameStyle[] = ['none', 'thin', 'gold', 'mat'];

const FRAME_COLORS: Record<FrameStyle, { color: string; width: number; outer?: { color: string; width: number } }> = {
  none: { color: 'transparent', width: 0 },
  thin: { color: '#1a1a1a', width: 0.01 },
  gold: { color: '#c9a227', width: 0.03 },
  mat: { color: '#f5f0e8', width: 0.06, outer: { color: '#1a1a1a', width: 0.002 } },
};

// ============================================================
// Headset SVG icon
// ============================================================
function HeadsetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="18" width="52" height="28" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="22" cy="32" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="42" cy="32" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M29 32h6" stroke="currentColor" strokeWidth="2" />
      <path d="M2 28v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M62 28v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================
// Main WebXR Page Component
// ============================================================
export default function WebXRPage() {
  const searchParams = useSearchParams();

  // Query params for preview mode
  const paramArtworkId = searchParams.get('artworkId');
  const paramImage = searchParams.get('image');
  const paramTitle = searchParams.get('title');
  const paramArtist = searchParams.get('artist');

  const isPreviewMode = !!(paramArtworkId || paramImage);

  // Core state
  const [appState, setAppState] = useState<AppState>('loading');
  const [xrMode, setXrMode] = useState<XRMode | null>(null);
  const [artwork, setArtwork] = useState<PlacedArtwork | null>(null);
  const [recognitionMethod, setRecognitionMethod] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio state
  const [audioType, setAudioType] = useState<'quick' | 'full' | 'artist_story'>('quick');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [avatarGreeting, setAvatarGreeting] = useState<string | null>(null);

  // VR menu state
  const [vrArtworks, setVrArtworks] = useState<Awaited<ReturnType<typeof fetchRecentArtworks>>>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const xrSessionRef = useRef<XRSession | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const xrRefSpaceRef = useRef<XRReferenceSpace | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioStartTimeRef = useRef<number>(0);
  const audioDurationRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const frameIdRef = useRef<number>(0);

  // ============================================================
  // Device detection
  // ============================================================
  useEffect(() => {
    async function detectXR() {
      if (!navigator.xr) {
        setAppState('unsupported');
        return;
      }
      const arSupported = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
      if (arSupported) {
        setXrMode('immersive-ar');
        setAppState('pre-session');
        return;
      }
      const vrSupported = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
      if (vrSupported) {
        setXrMode('immersive-vr');
        setAppState('pre-session');
        return;
      }
      setAppState('unsupported');
    }
    detectXR();
  }, []);

  // ============================================================
  // Cleanup on unmount
  // ============================================================
  useEffect(() => {
    return () => {
      if (xrSessionRef.current) {
        xrSessionRef.current.end().catch(() => {});
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  // ============================================================
  // Fetch 3D assets & avatar after artwork is known
  // ============================================================
  const loadArtworkExtras = useCallback(async (artworkId: string) => {
    const assets = await fetchArtwork3DAssets(artworkId);
    if (assets?.artist_avatar_id) {
      const avatar = await fetchArtistAvatar(assets.artist_avatar_id);
      if (avatar?.greeting_text) {
        setAvatarGreeting(avatar.greeting_text);
      }
      // TODO: If avatar.model_url exists, load and render 3D artist avatar
      // TODO: If avatar.voice_id exists, use it for personalized TTS
    }
  }, []);

  // ============================================================
  // Audio playback via Web Audio API
  // ============================================================
  const playAudio = useCallback(async (artworkId: string, type: 'quick' | 'full' | 'artist_story') => {
    try {
      // Stop any currently playing audio
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }

      setAudioType(type);
      setAudioPlaying(false);
      setAudioProgress(0);

      const response = await fetchAudio(artworkId, type);
      if (!response.success || !response.audio_url) {
        setAudioAvailable(false);
        return;
      }

      setAudioAvailable(true);

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;

      const audioRes = await fetch(response.audio_url);
      const arrayBuffer = await audioRes.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      audioSourceRef.current = source;
      audioStartTimeRef.current = ctx.currentTime;
      audioDurationRef.current = audioBuffer.duration;
      setAudioPlaying(true);

      source.onended = () => {
        setAudioPlaying(false);
        setAudioProgress(1);
        audioSourceRef.current = null;
      };
    } catch {
      setAudioAvailable(false);
    }
  }, []);

  // Audio progress tracking
  useEffect(() => {
    if (!audioPlaying) return;
    let raf: number;
    function tick() {
      if (audioContextRef.current && audioDurationRef.current > 0) {
        const elapsed = audioContextRef.current.currentTime - audioStartTimeRef.current;
        setAudioProgress(Math.min(elapsed / audioDurationRef.current, 1));
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioPlaying]);

  const toggleAudioPause = useCallback(() => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
      setAudioPlaying(false);
    } else {
      audioContextRef.current.resume();
      setAudioPlaying(true);
    }
  }, []);

  // ============================================================
  // WebGL helpers — flat textured quads
  // ============================================================
  function initGL(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
    const gl = canvas.getContext('webgl', { xrCompatible: true }) as WebGLRenderingContext | null;
    if (!gl) return null;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return gl;
  }

  function createShaderProgram(gl: WebGLRenderingContext): WebGLProgram | null {
    const vsSource = `
      attribute vec4 aPosition;
      attribute vec2 aTexCoord;
      uniform mat4 uProjection;
      uniform mat4 uView;
      uniform mat4 uModel;
      varying vec2 vTexCoord;
      void main() {
        gl_Position = uProjection * uView * uModel * aPosition;
        vTexCoord = aTexCoord;
      }
    `;
    const fsSource = `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D uTexture;
      uniform float uOpacity;
      uniform bool uUseColor;
      uniform vec4 uColor;
      void main() {
        if (uUseColor) {
          gl_FragColor = uColor * uOpacity;
        } else {
          gl_FragColor = texture2D(uTexture, vTexCoord) * uOpacity;
        }
      }
    `;
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    return prog;
  }

  function createQuadBuffers(gl: WebGLRenderingContext) {
    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
    ]), gl.STATIC_DRAW);
    const texBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1, 1, 1, 1, 0, 0, 0,
    ]), gl.STATIC_DRAW);
    const idxBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    return { posBuf, texBuf, idxBuf };
  }

  function loadTexture(gl: WebGLRenderingContext, url: string): Promise<WebGLTexture> {
    return new Promise((resolve, reject) => {
      const tex = gl.createTexture()!;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        resolve(tex);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Simple 4x4 matrix helpers (column-major)
  function mat4Identity(): Float32Array {
    const m = new Float32Array(16);
    m[0] = m[5] = m[10] = m[15] = 1;
    return m;
  }

  function mat4Translate(out: Float32Array, x: number, y: number, z: number) {
    const m = mat4Identity();
    m[12] = x; m[13] = y; m[14] = z;
    mat4Multiply(out, out, m);
  }

  function mat4RotateY(out: Float32Array, rad: number) {
    const m = mat4Identity();
    const c = Math.cos(rad), s = Math.sin(rad);
    m[0] = c; m[2] = s; m[8] = -s; m[10] = c;
    mat4Multiply(out, out, m);
  }

  function mat4Scale(out: Float32Array, sx: number, sy: number, sz: number) {
    const m = mat4Identity();
    m[0] = sx; m[5] = sy; m[10] = sz;
    mat4Multiply(out, out, m);
  }

  function mat4Multiply(out: Float32Array, a: Float32Array, b: Float32Array) {
    const r = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        r[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] +
          a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
      }
    }
    out.set(r);
  }

  // ============================================================
  // Draw a quad with given program, buffers, transform, texture/color
  // ============================================================
  function drawQuad(
    gl: WebGLRenderingContext,
    prog: WebGLProgram,
    buffers: ReturnType<typeof createQuadBuffers>,
    projection: Float32Array,
    view: Float32Array,
    model: Float32Array,
    texture: WebGLTexture | null,
    opacity: number,
    color?: [number, number, number, number],
  ) {
    gl.useProgram(prog);

    const aPos = gl.getAttribLocation(prog, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.posBuf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    const aTex = gl.getAttribLocation(prog, 'aTexCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texBuf);
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uProjection'), false, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uView'), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uModel'), false, model);
    gl.uniform1f(gl.getUniformLocation(prog, 'uOpacity'), opacity);

    if (color) {
      gl.uniform1i(gl.getUniformLocation(prog, 'uUseColor'), 1);
      gl.uniform4fv(gl.getUniformLocation(prog, 'uColor'), color);
    } else {
      gl.uniform1i(gl.getUniformLocation(prog, 'uUseColor'), 0);
      if (texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(prog, 'uTexture'), 0);
      }
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.idxBuf);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  // ============================================================
  // Render frame border quads behind the artwork
  // ============================================================
  function drawFrame(
    gl: WebGLRenderingContext,
    prog: WebGLProgram,
    buffers: ReturnType<typeof createQuadBuffers>,
    projection: Float32Array,
    view: Float32Array,
    baseModel: Float32Array,
    frameStyle: FrameStyle,
    artWidth: number,
    artHeight: number,
  ) {
    const f = FRAME_COLORS[frameStyle];
    if (f.width === 0) return;

    // Parse hex color
    function hexToGL(hex: string): [number, number, number, number] {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b, 1];
    }

    // Outer border (for mat style)
    if (f.outer) {
      const outerW = artWidth + (f.width + f.outer.width) * 2;
      const outerH = artHeight + (f.width + f.outer.width) * 2;
      const model = mat4Identity();
      model.set(baseModel);
      mat4Translate(model, 0, 0, -0.002);
      mat4Scale(model, outerW, outerH, 1);
      drawQuad(gl, prog, buffers, projection, view, model, null, 1, hexToGL(f.outer.color));
    }

    // Main frame
    const fw = artWidth + f.width * 2;
    const fh = artHeight + f.width * 2;
    const model = mat4Identity();
    model.set(baseModel);
    mat4Translate(model, 0, 0, -0.001);
    mat4Scale(model, fw, fh, 1);
    drawQuad(gl, prog, buffers, projection, view, model, null, 1, hexToGL(f.color));
  }

  // ============================================================
  // Draw reticle (gold ring) at hit-test position
  // ============================================================
  function drawReticle(
    gl: WebGLRenderingContext,
    prog: WebGLProgram,
    buffers: ReturnType<typeof createQuadBuffers>,
    projection: Float32Array,
    view: Float32Array,
    hitMatrix: Float32Array,
  ) {
    // Outer ring
    const outerModel = mat4Identity();
    outerModel.set(hitMatrix);
    mat4Scale(outerModel, 0.15, 0.15, 1);
    drawQuad(gl, prog, buffers, projection, view, outerModel, null, 0.6, [0.788, 0.635, 0.153, 1]);

    // Inner cutout (black to simulate ring)
    const innerModel = mat4Identity();
    innerModel.set(hitMatrix);
    mat4Scale(innerModel, 0.12, 0.12, 1);
    mat4Translate(innerModel, 0, 0, 0.001);
    drawQuad(gl, prog, buffers, projection, view, innerModel, null, 1, [0, 0, 0, 0.01]);
  }

  // ============================================================
  // Start XR session
  // ============================================================
  const startXRSession = useCallback(async () => {
    if (!navigator.xr || !xrMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = initGL(canvas);
    if (!gl) return;
    glRef.current = gl;

    const prog = createShaderProgram(gl);
    if (!prog) return;
    const buffers = createQuadBuffers(gl);

    // XR session options
    const isAR = xrMode === 'immersive-ar';
    const sessionInit: XRSessionInit = isAR
      ? {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['anchors', 'hand-tracking', 'local-floor', 'dom-overlay'],
          domOverlay: overlayRef.current ? { root: overlayRef.current } : undefined,
        }
      : {
          requiredFeatures: ['local-floor'],
          optionalFeatures: ['dom-overlay'],
          domOverlay: overlayRef.current ? { root: overlayRef.current } : undefined,
        };

    let session: XRSession;
    try {
      session = await navigator.xr.requestSession(xrMode, sessionInit);
    } catch {
      setErrorMsg('Failed to start XR session. Please try again.');
      return;
    }
    xrSessionRef.current = session;

    await gl.makeXRCompatible();
    const baseLayer = new XRWebGLLayer(session, gl);
    await session.updateRenderState({ baseLayer });

    const refSpaceType = isAR ? 'local-floor' : 'local-floor';
    const refSpace = await session.requestReferenceSpace(refSpaceType).catch(
      () => session.requestReferenceSpace('local'),
    );
    xrRefSpaceRef.current = refSpace;

    // Hit test source for AR
    let hitTestSource: XRHitTestSource | null = null;
    if (isAR) {
      try {
        const viewerSpace = await session.requestReferenceSpace('viewer');
        hitTestSource = await session.requestHitTestSource!({ space: viewerSpace });
        hitTestSourceRef.current = hitTestSource;
      } catch {
        // Hit-test not available
      }
    }

    // Artwork state for XR render loop
    let artworkTexture: WebGLTexture | null = null;
    let placed = false;
    let ghostOpacity = 0.5;
    let hitPose: XRPose | null = null;
    let artPos = { x: 0, y: 1.5, z: -2 };
    let artRotation = 0;
    let artScale = 1;
    let currentFrameStyle: FrameStyle = 'none';
    let frameStyleIdx = 0;

    // Load artwork texture if image URL available
    const imageUrl = artwork?.image_url || paramImage;
    if (imageUrl) {
      try {
        artworkTexture = await loadTexture(gl, imageUrl);
      } catch {
        // Texture load failed — we'll render without it
      }
    }

    // If in VR mode with artwork specified, auto-place
    if (!isAR && artwork) {
      placed = true;
      ghostOpacity = 1;
      artPos = { x: 0, y: 1.5, z: -2 };
      setAppState('placed');
      if (artwork.id) {
        playAudio(artwork.id, 'quick');
        loadArtworkExtras(artwork.id);
      }
    }

    // If in AR scan mode
    if (isAR && !isPreviewMode && !artwork) {
      setAppState('scan');
    } else if (artwork) {
      setAppState(placed ? 'placed' : 'place');
    }

    // Input handling
    session.addEventListener('selectstart', () => {
      if (appState === 'scan' || appState === 'recognizing') {
        // Capture frame for recognition — handled separately
        return;
      }
      if (!placed && hitPose) {
        // Place artwork at hit-test position
        const t = hitPose.transform.position;
        artPos = { x: t.x, y: t.y, z: t.z };
        placed = true;
        ghostOpacity = 1;
        setAppState('placed');
        if (artwork?.id) {
          playAudio(artwork.id, 'quick');
          loadArtworkExtras(artwork.id);
        }
      }
    });

    session.addEventListener('select', () => {
      if (appState === 'scan') {
        handleScanCapture(gl, baseLayer, session);
      }
    });

    session.addEventListener('squeezestart', () => {
      // Grip: start grab for reposition (simplified — continuous reposition)
    });

    // Input source changes (gamepad)
    session.addEventListener('inputsourceschange', () => {});

    // Session end handler
    session.addEventListener('end', () => {
      xrSessionRef.current = null;
      hitTestSourceRef.current = null;
      xrRefSpaceRef.current = null;
      setAppState('pre-session');
    });

    // Frame capture for scan mode
    async function handleScanCapture(
      captureGL: WebGLRenderingContext,
      layer: XRWebGLLayer,
      sess: XRSession,
    ) {
      setAppState('recognizing');
      try {
        // Capture current WebGL framebuffer as base64
        const fb = layer.framebuffer;
        captureGL.bindFramebuffer(captureGL.FRAMEBUFFER, fb);
        const w = layer.framebufferWidth;
        const h = layer.framebufferHeight;
        const pixels = new Uint8Array(w * h * 4);
        captureGL.readPixels(0, 0, w, h, captureGL.RGBA, captureGL.UNSIGNED_BYTE, pixels);

        // Create canvas to convert to base64
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = w;
        captureCanvas.height = h;
        const ctx2d = captureCanvas.getContext('2d')!;
        const imgData = ctx2d.createImageData(w, h);
        // Flip Y (WebGL is bottom-up)
        for (let row = 0; row < h; row++) {
          const srcOff = (h - row - 1) * w * 4;
          const dstOff = row * w * 4;
          imgData.data.set(pixels.subarray(srcOff, srcOff + w * 4), dstOff);
        }
        ctx2d.putImageData(imgData, 0, 0);
        const base64 = captureCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        const result = await recognizeArtwork(base64);

        if (result.success && result.artwork && result.confidence >= 0.5) {
          const a = result.artwork;
          setArtwork({
            id: a.id,
            title: a.title,
            artist_name: a.artist_name,
            year: a.year,
            description: a.description,
            compact_description: a.compact_description,
            audio_url: a.audio_url,
            frameStyle: 'none',
            position: { x: 0, y: 1.5, z: -2 },
            rotation: 0,
            scale: 1,
          });
          setRecognitionMethod(result.method || null);
          setConfidence(result.confidence);
          setAppState('place');

          // Fire-and-forget recognition event
          logRecognitionEvent(
            a.id,
            result.method || 'ai_vision',
            result.confidence,
            sessionIdRef.current,
          );
        } else {
          setErrorMsg('Not recognised — try again');
          setAppState('scan');
          setTimeout(() => setErrorMsg(null), 3000);
        }
      } catch {
        setErrorMsg('Recognition failed — try again');
        setAppState('scan');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    }

    // ============================================================
    // XR render loop
    // ============================================================
    function onXRFrame(time: DOMHighResTimeStamp, frame: XRFrame) {
      if (!gl || !prog) return;
      const sess = frame.session;
      frameIdRef.current = sess.requestAnimationFrame(onXRFrame);

      const glLayer = sess.renderState.baseLayer;
      if (!glLayer || !xrRefSpaceRef.current) return;

      const pose = frame.getViewerPose(xrRefSpaceRef.current);
      if (!pose) return;

      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
      gl.viewport(0, 0, glLayer.framebufferWidth, glLayer.framebufferHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Process gamepad input for placed artwork
      for (const source of sess.inputSources) {
        if (source.gamepad && placed) {
          const axes = source.gamepad.axes;
          // Thumbstick Y: scale
          if (Math.abs(axes[3]) > 0.1) {
            artScale = Math.max(0.2, Math.min(3, artScale + axes[3] * -0.02));
          }
          // Thumbstick X: rotate
          if (Math.abs(axes[2]) > 0.1) {
            artRotation += axes[2] * 0.03;
          }
          // B/Y button: cycle frame style
          const buttons = source.gamepad.buttons;
          if (buttons[5]?.pressed) {
            frameStyleIdx = (frameStyleIdx + 1) % FRAME_STYLES.length;
            currentFrameStyle = FRAME_STYLES[frameStyleIdx];
          }
        }
      }

      for (const view of pose.views) {
        const vp = glLayer.getViewport(view);
        if (vp) gl.viewport(vp.x, vp.y, vp.width, vp.height);

        const projection = view.projectionMatrix;
        const viewMatrix = view.transform.inverse.matrix;

        // Hit-test (AR mode)
        if (hitTestSource && !placed) {
          const hitResults = frame.getHitTestResults(hitTestSource);
          if (hitResults.length > 0) {
            const hitResult = hitResults[0];
            hitPose = hitResult.getPose(xrRefSpaceRef.current!);
            if (hitPose) {
              drawReticle(gl, prog, buffers, projection, viewMatrix, new Float32Array(hitPose.transform.matrix));

              // Ghost artwork preview at hit position
              if (artworkTexture) {
                const ghostModel = mat4Identity();
                ghostModel.set(new Float32Array(hitPose.transform.matrix));
                mat4RotateY(ghostModel, artRotation);
                mat4Scale(ghostModel, artScale, artScale * 0.75, 1);
                drawQuad(gl, prog, buffers, projection, viewMatrix, ghostModel, artworkTexture, ghostOpacity);
              }
            }
          }
        }

        // Render placed artwork
        if (placed && artworkTexture) {
          const artModel = mat4Identity();
          mat4Translate(artModel, artPos.x, artPos.y, artPos.z);
          mat4RotateY(artModel, artRotation);

          const artW = artScale;
          const artH = artScale * 0.75; // Assume ~4:3 aspect

          // Draw frame behind artwork
          const frameModel = mat4Identity();
          mat4Translate(frameModel, artPos.x, artPos.y, artPos.z);
          mat4RotateY(frameModel, artRotation);
          drawFrame(gl, prog, buffers, projection, viewMatrix, frameModel, currentFrameStyle, artW, artH);

          // Draw artwork
          const imgModel = mat4Identity();
          mat4Translate(imgModel, artPos.x, artPos.y, artPos.z);
          mat4RotateY(imgModel, artRotation);
          mat4Scale(imgModel, artW, artH, 1);
          drawQuad(gl, prog, buffers, projection, viewMatrix, imgModel, artworkTexture, 1);
        }

        // VR mode: render artwork 2m in front if placed (no texture)
        if (placed && !artworkTexture) {
          const placeholderModel = mat4Identity();
          mat4Translate(placeholderModel, artPos.x, artPos.y, artPos.z);
          mat4RotateY(placeholderModel, artRotation);
          mat4Scale(placeholderModel, artScale, artScale * 0.75, 1);
          drawQuad(gl, prog, buffers, projection, viewMatrix, placeholderModel, null, 0.8, [0.15, 0.15, 0.15, 1]);
        }
      }
    }

    session.requestAnimationFrame(onXRFrame);
  }, [xrMode, artwork, isPreviewMode, paramImage, appState, playAudio, loadArtworkExtras]);

  // ============================================================
  // Preview mode: build artwork from query params
  // ============================================================
  useEffect(() => {
    if (!isPreviewMode || artwork) return;
    if (paramArtworkId || paramTitle) {
      setArtwork({
        id: paramArtworkId || '',
        title: paramTitle || 'Untitled',
        artist_name: paramArtist || 'Unknown Artist',
        year: '',
        description: '',
        compact_description: '',
        audio_url: '',
        image_url: paramImage || undefined,
        frameStyle: 'none',
        position: { x: 0, y: 1.5, z: -2 },
        rotation: 0,
        scale: 1,
      });
    }
  }, [isPreviewMode, paramArtworkId, paramImage, paramTitle, paramArtist, artwork]);

  // ============================================================
  // VR mode: load recent artworks for menu
  // ============================================================
  useEffect(() => {
    if (xrMode === 'immersive-vr' && !isPreviewMode && appState === 'pre-session') {
      fetchRecentArtworks(6).then(setVrArtworks);
    }
  }, [xrMode, isPreviewMode, appState]);

  // ============================================================
  // Handle VR menu selection
  // ============================================================
  const selectVrArtwork = useCallback((a: typeof vrArtworks[0]) => {
    setArtwork({
      id: a.id,
      title: a.title,
      artist_name: a.artist_name,
      year: a.year || '',
      description: a.description,
      compact_description: a.compact_description,
      audio_url: a.audio_url || '',
      image_url: a.image_url || undefined,
      frameStyle: 'none',
      position: { x: 0, y: 1.5, z: -2 },
      rotation: 0,
      scale: 1,
    });
  }, []);

  // ============================================================
  // Render
  // ============================================================

  // Loading state
  if (appState === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // Unsupported state
  if (appState === 'unsupported') {
    return (
      <div className={styles.container}>
        <div className={styles.unsupported}>
          <HeadsetIcon className={styles.headsetIcon} />
          <h1>WebXR Not Available</h1>
          <p>
            This experience requires a Meta Quest headset with WebXR support.
            Open this page in the Meta Quest Browser on Quest 2, 3, or Pro.
          </p>
          <div className={styles.linkRow}>
            <a
              href="https://www.meta.com/experiences/1916519981771802/"
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Meta Quest Browser
            </a>
            <a href="/ar-preview" className={styles.link}>
              Back to AR Preview
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Pre-session screen
  if (appState === 'pre-session') {
    const isAR = xrMode === 'immersive-ar';

    return (
      <div className={styles.container}>
        <div className={styles.preSession}>
          <span className={`${styles.badge} ${isAR ? styles.badgeMR : styles.badgeVR}`}>
            {isAR ? 'Mixed Reality' : 'VR Mode'}
          </span>
          <h1>WebXR Art Preview</h1>
          <p>
            {isAR
              ? 'Scan a physical artwork or browse the gallery to place art on your walls with surface detection.'
              : 'Browse the gallery and view artwork in a virtual space.'}
          </p>

          {/* VR mode without artwork: show gallery menu */}
          {!isAR && !isPreviewMode && vrArtworks.length > 0 && (
            <div className={styles.vrMenu}>
              <h2 className={styles.vrMenuTitle}>Select Artwork</h2>
              {vrArtworks.map((a) => (
                <button
                  key={a.id}
                  className={styles.vrMenuItem}
                  onClick={() => {
                    selectVrArtwork(a);
                    startXRSession();
                  }}
                >
                  <p className={styles.vrMenuItemTitle}>{a.title}</p>
                  <p className={styles.vrMenuItemArtist}>{a.artist_name}</p>
                </button>
              ))}
            </div>
          )}

          {/* AR mode or preview mode: action buttons */}
          {(isAR || isPreviewMode) && (
            <>
              <button className={styles.btnPrimary} onClick={startXRSession}>
                {isAR && !isPreviewMode ? 'Scan Artwork' : 'Enter XR'}
              </button>
              {isAR && !isPreviewMode && (
                <a href="/gallery?xr=1" className={styles.btnSecondary}>
                  Browse Gallery
                </a>
              )}
            </>
          )}

          {/* VR mode with no artworks and no preview */}
          {!isAR && !isPreviewMode && vrArtworks.length === 0 && (
            <button className={styles.btnPrimary} onClick={startXRSession}>
              Enter VR
            </button>
          )}
        </div>
      </div>
    );
  }

  // XR active states (scan, recognizing, place, placed, vr-menu)
  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.xrCanvas} />

      {/* DOM Overlay for in-XR UI */}
      <div ref={overlayRef} className={styles.overlay}>
        {/* Top area */}
        <div className={styles.overlayTop}>
          {/* Mode badge */}
          <span className={`${styles.badge} ${xrMode === 'immersive-ar' ? styles.badgeMR : styles.badgeVR}`}>
            {xrMode === 'immersive-ar' ? 'Mixed Reality' : 'VR Mode'}
          </span>

          {/* Debug badge for recognition method */}
          {recognitionMethod && confidence < 1.0 && (
            <span className={`${styles.badge} ${styles.badgeDebug}`}>
              {recognitionMethod} ({(confidence * 100).toFixed(0)}%)
            </span>
          )}

          {/* Scan state */}
          {appState === 'scan' && (
            <>
              <div className={styles.scanFrame} />
              <div className={styles.overlayHint}>
                Point at the artwork label or face
              </div>
            </>
          )}

          {/* Recognizing state */}
          {appState === 'recognizing' && (
            <div className={`${styles.overlayHint} ${styles.recognizing}`}>
              Recognising...
            </div>
          )}

          {/* Place mode hint */}
          {appState === 'place' && (
            <div className={styles.overlayHint}>
              Point at a surface and pinch or press trigger to place
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className={styles.overlayHint} style={{ borderColor: '#f44336', color: '#f44336' }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Bottom area — info panel & audio */}
        <div className={styles.overlayBottom}>
          {/* Info panel after placement */}
          {appState === 'placed' && artwork && (
            <div className={styles.infoPanel}>
              <h2>{artwork.title}</h2>
              <p className={styles.infoPanelMeta}>
                {artwork.artist_name}
                {artwork.year ? ` \u00B7 ${artwork.year}` : ''}
              </p>
              {artwork.compact_description && (
                <p className={styles.infoPanelDesc}>{artwork.compact_description}</p>
              )}
              {avatarGreeting && (
                <p className={styles.infoPanelGreeting}>&ldquo;{avatarGreeting}&rdquo;</p>
              )}
            </div>
          )}

          {/* Audio controls after placement */}
          {appState === 'placed' && artwork && audioAvailable && (
            <div className={styles.audioControls}>
              <button
                className={`${styles.audioBtn} ${audioType === 'quick' ? styles.audioBtnActive : ''}`}
                onClick={() => artwork.id && playAudio(artwork.id, 'quick')}
              >
                Quick
              </button>
              <button
                className={`${styles.audioBtn} ${audioType === 'full' ? styles.audioBtnActive : ''}`}
                onClick={() => artwork.id && playAudio(artwork.id, 'full')}
              >
                Full
              </button>
              <button
                className={`${styles.audioBtn} ${audioType === 'artist_story' ? styles.audioBtnActive : ''}`}
                onClick={() => artwork.id && playAudio(artwork.id, 'artist_story')}
              >
                Artist Story
              </button>
              <button className={styles.audioBtn} onClick={toggleAudioPause}>
                {audioPlaying ? 'Pause' : 'Play'}
              </button>
              <div className={styles.audioProgress}>
                <div
                  className={styles.audioProgressFill}
                  style={{ width: `${audioProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
