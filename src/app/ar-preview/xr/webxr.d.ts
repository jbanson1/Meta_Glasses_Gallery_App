// WebXR type declarations for TypeScript
// These supplement the DOM types with WebXR API definitions

interface XRSystem {
  isSessionSupported(mode: string): Promise<boolean>;
  requestSession(mode: string, options?: XRSessionInit): Promise<XRSession>;
}

interface XRSessionInit {
  requiredFeatures?: string[];
  optionalFeatures?: string[];
  domOverlay?: { root: Element };
}

interface XRSession extends EventTarget {
  renderState: XRRenderState;
  inputSources: XRInputSourceArray;
  requestAnimationFrame(callback: XRFrameRequestCallback): number;
  requestReferenceSpace(type: string): Promise<XRReferenceSpace>;
  requestHitTestSource?(options: { space: XRSpace }): Promise<XRHitTestSource>;
  updateRenderState(state: { baseLayer: XRWebGLLayer }): Promise<void>;
  end(): Promise<void>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface XRRenderState {
  baseLayer?: XRWebGLLayer;
}

interface XRInputSourceArray extends Array<XRInputSource> {}

interface XRInputSource {
  gamepad?: Gamepad;
  handedness: string;
  targetRayMode: string;
  targetRaySpace: XRSpace;
  gripSpace?: XRSpace;
}

interface XRFrame {
  session: XRSession;
  getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
  getHitTestResults(hitTestSource: XRHitTestSource): XRHitTestResult[];
}

interface XRViewerPose {
  views: XRView[];
  transform: XRRigidTransform;
}

interface XRView {
  eye: string;
  projectionMatrix: Float32Array;
  transform: XRRigidTransform;
}

interface XRRigidTransform {
  position: DOMPointReadOnly;
  orientation: DOMPointReadOnly;
  matrix: Float32Array;
  inverse: XRRigidTransform;
}

interface XRSpace {}

interface XRReferenceSpace extends XRSpace {}

interface XRHitTestSource {}

interface XRHitTestResult {
  getPose(baseSpace: XRReferenceSpace): XRPose | null;
}

interface XRPose {
  transform: XRRigidTransform;
}

interface XRWebGLLayer {
  framebuffer: WebGLFramebuffer;
  framebufferWidth: number;
  framebufferHeight: number;
  getViewport(view: XRView): { x: number; y: number; width: number; height: number } | null;
}

declare const XRWebGLLayer: {
  new (session: XRSession, gl: WebGLRenderingContext): XRWebGLLayer;
};

type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;

interface Navigator {
  xr?: XRSystem;
}

interface WebGLRenderingContext {
  makeXRCompatible(): Promise<void>;
}

// CSS module declarations
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
