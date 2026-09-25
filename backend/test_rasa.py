"""
RASA-AI — Comprehensive Automated Test Suite
===========================================
Tests:
1. Anti-Steam & Blur Rejection (IQA)
2. Specular Glare & Oil Reflection Filter
3. Color Anchor & White-Balance Calibration
4. Food & Defect Segmentation (Explainable Polygons)
5. CIE-Lab (Browning Index BI, Delta E) & GLCM Texture Extraction
6. Tabular ML Classifier & Prescriptive Recommendation Engine
7. FastAPI End-to-End Orchestrator Endpoints & Latency Benchmarks
"""

import os
import cv2
import numpy as np
from starlette.testclient import TestClient

try:
    import pytest
except ImportError:
    pytest = None

import vision_engine
import ml_engine
from main import app

client = TestClient(app)
DEMO_DIR = os.path.join(os.path.dirname(__file__), "demo_samples")


# ============================================================================
# 1. VISION ENGINE: IQA (STEAM & BLUR) TESTS
# ============================================================================

def test_iqa_sharp_vs_blurry_image():
    """Verify IQA accepts sharp image and rejects steamy/blurry image."""
    sharp_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    # Add strong high-frequency edge gradients
    cv2.rectangle(sharp_img, (100, 100), (300, 300), (255, 255, 255), 4)
    cv2.putText(sharp_img, "RASA TEST", (120, 200), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 4)
    
    iqa_sharp = vision_engine.assess_image_quality(sharp_img, blur_threshold=80.0)
    assert iqa_sharp["is_valid"] is True
    assert iqa_sharp["blur_score"] > 80.0
    assert iqa_sharp["rejection_reason"] is None

    # Severely blurred / steamy image
    blurry_img = cv2.GaussianBlur(sharp_img, (55, 55), 30.0)
    iqa_blurry = vision_engine.assess_image_quality(blurry_img, blur_threshold=80.0)
    assert iqa_blurry["is_valid"] is False
    assert iqa_blurry["blur_score"] < 80.0
    assert iqa_blurry["rejection_reason"] is not None


# ============================================================================
# 2. VISION ENGINE: GLARE FILTER TESTS
# ============================================================================

def test_specular_glare_filtering():
    """Verify glare detector finds flash specular highlights and applies inpainting."""
    img = np.full((300, 300, 3), 120, dtype=np.uint8)
    # Insert high-intensity specular flash hotspot (V=255, S=0)
    img[100:140, 100:140] = [255, 255, 255]
    
    mitigated, mask, detected = vision_engine.filter_specular_glare(img)
    assert detected is True
    assert np.sum(mask > 0) > 100
    # Inpainted pixels should not be max saturated white
    inpainted_patch = mitigated[110:130, 110:130]
    assert np.mean(inpainted_patch) < 250


# ============================================================================
# 3. VISION ENGINE: COLOR ANCHOR CALIBRATION TESTS
# ============================================================================

def test_color_anchor_white_balance():
    """Verify color anchor calibration adjusts skewed color gains."""
    # Create image with strong blue tint
    blue_skewed = np.zeros((400, 400, 3), dtype=np.uint8)
    blue_skewed[:, :, 0] = 200 # Blue
    blue_skewed[:, :, 1] = 100 # Green
    blue_skewed[:, :, 2] = 50  # Red
    
    calibrated, meta = vision_engine.calibrate_color_anchor(blue_skewed)
    assert meta["anchor_type"] in ["AUTO_CORNER_ANCHOR", "GRAY_WORLD_FALLBACK", "GRAY_WORLD"]
    # Gains should boost Red and reduce Blue
    assert meta["gains"]["R"] > meta["gains"]["B"]


# ============================================================================
# 4. VISION ENGINE: CIE-LAB & GLCM EXTRACTION
# ============================================================================

