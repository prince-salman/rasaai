"""
RASA-AI — Dual-Engine Deep Vision, Calibration & Explainable Defect Engine
========================================================================
Engine 1: Robust Computer Vision & Food Science Quantitative Analysis
- Anti-Steam & Blur Rejection (Laplacian Variance + High-Frequency Edge Analysis)
- Specular Glare / Oil Reflection Filter (Digital Polarization & Inpainting)
- Dynamic Color & White-Balance Calibration (Color Anchor / Neutral Reference)
- Food ROI & Defect Segmentation (Explainable Defect Highlighting)
- Standardized CIE-Lab (Browning Index, Delta E) & GLCM Texture Extraction
- Base64 Annotated Diagnostic Image Generation
"""

from __future__ import annotations
import base64
import math
from typing import Dict, List, Optional, Tuple, Any

import cv2
import numpy as np

try:
    from skimage.feature import graycomatrix, graycoprops
    SKIMAGE_AVAILABLE = True
except ImportError:
    SKIMAGE_AVAILABLE = False


# ============================================================================
# 1. IMAGE QUALITY ASSESSMENT (IQA): ANTI-STEAM & BLUR REJECTION
# ============================================================================

def assess_image_quality(
    image_bgr: np.ndarray,
    blur_threshold: float = 80.0,
    steam_haze_threshold: float = 0.25
) -> Dict[str, Any]:
    """
    Evaluates image quality under extreme kitchen conditions.
    Detects lens fogging from boiling steam and camera motion blur.
    """
    if image_bgr is None or image_bgr.size == 0:
        return {
            "is_valid": False,
            "blur_score": 0.0,
            "is_steamy": False,
            "steam_haze_ratio": 1.0,
            "rejection_reason": "Gambar kosong atau tidak terbaca."
        }

    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    
    # 1. Laplacian Variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = float(laplacian.var())

    # 2. Steam / Haze Detection
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(sobelx**2 + sobely**2)
    
    min_rgb = np.min(image_bgr, axis=2)
    haze_patch = cv2.boxFilter(min_rgb, ddepth=-1, ksize=(15, 15))
    steam_haze_ratio = float(np.mean(haze_patch > 180))
    low_grad_ratio = float(np.mean(grad_mag < 10.0))

    # 3. Human Face Rejection (OpenCV Haar Cascade)
    is_face = False
    try:
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
        if len(faces) > 0:
            is_face = True
    except Exception:
        pass

    # 4. Color Spectrum & Lighting Check (Food vs Cold Non-Food)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    avg_l = float(np.mean(lab[:, :, 0]))
    avg_b = float(np.mean(lab[:, :, 2])) # In OpenCV Lab: 128 is neutral, >128 is yellow
    avg_b_centered = avg_b - 128.0

    is_too_dark = avg_l < 25.0
    is_too_bright = avg_l > 240.0
    is_cold_non_food = avg_b_centered < -5.0 # Strongly blue

    is_blurry = blur_score < blur_threshold
    is_steamy = (steam_haze_ratio > steam_haze_threshold) or (is_blurry and low_grad_ratio > 0.85)

    is_valid = not (is_blurry or is_steamy or is_face or is_too_dark or is_too_bright or is_cold_non_food)
    rejection_reason = None

    if not is_valid:
        if is_face:
            rejection_reason = "Wajah Manusia Terdeteksi: Sistem RASA AI dikhususkan untuk inspeksi mutu pangan olahan (keripik, ayam goreng, pastry, dsb.). Harap foto makanan Anda."
        elif is_steamy:
            rejection_reason = "Lensa Beruap / Berembun Panas: Bersihkan lensa kamera dan beri jarak uap dari wajan/piring sebelum foto ulang."
        elif is_blurry:
            rejection_reason = "Foto Buram / Gerak (Motion Blur): Tahan posisi kamera dengan stabil dan pastikan flash aktif."
        elif is_too_dark:
            rejection_reason = "Foto Terlalu Gelap: Objek makanan tidak terlihat dengan jelas. Pastikan pencahayaan cukup."
        elif is_too_bright:
            rejection_reason = "Foto Terlalu Terang / Silau: Lensa terkena cahaya berlebih atau mengarah ke permukaan putih polos."
        elif is_cold_non_food:
            rejection_reason = "Bukan Objek Makanan: Terdeteksi spektrum warna dingin non-pangan (kebiruan/layar). Makanan olahan memiliki pigmen hangat."

    return {
        "is_valid": is_valid,
        "blur_score": round(blur_score, 2),
        "is_steamy": is_steamy,
        "is_face": is_face,
        "steam_haze_ratio": round(steam_haze_ratio, 3),
        "low_grad_ratio": round(low_grad_ratio, 3),
        "rejection_reason": rejection_reason
    }


