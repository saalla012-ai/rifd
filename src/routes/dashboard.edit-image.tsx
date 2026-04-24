import { useRef, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Upload,
  Wand2,
  Loader2,
  Download,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { editImage } from "@/server/ai-functions";
import { supabase } from "@/integrations/supabase/client";
import {
  QuotaExceededDialog,
  isQuotaError,
} from "@/components/quota-exceeded-dialog";

export const Route = createFileRoute("/dashboard/edit-image")({
  head: () => ({
    meta: [
      { title: "تعديل صور المنتجات بالـAI — رِفد" },
      {
        name: "description",
        content:
          "ارفع صورة منتجك وعدّلها بالذكاء الاصطناعي: إزالة خلفية، تحسين إضاءة، إضافة نصوص عربية، خلفيات احترافية.",
      },
    ],
  }),
  component: EditImagePage,
});

const PRESETS = [
  {
    id: "remove-bg",
    label: "إزالة الخلفية",
    desc: "خلفية بيضاء نظيفة جاهزة للمتجر",
    prompt:
      "Remove the background completely and replace it with a clean pure white background. Keep the product centered, sharp, and well-lit. Professional product photography style.",
  },
  {
    id: "enhance",
    label: "تحسين الإضاءة والجودة",
    desc: "ألوان أوضح وتفاصيل أحدّ",
    prompt:
      "Enhance the lighting, sharpness, and color vibrancy of this product photo. Make it look professional and ready for an e-commerce store. Keep the original composition.",
  },
  {
    id: "luxury-bg",
    label: "خلفية فخمة",
    desc: "خلفية رخامية ذهبية راقية",
    prompt:
      "Replace the background with a luxurious marble and gold gradient backdrop. Add subtle elegant lighting. Premium product photography for high-end Saudi market.",
  },
  {
    id: "lifestyle-bg",
    label: "خلفية حياتية",
    desc: "بيئة طبيعية للمنتج",
    prompt:
      "Place this product in a natural lifestyle setting: a warm, modern Saudi home with soft daylight. Photorealistic, professional composition.",
  },
  {
    id: "add-text",
    label: "إضافة نص عربي",
    desc: "عنوان أو سعر بخط بارز",
    prompt:
      "Add a bold Arabic text overlay at the top: 'عرض خاص'. Use elegant typography that fits the product style. Position it where it doesn't cover the product.",
  },
  {
    id: "instagram-square",
    label: "بوست إنستقرام",
    desc: "إطار 1:1 جاهز للنشر",
    prompt:
      "Reframe this image into a perfect square Instagram post. Add a subtle gradient background that complements the product colors. Center the product elegantly.",
  },
];

const MAX_BYTES = 8 * 1024 * 1024; // 8MB قبل الترميز

function EditImagePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState<string>("");
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [quotaDialog, setQuotaDialog] = useState<{
    open: boolean;
    reason?: string;
  }>({ open: false });

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("الملف يجب أن يكون صورة");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("حجم الصورة يجب ألا يتجاوز 8MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalDataUrl(reader.result as string);
      setOriginalName(file.name);
      setResultUrl(null);
    };
    reader.onerror = () => toast.error("فشل قراءة الصورة");
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const clear = () => {
    setOriginalDataUrl(null);
    setOriginalName("");
    setResultUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const go = async () => {
    if (!originalDataUrl) {
      toast.error("ارفع صورة أولاً");
      return;
    }
    const finalPrompt = customPrompt.trim() || preset.prompt;
    if (!finalPrompt) {
      toast.error("اختر قالباً أو اكتب وصف تعديل");
      return;
    }

    setLoading(true);
    setResultUrl(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("سجّل الدخول أولاً");

      const out = await editImage({
        data: {
          imageDataUrl: originalDataUrl,
          prompt: finalPrompt,
          templateTitle: customPrompt.trim() ? "تعديل مخصص" : preset.label,
          templateId: customPrompt.trim() ? "custom-edit" : preset.id,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setResultUrl(out.url);
      setRemaining(out.remainingCredits);
      toast.success("تم تعديل الصورة ✨");
      router.invalidate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ في التعديل";
      if (isQuotaError(msg)) {
        setQuotaDialog({ open: true, reason: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">تعديل صور المنتجات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ارفع صورة منتجك وعدّلها بالذكاء الاصطناعي خلال ثوانٍ
          </p>
        </div>
        {remaining !== null && (
          <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
            باقي {remaining.toLocaleString("ar-SA")} نقطة
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* العمود الأيمن: الإدخال */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-4">
          {/* رفع الصورة */}
          <div>
            <Label>الصورة الأصلية</Label>
            {!originalDataUrl ? (
              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 p-6 text-center transition-colors hover:border-primary/40 hover:bg-secondary/50"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">اسحب صورة هنا أو اضغط للرفع</p>
                <p className="text-xs text-muted-foreground">
                  JPG / PNG / WEBP — حتى 8MB
                </p>
              </div>
            ) : (
              <div className="mt-1 relative overflow-hidden rounded-lg border border-border bg-secondary/30">
                <img
                  src={originalDataUrl}
                  alt={originalName}
                  className="h-auto max-h-72 w-full object-contain"
                />
                <button
                  onClick={clear}
                  className="absolute top-2 left-2 rounded-full bg-background/90 p-1.5 text-muted-foreground shadow-soft hover:text-foreground"
                  aria-label="حذف الصورة"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/60 to-transparent p-2 text-xs text-white">
                  {originalName}
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* القوالب */}
          <div>
            <Label>قالب التعديل</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPresetId(p.id)}
                  className={cn(
                    "rounded-lg border p-3 text-right text-sm transition-colors",
                    presetId === p.id && !customPrompt.trim()
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="font-bold">{p.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* prompt حر اختياري */}
          <div>
            <Label htmlFor="custom-prompt">
              أو اكتب تعديلك بنفسك (اختياري)
            </Label>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="مثلاً: غيّر الخلفية لذهبية فخمة وأضف ظل خفيف للمنتج"
              className="mt-1 min-h-20"
              maxLength={1500}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              لو كتبت هنا، سيتم تجاهل القالب أعلاه
            </p>
          </div>

          <Button
            onClick={go}
            disabled={loading || !originalDataUrl}
            className="w-full gradient-primary text-primary-foreground shadow-elegant"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> جاري التعديل...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> عدّل الصورة
              </>
            )}
          </Button>
        </div>

        {/* العمود الأيسر: النتيجة */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">النتيجة</h3>
            {resultUrl && (
              <a
                href={resultUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs hover:bg-accent"
              >
                <Download className="h-3 w-3" /> تنزيل
              </a>
            )}
          </div>
          <div className="mt-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
            {resultUrl ? (
              <img
                src={resultUrl}
                alt="الصورة المعدّلة"
                className="h-full w-full object-contain"
              />
            ) : loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs">قد يستغرق 15-30 ثانية</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <ImageIcon className="h-8 w-8 opacity-40" />
                <p>الصورة المعدّلة بتظهر هنا</p>
              </div>
            )}
          </div>
          <div className="mt-3 text-center">
            <Link
              to="/dashboard/library"
              className="text-xs text-primary hover:underline"
            >
              شوف كل توليداتك في المكتبة ←
            </Link>
          </div>
        </div>
      </div>

      <QuotaExceededDialog
        open={quotaDialog.open}
        onOpenChange={(v) => setQuotaDialog((s) => ({ ...s, open: v }))}
        kind="صورة"
        reason={quotaDialog.reason}
      />
    </DashboardShell>
  );
}