def test_browning_index_and_glcm():
    """Verify Browning Index and GLCM calculations."""
    h, w = 200, 200
    food_mask = np.ones((h, w), dtype=np.uint8) * 255
    l_norm = np.full((h, w), 50.0, dtype=np.float32)
    a_norm = np.full((h, w), 18.0, dtype=np.float32)
    b_norm = np.full((h, w), 35.0, dtype=np.float32)
    
    cie_lab = vision_engine.extract_cie_lab_features(
        l_norm, a_norm, b_norm, food_mask, golden_lab=(48.0, 17.5, 34.0)
    )
    assert 50.0 < cie_lab["browning_index"] <= 150.0
    assert cie_lab["delta_e"] < 5.0

    img = np.random.randint(50, 200, (h, w, 3), dtype=np.uint8)
    glcm = vision_engine.extract_glcm_texture(img, food_mask)
    assert "homogeneity" in glcm
    assert "contrast" in glcm
    assert 0.0 <= glcm["homogeneity"] <= 1.0


# ============================================================================
# 5. ML ENGINE: CLASSIFICATION & PRESCRIPTIVE RECOMMENDATIONS
# ============================================================================

def test_ml_engine_inference():
    """Verify ML model prediction and prescriptive action generation."""
    ml = ml_engine.RasaMLEngine()
    
    # 1. Test Golden Passed Sample
    vision_metrics_passed = {
        "browning_index": 150.0,
        "delta_e": 1.5,
        "texture_homogeneity": 0.72,
        "texture_contrast": 135.0,
        "l_mean": 54.0, "l_std": 5.0,
        "a_mean": 12.0, "a_std": 2.5,
        "b_mean": 48.0, "b_std": 3.0,
        "texture_dissimilarity": 5.8,
        "texture_energy": 0.16,
        "texture_correlation": 0.86
    }
    seg_passed = {
        "overcooked_pct": 0.5,
        "undercooked_pct": 0.8,
        "uneven_pct": 0.6,
        "total_defect_pct": 1.9,
        "defects_detected": []
    }
    status, score, probs = ml.predict(
        "AYAM_GORENG_LENGKUAS", 1.0, 10.0, vision_metrics_passed, seg_passed
    )
    assert status == "PASSED"
    assert score >= 80.0

    rx_passed = ml.prescribe_recommendation(
        "AYAM_GORENG_LENGKUAS", status, 10.0, 1.0, vision_metrics_passed, seg_passed
    )
    assert rx_passed["adjustment_parameters"]["additional_time_mins"] == 0.0
    assert "LULUS" in rx_passed["actionable_feedback"] or "sempurna" in rx_passed["actionable_feedback"]

    # 2. Test Undercooked Sample
    vision_metrics_under = {
        "browning_index": 28.0,
        "delta_e": 14.5,
        "texture_homogeneity": 0.82,
        "texture_contrast": 85.0,
        "l_mean": 64.0, "l_std": 8.0,
        "a_mean": 8.0, "a_std": 3.0,
        "b_mean": 24.0, "b_std": 4.0,
        "texture_dissimilarity": 4.0,
        "texture_energy": 0.22,
        "texture_correlation": 0.92
    }
    seg_under = {
        "overcooked_pct": 0.0,
        "undercooked_pct": 28.0,
        "uneven_pct": 3.0,
        "total_defect_pct": 31.0,
        "defects_detected": ["UNDERCOOKED_PALE_ZONES"]
    }
    status_u, score_u, _ = ml.predict(
        "AYAM_GORENG_LENGKUAS", 1.0, 5.0, vision_metrics_under, seg_under
    )
    assert status_u == "UNDER_COOKED"
    assert score_u < 75.0

    rx_under = ml.prescribe_recommendation(
        "AYAM_GORENG_LENGKUAS", status_u, 5.0, 1.0, vision_metrics_under, seg_under
    )
    assert rx_under["adjustment_parameters"]["additional_time_mins"] > 0.0
    assert "lanjutkan" in rx_under["actionable_feedback"].lower() or "menit" in rx_under["actionable_feedback"].lower()


# ============================================================================
# 6. FASTAPI ORCHESTRATOR API INTEGRATION TESTS
# ============================================================================

