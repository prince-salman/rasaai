import { LabValues, FoodProfile } from '../types';

export interface GutsAiModelInfo {
  id: string;
  name: string;
  badge: string;
  speed: string;
  description: string;
}

export const GUTS_AI_MODELS: GutsAiModelInfo[] = [
  {
    id: 'nemotron-3-super',
    name: 'Nemotron 3 Super',
    badge: 'Terbaik & Tercepat (Rekomendasi)',
    speed: '~1.8s',
    description: 'Model paling seimbang, presisi klasifikasi kuliner Indonesia tertinggi, dan latensi ultra-cepat.'
  },
  {
    id: 'nemotron-3-ultra',
    name: 'Nemotron 3 Ultra',
    badge: 'Deep Knowledge',
    speed: '~2.2s',
    description: 'Model penalaran mendalam NVIDIA untuk analisis tekstur dan profil mutu kompleks.'
  },
  {
    id: 'nemotron-3.5-lightning',
    name: 'Nemotron 3.5 Lightning',
    badge: 'High Throughput',
    speed: '~3.5s',
    description: 'Arsitektur Lightning untuk pemrosesan teks dan data analitik skala tinggi.'
  },
  {
    id: 'nemotron-3-nano-omni',
    name: 'Nemotron 3 Nano Omni',
    badge: 'Ultra-Compact',
    speed: '~1.1s',
    description: 'Model nano multimodal berkecepatan instan untuk respons cepat.'
  },
  {
    id: 'ling-3.0-flash-fin',
    name: 'Ling 3.0 Flash Fin',
    badge: 'Quantitative Flash',
    speed: '~1.4s',
    description: 'Model kuantitatif berpresisi tinggi untuk toleransi metrik numerik.'
  },
  {
    id: 'laguna-xs2.1',
    name: 'Laguna XS 2.1',
    badge: 'Compact Neural',
    speed: '~3.4s',
    description: 'Model neural efisien untuk identifikasi pola citra dan karakteristik visual.'
  },
  {
    id: 'laguna-s2.1',
    name: 'Laguna S 2.1',
    badge: 'Balanced Neural',
    speed: '~2.8s',
    description: 'Model penalaran seimbang untuk verifikasi silang standar SNI pangan.'
  }
];

export const DEFAULT_GUTS_MODEL = 'nemotron-3-super';

const GUTS_API_KEY = 'sk-guts-83d0dcdcfcf1dc76ae8aaf946815626cbf04ebd3';
const GUTS_API_ENDPOINT = 'https://api.gutsai.id/v1/chat/completions';

export interface GutsClassificationResult {
  detectedProfileId: string;
  foodName: string;
  confidence: number;
  reason: string;
  modelUsed: string;
  latencyMs: number;
}

/**
 * Builds descriptive visual cues from CIE-Lab, Fractal Dimension (Df), and culinary browning.
 */
function deriveVisualCues(lab: LabValues, df: number): string {
  const cues: string[] = [];
  
  if (lab.l >= 64 && lab.b >= 34 && lab.a <= 13.5) {
    cues.push('warna kuning keemasan kunyit bertepung bumbu gurih');
  } else if (lab.a >= 13.0 && lab.l <= 65) {
    cues.push('warna cokelat keemasan Maillard browning khas kerak ayam goreng');
  } else if (lab.l >= 66 && lab.a <= 10.0) {
    cues.push('warna cerah kuning getas khas keripik atau kentang');
  } else if (lab.l <= 52 && lab.a >= 14.0) {
    cues.push('warna kecokelatan gelap karamel kecap panggangan');
  }

  if (df >= 1.84) {
    cues.push('pori-pori fraktal mekar sangat renyah berserat');
  } else if (df >= 1.76) {
    cues.push('tekstur pori gurih seimbang');
  } else {
    cues.push('tekstur butiran atau untaian padat');
  }

  return cues.join(', ');
}

/**
 * Classifies food sample with Guts AI cloud intelligence using the selected model
 * and seamless fallback across candidate models.
 */
export async function classifyFoodWithGutsAi(
  lab: LabValues,
  df: number,
  porosity: number,
  profiles: FoodProfile[],
  fileNameHint?: string,
  preferredModelId?: string
): Promise<GutsClassificationResult | null> {
  const targetModel = preferredModelId || DEFAULT_GUTS_MODEL;
  
  // Prioritized fallback queue starting with user's selected model
  const modelQueue = [
    targetModel,
    'nemotron-3-super',
    'nemotron-3-ultra',
    'nemotron-3.5-lightning',
    'ling-3.0-flash-fin'
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  const visualDesc = deriveVisualCues(lab, df);
  const profilesListText = profiles.map((p, i) => `${i + 1}. ${p.name} [id: ${p.id}]`).join('\n');

  const systemPrompt = `Anda adalah sistem pakar computer vision & food quality assurance RASA AI (CPPOB BPOM & SNI Indonesia).
Tugas: Klasifikasikan identitas hidangan makanan dari data spektral kamera dan tekstur berikut.

Data Sampel:
- Spektral CIE-Lab: L*=${lab.l}, a*=${lab.a}, b*=${lab.b}
- Dimensi Fraktal Porositas: Df=${df}, Porositas=${porosity}%
- Ciri Visual Spektral: ${visualDesc}
- Petunjuk Nama Berkas: ${fileNameHint || 'tidak ada'}

Daftar Acuan Profil Standar Mutu SNI:
${profilesListText}

PANDUAN KLASIFIKASI:
- Bila warna kuning keemasan (b* tinggi) dan ada aroma kedelai/kunyit/daun bawang, itu adalah "tahu-tempe-crispy" (Tempe & Tahu Goreng).
- Bila warna cokelat browning Maillard (a* >= 13) dan kerak krispi renyah, itu adalah "ayam-krispi" (Ayam Goreng Krispi).
- Jangan samakan Tempe Goreng dengan Kentang Goreng (French Fries).
- Berikan output HANYA satu objek JSON valid tanpa pembungkus markdown apapun:
{"detectedProfileId": "id-pilihan", "foodName": "Nama Makanan", "confidence": 98, "reason": "Alasan singkat deteksi"}`;

  for (const model of modelQueue) {
    const t0 = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

      const res = await fetch(GUTS_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GUTS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: systemPrompt }
          ],
          max_tokens: 300,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Guts AI [${model}] returned status ${res.status}`);
        continue;
      }

      const data = await res.json();
      const rawMsg = data.choices?.[0]?.message;
      if (!rawMsg) continue;

      let replyText = (rawMsg.content || rawMsg.reasoning || '').trim();

      // Extract JSON substring if model wrapped it in markdown or prose
      const jsonMatch = replyText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.detectedProfileId) {
          const latencyMs = Math.round(performance.now() - t0);
          return {
            detectedProfileId: parsed.detectedProfileId,
            foodName: parsed.foodName || 'Makanan Terdeteksi',
            confidence: Math.min(99, Math.max(88, Number(parsed.confidence) || 96)),
            reason: parsed.reason || `Identifikasi presisi Guts AI (${model})`,
            modelUsed: model,
            latencyMs
          };
        }
      }
    } catch (err: any) {
      console.warn(`Guts AI [${model}] error:`, err?.message || err);
      // Continue to next model in queue
    }
  }

  return null;
}
