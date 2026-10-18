// Sign in with an email and a code: the email step, the code step, then (when the account already has data and this
// phone does too) which data to keep. Used on first launch and from Me.
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { applySaved, checkCode, cleanEmail, deleteAccount, okEmail, readSaved, saveNow, sendCode, signOut, useAccount, type AuthErr } from '../lib/account.ts';
import { hasProfile, type Backup } from '../lib/backup.ts';
import { L, latin } from '../lib/i18n.ts';
import { fonts, useColors } from '../theme.ts';
import { Btn, Card, START, T } from './ui.tsx';

const ERR: Record<AuthErr, [string, string]> = {
  network: ['مفيش إنترنت دلوقتي. جربوا تاني بعد شوية.', 'No internet right now. Try again in a bit.'],
  wait: ['طلبات كتير ورا بعض. استنوا دقيقة وجربوا تاني.', 'Too many tries in a row. Wait a minute and try again.'],
  code: ['الكود ده مش شغال. لازم يكون من آخر إيميل وصلكم، لأن كل كود جديد بيلغي اللي قبله. اطلبوا كود جديد واستخدموه هو بس.', "That code doesn't work. It has to be from the latest email, since each new code cancels the one before. Ask for a new code and use only that one."],
  other: ['حصلت مشكلة. جربوا تاني.', 'Something went wrong. Please try again.'],
};

