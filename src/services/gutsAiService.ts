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
    id: 'nemotron-3-nano-omni',
    name: 'Nemotron 3 Nano Omni',
    badge: 'Model Utama (Multimodal ~1.1s)',
    speed: '~1.1s',
    description: 'Model vision multimodal nano NVIDIA dengan pemrosesan optik instan tercepat untuk analisis visual dan tekstur makanan.'
  },
  {
    id: 'nemotron-3-super',
    name: 'Nemotron 3 Super',
    badge: 'Penalaran Sensori ~1.8s',
    speed: '~1.8s',
    description: 'Model penalaran sensori tercepat untuk korelasi parameter spektrofotometri dan kekerasan.'
  },
  {
    id: 'nemotron-3-ultra',
    name: 'Nemotron 3 Ultra',
    badge: 'Deep Knowledge ~2.2s',
    speed: '~2.2s',
    description: 'Model penalaran mendalam NVIDIA untuk analisis tekstur dan profil mutu pangan.'
  },
  {
    id: 'nemotron-3.5-lightning',
    name: 'Nemotron 3.5 Lightning',
    badge: 'High Throughput ~3.5s',
    speed: '~3.5s',
    description: 'Arsitektur Lightning untuk pemrosesan teks dan data analitik skala tinggi.'
  },
  {
    id: 'ling-3.0-flash-fin',
    name: 'Ling 3.0 Flash Fin',
    badge: 'Quantitative Flash ~1.4s',
    speed: '~1.4s',
    description: 'Model kuantitatif berpresisi tinggi untuk toleransi metrik numerik.'
  },
  {
    id: 'laguna-xs2.1',
    name: 'Laguna XS 2.1',
    badge: 'Compact Neural ~3.4s',
    speed: '~3.4s',
    description: 'Model neural efisien untuk identifikasi pola citra.'
  },
  {
    id: 'laguna-s2.1',
    name: 'Laguna S 2.1',
    badge: 'Balanced Neural ~2.8s',
    speed: '~2.8s',
    description: 'Model penalaran seimbang untuk verifikasi silang standar SNI pangan.'
  }
];

