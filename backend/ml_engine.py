"""
RASA-AI — Multimodal Machine Learning & Prescriptive Tabular Engine
===================================================================
Engine 2: Quality Classification & Actionable Kitchen Recommendation
- Menu Specification Catalog (Indonesian Culinary Standards)
- Multimodal Feature Integration (Vision Metrics + Operational Context)
- Machine Learning Classifier (LightGBM / Gradient Boosting / Random Forest)
- Prescriptive Recommendation Logic (Calculated Time Delta, Flame Adjustments, Action Steps)
- Synthetic Kitchen Dataset Generator & Auto-Trainer
"""

from __future__ import annotations
import os
import json
import random
from typing import Dict, List, Tuple, Any, Optional
import numpy as np

try:
    import joblib
    from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, accuracy_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


# ============================================================================
# 1. MENU SPECIFICATION CATALOG (GOLDEN STANDARDS)
# ============================================================================

MENU_CATALOG: Dict[str, Dict[str, Any]] = {
    "AYAM_GORENG_LENGKUAS": {
        "menu_id": "AYAM_GORENG_LENGKUAS",
        "name": "Ayam Goreng Lengkuas",
        "category": "Deep Fried Poultry",
        "description": "Ayam goreng rempah bertabur serundeng lengkuas renyah keemasan.",
        "golden_lab": (54.0, 12.0, 48.0),
        "target_bi": 150.0,
        "bi_tolerance": 35.0,
        "standard_cooking_time_mins": 10.0,
        "standard_temp_c": 175.0,
        "target_homogeneity": 0.72,
        "target_contrast": 135.0,
        "max_tolerated_defect_pct": 8.0,
        "key_ingredients": ["Ayam", "Lengkuas Parut", "Kunyit", "Bawang Putih", "Ketumbar"],
        "instructions_guide": {
            "UNDER_COOKED": "Kulit ayam belum renyah keemasan (pucat). Balik potongan ayam dan lanjutkan menggoreng selama {delta_time:.1f} menit pada api sedang ({temp_target}C).",
            "OVER_COOKED": "Serundeng lengkuas mulai menggelap/gosong (BI tinggi). Segera angkat ayam dari minyak panas dan tiriskan pada cooling rack.",
            "UNEVEN_SEASONING": "Serundeng lengkuas menggumpal di satu sisi. Aduk minyak perlahan dengan gerakan memutar agar rempah lengkuas menempel merata.",
            "PASSED": "Mutu visual & kematangan sempurna! Tekstur renyah keemasan merata. Siap disajikan."
        }
    },
    "RENDANG_DAGING": {
        "menu_id": "RENDANG_DAGING",
        "name": "Rendang Daging Sapi",
        "category": "Slow Cooked Meat",
        "description": "Rendang Minang otentik berwarna cokelat gelap terkaramelisasi berminyak kelapa.",
        "golden_lab": (28.0, 10.0, 16.0),
        "target_bi": 155.0,
        "bi_tolerance": 25.0,
        "standard_cooking_time_mins": 45.0,
        "standard_temp_c": 95.0,
        "target_homogeneity": 0.60,
        "target_contrast": 210.0,
        "max_tolerated_defect_pct": 6.0,
        "key_ingredients": ["Daging Sapi", "Santan Kental", "Cabai Merah", "Rempah Gulai"],
        "instructions_guide": {
            "UNDER_COOKED": "Bumbu masih pada tahap kalio (cokelat kemerahan, belum karamelisasi). Lanjutkan reduksi bumbu {delta_time:.1f} menit dengan api kecil sambil diaduk perlahan.",
            "OVER_COOKED": "Minyak dedak gosong berlebih di dasar wajan. Matikan api seketika, pindahkan daging ke wadah bersih tanpa mengeruk kerak dasar.",
            "UNEVEN_SEASONING": "Bumbu dedak belum merata melapisi potongan daging. Aduk lipat perlahan dari tepi wajan ke tengah selama 2 menit.",
            "PASSED": "Karamelisasi rendang sempurna (Dedak hitam kecokelatan berkilau minyak). Siap disajikan."
        }
    },
    "NASI_GORENG_SPESIAL": {
        "menu_id": "NASI_GORENG_SPESIAL",
        "name": "Nasi Goreng Spesial Wok",
        "category": "Wok Stir Fry",
        "description": "Nasi goreng kecap gurih beraroma smoky wok hei dengan warna kecokelatan merata.",
        "golden_lab": (55.0, 12.0, 32.0),
        "target_bi": 105.0,
        "bi_tolerance": 20.0,
        "standard_cooking_time_mins": 5.0,
        "standard_temp_c": 210.0,
        "target_homogeneity": 0.78,
        "target_contrast": 95.0,
        "max_tolerated_defect_pct": 7.0,
        "key_ingredients": ["Nasi Pera", "Kecap Manis", "Telur", "Bawang Merah", "Minyak Wijen"],
        "instructions_guide": {
            "UNDER_COOKED": "Kecap manis belum terkaramelisasi merata (nasi belang putih). Tambahkan api ke level 4 (high heat) dan aduk cepat selama {delta_time:.1f} menit.",
            "OVER_COOKED": "Bulir nasi terlalu kering dan terdapat bintik gosong di dasar wok. Angkat segera dan jangan campurkan bagian dasar wajan.",
            "UNEVEN_SEASONING": "Distribusi kecap tidak rata (ada gumpalan nasi putih). Tambahkan 5 ml bumbu cair dan tekan-tekan nasi dengan spatula hingga butiran terpisah.",
            "PASSED": "Aroma Wok Hei dan warna karamel nasi goreng sangat merata. Siap plating!"
        }
    },
    "SATE_AYAM_MADURA": {
        "menu_id": "SATE_AYAM_MADURA",
        "name": "Sate Ayam Madura",
        "category": "Charcoal Grilled Skewers",
        "description": "Sate ayam panggang dengan karamelisasi bumbu kacang kecap dan aroma arang seimbang.",
        "golden_lab": (38.0, 15.0, 24.0),
        "target_bi": 140.0,
        "bi_tolerance": 25.0,
        "standard_cooking_time_mins": 8.0,
        "standard_temp_c": 230.0,
        "target_homogeneity": 0.65,
        "target_contrast": 180.0,
        "max_tolerated_defect_pct": 8.0,
        "key_ingredients": ["Fillet Dada Ayam", "Kecap Manis", "Bumbu Kacang", "Minyak Bawang"],
        "instructions_guide": {
            "UNDER_COOKED": "Daging bagian dalam masih kenyal/pucat. Celup kembali ke bumbu kecap dan bakar {delta_time:.1f} menit di atas bara api sedang.",
            "OVER_COOKED": "Area gosong (charring) melebihi batas toleransi. Kikis bagian gosong dengan pisau sebelum disiram bumbu kacang hangat.",
            "UNEVEN_SEASONING": "Glaze bumbu kecap tidak merata pada tiap tusuk. Oleskan kuas bumbu secara menyeluruh pada sisi yang pucat.",
            "PASSED": "Kematangan daging empuk juicy dengan charring karamel gurih sempurna!"
        }
    },
    "TUMIS_KANGKUNG_TERASI": {
        "menu_id": "TUMIS_KANGKUNG_TERASI",
        "name": "Tumis Kangkung Terasi",
        "category": "High-Heat Stir Fry",
        "description": "Tumis kangkung renyah hijau segar berlumur saus terasi harum.",
        "golden_lab": (48.0, -18.0, 28.0),
        "target_bi": 22.0,
        "bi_tolerance": 15.0,
        "standard_cooking_time_mins": 3.0,
        "standard_temp_c": 190.0,
        "target_homogeneity": 0.70,
        "target_contrast": 120.0,
        "max_tolerated_defect_pct": 6.0,
        "key_ingredients": ["Kangkung Segar", "Terasi Udang", "Cabai Rawit", "Bawang Putih"],
        "instructions_guide": {
            "UNDER_COOKED": "Batang kangkung masih terlalu kaku/mentah. Tutup wajan selama {delta_time:.1f} menit pada api besar.",
            "OVER_COOKED": "Daun kangkung layu kecokelatan (overcooked). Matikan api dan segera sajikan agar tidak semakin menghitam karena sisa panas wajan.",
            "UNEVEN_SEASONING": "Terasi belum larut sempurna (terdapat gumpalan bumbu). Aduk cepat dengan 1 sdm air kaldu panas.",
            "PASSED": "Kangkung tetap hijau segar dengan kerenyahan batang yang pas!"
        }
    }
}