# ============================================================================
# 2. SPECULAR GLARE & OIL REFLECTION FILTER
# ============================================================================

def filter_specular_glare(
    image_bgr: np.ndarray,
    v_thresh: int = 240,
    s_thresh: int = 55,
    inpaint_radius: int = 5
) -> Tuple[np.ndarray, np.ndarray, bool]:
    """
    Detects and mitigates specular flash highlights and hot oil reflections
    using digital polarization and selective inpainting.
    """
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    
    # Glare is characterized by near-max intensity (V) and washed out saturation (S)
    glare_mask = ((v >= v_thresh) & (s <= s_thresh)).astype(np.uint8) * 255
    
    # Also check Lab space L* > 94
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_chan, _, _ = cv2.split(lab)
    glare_mask_lab = (l_chan >= 240).astype(np.uint8) * 255
    
    combined_glare = cv2.bitwise_or(glare_mask, glare_mask_lab)
    
    # Clean up small noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    combined_glare = cv2.morphologyEx(combined_glare, cv2.MORPH_OPEN, kernel)
    
    glare_pixel_count = int(np.sum(combined_glare > 0))
    total_pixels = int(image_bgr.shape[0] * image_bgr.shape[1])
    glare_ratio = glare_pixel_count / max(1, total_pixels)
    
    was_glare_detected = bool(glare_ratio > 0.001 or glare_pixel_count > 50)
    
    if was_glare_detected:
        dilated_mask = cv2.dilate(combined_glare, kernel, iterations=2)
        mitigated_bgr = cv2.inpaint(image_bgr, dilated_mask, inpaint_radius, cv2.INPAINT_TELEA)
    else:
        mitigated_bgr = image_bgr.copy()
        
    return mitigated_bgr, combined_glare, was_glare_detected


# ============================================================================
# 3. DYNAMIC COLOR & WHITE-BALANCE CALIBRATION (COLOR ANCHOR)
# ============================================================================