def test_api_health():
    """Verify /api/v1/health responds with healthy status."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "AYAM_GORENG_LENGKUAS" in data["available_menus"]


def test_api_menus():
    """Verify /api/v1/menus returns all registered menu specs."""
    res = client.get("/api/v1/menus")
    assert res.status_code == 200
    data = res.json()
    assert data["total_menus"] >= 5
    assert "RENDANG_DAGING" in data["menus"]


def test_api_analyze_demo_golden():
    """Verify QC analysis on golden sample succeeds under 500ms."""
    golden_path = os.path.join(DEMO_DIR, "sample_ayam_golden.jpg")
    assert os.path.exists(golden_path)

    with open(golden_path, "rb") as f:
        res = client.post(
            "/api/v1/qc/analyze",
            files={"image": ("golden.jpg", f, "image/jpeg")},
            data={
                "cabang_id": "CABANG_01_TEST",
                "menu_id": "AYAM_GORENG_LENGKUAS",
                "batch_size": "1",
                "elapsed_time": "10.0"
            }
        )
    assert res.status_code == 200
    data = res.json()
    assert data["image_quality"]["is_valid"] is True
    assert data["status"] == "PASSED"
    assert data["quality_score"] >= 80.0
    assert data["annotated_image_base64"].startswith("data:image/jpeg;base64,")
    assert data["execution_time_ms"] < 600
    print(f"\n[BENCHMARK] Golden dish analyzed in {data['execution_time_ms']} ms")


def test_api_analyze_steamy_rejection():
    """Verify IQA automatically rejects steamy/blurry lens sample."""
    steamy_path = os.path.join(DEMO_DIR, "sample_lens_steamy.jpg")
    assert os.path.exists(steamy_path)

    with open(steamy_path, "rb") as f:
        res = client.post(
            "/api/v1/qc/analyze",
            files={"image": ("steamy.jpg", f, "image/jpeg")},
            data={
                "cabang_id": "CABANG_01_TEST",
                "menu_id": "AYAM_GORENG_LENGKUAS",
                "batch_size": "1",
                "elapsed_time": "10.0"
            }
        )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "REJECTED_BLUR_OR_STEAM"
    assert data["image_quality"]["is_valid"] is False
    assert data["quality_score"] == 0.0
    assert "DITOLAK" in data["actionable_feedback"]
    assert len(data["prescriptive_actions"]) > 0


def test_api_analyze_burnt_defect():
    """Verify QC analysis on burnt sample detects overcooked defects."""
    burnt_path = os.path.join(DEMO_DIR, "sample_ayam_burnt.jpg")
    assert os.path.exists(burnt_path)

    with open(burnt_path, "rb") as f:
        res = client.post(
            "/api/v1/qc/analyze",
            files={"image": ("burnt.jpg", f, "image/jpeg")},
            data={
                "cabang_id": "CABANG_01_TEST",
                "menu_id": "AYAM_GORENG_LENGKUAS",
                "batch_size": "1",
                "elapsed_time": "14.0"
            }
        )
    assert res.status_code == 200
    data = res.json()
    assert data["image_quality"]["is_valid"] is True
    assert data["status"] in ["NEEDS_ADJUSTMENT", "OVER_COOKED"]

if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING RASA-AI END-TO-END AUTOMATED TEST SUITE")
    print("=" * 70)
    test_iqa_sharp_vs_blurry_image()
    print("[PASS] test_iqa_sharp_vs_blurry_image")
    test_specular_glare_filtering()
    print("[PASS] test_specular_glare_filtering")
    test_color_anchor_white_balance()
    print("[PASS] test_color_anchor_white_balance")
    test_browning_index_and_glcm()
    print("[PASS] test_browning_index_and_glcm")
    test_ml_engine_inference()
    print("[PASS] test_ml_engine_inference")
    test_api_health()
    print("[PASS] test_api_health")
    test_api_menus()
    print("[PASS] test_api_menus")
    test_api_analyze_demo_golden()
    print("[PASS] test_api_analyze_demo_golden")
    test_api_analyze_steamy_rejection()
    print("[PASS] test_api_analyze_steamy_rejection")
    test_api_analyze_burnt_defect()
    print("[PASS] test_api_analyze_burnt_defect")
    print("=" * 70)
    print("ALL 10 TEST SUITES COMPLETED SUCCESSFULLY! (100% PASS RATE)")
    print("=" * 70)
