import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, X } from 'lucide-react';
import { format, isValid, newCode, pull, push, removeRemote } from './cloudSync';

const KEY = 'todo_sync_code';
const MSG: Record<string, string> = {
  bad_code: 'الكود غلط أو مفيش نسخة تتفك بيه.',
  not_found: 'مفيش نسخة على الكود ده لسه. ارفع من الجهاز التاني الأول.',
  too_large: 'البيانات كبيرة أوي للمزامنة.',
  server: 'السيرفر مش متاح دلوقتي، جرّب بعد شوية.',
};

type Props = { tasks: any[]; onRestore: (tasks: any[]) => void };

// Optional end-to-end encrypted sync. With a code connected, changes upload automatically (debounced).
export default function SyncPanel({ tasks, onRestore }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(() => localStorage.getItem(KEY) || '');
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [when, setWhen] = useState('');
  const first = useRef(true);

  const say = (t: string, ok: boolean) => setMsg({ t, ok });
  const fail = (e: any) => say(MSG[e?.message] || MSG.server, false);
  const save = (c: string) => { setCode(c); c ? localStorage.setItem(KEY, c) : localStorage.removeItem(KEY); };
  const fmt = (iso: string) => { try { return new Date(iso).toLocaleString('ar-EG'); } catch { return iso; } };

  // auto-upload after changes when connected (skips the first render)
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!code) return;
    const h = setTimeout(() => { push(code, JSON.stringify(tasks)).then((u) => setWhen(fmt(u))).catch(() => {}); }, 15000);
    return () => clearTimeout(h);
  }, [tasks, code]);

  const run = async (fn: () => Promise<void>) => { setBusy(true); setMsg(null); try { await fn(); } catch (e) { fail(e); } setBusy(false); };

  const create = () => run(async () => {
    const c = newCode();
    const u = await push(c, JSON.stringify(tasks));
    save(c); setWhen(fmt(u)); say('اتعمل الكود واترفعت مهامك مشفّرة. احفظ الكود دلوقتي.', true);
  });
  const connect = () => run(async () => {
    if (!isValid(input)) { say('الكود لازم يبقى 20 حرف ورقم.', false); return; }
    const r = await pull(input);
    const data = JSON.parse(r.text);
    if (!Array.isArray(data)) throw new Error('bad_code');
    onRestore(data); save(format(input)); setWhen(fmt(r.updated)); setInput(''); say(`اتربط الجهاز واتسترجع ${data.length} مهمة.`, true);
  });
  const download = () => run(async () => {
    if (!window.confirm('هيكتب فوق مهامك الحالية بالنسخة اللي في السحابة. تكمّل؟')) return;
    const r = await pull(code); const data = JSON.parse(r.text);
    if (!Array.isArray(data)) throw new Error('bad_code');
    onRestore(data); setWhen(fmt(r.updated)); say('اتسترجعت المهام من السحابة.', true);
  });
  const upload = () => run(async () => { const u = await push(code, JSON.stringify(tasks)); setWhen(fmt(u)); say('اترفعت المهام (مشفّرة).', true); });
  const forget = () => { if (window.confirm('الجهاز ده هينسى الكود (النسخة بتفضل في السحابة). متأكد إنك حافظه؟')) { save(''); say('اتفصل الجهاز.', true); } };
  const wipe = () => run(async () => {
    if (!window.confirm('تمسح نسختك من السحابة نهائيًا؟ مهامك على الأجهزة مش هتتأثر.')) return;
    await removeRemote(code); save(''); say('اتمسحت النسخة من السحابة.', true);
  });

  const btn = 'px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50';
  return (
    <>
      <button onClick={() => setOpen(true)} className={`p-2 rounded-full transition-colors ${code ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`} title={code ? 'المزامنة شغالة' : 'مزامنة سحابية'} aria-label="مزامنة سحابية">
        <Cloud size={20} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="مزامنة سحابية" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 text-slate-200 max-h-[90vh] overflow-auto" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold text-white">مزامنة سحابية مشفّرة</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-white" aria-label="إغلاق"><X size={20} /></button>
            </div>
            <p className="text-sm text-slate-400 mb-4 leading-7">مهامك على أكتر من جهاز من غير حساب. بتتشفّر على جهازك قبل ما تتبعت، والسيرفر مبيشوفش غير نص مشفّر. اللي معاه الكود بس يفتحها، فاحفظه.</p>
            {!code ? (
              <div className="space-y-3">
                <button disabled={busy} onClick={create} className={`${btn} bg-indigo-600 hover:bg-indigo-500 text-white w-full`}>اعمل كود مزامنة جديد</button>
                <label className="block text-sm text-slate-400 mt-3" htmlFor="sync-in">أو اكتب كود من جهاز تاني</label>
                <input id="sync-in" dir="ltr" value={input} onChange={(e) => setInput(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} className="w-full rounded-xl bg-slate-800 border border-white/10 px-3 py-2 font-mono text-sm" />
                <button disabled={busy} onClick={connect} className={`${btn} bg-white/10 hover:bg-white/20 w-full`}>اربط الجهاز ونزّل مهامي</button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm text-slate-400" htmlFor="sync-code">كودك السري (احفظه في مكان آمن)</label>
                <input id="sync-code" readOnly dir="ltr" value={code} className="w-full rounded-xl bg-slate-800 border border-white/10 px-3 py-2 font-mono text-sm" />
                <p className="text-xs text-slate-500">{when ? `آخر رفع: ${when}` : 'التغييرات بتترفع لوحدها بعد ثواني من كل تعديل.'}</p>
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy} onClick={upload} className={`${btn} bg-indigo-600 hover:bg-indigo-500 text-white`}>ارفع دلوقتي</button>
                  <button disabled={busy} onClick={download} className={`${btn} bg-white/10 hover:bg-white/20`}>نزّل من السحابة</button>
                  <button disabled={busy} onClick={forget} className={`${btn} bg-white/10 hover:bg-white/20`}>افصل الجهاز</button>
                  <button disabled={busy} onClick={wipe} className={`${btn} bg-rose-600/80 hover:bg-rose-600 text-white`}>امسح نسختي</button>
                </div>
              </div>
            )}
            {msg && <p role="status" className={`mt-4 text-sm rounded-xl px-3 py-2 ${msg.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>{msg.t}</p>}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