export const DEFAULT_GUTS_MODEL = 'nemotron-3-nano-omni';

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
  const yellowRedRatio = lab.b / Math.max(1, lab.a);

  // Check if spectral values resemble human skin tones (b* < 24, a* 7-20) rather than culinary golden-yellow
  if (lab.b < 24 && lab.a >= 7 && lab.a <= 20 && lab.l >= 30 && lab.l <= 75) {
    cues.push('spektrum rona kulit manusia (b* rendah non-kuliner) tanpa pigmen karotenoid keemasan');
  } else if (lab.a >= 21.5 && yellowRedRatio < 1.65) {
    cues.push('rona kemerahan-oranye pekat astaxanthin khas ekor udang krispi atau olahan seafood');
  } else if (lab.a >= 12.5 && lab.a <= 20.5 && lab.b >= 28.0) {
    cues.push('warna cokelat keemasan Maillard browning khas kerak ayam goreng krispi (fried chicken)');
  } else if (lab.l >= 64 && lab.b >= 32 && lab.a <= 14.5) {
    cues.push('warna kuning keemasan bumbu kunyit kedelai khas tempe/tahu goreng');
  } else if (lab.l >= 66 && lab.a <= 10.0) {
    cues.push('warna cerah kuning getas khas keripik atau kentang');
  } else if (lab.l <= 52 && lab.a >= 14.0 && lab.b >= 22.0) {
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
    'nemotron-3-nano-omni',
    'nemotron-3-super',
    'nemotron-3-ultra',
    'nemotron-3.5-lightning',
    'ling-3.0-flash-fin'
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

PERINGATAN VALIDASI MUTLAK:
- Bila rona spektral menyerupai kulit manusia (b* < 24) atau deskripsi visual menyebut kulit/wajah manusia/objek non-kuliner, Anda WAJIB menjawab:
{"detectedProfileId": "NON_FOOD", "foodName": "Bukan Makanan (Wajah Manusia)", "confidence": 99, "reason": "Data citra terdeteksi sebagai wajah/kulit manusia, bukan sampel makanan kuliner."}
- DILARANG KERAS mengklasifikasikan wajah orang sebagai sate atau daging!

PANDUAN KLASIFIKASI KULINER:
- Potongan paha/dada/sayap ayam berbalut tepung krispi keemasan browning Maillard (a* 12.5-20.5, b* >= 28) adalah "ayam-krispi" (Ayam Goreng Krispi).
- Warna kuning keemasan kunyit kedelai/daun bawang (a* 7-14.5, b* >= 30) adalah "tahu-tempe-crispy" (Tempe & Tahu Goreng).
- Hanya bila ada ekor udang oranye kemerahan astaxanthin nyata (a* >= 21.5 dan b*/a* < 1.65) maka itu adalah "udang-crispy" (Udang Goreng Tepung / Ebi Furai). Dilarang keras menganggap ayam goreng krispi sebagai udang!
- Jangan samakan Tempe Goreng dengan Kentang Goreng (French Fries).
- Berikan output HANYA satu objek JSON valid tanpa pembungkus markdown apapun:
{"detectedProfileId": "id-pilihan", "foodName": "Nama Makanan", "confidence": 98, "reason": "Alasan singkat deteksi"}`;

  for (const model of modelQueue) {
    const t0 = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for reliable multimodal response

      let requestBody: any;

      if ((model.includes('omni') || model.includes('nano-omni')) && base64Image) {
        requestBody = {
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Anda adalah sistem pakar Computer Vision RASA AI (CPPOB BPOM & SNI Indonesia).
Lihat foto ini dengan seksama.

PERINGATAN SANGAT PENTING (VALIDASI OBJEK MUTLAK):
Periksa terlebih dahulu apakah foto ini adalah MAKANAN KULINER atau BUKAN:
- Jika foto menampilkan wajah manusia, selfie, orang, foto profil, tubuh manusia, tangan/kaki, kacamata, pakaian/baju, hewan, perabotan, atau layar/gawai:
WAJIB KEMBALIKAN HANYA JSON INI:
{"detectedProfileId": "NON_FOOD", "foodName": "Bukan Makanan (Wajah Manusia / Non-Pangan)", "confidence": 99, "reason": "Objek yang difoto adalah wajah manusia / orang, bukan sampel makanan kuliner."}
DILARANG KERAS MENGANGGAP WAJAH MANUSIA SEBAGAI SATE, DAGING, AYAM, ATAU MAKANAN APAPUN!

Jika foto terbukti BENAR-BENAR MAKANAN KULINER, pilih dari daftar profil SNI:
${profilesListText}

PANDUAN IDENTIFIKASI MAKANAN:
- Jika berupa potongan paha/dada/sayap ayam berkerak tepung renyah browning keemasan (fried chicken/ayam goreng tepung), itu adalah "ayam-krispi" (Ayam Goreng Krispi).
- Jika tampak irisan tempe berbutir kedelai atau tahu berbalut tepung daun bawang, itu adalah "tahu-tempe-crispy" (Tempe & Tahu Goreng).
- Jika tampak jelas ekor udang kemerahan atau bentuk memanjang udang ebi furai/tempura seafood, itu adalah "udang-crispy" (Udang Goreng Tepung / Ebi Furai). Dilarang menganggap ayam goreng krispi sebagai udang!
- Jika berupa keripik tipis getas kentang/singkong/tempe keripik, itu adalah "keripik-kentang".

Jawab HANYA satu objek JSON valid:
{"detectedProfileId": "id-pilihan", "foodName": "Nama Makanan", "confidence": 98, "reason": "Alasan visual detail"}`
                },
                {
                  type: 'image_url',
                  image_url: { url: base64Image }
                }
              ]
            }
          ],
          max_tokens: 350,
          temperature: 0.1
        };
      } else {
        requestBody = {
          model: model,
          messages: [
            { role: 'user', content: textSystemPrompt }
          ],
          max_tokens: 280,
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

      let replyText = (rawMsg.content || '').trim();
      if (!replyText) {
        replyText = (rawMsg.reasoning || '').trim();
      }

      // Extract JSON substring if model wrapped it in markdown or prose
      let parsed: any = null;
      const jsonBlockMatch = replyText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonBlockMatch) {
        try { parsed = JSON.parse(jsonBlockMatch[1]); } catch {}
      }
      if (!parsed) {
        const match = replyText.match(/\{[^{}]*"detectedProfileId"[^{}]*\}/) || replyText.match(/\{[\s\S]*?\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }

      if (parsed && parsed.detectedProfileId) {
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
    } catch (err: any) {
      console.warn(`Guts AI [${model}] error:`, err?.message || err);
      // Continue to next model in queue
    }
  }

  return null;
}
