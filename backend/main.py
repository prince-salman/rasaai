"""
RASA-AI — Backend Orchestrator & Fast API Server
===============================================
Coordinates the Dual-Engine Deep Vision & Multimodal ML Pipeline:
1. Image Ingestion
2. Image Quality Assessment (IQA: Anti-Steam & Blur Rejection)
3. Specular Glare / Oil Reflection Filter
4. Dynamic Color & White-Balance Calibration (Color Anchor)
5. Food & Defect Segmentation (Explainable Defect Highlighting)
6. Standardized CIE-Lab (BI, Delta E) & GLCM Texture Extraction
7. Multimodal ML Classification & Prescriptive Recommendation
8. Base64 Annotated Diagnostic Image Generation
"""

from __future__ import annotations
import os
import time
import base64
from typing import Optional, Dict, Any, List

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import vision_engine
import ml_engine

# Initialize FastAPI application
app = FastAPI(
    title="RASA-AI Quality Control Orchestrator",
    description="Dual-Engine Deep Vision and Machine Learning Framework for Culinary Standardization",
    version="1.0.0"
)

# Enable CORS for cross-device mobile/tablet access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML Engine
ml_proc = ml_engine.RasaMLEngine()

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DEMO_DIR = os.path.join(BASE_DIR, "demo_samples")

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(DEMO_DIR, exist_ok=True)


# ============================================================================
# PYDANTIC RESPONSE MODELS
# ============================================================================

class ImageQualityResponse(BaseModel):
    is_valid: bool
    blur_score: float
    is_steamy: bool
    glare_mitigated: bool
    anchor_detected: bool
    anchor_type: Optional[str] = None
    rejection_reason: Optional[str] = None


class MetricsResponse(BaseModel):
    browning_index: float
    texture_homogeneity: float
    texture_contrast: float
    delta_e: float
    defect_area_percentage: float
    overcooked_pct: float
    undercooked_pct: float
    uneven_pct: float
    l_mean: float
    a_mean: float
    b_mean: float


class QCAnalysisResponse(BaseModel):
    quality_score: float
    status: str
    image_quality: ImageQualityResponse
    metrics: Optional[MetricsResponse] = None
    defects_detected: List[str] = []
    actionable_feedback: str
    prescriptive_actions: List[str] = []
    adjustment_parameters: Optional[Dict[str, Any]] = None
    class_probabilities: Optional[Dict[str, float]] = None
    annotated_image_base64: Optional[str] = None
    execution_time_ms: int


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/api/v1/health")
async def health_check():
    """Returns system status, ML readiness, and supported menu specifications."""
    return {
        "status": "HEALTHY",
        "service": "RASA-AI QC Orchestrator",
        "version": "1.0.0",
        "ml_model_loaded": ml_proc.model is not None,
        "available_menus": list(ml_engine.MENU_CATALOG.keys()),
        "skimage_available": vision_engine.SKIMAGE_AVAILABLE
    }


@app.get("/api/v1/menus")
async def get_menus():
    """Returns registered menu items and their golden benchmark specifications."""
    return {
        "status": "SUCCESS",
        "total_menus": len(ml_engine.MENU_CATALOG),
        "menus": ml_engine.MENU_CATALOG
    }