export function SignIn({ hasLocal, onDone }: { hasLocal: boolean; onDone: () => void }) {
  const c = useColors();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'pick'>('email');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState<Backup | null>(null);
  // Supabase allows one code a minute, and each new code cancels the last, so "new code" waits a minute.
  const [wait, setWait] = useState(0);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink } as const;
  const fail = (e: AuthErr) => setErr(L(...ERR[e]));

  const send = async () => {
    if (!okEmail(email)) { setErr(L('الإيميل ده مش مكتوب صح.', "That email doesn't look right.")); return; }
    setBusy(true); setErr('');
    const e = await sendCode(email);
    setBusy(false);
    if (e) { fail(e); return; }
    setNote(step === 'code' ? L('بعتنا كود جديد. الكود اللي قبله مبقاش شغال.', 'We sent a new code. The one before no longer works.') : '');
    setCode(''); setStep('code'); setWait(60);
  };
  const check = async () => {
    const digits = latin(code).replace(/\D/g, '');
    if (digits.length < 6) { setErr(L('اكتبوا الكود كله زي ما هو في الإيميل.', 'Type the whole code from the email.')); return; }
    setBusy(true); setErr('');
    const e = await checkCode(email, digits);
    if (e) { setBusy(false); fail(e); return; }
    const b = await readSaved();
    if (hasProfile(b) && !hasLocal) { await applySaved(b!); return; }
    if (hasProfile(b) && hasLocal) { setBusy(false); setSaved(b); setStep('pick'); return; }
    await saveNow(true);
    setBusy(false);
    onDone();
  };
  const keepPhone = async () => { setBusy(true); await saveNow(true); setBusy(false); onDone(); };

  if (step === 'pick') {
    const when = saved?.at ? new Date(saved.at).toLocaleDateString(L('ar-EG', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return (
      <View style={{ gap: 12 }}>
        <T kind="h2">{L('الحساب ده فيه بيانات محفوظة', 'This account already has saved data')}</T>
        <T kind="body" color={c.muted}>{L(`آخر حفظ ${when}. نكمل بأنهي بيانات؟`, `Last saved ${when}. Which data should we keep?`)}</T>
        <Btn title={L('بيانات الحساب', "The account's data")} disabled={busy} onPress={() => { setBusy(true); applySaved(saved!); }} />
        <Btn kind="outline" title={L('بيانات الموبايل ده', "This phone's data")} disabled={busy} onPress={keepPhone} />
        <T kind="small">{L('البيانات التانية هتتمسح.', 'The other data will be replaced.')}</T>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {step === 'email' ? <>
        <T kind="label">{L('الإيميل', 'Email')}</T>
        <TextInput value={email} onChangeText={(t) => { setErr(''); setEmail(t); }} placeholder="name@gmail.com" placeholderTextColor={c.dim}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
          returnKeyType="send" onSubmitEditing={send} style={[input, { textAlign: 'left', writingDirection: 'ltr' }]} />
        <Btn title={busy ? L('ثواني...', 'One sec...') : L('ابعتولي كود', 'Send me a code')} disabled={busy} onPress={send} />
        <T kind="small">{L('هيوصلك إيميل فيه كود. من غير باسورد.', "You'll get an email with a code. No password needed.")}</T>
      </> : <>
        <T kind="body">{L('بعتنا الكود على', 'We sent the code to')} <T kind="h3" style={{ writingDirection: 'ltr' }}>{cleanEmail(email)}</T></T>
        <TextInput value={code} onChangeText={(t) => { setErr(''); setCode(t); }} placeholder="123456" placeholderTextColor={c.dim}
          keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={10}
          returnKeyType="done" onSubmitEditing={check} style={[input, { textAlign: 'center', fontFamily: fonts.num, fontSize: 28, letterSpacing: 8 }]} />
        <Btn title={busy ? L('ثواني...', 'One sec...') : L('دخول', 'Sign in')} disabled={busy} onPress={check} />
        {note ? <T kind="small" color={c.petrol}>{note}</T> : null}
        <T kind="small">{L('استخدموا الكود اللي في آخر إيميل وصل. مش لاقيين الإيميل؟ بصوا في الـ Spam.', "Use the code in the latest email. Can't find it? Check your spam folder.")}</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn kind="text" title={wait > 0 ? L(`كود جديد بعد ${wait} ث`, `New code in ${wait}s`) : L('كود جديد', 'Send a new code')} disabled={busy || wait > 0} onPress={send} style={{ flex: 1 }} />
          <Btn kind="text" title={L('تغيير الإيميل', 'Change email')} disabled={busy} onPress={() => { setErr(''); setNote(''); setStep('email'); }} style={{ flex: 1 }} />
        </View>
      </>}
      {err ? <T kind="small" color={c.bad} style={{ textAlign: START() }}>{err}</T> : null}
    </View>
  );
}

/** The account card in Me: sign in, or the signed-in email with save, sign out and delete. */
export function AccountCard({ g }: { g: (m: string, f: string) => string }) {
  const c = useColors();
  const { on, email } = useAccount();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!on) return null;
  // The sign-in form stays up until it finishes, even once signed in, for the "which data to keep" question.
  if (!email || open) {
    return (
      <Card>
        <T kind="h3">{L('حسابي', 'My account')}</T>
        <T kind="small">{L('بياناتك دلوقتي على الموبايل ده بس. بالإيميل تتحفظ في حسابك وترجع على أي موبايل.', 'Your data is only on this phone right now. Sign in with your email to save it to your account and get it back on any phone.')}</T>
        {open ? <SignIn hasLocal onDone={() => setOpen(false)} /> : <Btn kind="outline" title={L('الدخول بالإيميل', 'Sign in with email')} onPress={() => setOpen(true)} />}
      </Card>
    );
  }
  return (
    <Card>
      <T kind="h3">{L('حسابي', 'My account')}</T>
      <T kind="body" style={{ writingDirection: 'ltr', textAlign: START() }}>{email}</T>
      <T kind="small">{L('بياناتك بتتحفظ في حسابك لوحدها.', 'Your data is saved to your account automatically.')}</T>
      <Btn kind="outline" title={busy ? L('ثواني...', 'One sec...') : L('حفظ دلوقتي', 'Save now')} disabled={busy} onPress={async () => {
        setBusy(true); setMsg('');
        const ok = await saveNow(true);
        setBusy(false);
        setMsg(ok ? L('اتحفظت.', 'Saved.') : L(`ماتحفظتش. ${g('اتأكد', 'اتأكدي')} من الإنترنت.`, "Couldn't save. Check your internet."));
      }} />
      {msg ? <T kind="small" color={c.petrol}>{msg}</T> : null}
      <Btn kind="text" title={L('تسجيل الخروج', 'Sign out')} disabled={busy} onPress={async () => { setBusy(true); await signOut(); setBusy(false); setMsg(''); }} />
      {sure ? (
        <View style={{ gap: 10 }}>
          <T kind="body">{L(`${g('متأكد', 'متأكدة')}؟ الحساب والنسخة المحفوظة فيه هيتمسحوا. البيانات اللي على الموبايل ده هتفضل.`, 'Are you sure? Your account and the data saved in it will be deleted. The data on this phone stays.')}</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn kind="secondary" title={L(g('أيوه امسح الحساب', 'أيوه امسحي الحساب'), 'Yes, delete it')} disabled={busy} style={{ flex: 1 }} onPress={async () => {
              setBusy(true);
              const ok = await deleteAccount();
              setBusy(false); setSure(false);
              setMsg(ok ? '' : L(`الحساب ماتمسحش. ${g('جرب', 'جربي')} تاني.`, "Couldn't delete the account. Try again."));
            }} />
            <Btn kind="outline" title={L('لأ', 'No')} onPress={() => setSure(false)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : <Btn kind="text" title={L('مسح الحساب', 'Delete account')} onPress={() => setSure(true)} />}
    </Card>
  );
}

/** First launch when this phone is already signed in but has no data yet (for example after "delete all my data"
 * on an older version): brings back the account's saved copy if there is one, otherwise says which email is in use. */
export function SignedInStep({ email, onDone, onSwitch }: { email: string; onDone: () => void; onSwitch: () => void }) {
  const c = useColors();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let live = true;
    readSaved().then((b) => {
      if (!live) return;
      if (hasProfile(b)) applySaved(b!);
      else setChecking(false);
    });
    return () => { live = false; };
  }, []);
  if (checking) return <T kind="body" color={c.muted} style={{ textAlign: 'center' }}>{L('ثواني، بنشوف حسابك...', 'One sec, checking your account...')}</T>;
  return (
    <View style={{ gap: 12 }}>
      <T kind="body" style={{ textAlign: 'center' }}>{L('الحساب اللي داخل دلوقتي:', "You're signed in as:")}</T>
      <T kind="h3" style={{ textAlign: 'center', writingDirection: 'ltr' }}>{email}</T>
      <Btn title={L('يلا نكمل', 'Continue')} onPress={onDone} />
      <Btn kind="text" title={L('دخول بإيميل تاني', 'Use a different email')} onPress={async () => { await signOut(); onSwitch(); }} />
    </View>
  );
}
