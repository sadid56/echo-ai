import { UseFormRegister, UseFormWatch } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Switch } from "../../components/ui/switch";
import { ExternalLink, Info, HelpCircle } from "lucide-react";

interface TelegramSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
}

export function TelegramSettings({ register, watch }: TelegramSettingsProps) {
  const isEnabled = watch("telegramEnabled");

  return (
    <div className='space-y-6 animate-fadeIn'>
      <div className='space-y-4'>
        <SectionHeader>Telegram Bot Control Center</SectionHeader>
        <p className='text-sm text-text-muted leading-relaxed'>
          Connect Echo AI with a Telegram Bot to remotely control your computer (send prompts, run tasks) and receive instant reports directly on any device.
        </p>

        {/* Integration Instructions */}
        <div className='bg-bg-secondary/40 border border-border-color/30 rounded-2xl p-5 space-y-3.5 text-sm'>
          <div className='flex gap-2.5 items-start text-accent-cyan'>
            <Info className='h-4 w-4 mt-0.5 shrink-0' />
            <span className='font-semibold text-xs tracking-wider uppercase'>How to set up your Telegram Bot:</span>
          </div>
          <ol className='list-decimal list-inside space-y-2 text-text-muted text-xs leading-relaxed pl-1.5'>
            <li>
              Open Telegram and search for{" "}
              <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline inline-flex items-center gap-0.5">
                @BotFather <ExternalLink className="h-3 w-3" />
              </a>.
            </li>
            <li>
              Send the command <code className='px-1.5 py-0.5 rounded bg-bg-primary font-mono text-text-main border border-border-color/20 font-bold'>/newbot</code> and follow the instructions to name your bot.
            </li>
            <li>
              Copy the HTTP API <strong>Bot Token</strong> they provide and paste it below.
            </li>
            <li>
              Send any message to your newly created bot, then set the <strong>Authorized Chat ID / Username</strong> below to lock the bot to your account (e.g. your username like <code className='font-mono'>@myusername</code> or your Chat ID).
            </li>
          </ol>
          <div className='pt-1.5 flex items-center gap-1 text-[11px] text-accent-cyan hover:underline select-none cursor-pointer'>
            <HelpCircle className='h-3.5 w-3.5' />
            <a href='https://core.telegram.org/bots/features#botfather' target='_blank' rel='noreferrer' className='flex items-center gap-1'>
              Learn more about BotFather <ExternalLink className='h-3 w-3' />
            </a>
          </div>
        </div>

        {/* Enabled Toggle Switch */}
        <div className='pt-2'>
          <Switch
            name='telegramEnabled'
            label='Enable Telegram Bot Control'
            register={register}
            checked={isEnabled}
          />
        </div>

        {/* Conditional Configuration Fields */}
        {isEnabled && (
          <div className='space-y-6 pt-2 animate-fadeIn'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <TextField
                name='telegramToken'
                label='Telegram Bot Token'
                type='password'
                placeholder='123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'
                register={register}
              />
              <TextField
                name='telegramChatId'
                label='Authorized Chat ID / Username'
                placeholder='@myusername or 123456789'
                register={register}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
