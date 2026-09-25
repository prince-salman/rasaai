"""
RASA-AI — Demo Culinary Sample Generator
========================================
Generates realistic high-quality synthetic food benchmark images for testing
and zero-camera instant UI simulation:
- Golden Sample (Passed)
- Overcooked / Burnt Sample (Failed / Needs Adjustment)
- Undercooked / Pale Sample (Needs Adjustment)
- Steamy / Foggy Lens Sample (Rejected by IQA)
- Glare / Flash-Reflected Sample (Mitigated by Glare Filter)
"""

import os
import cv2
import numpy as np


def create_demo_food_images(output_dir: str):
    """Creates synthetic benchmark images with realistic culinary features and color anchor."""
    os.makedirs(output_dir, exist_ok=True)
    w, h = 640, 480

    def add_color_anchor(img: np.ndarray):
        """Adds a standard neutral reference sticker in the top-right corner."""
        aw, ah = int(w * 0.18), int(h * 0.18)
        ax1, ay1 = w - aw - 12, 12
        ax2, ay2 = w - 12, 12 + ah
        
        # 4-quadrant calibration target: White, Neutral Gray (18%), Black, Cyan/Amber
        cv2.rectangle(img, (ax1, ay1), (ax2, ay2), (40, 40, 40), -1)
        
        mid_x = (ax1 + ax2) // 2
        mid_y = (ay1 + ay2) // 2
        
        # Quadrant 1: Calibrated White
        img[ay1+2:mid_y-1, ax1+2:mid_x-1] = [240, 240, 240]
        # Quadrant 2: 18% Neutral Gray
        img[ay1+2:mid_y-1, mid_x+1:ax2-2] = [118, 118, 118]
        # Quadrant 3: Deep Black
        img[mid_y+1:ay2-2, ax1+2:mid_x-1] = [25, 25, 25]
        # Quadrant 4: Calibration Amber
        img[mid_y+1:ay2-2, mid_x+1:ax2-2] = [30, 160, 220]
        
        cv2.rectangle(img, (ax1, ay1), (ax2, ay2), (255, 255, 255), 2)
        return img

    def make_plate_canvas(bg_color=(35, 38, 45), plate_color=(215, 220, 225)):
        """Draws a ceramic plate on a dark kitchen table."""
        img = np.zeros((h, w, 3), dtype=np.uint8)
        img[:] = bg_color
        # Add slight wooden/granite noise to background table
        noise = np.random.normal(0, 5, img.shape).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        # Plate rim
        center = (w // 2 - 20, h // 2 + 10)
        cv2.ellipse(img, center, (220, 165), 0, 0, 360, (180, 185, 190), -1, cv2.LINE_AA)
        cv2.ellipse(img, center, (205, 150), 0, 0, 360, plate_color, -1, cv2.LINE_AA)
        return img, center

    # 1. GOLDEN SAMPLE: Ayam Goreng Lengkuas (Golden Brown, uniform crispy crumb)
    img_golden, center = make_plate_canvas()
    # Draw fried chicken pieces (Warm golden brown BGR: ~[35, 120, 195])
    # Main chicken body
    cv2.ellipse(img_golden, (center[0] - 25, center[1]), (95, 70), -15, 0, 360, (30, 115, 190), -1, cv2.LINE_AA)
    cv2.ellipse(img_golden, (center[0] + 45, center[1] + 15), (75, 55), 25, 0, 360, (32, 120, 198), -1, cv2.LINE_AA)
    # Add galangal spice crumbs (serundeng) texture
    np.random.seed(101)
    for _ in range(1200):
        rx = int(np.random.normal(center[0], 65))
        ry = int(np.random.normal(center[1], 45))
        if 0 <= rx < w and 0 <= ry < h:
            crumb_col = (
                int(np.random.uniform(20, 45)),
                int(np.random.uniform(95, 140)),
                int(np.random.uniform(170, 225))
            )
            cv2.circle(img_golden, (rx, ry), np.random.randint(1, 4), crumb_col, -1)
    # Add subtle garnishes (green chili / lime)
    cv2.ellipse(img_golden, (center[0] + 110, center[1] - 40), (18, 10), 45, 0, 360, (35, 145, 45), -1, cv2.LINE_AA)
    img_golden = add_color_anchor(img_golden)
    cv2.imwrite(os.path.join(output_dir, "sample_ayam_golden.jpg"), img_golden)

    # 2. OVERCOOKED / BURNT SAMPLE (Charred dark patches, excessive BI)
    img_burnt, center = make_plate_canvas()
    cv2.ellipse(img_burnt, (center[0] - 25, center[1]), (95, 70), -15, 0, 360, (20, 65, 110), -1, cv2.LINE_AA)
    cv2.ellipse(img_burnt, (center[0] + 45, center[1] + 15), (75, 55), 25, 0, 360, (18, 55, 90), -1, cv2.LINE_AA)
    # Dark burnt / charred zone on right side
    cv2.ellipse(img_burnt, (center[0] + 55, center[1] + 10), (55, 40), 20, 0, 360, (12, 22, 38), -1, cv2.LINE_AA)
    # Burnt crumbs
    for _ in range(1400):
        rx = int(np.random.normal(center[0], 65))
        ry = int(np.random.normal(center[1], 45))
        if 0 <= rx < w and 0 <= ry < h:
            if rx > center[0]:
                crumb_col = (int(np.random.uniform(8, 22)), int(np.random.uniform(15, 40)), int(np.random.uniform(25, 60)))
            else:
                crumb_col = (int(np.random.uniform(18, 35)), int(np.random.uniform(70, 110)), int(np.random.uniform(130, 175)))
            cv2.circle(img_burnt, (rx, ry), np.random.randint(1, 4), crumb_col, -1)
    img_burnt = add_color_anchor(img_burnt)
    cv2.imwrite(os.path.join(output_dir, "sample_ayam_burnt.jpg"), img_burnt)

    # 3. UNDERCOOKED / PALE SAMPLE (Pale batter, low BI, insufficient browning)
    img_under, center = make_plate_canvas()
    # Pale yellow-white raw meat/batter (BGR: ~[120, 200, 235])
    cv2.ellipse(img_under, (center[0] - 25, center[1]), (95, 70), -15, 0, 360, (110, 185, 225), -1, cv2.LINE_AA)
    cv2.ellipse(img_under, (center[0] + 45, center[1] + 15), (75, 55), 25, 0, 360, (120, 195, 235), -1, cv2.LINE_AA)
    for _ in range(800):
        rx = int(np.random.normal(center[0], 60))
        ry = int(np.random.normal(center[1], 40))
        if 0 <= rx < w and 0 <= ry < h:
            crumb_col = (int(np.random.uniform(90, 140)), int(np.random.uniform(160, 210)), int(np.random.uniform(210, 245)))
            cv2.circle(img_under, (rx, ry), np.random.randint(1, 3), crumb_col, -1)
    img_under = add_color_anchor(img_under)
    cv2.imwrite(os.path.join(output_dir, "sample_ayam_undercooked.jpg"), img_under)

    # 4. STEAMY / FOGGY LENS SAMPLE (Boiling steam condensation haze & blur)
    img_steamy, center = make_plate_canvas()
    cv2.ellipse(img_steamy, (center[0] - 25, center[1]), (95, 70), -15, 0, 360, (30, 115, 190), -1, cv2.LINE_AA)
    cv2.ellipse(img_steamy, (center[0] + 45, center[1] + 15), (75, 55), 25, 0, 360, (32, 120, 198), -1, cv2.LINE_AA)
    img_steamy = add_color_anchor(img_steamy)
    # Heavy Gaussian blur to simulate severe out-of-focus & steam haze
    img_steamy = cv2.GaussianBlur(img_steamy, (45, 45), 25.0)
    # Add milky white fog overlay
    fog = np.full_like(img_steamy, 235)
    img_steamy = cv2.addWeighted(img_steamy, 0.45, fog, 0.55, 0)
    cv2.imwrite(os.path.join(output_dir, "sample_lens_steamy.jpg"), img_steamy)

    # 5. OILY GLARE SAMPLE (Hot oil flash reflection spots)
    img_glare, center = make_plate_canvas()
    cv2.ellipse(img_glare, (center[0] - 25, center[1]), (95, 70), -15, 0, 360, (30, 115, 190), -1, cv2.LINE_AA)
    cv2.ellipse(img_glare, (center[0] + 45, center[1] + 15), (75, 55), 25, 0, 360, (32, 120, 198), -1, cv2.LINE_AA)
    # Add intense specular reflection spots
    cv2.ellipse(img_glare, (center[0] - 15, center[1] - 10), (22, 14), -20, 0, 360, (255, 255, 255), -1, cv2.LINE_AA)
    cv2.ellipse(img_glare, (center[0] + 30, center[1] + 5), (18, 10), 30, 0, 360, (255, 255, 255), -1, cv2.LINE_AA)
    cv2.circle(img_glare, (center[0] - 50, center[1] + 15), 10, (255, 255, 255), -1)
    img_glare = add_color_anchor(img_glare)
    cv2.imwrite(os.path.join(output_dir, "sample_oily_glare.jpg"), img_glare)

    print(f"[RASA-AI] Generated 5 synthetic benchmark food samples in {output_dir}")


if __name__ == "__main__":
    demo_dir = os.path.join(os.path.dirname(__file__), "demo_samples")
    create_demo_food_images(demo_dir)