@app.post("/api/v1/qc/analyze", response_model=QCAnalysisResponse)
async def analyze_dish_qc(
    image: UploadFile = File(...),
    cabang_id: str = Form("CABANG_01_JAKARTA"),
    menu_id: str = Form("AYAM_GORENG_LENGKUAS"),
    batch_size: float = Form(1.0),
    elapsed_time: Optional[float] = Form(None),
    operator_name: Optional[str] = Form("Staff Dapur")
):
    """
    Sub-500ms unified inference pipeline:
    Image Ingestion -> IQA -> Glare Filter -> Color Anchor Calibration ->
    Food & Defect Segmentation -> CIE-Lab & GLCM Extraction -> ML Inference ->
    Base64 Annotated Diagnostic Rendering.
    """
    t_start = time.perf_counter()

    if menu_id not in ml_engine.MENU_CATALOG:
        menu_id = "AYAM_GORENG_LENGKUAS"
    
    spec = ml_engine.MENU_CATALOG[menu_id]
    if elapsed_time is None or elapsed_time <= 0:
        elapsed_time = spec["standard_cooking_time_mins"]

    # 1. Read & Decode Image
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Gagal membaca file gambar.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    # 2. Image Quality Assessment (Anti-Steam & Blur Rejection)
    iqa = vision_engine.assess_image_quality(img_bgr, blur_threshold=80.0)

    if not iqa["is_valid"]:
        t_end = time.perf_counter()
        exec_ms = int((t_end - t_start) * 1000)
        return QCAnalysisResponse(
            quality_score=0.0,
            status="REJECTED_BLUR_OR_STEAM",
            image_quality=ImageQualityResponse(
                is_valid=False,
                blur_score=iqa["blur_score"],
                is_steamy=iqa["is_steamy"],
                glare_mitigated=False,
                anchor_detected=False,
                rejection_reason=iqa["rejection_reason"]
            ),
            metrics=None,
            defects_detected=["IMAGE_QUALITY_DEFICIT"],
            actionable_feedback=f"⚠️ FOTO DITOLAK: {iqa['rejection_reason']}",
            prescriptive_actions=[
                "Lap dan bersihkan lensa kamera smartphone dari uap/embun minyak.",
                "Posisikan kamera stabil sejajar dengan masakan pada jarak 30-40 cm.",
                "Pastikan lampu flash/torch aktif untuk pencahayaan optimal."
            ],
            adjustment_parameters=None,
            class_probabilities=None,
            annotated_image_base64=None,
            execution_time_ms=exec_ms
        )

    # 3. Specular Glare & Hot Oil Reflection Filter
    mitigated_bgr, glare_mask, was_glare = vision_engine.filter_specular_glare(img_bgr)

    # 4. Dynamic Color & White-Balance Calibration (Color Anchor)
    calibrated_bgr, calib_meta = vision_engine.calibrate_color_anchor(mitigated_bgr)

    # 5. Food ROI & Defect Segmentation
    seg_results = vision_engine.segment_food_and_defects(
        calibrated_bgr,
        golden_lab=spec["golden_lab"],
        target_bi=spec["target_bi"],
        allowed_bi_delta=spec["bi_tolerance"]
    )

    # 6. Standardized CIE-Lab & GLCM Extraction
    cie_lab = vision_engine.extract_cie_lab_features(
        seg_results["l_norm"],
        seg_results["a_norm"],
        seg_results["b_norm"],
        seg_results["food_mask"],
        golden_lab=spec["golden_lab"]
    )

    glcm = vision_engine.extract_glcm_texture(calibrated_bgr, seg_results["food_mask"])

    # Merge Vision Metrics
    vision_metrics = {
        "browning_index": cie_lab["browning_index"],
        "delta_e": cie_lab["delta_e"],
        "l_mean": cie_lab["l_mean"],
        "l_std": cie_lab["l_std"],
        "a_mean": cie_lab["a_mean"],
        "a_std": cie_lab["a_std"],
        "b_mean": cie_lab["b_mean"],
        "b_std": cie_lab["b_std"],
        "texture_homogeneity": glcm["homogeneity"],
        "texture_contrast": glcm["contrast"],
        "texture_dissimilarity": glcm["dissimilarity"],
        "texture_energy": glcm["energy"],
        "texture_correlation": glcm["correlation"],
        "defect_area_percentage": seg_results["total_defect_pct"],
        "overcooked_pct": seg_results["overcooked_pct"],
        "undercooked_pct": seg_results["undercooked_pct"],
        "uneven_pct": seg_results["uneven_pct"]
    }

    # 7. Machine Learning Classification & Prescriptive Recommendation
    predicted_status, quality_score, class_probs = ml_proc.predict(
        menu_id=menu_id,
        batch_size=batch_size,
        elapsed_time=elapsed_time,
        vision_metrics=vision_metrics,
        seg_results=seg_results
    )

    prescription = ml_proc.prescribe_recommendation(
        menu_id=menu_id,
        predicted_status=predicted_status,
        elapsed_time=elapsed_time,
        batch_size=batch_size,
        vision_metrics=vision_metrics,
        seg_results=seg_results
    )

    # 8. Generate Base64 Diagnostic Annotated Image
    annotated_b64 = vision_engine.generate_annotated_image(
        image_bgr=img_bgr,
        seg_results=seg_results,
        metrics=vision_metrics,
        status=predicted_status,
        action_feedback=prescription["actionable_feedback"]
    )

    t_end = time.perf_counter()
    exec_ms = int((t_end - t_start) * 1000)

    # Determine general status label
    general_status = predicted_status
    if predicted_status in ["UNDER_COOKED", "OVER_COOKED", "UNEVEN_SEASONING"]:
        general_status = "NEEDS_ADJUSTMENT"

    return QCAnalysisResponse(
        quality_score=quality_score,
        status=general_status,
        image_quality=ImageQualityResponse(
            is_valid=True,
            blur_score=iqa["blur_score"],
            is_steamy=iqa["is_steamy"],
            glare_mitigated=was_glare,
            anchor_detected=calib_meta["anchor_detected"],
            anchor_type=calib_meta["anchor_type"]
        ),
        metrics=MetricsResponse(**vision_metrics),
        defects_detected=seg_results["defects_detected"],
        actionable_feedback=prescription["actionable_feedback"],
        prescriptive_actions=prescription["prescriptive_actions"],
        adjustment_parameters=prescription["adjustment_parameters"],
        class_probabilities=class_probs,
        annotated_image_base64=annotated_b64,
        execution_time_ms=exec_ms
    )


