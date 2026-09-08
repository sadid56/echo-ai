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
    <div className='space-y-5 animate-fadeIn'>
      <div className='space-y-4'>
        <SectionHeader>Search Engine Configuration</SectionHeader>
        <p className='text-xs sm:text-sm text-m3-on-surface-variant leading-relaxed'>
          Configure how Echo AI searches the web in the background. Background searching retrieves jobs, news, and info instantly without opening any physical browser windows.
        </p>

        {/* Engine Selector */}
        <div className='space-y-2'>
          <label className='text-xs font-medium text-m3-on-surface-variant block'>
            Select Active Search Engine
          </label>
          <Dropdown
            value={selectedEngine}
            onChange={(val) => setValue("googleSearchEngine", val, { shouldDirty: true })}
            options={searchEngineOptions}
          />
        </div>

        {/* Conditional Configuration for Serper.dev */}
        {selectedEngine === "serper" && (
          <div className='space-y-4 pt-1 animate-fadeIn'>
            {/* Dynamic Usage Statistics Card */}
            <Card className='space-y-4 shadow-sm border border-m3-outline-variant/60'>
              <div className='flex justify-between items-center'>
                <div className='flex gap-2.5 items-center'>
                  <div className='p-2 rounded-full bg-m3-surface-container text-m3-primary shrink-0'>
                    <Activity className='h-4 w-4' />
                  </div>
                  <div>
                    <h4 className='text-xs font-semibold text-m3-on-surface'>Daily Usage Statistics</h4>
                    <p className='text-[10px] text-m3-on-surface-variant mt-0.5'>Date: {searchStats.date}</p>
                  </div>
                </div>
                <div>
                  <span className='px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-m3-primary/15 text-m3-primary border border-m3-primary/20'>
                    Free Tier
                  </span>
                </div>
              </div>

              <div className='space-y-1.5'>
                <div className='flex justify-between text-[11px] font-medium text-m3-on-surface-variant'>
                  <span>Queries Used Today</span>
                  <span>{searchStats.count} / {limit} ({~~percentage}%)</span>
                </div>
                <div className='w-full h-2 bg-m3-surface-container-highest rounded-full overflow-hidden'>
                  <div 
                    className='h-full bg-m3-primary rounded-full transition-all duration-500 ease-out'
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <p className='text-[10px] text-m3-on-surface-variant/70 leading-relaxed italic'>
                * Serper.dev provides 2,500 queries completely free upon signing up, without requiring a credit card.
              </p>
            </Card>

            <div className='pt-1'>
              <TextField
                name='googleSearchApiKey'
                label='Serper.dev API Key'
                type='password'
                placeholder='Paste your Serper.dev API Key here'
                register={register}
              />
            </div>

            <Card className='mt-4 border border-m3-primary/20 bg-m3-primary/[0.03] space-y-4 shadow-sm'>
              <div className='flex gap-3 items-start'>
                <div className='p-2 rounded-full bg-m3-primary/15 text-m3-primary shrink-0'>
                  <HelpCircle className='h-4 w-4' />
                </div>
                <div>
                  <h4 className='text-xs font-semibold text-m3-on-surface'>How to get your free API Key:</h4>
                  <p className='text-[11px] text-m3-on-surface-variant mt-0.5 leading-relaxed'>
                    Get 2,500 search queries for free with no credit card required.
                  </p>
                </div>
              </div>

              <ol className='text-xs space-y-2 text-m3-on-surface-variant pl-8 list-decimal leading-relaxed'>
                <li>
                  Go to the{" "}
                  <a
                    href='https://serper.dev'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 text-m3-primary hover:underline font-medium'
                  >
                    Serper.dev website
                    <ExternalLink className='h-3 w-3' />
                  </a>{" "}
                  and click <strong>Sign Up</strong>.
                </li>
                <li>Create a free account.</li>
                <li>Once logged in, copy the API Key from your dashboard.</li>
                <li>Paste the key into the <strong>Serper.dev API Key</strong> field above.</li>
              </ol>

              <div className='flex items-center gap-2.5 bg-m3-surface-container/60 p-3 rounded-xl border border-m3-outline-variant/40 text-[11px] text-m3-on-surface-variant'>
                <Info className='h-4 w-4 text-m3-primary shrink-0' />
                <span>Serper.dev does not restrict web search and doesn't require any credit card validation.</span>
              </div>
            </Card>
          </div>
        )}

        {/* Configuration for DuckDuckGo */}
        {selectedEngine === "duckduckgo" && (
          <div className='animate-fadeIn pt-1'>
            <Card className='space-y-4 shadow-sm border border-m3-outline-variant/60'>
              <div className='flex gap-3 items-start'>
                <div className='p-2 rounded-full bg-m3-primary/15 text-m3-primary shrink-0'>
                  <Shield className='h-4 w-4' />
                </div>
                <div>
                  <h4 className='text-xs font-semibold text-m3-on-surface'>DuckDuckGo Privacy Integration Active</h4>
                  <p className='text-[11px] text-m3-on-surface-variant mt-1 leading-relaxed'>
                    DuckDuckGo is currently set as your default search engine. The AI will query DuckDuckGo directly in the background using our custom scraper sidecar.
                  </p>
                </div>
              </div>
              
              <div className='flex items-center gap-2.5 bg-m3-surface-container/60 p-3 rounded-xl border border-m3-outline-variant/40 text-[11px] text-m3-on-surface-variant'>
                <Info className='h-4 w-4 text-m3-primary shrink-0' />
                <span>No API Key, signup, or internet accounts are needed. It works completely out-of-the-box with unlimited queries.</span>
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
