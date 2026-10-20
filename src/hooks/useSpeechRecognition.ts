import { useCallback, useEffect, useRef, useState } from "react";

//ses tanıma apisi Web Speech    her tarayıcıda farklı isim
interface SpeechResultList {
  length: number;
  [i: number]: { isFinal: boolean; 0: { transcript: string } };
}
interface SpeechResultEvent {
  resultIndex: number;
  results: SpeechResultList;
}
interface SpeechErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

const Ctor: RecognitionCtor | undefined =
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition;

const SILENCE_MS = 4000; // bu kadar konuşulmazsa dinleme kendiliğinden biter
const STOP_GRACE_MS = 1500; // durdurduktan sonra son sonucu 1.5 sn bekkl
const ERRORS: Record<string, string> = {
  "not-allowed": "Mikrofn izni verilmedi. Tarayıcının adres çubuğundan mikrofon iznini açabilirsiniz.",
  "service-not-allowed": "Bu tarayıcıda ses tanıma kullanılamıyor.",
  "audio-capture": "Mikrofon bulunamadı. Bağlı olduğundan emin olun.",
  network: "Ses tanıma servisine bağlanılamadı. İnternet bağlantınızı kontrol edin.",
  "no-speech": "Ses algılanamadı, tekrar deneyin.",
};

interface Options {
  lang?: string;
  onText: (text: string) => void;
  onError: (message: string) => void;
}

export function useSpeechRecognition({ lang = "tr-TR", onText, onError }: Options) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const silenceRef = useRef<number>();
  const handlers = useRef({ onText, onError });
  handlers.current = { onText, onError };

  const graceRef = useRef<number>();
  const stoppingRef = useRef<Recognition | null>(null); // durdurulmuş, son sonucu beklenen oturum

  const clearSilence = () => window.clearTimeout(silenceRef.current);

  const detach = useCallback(() => {
    clearSilence();
    window.clearTimeout(graceRef.current);
    const rec = recRef.current;
    recRef.current = null;
    setListening(false);
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    rec.abort();
  }, []);

  const stop = useCallback(() => {  // o ana kadar geönderilecek
    clearSilence();
    const rec = recRef.current;
    if (!rec) return;
    setListening(false); // tarayıcının bitişi bildirmesini bekleiyo
    rec.onerror = null;  // kullanıcı durdurdu
    stoppingRef.current = rec;
    rec.stop();         
    window.clearTimeout(graceRef.current);
    graceRef.current = window.setTimeout(() => {
      if (recRef.current === rec) detach();
    }, STOP_GRACE_MS);
  }, [detach]);

  const cancel = detach;

  const start = useCallback(() => {
    if (!Ctor) return;
    if (recRef.current) detach(); 

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    let finalText = "";
    const armSilence = () => {
      clearSilence();
      silenceRef.current = window.setTimeout(() => {
        if (recRef.current === rec) stop();
      }, SILENCE_MS);
    };

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      handlers.current.onText((finalText + interim).replace(/\s+/g, " ").trim());
      if (recRef.current === rec && stoppingRef.current !== rec) armSilence();
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      handlers.current.onError(ERRORS[e.error] ?? `Ses tanıma hatası: ${e.error}`);
    };
    rec.onend = () => {
      if (recRef.current !== rec) return; // eski oturumun geç bitişi yenisini kapatmasın
      clearSilence();
      window.clearTimeout(graceRef.current);
      recRef.current = null;
      setListening(false);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      armSilence();
    } catch {
      recRef.current = null;
      handlers.current.onError("Ses tanıma başlatılamadı.");
    }
  }, [lang, detach, stop]);

  useEffect(() => cancel, [cancel]);

  return { supported: !!Ctor, listening, start, stop, cancel };
}
