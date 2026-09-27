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
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash Vision',
    badge: 'Vision Multimodal (Paling Pintar)',
    speed: '~3.5s',
    description: 'Model vision multimodal dengan mata optik AI nyata. Mampu melihat dan membedakan detail visual (ekor udang, daging ayam, potongan tempe mendoan, keripik, dsb).'
  },
  {
    id: 'nemotron-3-super',
    name: 'Nemotron 3 Super',
    badge: 'Tercepat & Sensorik ~1.8s',
    speed: '~1.8s',
    description: 'Model penalaran sensori tercepat untuk korelasi parameter spektrofotometri dan kekerasan.'
  },
  {
    id: 'nemotron-3-ultra',
    name: 'Nemotron 3 Ultra',
    badge: 'Deep Knowledge',
    speed: '~2.2s',
    description: 'Model penalaran mendalam NVIDIA untuk analisis tekstur dan profil mutu pangan.'
  },
  {
    id: 'nemotron-3.5-lightning',
    name: 'Nemotron 3.5 Lightning',
    badge: 'High Throughput',
    speed: '~3.5s',
    description: 'Arsitektur Lightning untuk pemrosesan teks dan data analitik skala tinggi.'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash Vision',
    badge: 'Ultra Vision Multimodal',
    speed: '~6.5s',
    description: 'Model vision generasi terbaru dengan kapabilitas deteksi objek visual beresolusi tinggi.'
  },
  {
    id: 'nemotron-3-nano-omni',
    name: 'Nemotron 3 Nano Omni',
    badge: 'Ultra-Compact',
    speed: '~1.1s',
    description: 'Model nano berkecepatan instan untuk respons cepat.'
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
    description: 'Model neural efisien untuk identifikasi pola citra.'
  },
  {
    id: 'laguna-s2.1',
    name: 'Laguna S 2.1',
    badge: 'Balanced Neural',
    speed: '~2.8s',
    description: 'Model penalaran seimbang untuk verifikasi silang standar SNI pangan.'
  }
];

export const DEFAULT_GUTS_MODEL = 'gemini-3.7-flash';

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
  
  if (lab.a >= 17.0) {
    cues.push('rona kemerahan-oranye pekat khas ekor udang krispi atau olahan seafood');
  } else if (lab.l >= 64 && lab.b >= 34 && lab.a <= 13.5) {
    cues.push('warna kuning keemasan bumbu kunyit kedelai khas tempe/tahu goreng');
  } else if (lab.a >= 12.8 && lab.a <= 17.5 && lab.l <= 65) {
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
  preferredModelId?: string,
  base64Image?: string
): Promise<GutsClassificationResult | null> {
  const targetModel = preferredModelId || DEFAULT_GUTS_MODEL;
  
  // Prioritized fallback queue starting with user's selected model
  const modelQueue = [
    targetModel,
    'gemini-3.7-flash',
    'nemotron-3-super',
    'nemotron-3-ultra',
    'nemotron-3.5-lightning'
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  const visualDesc = deriveVisualCues(lab, df);
  const profilesListText = profiles.map((p, i) => `${i + 1}. ${p.name} [id: ${p.id}]`).join('\n');

  const textSystemPrompt = `Anda adalah sistem pakar computer vision & food quality assurance RASA AI (CPPOB BPOM & SNI Indonesia).
Tugas: Klasifikasikan identitas hidangan makanan dari data spektral kamera dan tekstur berikut.

Data Sampel:
- Spektral CIE-Lab: L*=${lab.l}, a*=${lab.a}, b*=${lab.b}
- Dimensi Fraktal Porositas: Df=${df}, Porositas=${porosity}%
- Ciri Visual Spektral: ${visualDesc}
- Petunjuk Nama Berkas: ${fileNameHint || 'tidak ada'}

Daftar Acuan Profil Standar Mutu SNI:
${profilesListText}

PANDUAN KLASIFIKASI:
- Bila rona merah kemerahan sangat tinggi (a* >= 17) atau ada tampak ekor oranye, itu adalah "udang-crispy" (Udang Goreng Tepung / Ebi Furai).
- Bila warna kuning keemasan (b* tinggi) dan ada aroma kedelai/kunyit/daun bawang, itu adalah "tahu-tempe-crispy" (Tempe & Tahu Goreng).
- Bila warna cokelat browning Maillard (a* 13-17) dan kerak ayam krispi, itu adalah "ayam-krispi" (Ayam Goreng Krispi).
- Jangan samakan Tempe Goreng dengan Kentang Goreng (French Fries).
- Berikan output HANYA satu objek JSON valid tanpa pembungkus markdown apapun:
{"detectedProfileId": "id-pilihan", "foodName": "Nama Makanan", "confidence": 98, "reason": "Alasan singkat deteksi"}`;

  for (const model of modelQueue) {
    const t0 = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500); // 8.5s timeout

      let requestBody: any;

      if (model.includes('gemini') && base64Image) {
        requestBody = {
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Anda adalah sistem pakar Computer Vision RASA AI (CPPOB BPOM & SNI Indonesia).
Lihat foto makanan ini dengan seksama. Kenali objeknya secara presisi (apakah udang goreng dengan ekor kemerahan, ayam goreng berpori, tempe mendoan berdaun bawang, keripik, kentang, dsb).

Pilihan Profil SNI:
${profilesListText}

PANDUAN:
- Perhatikan detail visual: jika tampak ekor udang berwarna oranye/kemerahan, itu adalah "udang-crispy" (Udang Goreng Tepung / Ebi Furai).
- Jika tampak irisan daun bawang dan butiran kedelai tempe, itu adalah "tahu-tempe-crispy" (Tempe & Tahu Goreng).
- Jika berupa potongan ayam bertulang/berkerak browning, itu adalah "ayam-krispi" (Ayam Goreng Krispi).

Jawab HANYA satu objek JSON valid:
{"detectedProfileId": "id-pilihan", "foodName": "Nama Makanan", "confidence": 98, "reason": "Alasan visual detail (sebutkan bentuk, ekor udang/tulang ayam/tekstur)"}`
                },
                {
                  type: 'image_url',
                  image_url: { url: base64Image }
                }
              ]
            }
          ],
          max_tokens: 200,
          temperature: 0.1
        };
      } else {
        requestBody = {
          model: model,
          messages: [
            { role: 'user', content: textSystemPrompt }
          ],
          max_tokens: 250,
          temperature: 0.1
        };
      }

      const res = await fetch(GUTS_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GUTS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
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