def calibrate_color_anchor(
    image_bgr: np.ndarray,
    anchor_box: Optional[Tuple[int, int, int, int]] = None
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Performs dynamic color and white-balance calibration using a reference anchor
    (neutral calibration sticker, plate rim, or Gray-World fallback).
    """
    h, w = image_bgr.shape[:2]
    anchor_found = False
    anchor_type = "GRAY_WORLD"
    
    r_gain, g_gain, b_gain = 1.0, 1.0, 1.0
    
    if anchor_box is not None:
        ax, ay, aw, ah = anchor_box
        ax, ay = max(0, ax), max(0, ay)
        aw, ah = min(w - ax, aw), min(h - ay, ah)
        if aw > 10 and ah > 10:
            anchor_patch = image_bgr[ay:ay+ah, ax:ax+aw]
            b_mean = np.mean(anchor_patch[:, :, 0])
            g_mean = np.mean(anchor_patch[:, :, 1])
            r_mean = np.mean(anchor_patch[:, :, 2])
            
            if b_mean > 30 and g_mean > 30 and r_mean > 30:
                anchor_found = True
                anchor_type = "MANUAL_ANCHOR"
                ref_gray = (r_mean + g_mean + b_mean) / 3.0
                b_gain = ref_gray / max(1.0, b_mean)
                g_gain = ref_gray / max(1.0, g_mean)
                r_gain = ref_gray / max(1.0, r_mean)
    
    if not anchor_found:
        corner_w, corner_h = int(w * 0.18), int(h * 0.18)
        corner_patch = image_bgr[10:10+corner_h, w - corner_w - 10:w - 10]
        
        # Check for white/neutral reference patch in top-right guide box
        white_pixels = (
            (corner_patch[:, :, 0] > 190) &
            (corner_patch[:, :, 1] > 190) &
            (corner_patch[:, :, 2] > 190)
        )
        
        if np.sum(white_pixels) > 80:
            anchor_found = True
            anchor_type = "AUTO_CORNER_ANCHOR"
            b_mean = float(np.mean(corner_patch[:, :, 0][white_pixels]))
            g_mean = float(np.mean(corner_patch[:, :, 1][white_pixels]))
            r_mean = float(np.mean(corner_patch[:, :, 2][white_pixels]))
            ref_target = 240.0
            b_gain = ref_target / max(1.0, b_mean)
            g_gain = ref_target / max(1.0, g_mean)
            r_gain = ref_target / max(1.0, r_mean)
        else:
            anchor_type = "GRAY_WORLD_FALLBACK"
            b_mean = float(np.mean(image_bgr[:, :, 0]))
            g_mean = float(np.mean(image_bgr[:, :, 1]))
            r_mean = float(np.mean(image_bgr[:, :, 2]))
            k = (r_mean + g_mean + b_mean) / 3.0
            b_gain = k / max(1.0, b_mean)
            g_gain = k / max(1.0, g_mean)
            r_gain = k / max(1.0, r_mean)

    b_gain = float(np.clip(b_gain, 0.75, 1.35))
    g_gain = float(np.clip(g_gain, 0.75, 1.35))
    r_gain = float(np.clip(r_gain, 0.75, 1.35))

    calibrated = image_bgr.astype(np.float32)
    calibrated[:, :, 0] *= b_gain
    calibrated[:, :, 1] *= g_gain
    calibrated[:, :, 2] *= r_gain
    calibrated = np.clip(calibrated, 0, 255).astype(np.uint8)

    meta = {
        "anchor_detected": anchor_found,
        "anchor_type": anchor_type,
        "gains": {"R": round(r_gain, 3), "G": round(g_gain, 3), "B": round(b_gain, 3)}
    }
    return calibrated, meta


# ============================================================================
# 4. FOOD ROI & DEFECT SEGMENTATION (EXPLAINABLE AI)
# ============================================================================

def segment_food_and_defects(
    image_bgr: np.ndarray,
    golden_lab: Tuple[float, float, float] = (50.0, 18.0, 35.0),
    target_bi: float = 48.0,
    allowed_bi_delta: float = 18.0
) -> Dict[str, Any]:
    """
    Segments the main culinary food ROI from the plate/wok background,
    and isolates explainable defect regions:
    - Overcooked / Burnt (Red polygon)
    - Undercooked / Raw / Pale (Yellow polygon)
    - Uneven Seasoning / Sauce pooling (Orange polygon)
    """
    h, w = image_bgr.shape[:2]
    
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_chan, a_chan, b_chan = cv2.split(lab)
    
    # 1. Primary Food ROI Segmentation
    # Exclude top-right calibration anchor
    anchor_margin_x = int(w * 0.78)
    anchor_margin_y = int(h * 0.22)
    non_anchor_mask = np.ones((h, w), dtype=bool)
    non_anchor_mask[:anchor_margin_y, anchor_margin_x:] = False

    l_norm = (l_chan.astype(np.float32) * 100.0) / 255.0
    a_norm = a_chan.astype(np.float32) - 128.0
    b_norm = b_chan.astype(np.float32) - 128.0

    # Chroma metric: Distance from neutral in CIE-Lab
    chroma = np.sqrt(a_norm**2 + b_norm**2)

    cy, cx = h / 2.0, w / 2.0
    y_coords, x_coords = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((x_coords - cx)**2 + (y_coords - cy)**2)
    max_radius = min(h, w) * 0.44

    # Food pixels: distinct warm organic tone OR central dark charred meat
    food_mask_bool = (
        non_anchor_mask &
        (l_norm < 88.0) &
        ((b_norm > 12.0) | ((l_norm < 35.0) & (b_norm > 2.0)))
    )

    cleaned_food_mask = food_mask_bool.astype(np.uint8) * 255
    food_pixel_count = int(np.sum(cleaned_food_mask > 0))
    if food_pixel_count < 100:
        cleaned_food_mask[int(h*0.25):int(h*0.75), int(w*0.25):int(w*0.75)] = 255
        food_pixel_count = int(np.sum(cleaned_food_mask > 0))

    # 2. Defect Localization (Explainable AI)
    denom = 5.645 * l_norm + a_norm - 3.012 * b_norm
    denom[np.abs(denom) < 1e-4] = 1e-4
    x_val = (a_norm + 1.75 * l_norm) / denom
    pixel_bi = 100.0 * (x_val - 0.31) / 0.17
    pixel_bi = np.clip(pixel_bi, 0, 250)

    delta_e_map = np.sqrt(
        (l_norm - golden_lab[0])**2 +
        (a_norm - golden_lab[1])**2 +
        (b_norm - golden_lab[2])**2
    )

    # Overcooked / Burnt: Low L* within food ROI
    overcooked_raw = (
        (cleaned_food_mask > 0) &
        (l_norm < 35.0)
    )
    overcooked_mask = overcooked_raw.astype(np.uint8) * 255

    # Undercooked / Raw / Pale: High L*, low a*
    undercooked_raw = (
        (cleaned_food_mask > 0) &
        (overcooked_mask == 0) &
        (l_norm > 68.0) &
        (a_norm < 7.0)
    )
    undercooked_mask = undercooked_raw.astype(np.uint8) * 255

    # Uneven Seasoning / Color Blotches: High local Delta E
    uneven_raw = (
        (cleaned_food_mask > 0) &
        (overcooked_mask == 0) &
        (undercooked_mask == 0) &
        (delta_e_map > 18.0)
    )
    uneven_mask = uneven_raw.astype(np.uint8) * 255

    def get_contours_list(mask: np.ndarray) -> List[List[List[int]]]:
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        polys = []
        for c in cnts:
            if cv2.contourArea(c) > 60:
                epsilon = 0.015 * cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, epsilon, True)
                poly = approx.reshape(-1, 2).tolist()
                if len(poly) >= 3:
                    polys.append(poly)
        return polys

    overcooked_polys = get_contours_list(overcooked_mask)
    undercooked_polys = get_contours_list(undercooked_mask)
    uneven_polys = get_contours_list(uneven_mask)

    overcooked_pct = (np.sum(overcooked_mask > 0) / food_pixel_count) * 100.0
    undercooked_pct = (np.sum(undercooked_mask > 0) / food_pixel_count) * 100.0
    uneven_pct = (np.sum(uneven_mask > 0) / food_pixel_count) * 100.0
    total_defect_pct = overcooked_pct + undercooked_pct + uneven_pct

    defects_detected = []
    if overcooked_pct > 6.0:
        defects_detected.append("OVERCOOKED_BURNT_ZONES")
    if undercooked_pct > 8.0:
        defects_detected.append("UNDERCOOKED_PALE_ZONES")
    if uneven_pct > 14.0:
        defects_detected.append("UNEVEN_SEASONING_DISTRIBUTION")

    return {
        "food_mask": cleaned_food_mask,
        "overcooked_mask": overcooked_mask,
        "undercooked_mask": undercooked_mask,
        "uneven_mask": uneven_mask,
        "overcooked_polygons": overcooked_polys,
        "undercooked_polygons": undercooked_polys,
        "uneven_polygons": uneven_polys,
        "overcooked_pct": round(overcooked_pct, 2),
        "undercooked_pct": round(undercooked_pct, 2),
        "uneven_pct": round(uneven_pct, 2),
        "total_defect_pct": round(total_defect_pct, 2),
        "defects_detected": defects_detected,
        "pixel_bi": pixel_bi,
        "l_norm": l_norm,
        "a_norm": a_norm,
        "b_norm": b_norm
    }


# ============================================================================
# 5. STANDARDIZED CIE-LAB & GLCM FEATURE EXTRACTION
# ============================================================================

def extract_cie_lab_features(
    l_norm: np.ndarray,
    a_norm: np.ndarray,
    b_norm: np.ndarray,
    food_mask: np.ndarray,
    golden_lab: Tuple[float, float, float]
) -> Dict[str, float]:
    """
    Extracts Food Science CIE-Lab metrics (Browning Index BI, Delta E, Color Mean/Std).
    """
    mask_indices = food_mask > 0
    if not np.any(mask_indices):
        return {
            "l_mean": 50.0, "l_std": 0.0,
            "a_mean": 15.0, "a_std": 0.0,
            "b_mean": 25.0, "b_std": 0.0,
            "browning_index": 45.0,
            "delta_e": 0.0
        }

    l_vals = l_norm[mask_indices]
    a_vals = a_norm[mask_indices]
    b_vals = b_norm[mask_indices]

    l_mean = float(np.mean(l_vals))
    l_std = float(np.std(l_vals))
    a_mean = float(np.mean(a_vals))
    a_std = float(np.std(a_vals))
    b_mean = float(np.mean(b_vals))
    b_std = float(np.std(b_vals))

    denom = 5.645 * l_mean + a_mean - 3.012 * b_mean
    if abs(denom) < 1e-4:
        denom = 1e-4
    x_mean = (a_mean + 1.75 * l_mean) / denom
    bi = float(100.0 * (x_mean - 0.31) / 0.17)
    bi = max(0.0, min(150.0, bi))

    delta_e = float(math.sqrt(
        (l_mean - golden_lab[0])**2 +
        (a_mean - golden_lab[1])**2 +
        (b_mean - golden_lab[2])**2
    ))

    return {
        "l_mean": round(l_mean, 2),
        "l_std": round(l_std, 2),
        "a_mean": round(a_mean, 2),
        "a_std": round(a_std, 2),
        "b_mean": round(b_mean, 2),
        "b_std": round(b_std, 2),
        "browning_index": round(bi, 2),
        "delta_e": round(delta_e, 2)
    }


def extract_glcm_texture(
    image_bgr: np.ndarray,
    food_mask: np.ndarray
) -> Dict[str, float]:
    """
    Calculates Gray-Level Co-occurrence Matrix (GLCM) texture metrics
    (Contrast, Dissimilarity, Homogeneity, Energy, Correlation).
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    
    y_indices, x_indices = np.where(food_mask > 0)
    if len(y_indices) == 0:
        return {
            "contrast": 150.0,
            "dissimilarity": 8.0,
            "homogeneity": 0.65,
            "energy": 0.12,
            "correlation": 0.85
        }
        
    min_y, max_y = np.min(y_indices), np.max(y_indices)
    min_x, max_x = np.min(x_indices), np.max(x_indices)
    
    cropped_gray = gray[min_y:max_y+1, min_x:max_x+1]
    cropped_mask = food_mask[min_y:max_y+1, min_x:max_x+1]
    
    quantized = (cropped_gray // 8).astype(np.uint8)
    quantized[cropped_mask == 0] = 0
    
    if SKIMAGE_AVAILABLE:
        try:
            glcm = graycomatrix(
                quantized,
                distances=[1, 2],
                angles=[0, np.pi/4, np.pi/2, 3*np.pi/4],
                levels=32,
                symmetric=True,
                normed=True
            )
            contrast = float(np.mean(graycoprops(glcm, 'contrast')))
            dissimilarity = float(np.mean(graycoprops(glcm, 'dissimilarity')))
            homogeneity = float(np.mean(graycoprops(glcm, 'homogeneity')))
            energy = float(np.mean(graycoprops(glcm, 'energy')))
            correlation = float(np.mean(graycoprops(glcm, 'correlation')))
        except Exception:
            contrast, dissimilarity, homogeneity, energy, correlation = 120.0, 7.5, 0.70, 0.15, 0.88
    else:
        diff_h = np.abs(quantized[:, 1:].astype(np.float32) - quantized[:, :-1].astype(np.float32))
        valid_h = (cropped_mask[:, 1:] > 0) & (cropped_mask[:, :-1] > 0)
        
        contrast = float(np.mean(diff_h[valid_h]**2) if np.any(valid_h) else 100.0)
        dissimilarity = float(np.mean(diff_h[valid_h]) if np.any(valid_h) else 6.0)
        homogeneity = float(np.mean(1.0 / (1.0 + diff_h[valid_h])) if np.any(valid_h) else 0.70)
        energy = 0.15
        correlation = 0.85

    return {
        "contrast": round(contrast, 2),
        "dissimilarity": round(dissimilarity, 2),
        "homogeneity": round(homogeneity, 3),
        "energy": round(energy, 3),
        "correlation": round(correlation, 3)
    }


# ============================================================================
# 6. EXPLAINABLE DEFECT ANNOTATION & BASE64 GENERATOR
# ============================================================================

def generate_annotated_image(
    image_bgr: np.ndarray,
    seg_results: Dict[str, Any],
    metrics: Dict[str, Any],
    status: str,
    action_feedback: str
) -> str:
    """
    Renders high-contrast Explainable AI visual feedback directly onto the image:
    - Red translucent polygon overlays for Overcooked/Burnt zones
    - Yellow translucent polygon overlays for Undercooked/Pale zones
    - Orange translucent polygon overlays for Uneven zones
    - Color calibration HUD & target crosshair
    - Quality status badge & quantitative telemetry box
    """
    canvas = image_bgr.copy()
    h, w = canvas.shape[:2]
    
    # 1. Overlay translucent defect masks
    overlay = canvas.copy()
    
    if seg_results["overcooked_pct"] > 0:
        overlay[seg_results["overcooked_mask"] > 0] = [68, 68, 239]
        
    if seg_results["undercooked_pct"] > 0:
        overlay[seg_results["undercooked_mask"] > 0] = [21, 204, 250]
        
    if seg_results["uneven_pct"] > 0:
        overlay[seg_results["uneven_mask"] > 0] = [60, 146, 251]

    cv2.addWeighted(overlay, 0.45, canvas, 0.55, 0, canvas)
    
    # 2. Draw sharp contour boundaries around defects
    def draw_polys(polys: List[List[List[int]]], color_bgr: Tuple[int, int, int], label: str):
        for poly in polys:
            pts = np.array(poly, np.int32).reshape((-1, 1, 2))
            cv2.polylines(canvas, [pts], isClosed=True, color=color_bgr, thickness=2, lineType=cv2.LINE_AA)
            if len(poly) > 0 and cv2.contourArea(pts) > 400:
                cx, cy = poly[0][0], poly[0][1]
                cv2.rectangle(canvas, (cx - 4, cy - 18), (cx + 90, cy + 2), (15, 23, 42), -1)
                cv2.putText(canvas, label, (cx, cy - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color_bgr, 1, cv2.LINE_AA)

    draw_polys(seg_results["overcooked_polygons"], (68, 68, 239), "OVERCOOKED")
    draw_polys(seg_results["undercooked_polygons"], (21, 204, 250), "UNDERCOOKED")
    draw_polys(seg_results["uneven_polygons"], (60, 146, 251), "UNEVEN")

    # 3. Top HUD: Calibration Target in Top Right
    anchor_box_w, anchor_box_h = int(w * 0.18), int(h * 0.18)
    ax1, ay1 = w - anchor_box_w - 10, 10
    ax2, ay2 = w - 10, 10 + anchor_box_h
    cv2.rectangle(canvas, (ax1, ay1), (ax2, ay2), (0, 240, 255), 1, cv2.LINE_AA)
    cv2.putText(canvas, "COLOR ANCHOR", (ax1 + 4, ay1 + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 240, 255), 1, cv2.LINE_AA)

    # 4. Top Left QC Status Badge
    status_colors = {
        "PASSED": (74, 222, 128),
        "NEEDS_ADJUSTMENT": (21, 204, 250),
        "UNDER_COOKED": (21, 204, 250),
        "OVER_COOKED": (68, 68, 239),
        "UNEVEN_SEASONING": (60, 146, 251),
        "FAILED": (68, 68, 239)
    }
    badge_color = status_colors.get(status, (200, 200, 200))
    
    cv2.rectangle(canvas, (10, 10), (220, 52), (15, 23, 42), -1)
    cv2.rectangle(canvas, (10, 10), (220, 52), badge_color, 2)
    cv2.putText(canvas, f"STATUS: {status}", (20, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.60, badge_color, 2, cv2.LINE_AA)

    # 5. Bottom Telemetry Overlay
    hud_h = 70
    cv2.rectangle(canvas, (0, h - hud_h), (w, h), (10, 15, 30), -1)
    cv2.line(canvas, (0, h - hud_h), (w, h - hud_h), (51, 65, 85), 1)

    bi_str = f"BI: {metrics.get('browning_index', 0.0)}"
    de_str = f"dE: {metrics.get('delta_e', 0.0)}"
    homo_str = f"Homo: {metrics.get('texture_homogeneity', 0.0)}"
    defect_str = f"Defect: {metrics.get('defect_area_percentage', 0.0)}%"

    cv2.putText(canvas, f"RASA-AI ENGINE 1 | {bi_str} | {de_str} | {homo_str} | {defect_str}",
                (15, h - 42), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (226, 232, 240), 1, cv2.LINE_AA)
    
    short_feedback = (action_feedback[:60] + "...") if len(action_feedback) > 60 else action_feedback
    cv2.putText(canvas, f"Action: {short_feedback}",
                (15, h - 18), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (148, 163, 184), 1, cv2.LINE_AA)

    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 88]
    _, buffer = cv2.imencode('.jpg', canvas, encode_param)
    b64_str = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')
    return b64_str
