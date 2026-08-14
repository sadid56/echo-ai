import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Dropdown, DropdownOption } from "../../components/ui/dropdown";
import { useChatStore } from "../../store/chatStore";
import { HelpCircle, ExternalLink, Info, Activity, Shield } from "lucide-react";

interface GoogleSearchSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

const searchEngineOptions: DropdownOption[] = [
  {
    label: "DuckDuckGo",
    value: "duckduckgo",
    description: "Privacy-focused, 100% free, unlimited queries. Setup-free.",
  },
  {
    label: "Google Search (Serper)",
    value: "serper",
    description: "Official Google search index. Requires a free Serper.dev API Key.",
  },
];

export function GoogleSearchSettings({ register, watch, setValue }: GoogleSearchSettingsProps) {
  const { searchStats } = useChatStore();
  const selectedEngine = watch("googleSearchEngine") || "duckduckgo";
  
  const limit = 100;
  const percentage = Math.min((searchStats.count / limit) * 100, 100);

  return (
    <div className='space-y-6 animate-fadeIn'>
      <div className='space-y-4'>
        <SectionHeader>Search Engine Configuration</SectionHeader>
        <p className='text-sm text-text-muted leading-relaxed'>
          Configure how Echo AI searches the web in the background. Background searching retrieves jobs, news, and info instantly without opening any physical browser windows.
        </p>

        {/* Engine Selector using custom Dropdown component */}
        <div className='space-y-2.5'>
          <label className='text-xs font-semibold uppercase tracking-wider text-text-muted block'>
            Select Search Engine
          </label>
          <Dropdown
            value={selectedEngine}
            onChange={(val) => setValue("googleSearchEngine", val, { shouldDirty: true })}
            options={searchEngineOptions}
          />
        </div>

        {/* Conditional Configuration for Serper.dev */}
        {selectedEngine === "serper" && (
          <div className='space-y-4 pt-2 animate-fadeIn'>
            {/* Dynamic Usage Statistics Card */}
            <Card className='border-border-color bg-bg-secondary/40 p-5 space-y-4 rounded-xl'>
              <div className='flex justify-between items-center'>
                <div className='flex gap-2.5 items-center'>
                  <div className='p-1.5 rounded-lg bg-accent-cyan/15 text-accent-cyan shrink-0'>
                    <Activity className='h-4 w-4 animate-pulse' />
                  </div>
                  <div>
                    <h4 className='text-xs font-semibold text-text-main'>Daily Usage Statistics</h4>
                    <p className='text-[10px] text-text-muted mt-0.5'>Date: {searchStats.date}</p>
                  </div>
                </div>
                <div className='text-right'>
                  <span className='px-2 py-0.5 text-[9px] font-bold rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25 uppercase tracking-wide'>
                    Free Tier
                  </span>
                </div>
              </div>

              <div className='space-y-1.5'>
                <div className='flex justify-between text-[11px] font-semibold text-text-muted'>
                  <span>Queries Used Today</span>
                  <span>{searchStats.count} / {limit} ({~~percentage}%)</span>
                </div>
                <div className='w-full h-2 bg-bg-primary rounded-full overflow-hidden border border-border-color/10'>
                  <div 
                    className='h-full bg-accent-cyan rounded-full transition-all duration-500 ease-out'
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <p className='text-[10px] text-text-muted leading-relaxed italic'>
                * Serper.dev provides 2,500 queries completely free upon signing up, without requiring a credit card.
              </p>
            </Card>

            <div className='space-y-6 pt-2'>
              <TextField
                name='googleSearchApiKey'
                label='Serper.dev API Key'
                type='password'
                placeholder='Paste your Serper.dev API Key here'
                register={register}
              />
            </div>

            <Card className='mt-6 border-accent-cyan/10 bg-accent-cyan/5 p-5 space-y-4 rounded-xl'>
              <div className='flex gap-3 items-start'>
                <div className='p-1.5 rounded-lg bg-accent-cyan/20 text-accent-cyan shrink-0'>
                  <HelpCircle className='h-5 w-5' />
                </div>
                <div>
                  <h4 className='text-sm font-semibold text-text-main'>How to get your FREE API Key (1-minute setup):</h4>
                  <p className='text-xs text-text-muted mt-1 leading-relaxed'>
                    Get 2,500 search queries for free with no credit card required.
                  </p>
                </div>
              </div>

              <ol className='text-xs space-y-2.5 text-text-muted pl-10 list-decimal leading-relaxed'>
                <li>
                  Go to the{" "}
                  <a
                    href='https://serper.dev'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-0.5 text-accent-cyan hover:underline font-semibold'
                  >
                    Serper.dev website
                    <ExternalLink className='h-3 w-3' />
                  </a>{" "}
                  and click <strong>Sign Up</strong>.
                </li>
                <li>Create a free account.</li>
                <li>Once logged in, copy the **API Key** from the dashboard.</li>
                <li>Paste the key into the **Serper.dev API Key** field above.</li>
              </ol>

              <div className='flex items-center gap-2.5 bg-bg-primary/50 p-3 rounded-lg border border-border-color/20 text-[11px] text-text-muted'>
                <Info className='h-4 w-4 text-accent-cyan shrink-0' />
                <span>Serper.dev does not restrict web search and doesn't require any credit card validation.</span>
              </div>
            </Card>
          </div>
        )}

        {/* Configuration for DuckDuckGo */}
        {selectedEngine === "duckduckgo" && (
          <div className='animate-fadeIn pt-2'>
            <Card className='border-border-color bg-bg-secondary/40 p-5 space-y-4 rounded-xl'>
              <div className='flex gap-3 items-start'>
                <div className='p-1.5 rounded-lg bg-accent-cyan/15 text-accent-cyan shrink-0'>
                  <Shield className='h-5 w-5' />
                </div>
                <div>
                  <h4 className='text-xs font-semibold text-text-main'>DuckDuckGo Integration Active</h4>
                  <p className='text-[11px] text-text-muted mt-1.5 leading-relaxed'>
                    DuckDuckGo is currently set as your default search engine. The AI will query DuckDuckGo directly in the background using our custom parser sidecar.
                  </p>
                </div>
              </div>
              
              <div className='flex items-center gap-2.5 bg-bg-primary/50 p-3 rounded-lg border border-border-color/20 text-[11px] text-text-muted'>
                <Info className='h-4 w-4 text-accent-cyan shrink-0' />
                <span>No API Key, signup, or internet accounts are needed. It works completely out-of-the-box and has unlimited queries.</span>
              </div>
            </Card>
          </div>
        )}

        {/* Hidden inputs to keep form state intact */}
        <input type="hidden" {...register("googleSearchCseId")} value="serper_default" />
      </div>
    </div>
  );
}
