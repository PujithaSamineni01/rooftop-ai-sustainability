import React, { useRef, useState, useEffect } from "react";
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from "@ionic/react";
import { cameraOutline, trashOutline, locateOutline } from "ionicons/icons";
import axios from "axios";
import { useHistory } from "react-router-dom";

export default function UploadForm() {
  const history = useHistory();

  // -------- FILE PICKER REF (for onClick Choose Photo) --------
  const fileInputRef = useRef(null);
  const openFilePicker = () => fileInputRef.current?.click();

  // -------- STATE: Image and Preview --------
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // -------- FORM FIELDS --------
  const [location, setLocation] = useState("");
  const [area, setArea] = useState(25);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  // NEW FIELDS
  const [roofType, setRoofType] = useState("concrete");
  const [roofSlope, setRoofSlope] = useState("flat");
  const [accessibility, setAccessibility] = useState("stairs");
  const [shared, setShared] = useState(false);

  // Obstacles
  const [obstacles, setObstacles] = useState("");

  // Loading state
  const [loading, setLoading] = useState(false);

  // -------- CAMERA --------
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopCamera();
    };
  }, [previewUrl]);

  const setFileAndPreview = (file) => {
    setPhotoFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setFileAndPreview(f);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera not supported in this browser/device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOpen(true);
    } catch (err) {
      console.error(err);
      alert("Unable to open camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const f = new File([blob], `capture_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setFileAndPreview(f);
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  // -------- AUTOFILL LOCATION --------
  const fillLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not available.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLon(String(pos.coords.longitude));
      },
      (err) => {
        alert("Location error: " + err.message);
      }
    );
  };

  const removePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoFile(null);
  };

  // -------- BUTTON STYLES --------
  const primaryButtonStyle = {
    "--background": "#2e86de",
    "--background-hover": "#2569b8",
    "--background-activated": "#1b66b5",
    "--color": "#ffffff",
    "--border-radius": "8px",
    boxShadow: "0 6px 18px rgba(46,134,222,0.18)",
    fontWeight: 700,
  };

  const outlineButtonStyle = {
    "--border-radius": "8px",
    fontWeight: 700,
  };

  // -------- SUBMIT --------
  const onSubmit = async (e) => {
    e.preventDefault();
    // Validation
    if (!photoFile) {
      alert("Please choose or capture a rooftop image.");
      return;
    }
    if (!roofType) {
      alert("Please select a roof type.");
      return;
    }
    if (!area || isNaN(Number(area)) || Number(area) <= 0) {
      alert("Please enter a valid area in sqm.");
      return;
    }

    // Convert area from sqm to sqft (1 sqm = 10.7639 sqft)
    const areaSqft = Number(area) * 10.7639;
    if (!areaSqft || isNaN(areaSqft) || areaSqft <= 0) {
      alert("Area conversion failed. Please check your input.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("imagefile", photoFile);
      fd.append("size_sqft", String(areaSqft));
      fd.append("roof_type", roofType);
      fd.append("shared", shared ? "true" : "false");
      // Map roofSlope string to float value
      let roofSlopeValue = "";
      switch (roofSlope) {
        case "flat":
          roofSlopeValue = "0";
          break;
        case "low":
          roofSlopeValue = "10";
          break;
        case "moderate":
          roofSlopeValue = "22.5";
          break;
        case "steep":
          roofSlopeValue = "35";
          break;
        case "unknown":
        default:
          roofSlopeValue = "";
      }
      fd.append("roof_slope", roofSlopeValue);
      fd.append("roof_scope", "");
      fd.append("accessibility", accessibility || "unknown");
      fd.append("obstacles", obstacles);
      // latitude and longitude: only send if valid
      if (lat && !isNaN(Number(lat))) fd.append("latitude", String(lat));
      if (lon && !isNaN(Number(lon))) fd.append("longitude", String(lon));

      // POST to /v1/metadata
      await axios.post(`${backend}/v1/metadata`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Redirect to recommendations
      history.push("/recommendations");
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================================
  // RENDER UI
  // ======================================================================

  return (
    <div className="upload-form">
      <form onSubmit={onSubmit}>
        <IonGrid>
          <IonRow>

            {/* LEFT COLUMN - Camera + Preview */}
            <IonCol size="12" sizeMd="6">
              <div className="uploader-left">
                <div className="camera-area">
                  {cameraOpen ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="camera-video" />

                      <div className="camera-actions" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <IonButton onClick={captureFromCamera} style={primaryButtonStyle}>
                          Capture
                        </IonButton>
                        <IonButton fill="clear" onClick={stopCamera} style={{ fontWeight: 700 }}>
                          Close
                        </IonButton>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Preview Container */}
                      <div className="preview-wrap">
                        {previewUrl ? (
                          <>
                            <img src={previewUrl} alt="preview" className="preview-img" />
                            <button type="button" className="btn-remove" onClick={removePhoto}>
                              <IonIcon icon={trashOutline} /> Remove
                            </button>
                          </>
                        ) : (
                          <div className="preview-placeholder">
                            <IonIcon icon={cameraOutline} style={{ fontSize: 36 }} />
                            <div className="small-muted">No photo chosen</div>
                          </div>
                        )}
                      </div>

                      {/* ⭐ FILE NAME DISPLAY BELOW PREVIEW */}
                      {photoFile && (
                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "14px",
                            color: "#475569",
                            textAlign: "center",
                            wordBreak: "break-all",
                          }}
                        >
                          {photoFile.name}
                        </div>
                      )}

                      {/* Camera + Choose Photo Buttons */}
                      <div className="camera-controls" style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <IonButton style={primaryButtonStyle} onClick={openCamera}>
                          <IonIcon slot="start" icon={cameraOutline} /> Open Camera
                        </IonButton>

                        <IonButton fill="outline" style={outlineButtonStyle} onClick={openFilePicker}>
                          Choose Photo
                        </IonButton>

                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </IonCol>

            {/* RIGHT COLUMN - Form Fields */}
            <IonCol size="12" sizeMd="6">
              <div className="uploader-right">

                {/* Location */}
                <IonItem lines="none" className="item-no-border">
                  <IonLabel position="stacked">Location</IonLabel>
                  <IonInput value={location} onIonChange={(e) => setLocation(e.detail.value)} />
                </IonItem>

                {/* Roof Type */}
                <IonItem lines="none" className="item-no-border">
                  <IonLabel position="stacked">Roof type</IonLabel>
                  <IonSelect value={roofType} onIonChange={(e) => setRoofType(e.detail.value)}>
                    <IonSelectOption value="concrete">Concrete</IonSelectOption>
                    <IonSelectOption value="metal">Metal sheets</IonSelectOption>
                    <IonSelectOption value="tiles">Tiles</IonSelectOption>
                    <IonSelectOption value="asphalt">Asphalt shingles</IonSelectOption>
                    <IonSelectOption value="membrane">EPDM/TPO membrane</IonSelectOption>
                    <IonSelectOption value="green">Existing green roof</IonSelectOption>
                    <IonSelectOption value="wood">Wood / Shakes</IonSelectOption>
                    <IonSelectOption value="other">Other</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Roof Slope */}
                <IonItem lines="none" className="item-no-border">
                  <IonLabel position="stacked">Roof slope</IonLabel>
                  <IonSelect value={roofSlope} onIonChange={(e) => setRoofSlope(e.detail.value)}>
                    <IonSelectOption value="flat">Flat / 0–5°</IonSelectOption>
                    <IonSelectOption value="low">Low (5–15°)</IonSelectOption>
                    <IonSelectOption value="moderate">Moderate (15–30°)</IonSelectOption>
                    <IonSelectOption value="steep">Steep (&gt;30°)</IonSelectOption>
                    <IonSelectOption value="unknown">Unknown</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Area */}
                <IonItem lines="none" className="item-no-border">
                  <IonLabel position="stacked">Approx area (sqm)</IonLabel>
                  <IonInput type="number" value={area} onIonChange={(e) => setArea(e.detail.value)} />
                </IonItem>

                {/* Accessibility */}
                <IonItem lines="none" className="item-no-border">
                  <IonLabel position="stacked">Accessibility</IonLabel>
                  <IonSelect value={accessibility} onIonChange={(e) => setAccessibility(e.detail.value)}>
                    <IonSelectOption value="stairs">Stairs</IonSelectOption>
                    <IonSelectOption value="ladder">Ladder</IonSelectOption>
                    <IonSelectOption value="elevator">Elevator</IonSelectOption>
                    <IonSelectOption value="ramp">Ramp</IonSelectOption>
                    <IonSelectOption value="other">Other</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Shared toggle */}
                <IonItem lines="none" className="item-no-border" style={{ alignItems: "center", display: "flex" }}>
                  <IonLabel>Is the roof shared?</IonLabel>
                  <IonToggle checked={shared} onIonChange={(e) => setShared(e.detail.checked)} />
                </IonItem>

                {/* Obstacles input */}
                <IonItem lines="none" className="item-no-border">
                  <IonLabel position="stacked">Obstacles (comma separated)</IonLabel>
                  <IonInput value={obstacles} onIonChange={(e) => setObstacles(e.detail.value)} placeholder="e.g. water tank, skylight" />
                </IonItem>

                {/* BUTTONS */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <IonButton fill="clear" onClick={fillLocation} style={{ fontWeight: 700 }}>
                    <IonIcon icon={locateOutline} /> Auto-locate
                  </IonButton>

                  <IonButton type="submit" expand="block" style={primaryButtonStyle} disabled={loading}>
                    {loading ? (
                      <>
                        <IonSpinner name="dots" /> &nbsp;Analyzing...
                      </>
                    ) : (
                      "Analyze Rooftop"
                    )}
                  </IonButton>
                </div>

              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </form>
    </div>
  );
}
