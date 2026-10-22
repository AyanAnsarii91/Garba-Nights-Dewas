import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

const REAR_CAMERA_LABEL = /(back|rear|environment|world)/i;
const READER_ID = "garbapass-camera-reader";
const QR_CONFIG = {
  fps: 10,
  qrbox: (width, height) => {
    const size = Math.min(width, height, 280);
    return { width: size, height: size };
  },
};

const describeCameraError = (error) => {
  if (!window.isSecureContext) {
    return "Camera access requires a secure connection. Use HTTPS or localhost.";
  }

  if (
    error?.name === "NotAllowedError" ||
    error?.name === "PermissionDeniedError" ||
    /permission|denied/i.test(error?.message || "")
  ) {
    return "Camera permission was denied. Allow camera access in your browser settings and try again.";
  }

  if (
    error?.name === "NotFoundError" ||
    /no camera/i.test(error?.message || "")
  ) {
    return "No camera was found. Connect a camera or use scanner input instead.";
  }

  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return "The camera is unavailable or being used by another app. Close other camera apps and try again.";
  }

  return (
    error?.message || "Unable to start the camera. Use scanner input instead."
  );
};

const chooseRearCamera = (cameras) =>
  cameras.find((camera) => REAR_CAMERA_LABEL.test(camera.label)) || cameras[0];

export default function AdminCameraScanner({ onDetected, onUseManual }) {
  const scannerRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const activeRef = useRef(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [starting, setStarting] = useState(true);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let active = true;
    let scannerStarted = false;
    activeRef.current = true;
    const scanner = new Html5Qrcode(READER_ID, { verbose: false });
    scannerRef.current = scanner;

    const startScanner = async (cameraId) => {
      await scanner.start(
        cameraId,
        QR_CONFIG,
        (decodedText) => {
          if (active) {
            onDetectedRef.current(decodedText);
          }
        },
        () => {},
      );
      scannerStarted = true;

      if (!active) {
        await scanner.stop();
        scannerStarted = false;
        scanner.clear();
      }
    };

    const initializeCamera = async () => {
      try {
        if (!window.isSecureContext) {
          throw new Error(
            "Camera access requires a secure connection. Use HTTPS or localhost.",
          );
        }

        const availableCameras = await Html5Qrcode.getCameras();

        if (!active) return;

        if (availableCameras.length === 0) {
          throw new Error("No camera was found on this device.");
        }

        const rearCamera = availableCameras.find((camera) =>
          REAR_CAMERA_LABEL.test(camera.label),
        );
        await startScanner(
          rearCamera?.id || { facingMode: { ideal: "environment" } },
        );

        const camerasWithLabels = await Html5Qrcode.getCameras();

        if (active) {
          const detectedCameraId = scanner.getRunningTrackSettings().deviceId;
          const cameraList = camerasWithLabels.length
            ? camerasWithLabels
            : availableCameras;
          const preferredCamera = chooseRearCamera(cameraList);
          setCameras(cameraList);
          setSelectedCameraId(detectedCameraId || preferredCamera.id);
        }
      } catch (error) {
        if (active) {
          console.error("Camera scanner error:", error);
          setCameraError(describeCameraError(error));
        }
      } finally {
        if (active) {
          setStarting(false);
        }
      }
    };

    initializeCamera();

    return () => {
      active = false;
      activeRef.current = false;
      scannerRef.current = null;

      if (scannerStarted) {
        const stopScanner = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (error) {
            console.error("Unable to stop camera scanner:", error);
          } finally {
            scanner.clear();
          }
        };

        stopScanner();
      }
    };
  }, []);

  const changeCamera = async (event) => {
    const cameraId = event.target.value;
    const scanner = scannerRef.current;

    if (!scanner || !cameraId || cameraId === selectedCameraId) return;

    setStarting(true);
    setCameraError("");

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      if (!activeRef.current) return;

      await scanner.start(
        cameraId,
        QR_CONFIG,
        (decodedText) => onDetectedRef.current(decodedText),
        () => {},
      );
      if (activeRef.current) {
        setSelectedCameraId(cameraId);
      }
    } catch (error) {
      if (activeRef.current) {
        console.error("Camera switch error:", error);
        setCameraError(describeCameraError(error));
      }
    } finally {
      if (activeRef.current) {
        setStarting(false);
      }
    }
  };

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-slate-950">
        <div
          id={READER_ID}
          className="min-h-[300px] w-full [&_video]:max-h-[65vh] [&_video]:object-cover"
        />
      </div>

      {cameraError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <AlertTriangle size={19} className="mt-0.5 shrink-0" />
          <p>{cameraError}</p>
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
          {starting ? (
            <Camera size={17} className="animate-pulse text-cyan-600" />
          ) : (
            <Camera size={17} className="text-emerald-600" />
          )}
          {starting
            ? "Requesting camera access and starting preview..."
            : "Camera is ready. Point it at the customer’s ticket QR code."}
        </p>
      )}

      {cameras.length > 1 && (
        <label className="block text-sm font-semibold text-slate-700">
          Camera
          <select
            value={selectedCameraId}
            onChange={changeCamera}
            disabled={starting}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 disabled:opacity-60"
          >
            {cameras.map((camera, index) => (
              <option key={camera.id} value={camera.id}>
                {camera.label ||
                  (index === 0 ? "Camera 1" : `Camera ${index + 1}`)}
                {REAR_CAMERA_LABEL.test(camera.label) ? " (rear)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-slate-500">
          Camera access works on HTTPS sites and localhost. You can continue
          with a USB/Bluetooth scanner if camera access is unavailable.
        </p>
        <button
          type="button"
          onClick={onUseManual}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
        >
          <CameraOff size={16} />
          Use scanner input
        </button>
      </div>
    </section>
  );
}