MENU_KEYS = list(MENU_CATALOG.keys())
STATUS_CLASSES = ["PASSED", "UNDER_COOKED", "OVER_COOKED", "UNEVEN_SEASONING"]


# ============================================================================
# 2. SYNTHETIC MULTIMODAL KITCHEN DATASET GENERATOR
# ============================================================================

def generate_synthetic_kitchen_dataset(n_samples_per_menu: int = 400) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Generates a realistic, domain-grounded multimodal dataset simulating
    kitchen thermal variations, smartphone sensor drifts, and cooking mistakes.
    
    Returns:
        Tuple of (X_features, y_labels, feature_names).
    """
    feature_names = [
        "menu_idx", "batch_size", "elapsed_time",
        "l_mean", "l_std", "a_mean", "a_std", "b_mean", "b_std",
        "browning_index", "delta_e",
        "contrast", "homogeneity", "dissimilarity", "energy", "correlation",
        "overcooked_pct", "undercooked_pct", "uneven_pct", "total_defect_pct"
    ]
    
    X_rows = []
    y_rows = []
    
    np.random.seed(42)
    random.seed(42)

    for menu_idx, (m_id, spec) in enumerate(MENU_CATALOG.items()):
        g_l, g_a, g_b = spec["golden_lab"]
        g_bi = spec["target_bi"]
        std_time = spec["standard_cooking_time_mins"]
        
        for _ in range(n_samples_per_menu):
            batch_size = random.choice([1.0, 2.0, 3.0, 4.0, 5.0])
            status_choice = random.choices(
                STATUS_CLASSES,
                weights=[0.45, 0.20, 0.20, 0.15],
                k=1
            )[0]
            
            # Simulate features based on operational state
            if status_choice == "PASSED":
                elapsed_time = std_time * np.random.uniform(0.95, 1.08)
                l_mean = g_l + np.random.normal(0, 2.0)
                a_mean = g_a + np.random.normal(0, 1.5)
                b_mean = g_b + np.random.normal(0, 2.0)
                bi = g_bi + np.random.normal(0, 3.0)
                delta_e = np.sqrt((l_mean - g_l)**2 + (a_mean - g_a)**2 + (b_mean - g_b)**2)
                contrast = spec["target_contrast"] + np.random.normal(0, 10.0)
                homogeneity = spec["target_homogeneity"] + np.random.normal(0, 0.03)
                dissimilarity = 6.0 + np.random.normal(0, 0.8)
                energy = 0.15 + np.random.normal(0, 0.02)
                correlation = 0.85 + np.random.normal(0, 0.03)
                overcooked_pct = np.random.uniform(0.0, 3.0)
                undercooked_pct = np.random.uniform(0.0, 3.5)
                uneven_pct = np.random.uniform(0.0, 11.0)
                
            elif status_choice == "UNDER_COOKED":
                elapsed_time = std_time * np.random.uniform(0.40, 0.80)
                l_mean = g_l + np.random.uniform(8.0, 18.0) # Paler
                a_mean = g_a - np.random.uniform(3.0, 8.0)
                b_mean = g_b - np.random.uniform(2.0, 6.0)
                bi = g_bi - np.random.uniform(12.0, 25.0)
                delta_e = np.sqrt((l_mean - g_l)**2 + (a_mean - g_a)**2 + (b_mean - g_b)**2)
                contrast = spec["target_contrast"] * 0.7 + np.random.normal(0, 8.0)
                homogeneity = spec["target_homogeneity"] + np.random.uniform(0.05, 0.12)
                dissimilarity = 4.0 + np.random.normal(0, 0.5)
                energy = 0.20 + np.random.normal(0, 0.03)
                correlation = 0.90 + np.random.normal(0, 0.02)
                overcooked_pct = 0.0
                undercooked_pct = np.random.uniform(14.0, 45.0)
                uneven_pct = np.random.uniform(1.0, 8.0)

            elif status_choice == "OVER_COOKED":
                elapsed_time = std_time * np.random.uniform(1.25, 1.70)
                l_mean = max(10.0, g_l - np.random.uniform(10.0, 22.0)) # Darker / charred
                a_mean = g_a + np.random.uniform(2.0, 8.0)
                b_mean = max(5.0, g_b - np.random.uniform(4.0, 12.0))
                bi = min(240.0, g_bi + np.random.uniform(15.0, 38.0))
                delta_e = np.sqrt((l_mean - g_l)**2 + (a_mean - g_a)**2 + (b_mean - g_b)**2)
                contrast = spec["target_contrast"] * 1.5 + np.random.normal(0, 15.0)
                homogeneity = max(0.3, spec["target_homogeneity"] - np.random.uniform(0.12, 0.25))
                dissimilarity = 12.0 + np.random.normal(0, 1.5)
                energy = 0.08 + np.random.normal(0, 0.02)
                correlation = 0.70 + np.random.normal(0, 0.04)
                overcooked_pct = np.random.uniform(14.0, 55.0)
                undercooked_pct = 0.0
                uneven_pct = np.random.uniform(2.0, 10.0)

            else: # UNEVEN_SEASONING
                elapsed_time = std_time * np.random.uniform(0.85, 1.15)
                l_mean = g_l + np.random.normal(0, 4.0)
                a_mean = g_a + np.random.normal(0, 3.0)
                b_mean = g_b + np.random.normal(0, 4.0)
                bi = g_bi + np.random.normal(0, 6.0)
                delta_e = np.sqrt((l_mean - g_l)**2 + (a_mean - g_a)**2 + (b_mean - g_b)**2)
                contrast = spec["target_contrast"] * 1.2 + np.random.normal(0, 12.0)
                homogeneity = max(0.4, spec["target_homogeneity"] - np.random.uniform(0.08, 0.18))
                dissimilarity = 9.0 + np.random.normal(0, 1.0)
                energy = 0.11 + np.random.normal(0, 0.02)
                correlation = 0.78 + np.random.normal(0, 0.03)
                overcooked_pct = np.random.uniform(2.0, 6.0)
                undercooked_pct = np.random.uniform(2.0, 6.0)
                uneven_pct = np.random.uniform(16.0, 40.0)
                homogeneity = max(0.4, spec["target_homogeneity"] - np.random.uniform(0.08, 0.18))
                dissimilarity = 9.0 + np.random.normal(0, 1.0)
                energy = 0.11 + np.random.normal(0, 0.02)
                correlation = 0.78 + np.random.normal(0, 0.03)
                overcooked_pct = np.random.uniform(2.0, 7.0)
                undercooked_pct = np.random.uniform(2.0, 8.0)
                uneven_pct = np.random.uniform(12.0, 30.0)

            l_std = np.random.uniform(4.0, 12.0) if status_choice != "UNEVEN_SEASONING" else np.random.uniform(14.0, 24.0)
            a_std = np.random.uniform(2.0, 6.0) if status_choice != "UNEVEN_SEASONING" else np.random.uniform(8.0, 14.0)
            b_std = np.random.uniform(3.0, 7.0) if status_choice != "UNEVEN_SEASONING" else np.random.uniform(9.0, 16.0)
            total_defect_pct = overcooked_pct + undercooked_pct + uneven_pct
            
            row = [
                float(menu_idx), float(batch_size), round(elapsed_time, 2),
                round(l_mean, 2), round(l_std, 2), round(a_mean, 2), round(a_std, 2),
                round(b_mean, 2), round(b_std, 2),
                round(bi, 2), round(delta_e, 2),
                round(contrast, 2), round(homogeneity, 3), round(dissimilarity, 2),
                round(energy, 3), round(correlation, 3),
                round(overcooked_pct, 2), round(undercooked_pct, 2), round(uneven_pct, 2),
                round(total_defect_pct, 2)
            ]
            X_rows.append(row)
            y_rows.append(status_choice)

    return np.array(X_rows, dtype=np.float32), np.array(y_rows), feature_names


# ============================================================================
# 3. MACHINE LEARNING ENGINE CLASS
# ============================================================================

class RasaMLEngine:
    """
    Multimodal ML Engine for Culinary Quality Classification and
    Prescriptive Recipe Parameter Adjustment.
    """
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "rasa_ml_model.joblib")
        self.model = None
        self.feature_names = []
        self._initialize_or_load()

    def _initialize_or_load(self):
        """Loads saved model or trains a high-precision multimodal model automatically."""
        if os.path.exists(self.model_path) and SKLEARN_AVAILABLE:
            try:
                bundle = joblib.load(self.model_path)
                self.model = bundle["model"]
                self.feature_names = bundle["feature_names"]
                print(f"[RASA-AI ML] Loaded pre-trained model from {self.model_path}")
                return
            except Exception as e:
                print(f"[RASA-AI ML] Error loading model: {e}. Re-training...")

        self.train_and_save()

    def train_and_save(self) -> Dict[str, Any]:
        """Trains the ML model on synthetic kitchen benchmark dataset."""
        print("[RASA-AI ML] Generating multimodal culinary training dataset...")
        X, y, feature_names = generate_synthetic_kitchen_dataset(n_samples_per_menu=500)
        self.feature_names = feature_names

        if SKLEARN_AVAILABLE:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
            
            # Use HistGradientBoostingClassifier / RandomForest
            self.model = RandomForestClassifier(
                n_estimators=120,
                max_depth=12,
                min_samples_split=4,
                random_state=42,
                n_jobs=-1
            )
            self.model.fit(X_train, y_train)
            
            y_pred = self.model.predict(X_test)
            acc = float(accuracy_score(y_test, y_pred))
            print(f"[RASA-AI ML] Training Complete. Validation Accuracy: {acc * 100:.2f}%")
            
            bundle = {
                "model": self.model,
                "feature_names": self.feature_names,
                "accuracy": acc
            }
            joblib.dump(bundle, self.model_path)
            return {"accuracy": acc, "status": "TRAINED"}
        else:
            print("[RASA-AI ML] scikit-learn not available, using heuristic rule-based engine.")
            return {"accuracy": 1.0, "status": "HEURISTIC_MODE"}

    def predict(
        self,
        menu_id: str,
        batch_size: float,
        elapsed_time: float,
        vision_metrics: Dict[str, Any],
        seg_results: Dict[str, Any]
    ) -> Tuple[str, float, Dict[str, float]]:
        """
        Executes multimodal inference combining visual telemetry + operational context.
        
        Returns:
            Tuple of (predicted_status, quality_score, class_probabilities).
        """
        if menu_id not in MENU_CATALOG:
            menu_id = "AYAM_GORENG_LENGKUAS"

        menu_idx = float(MENU_KEYS.index(menu_id))
        spec = MENU_CATALOG[menu_id]

        bi = float(vision_metrics.get("browning_index", 45.0))
        delta_e = float(vision_metrics.get("delta_e", 5.0))
        homogeneity = float(vision_metrics.get("texture_homogeneity", 0.70))
        contrast = float(vision_metrics.get("texture_contrast", 120.0))
        l_mean = float(vision_metrics.get("l_mean", 50.0))
        l_std = float(vision_metrics.get("l_std", 6.0))
        a_mean = float(vision_metrics.get("a_mean", 15.0))
        a_std = float(vision_metrics.get("a_std", 4.0))
        b_mean = float(vision_metrics.get("b_mean", 25.0))
        b_std = float(vision_metrics.get("b_std", 5.0))
        dissimilarity = float(vision_metrics.get("texture_dissimilarity", 6.0))
        energy = float(vision_metrics.get("texture_energy", 0.15))
        correlation = float(vision_metrics.get("texture_correlation", 0.85))

        overcooked_pct = float(seg_results.get("overcooked_pct", 0.0))
        undercooked_pct = float(seg_results.get("undercooked_pct", 0.0))
        uneven_pct = float(seg_results.get("uneven_pct", 0.0))
        total_defect_pct = float(seg_results.get("total_defect_pct", 0.0))

        feat_vector = np.array([[
            menu_idx, float(batch_size), float(elapsed_time),
            l_mean, l_std, a_mean, a_std, b_mean, b_std,
            bi, delta_e,
            contrast, homogeneity, dissimilarity, energy, correlation,
            overcooked_pct, undercooked_pct, uneven_pct, total_defect_pct
        ]], dtype=np.float32)

        predicted_status = "PASSED"
        class_probs = {"PASSED": 0.85, "UNDER_COOKED": 0.05, "OVER_COOKED": 0.05, "UNEVEN_SEASONING": 0.05}

        if self.model is not None and SKLEARN_AVAILABLE:
            try:
                preds = self.model.predict(feat_vector)
                probs = self.model.predict_proba(feat_vector)[0]
                predicted_status = str(preds[0])
                for idx, c_name in enumerate(self.model.classes_):
                    class_probs[str(c_name)] = round(float(probs[idx]), 3)
            except Exception as e:
                print(f"[RASA-AI ML] Inference fallback: {e}")
                predicted_status = self._rule_based_classify(spec, bi, delta_e, total_defect_pct, overcooked_pct, undercooked_pct)
        else:
            predicted_status = self._rule_based_classify(spec, bi, delta_e, total_defect_pct, overcooked_pct, undercooked_pct)

        # Calculate continuous Quality Score (0 to 100)
        bi_err = abs(bi - spec["target_bi"]) / max(1.0, spec["bi_tolerance"])
        de_penalty = min(35.0, max(0.0, delta_e - 3.5) * 1.5)
        defect_penalty = min(40.0, max(0.0, (overcooked_pct + undercooked_pct) - 5.0) * 2.0 + max(0.0, uneven_pct - 12.0) * 1.2)
        bi_penalty = min(25.0, max(0.0, bi_err - 0.5) * 10.0)

        quality_score = max(5.0, min(100.0, 100.0 - de_penalty - defect_penalty - bi_penalty))
        
        # Ensure status alignment with quality score and severe defects
        if (overcooked_pct > 6.0 or undercooked_pct > 8.0 or quality_score < 75.0) and predicted_status == "PASSED":
            if overcooked_pct > 6.0:
                predicted_status = "OVER_COOKED"
            elif undercooked_pct > 8.0:
                predicted_status = "UNDER_COOKED"
            elif uneven_pct > 14.0:
                predicted_status = "UNEVEN_SEASONING"

        return predicted_status, round(quality_score, 1), class_probs

    def _rule_based_classify(
        self,
        spec: Dict[str, Any],
        bi: float,
        delta_e: float,
        total_defect_pct: float,
        overcooked_pct: float,
        undercooked_pct: float
    ) -> str:
        """Heuristic classifier fallback."""
        target_bi = spec["target_bi"]
        tol = spec["bi_tolerance"]
        
        if overcooked_pct > 6.0 or bi > (target_bi + tol * 1.5):
            return "OVER_COOKED"
        if undercooked_pct > 8.0 or bi < (target_bi - tol * 1.5):
            return "UNDER_COOKED"
        if total_defect_pct > spec["max_tolerated_defect_pct"]:
            return "UNEVEN_SEASONING"
        return "PASSED"

    def prescribe_recommendation(
        self,
        menu_id: str,
        predicted_status: str,
        elapsed_time: float,
        batch_size: float,
        vision_metrics: Dict[str, Any],
        seg_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Task B: Prescriptive Recommendation Engine.
        Calculates exact additional cook duration, flame/temperature level,
        seasoning additions, and mechanical chef actions.
        
        Returns:
            Dict with actionable kitchen steps, delta time, and formatted prompt.
        """
        if menu_id not in MENU_CATALOG:
            menu_id = "AYAM_GORENG_LENGKUAS"
            
        spec = MENU_CATALOG[menu_id]
        std_time = spec["standard_cooking_time_mins"] * (1.0 + 0.15 * (batch_size - 1.0))
        bi = float(vision_metrics.get("browning_index", 45.0))
        target_bi = spec["target_bi"]
        
        delta_time_mins = 0.0
        flame_level = "SEDANG (Normal)"
        temp_target = int(spec["standard_temp_c"])
        action_steps = []

        if predicted_status == "UNDER_COOKED":
            # Estimate needed extra time based on BI deficit
            bi_ratio = max(0.2, (target_bi - bi) / max(5.0, target_bi))
            delta_time_mins = round(max(0.75, std_time * bi_ratio * 0.45), 1)
            flame_level = "SEDANG-TINGGI (Level 4)"
            action_steps = [
                f"Lanjutkan proses masak selama +{delta_time_mins} menit pada suhu ~{temp_target}°C.",
                "Balik potongan masakan 180° untuk meratakan paparan panas.",
                "Pastikan minyak/kuah menyelimuti seluruh permukaan bahan masakan."
            ]

        elif predicted_status == "OVER_COOKED":
            delta_time_mins = 0.0
            flame_level = "MATIKAN API / SEGERA ANGKAT"
            action_steps = [
                "Segera angkat masakan dari sumber panas untuk mencegah over-browning.",
                "Tiriskan di atas rak pendingin berlubang (cooling rack).",
                "Pisahkan bagian yang terlalu gosong (poligon merah) sebelum disajikan."
            ]

        elif predicted_status == "UNEVEN_SEASONING":
            delta_time_mins = 1.0
            flame_level = "KECIL (Level 2)"
            action_steps = [
                "Kecilkan api ke level 2 untuk mencegah area gelap semakin gosong.",
                "Aduk perlahan secara melingkar dari tepi luar ke tengah wajan.",
                "Jika bumbu menggumpal, tambahkan 1 sdm kuah/saus pengencer lalu aduk rata."
            ]

        else: # PASSED
            delta_time_mins = 0.0
            flame_level = "SIAP SAJI"
            action_steps = [
                "Standard mutu dan konsistensi warna LULUS kriteria Golden Sample.",
                "Lakukan plating sesuai standar SOP porsi cabang.",
                "Masakan siap disajikan ke pelanggan."
            ]

        # Format custom Indonesian chef feedback string
        template = spec["instructions_guide"].get(predicted_status, spec["instructions_guide"]["PASSED"])
        formatted_feedback = template.format(
            delta_time=delta_time_mins,
            temp_target=temp_target
        )

        return {
            "predicted_status": predicted_status,
            "actionable_feedback": formatted_feedback,
            "prescriptive_actions": action_steps,
            "adjustment_parameters": {
                "additional_time_mins": delta_time_mins,
                "flame_level": flame_level,
                "target_temperature_c": temp_target
            }
        }