@app.get("/api/v1/qc/demo-samples")
async def list_demo_samples():
    """Lists pre-generated benchmark demo sample images."""
    if not os.path.exists(DEMO_DIR):
        demo_generator.create_demo_food_images(DEMO_DIR)

    files = [f for f in os.listdir(DEMO_DIR) if f.endswith(".jpg") or f.endswith(".png")]
    samples = []
    
    sample_descriptions = {
        "sample_ayam_golden.jpg": {
            "title": "Ayam Goreng (Golden Sample)",
            "expected_status": "PASSED",
            "menu_id": "AYAM_GORENG_LENGKUAS",
            "desc": "Kematangan sempurna, warna serundeng keemasan merata, lolos standar mutu."
        },
        "sample_ayam_burnt.jpg": {
            "title": "Ayam Goreng (Overcooked / Gosong)",
            "expected_status": "NEEDS_ADJUSTMENT (OVER_COOKED)",
            "menu_id": "AYAM_GORENG_LENGKUAS",
            "desc": "Area gosong terdeteksi di sisi kanan, BI tinggi, perlu penyesuaian api."
        },
        "sample_ayam_undercooked.jpg": {
            "title": "Ayam Goreng (Undercooked / Pucat)",
            "expected_status": "NEEDS_ADJUSTMENT (UNDER_COOKED)",
            "menu_id": "AYAM_GORENG_LENGKUAS",
            "desc": "Warna pucat, BI rendah, perlu penambahan waktu masak."
        },
        "sample_lens_steamy.jpg": {
            "title": "Kamera Beruap (Steam Rejection)",
            "expected_status": "REJECTED_BLUR_OR_STEAM",
            "menu_id": "AYAM_GORENG_LENGKUAS",
            "desc": "Simulasi lensa kamera berembun uap panas wajan; ditolak otomatis oleh IQA."
        },
        "sample_oily_glare.jpg": {
            "title": "Pantulan Kilap Minyak (Glare Filtered)",
            "expected_status": "PASSED",
            "menu_id": "AYAM_GORENG_LENGKUAS",
            "desc": "Pantulan cahaya flash pada minyak panas dimitigasi oleh digital polarization."
        }
    }

    for f in sorted(files):
        info = sample_descriptions.get(f, {
            "title": f,
            "expected_status": "UNKNOWN",
            "menu_id": "AYAM_GORENG_LENGKUAS",
            "desc": "Demo benchmark sample"
        })
        samples.append({
            "filename": f,
            "url": f"/demo-samples/{f}",
            **info
        })
    return {"samples": samples}


@app.post("/api/v1/qc/simulate-demo/{filename}")
async def simulate_demo_sample(
    filename: str,
    menu_id: str = "AYAM_GORENG_LENGKUAS",
    batch_size: float = 1.0,
    elapsed_time: Optional[float] = None
):
    """Simulates instant QC analysis directly on a pre-generated demo sample."""
    file_path = os.path.join(DEMO_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Demo sample {filename} not found.")

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    # Reuse analyze logic by constructing an UploadFile-like structure
    from starlette.datastructures import UploadFile as StarletteUploadFile
    import io
    
    upload = StarletteUploadFile(file=io.BytesIO(file_bytes), filename=filename)
    return await analyze_dish_qc(
        image=upload,
        cabang_id="CABANG_SIMULASI_DEMO",
        menu_id=menu_id,
        batch_size=batch_size,
        elapsed_time=elapsed_time,
        operator_name="Chef Tester"
    )


# Serve demo samples static directory
app.mount("/demo-samples", StaticFiles(directory=DEMO_DIR), name="demo-samples")

# Serve main static assets
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def serve_index():
    """Serves the Kitchen QC Web App frontpage."""
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "RASA-AI Kitchen QC Web Portal is active."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
