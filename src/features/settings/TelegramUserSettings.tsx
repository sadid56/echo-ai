import { useState, useEffect } from "react";
import { UseFormRegister, UseFormWatch } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Switch } from "../../components/ui/switch";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ExternalLink, Info, Key, CheckCircle, ShieldAlert, Loader2 } from "lucide-react";

interface TelegramUserSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
}

export function TelegramUserSettings({ register, watch }: TelegramUserSettingsProps) {
  const isEnabled = watch("telegramUserEnabled");
  const apiId = watch("telegramUserApiId");
  const apiHash = watch("telegramUserApiHash");
  const phone = watch("telegramUserPhoneNumber");

  const [status, setStatus] = useState<string>("idle"); // idle, installing_dependencies, auth_required, password_required, connected, error
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const unlistenPromise = listen<string>("telegram-user-status", (event) => {
      const payload = event.payload;
      if (payload.startsWith("error:")) {
        setStatus("error");
        setErrorMessage(payload.substring(6));
        setLoading(false);
      } else {
        setStatus(payload);
        if (payload === "connected") {
          setLoading(false);
        }
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const handleConnect = async () => {
    if (!apiId || !apiHash || !phone) {
      setStatus("error");
      setErrorMessage("Please fill in API ID, API Hash, and Phone Number first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      await invoke("start_telegram_user_bridge");
    } catch (err) {
      setStatus("error");
      setErrorMessage(String(err));
      setLoading(false);
    }
  };

  const handleSubmitOtp = async () => {
    if (!otpCode) return;
    try {
      await invoke("send_telegram_user_otp", { code: otpCode });
      setOtpCode("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(String(err));
    }
  };

  const handleSubmitPassword = async () => {
    if (!password) return;
    try {
      await invoke("send_telegram_user_password", { password });
      setPassword("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(String(err));
    }
  };

  return (
    <div className='space-y-6 animate-fadeIn'>
      <div className='space-y-4'>
        <SectionHeader>Telegram Personal Account Integration (MTProto)</SectionHeader>
        <p className='text-sm text-text-muted leading-relaxed'>
          Connect Echo AI to your personal Telegram account. This allows Echo to check your active chats, read recent messages from friends
          or groups, and reply on your behalf.
        </p>

        {/* Info Setup Box */}
        <div className='bg-bg-secondary/40 border border-border-color/30 rounded-2xl p-5 space-y-3.5 text-sm'>
          <div className='flex gap-2.5 items-start text-accent-cyan'>
            <Info className='h-4 w-4 mt-0.5 shrink-0' />
            <span className='font-semibold text-xs tracking-wider uppercase'>How to obtain API ID and API Hash:</span>
          </div>
          <ol className='list-decimal list-inside space-y-2 text-text-muted text-xs leading-relaxed pl-1.5'>
            <li>
              Go to{" "}
              <a
                href='https://my.telegram.org'
                target='_blank'
                rel='noreferrer'
                className='text-accent-cyan hover:underline inline-flex items-center gap-0.5'
              >
                my.telegram.org <ExternalLink className='h-3 w-3' />
              </a>{" "}
              and log in with your Telegram phone number.
            </li>
            <li>
              Navigate to <strong>API development tools</strong>.
            </li>
            <li>Create a new application (fill in any app title and short name).</li>
            <li>
              Copy the <strong>App api_id</strong> and <strong>App api_hash</strong> and enter them below.
            </li>
          </ol>
        </div>

        {/* Enabled Toggle */}
        <div className='pt-2'>
          <Switch name='telegramUserEnabled' label='Enable Personal Telegram Integration' register={register} checked={isEnabled} />
        </div>

        {isEnabled && (
          <div className='space-y-6 pt-2 animate-fadeIn'>
            <div className='grid gap-6 sm:grid-cols-3'>
              <TextField name='telegramUserApiId' label='Telegram API ID' placeholder='e.g. 1234567' register={register} />
              <TextField
                name='telegramUserApiHash'
                label='Telegram API Hash'
                type='password'
                placeholder='e.g. abcdef0123456789abcdef0123456789'
                register={register}
              />
              <TextField
                name='telegramUserPhoneNumber'
                label='Phone Number (with country code)'
                placeholder='+88017XXXXXXXX'
                register={register}
              />
            </div>

            {/* Authentication Flow UI */}
            <div className='border border-border-color/40 bg-bg-secondary/25 p-6 rounded-2xl space-y-4'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5'>
                <Key className='h-4 w-4 text-accent-cyan' /> Account Connection Status
              </h4>

              <div className='flex flex-wrap items-center gap-4'>
                <button
                  type='button'
                  onClick={handleConnect}
                  disabled={loading || status === "connected"}
                  className={`px-5 py-2.5 rounded-xl font-medium text-xs transition-all flex items-center gap-2 ${
                    status === "connected"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                      : "bg-accent-cyan text-bg-primary hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50"
                  }`}
                >
                  {loading && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
                  {status === "connected" ? "Account Linked" : "Link Telegram Account"}
                </button>

                {/* Status Indicator labels */}
                {status === "installing_dependencies" && (
                  <div className='flex items-center gap-2 text-xs text-text-muted animate-pulse'>
                    <Loader2 className='h-4 w-4 animate-spin text-accent-cyan' />
                    Installing Telethon library...
                  </div>
                )}

                {status === "connected" && (
                  <div className='flex items-center gap-1.5 text-xs text-emerald-400 font-semibold'>
                    <CheckCircle className='h-4.5 w-4.5' />
                    Your personal Telegram account is fully linked and active!
                  </div>
                )}
              </div>

              {/* OTP Form Overlay */}
              {status === "auth_required" && (
                <div className='p-4 bg-bg-primary/50 border border-accent-cyan/30 rounded-xl space-y-3 max-w-sm animate-fadeIn'>
                  <div className='text-xs font-semibold text-accent-cyan'>Verification Code Sent!</div>
                  <p className='text-xs text-text-muted leading-relaxed'>
                    Telegram has sent a login code. Enter it below to authorize this device:
                  </p>
                  <div className='flex gap-2.5'>
                    <input
                      type='text'
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder='Enter OTP Code'
                      className='flex-1 px-3 py-2 text-xs bg-bg-secondary border border-border-color/30 rounded-lg text-text-main focus:outline-none focus:border-accent-cyan/60'
                    />
                    <button
                      type='button'
                      onClick={handleSubmitOtp}
                      className='px-4 py-2 bg-accent-cyan text-bg-primary rounded-lg font-bold text-xs hover:bg-accent-cyan/90'
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {/* 2FA Password Form Overlay */}
              {status === "password_required" && (
                <div className='p-4 bg-bg-primary/50 border border-accent-cyan/30 rounded-xl space-y-3 max-w-sm animate-fadeIn'>
                  <div className='text-xs font-semibold text-accent-cyan'>2FA Password Required</div>
                  <p className='text-xs text-text-muted leading-relaxed'>
                    Your account has Two-Step Verification enabled. Enter your password:
                  </p>
                  <div className='flex gap-2.5'>
                    <input
                      type='password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder='Enter 2FA Password'
                      className='flex-1 px-3 py-2 text-xs bg-bg-secondary border border-border-color/30 rounded-lg text-text-main focus:outline-none focus:border-accent-cyan/60'
                    />
                    <button
                      type='button'
                      onClick={handleSubmitPassword}
                      className='px-4 py-2 bg-accent-cyan text-bg-primary rounded-lg font-bold text-xs hover:bg-accent-cyan/90'
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {/* Error messages */}
              {status === "error" && errorMessage && (
                <div className='p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2 max-w-xl animate-fadeIn'>
                  <ShieldAlert className='h-4 w-4 mt-0.5 shrink-0' />
                  <div>
                    <span className='font-bold uppercase tracking-wider block text-[10px] mb-0.5'>Error Connecting</span>
                    {errorMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
