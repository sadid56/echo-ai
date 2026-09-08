import { Mic, Plus, Mail, GitBranch, Bug, Code, Terminal, Square, ArrowUp, File, Music } from "lucide-react";
import { type KeyboardEvent, type SyntheticEvent, useState, useRef, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { useChatStore } from "../../store/chatStore";
import { Dropdown } from "../../components/ui/dropdown";

interface CommandInputProps {
  onVoiceClick: () => void;
  onFocusChange?: (focused: boolean) => void;
}

interface SelectedAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 representation (empty for non-images)
  isImage: boolean;
  textPreview: string; // raw text contents for code/text files
}

export const CommandInput: React.FC<CommandInputProps> = ({ onVoiceClick, onFocusChange }) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<SelectedAttachment[]>([]);
  const { sendMessage, loading, config, updateConfig, stopChat } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea smoothly on input change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const targetHeight = Math.min(Math.max(scrollHeight, 38), 200);
      textareaRef.current.style.height = `${targetHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e?: SyntheticEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    // 1. Separate images and text/code files
    const imageAttachments = attachments
      .filter((att) => att.isImage)
      .map((att) => ({
        name: att.name,
        mime_type: att.mimeType,
        data: att.data,
      }));

    const textAttachments = attachments.filter((att) => !att.isImage);

    // 2. Build final prompt with text files appended as markdown blocks
    let finalPrompt = input;
    if (textAttachments.length > 0) {
      finalPrompt += "\n\n--- Attached Files Context ---";
      for (const att of textAttachments) {
        finalPrompt += `\n\n[File: ${att.name}]\n\`\`\`\n${att.textPreview}\n\`\`\``;
      }
    }

    // 3. Send via store action
    sendMessage(finalPrompt, imageAttachments.length > 0 ? imageAttachments : undefined);

    // 4. Clear state
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickCommand = (promptText: string) => {
    setInput(promptText);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    for (const file of filesArray) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = (reader.result as string).split(",")[1];
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type,
              data: base64Data,
              isImage: true,
              textPreview: "",
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const textContent = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type,
              data: "",
              isImage: false,
              textPreview: textContent,
            },
          ]);
        };
        reader.readAsText(file);
      }
    }
    // Clear input value so same file can be selected consecutively
    e.target.value = "";
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const activeModel = config?.text_model?.model_name || "google/gemini-2.5-flash";
  const configuredModels = config?.text_model?.models ?? [];
  const selectOptions = configuredModels.map(m => ({ label: m, value: m }));
  if (!configuredModels.includes(activeModel)) {
    selectOptions.push({ label: `${activeModel} (Current)`, value: activeModel });
  }

  const quickCommands = [
    {
      label: "Fetch unread emails",
      prompt: "Fetch my latest unread emails and summarize them.",
      icon: <Mail className="w-3.5 h-3.5 text-m3-primary/90" />
    },
    {
      label: "Play music",
      prompt: "Play some music on Spotify.",
      icon: <Music className="w-3.5 h-3.5 text-m3-primary/90" />
    },
    {
      label: "Review git diff",
      prompt: "Review my recent git changes and summarize them.",
      icon: <GitBranch className="w-3.5 h-3.5 text-m3-primary/90" />
    },
    {
      label: "Explain code error",
      prompt: "Explain this code error and suggest a fix: ",
      icon: <Bug className="w-3.5 h-3.5 text-m3-primary/90" />
    },
    {
      label: "Refactor component",
      prompt: "Suggest clean code refactoring improvements for this component: ",
      icon: <Code className="w-3.5 h-3.5 text-m3-primary/90" />
    },
    {
      label: "Write unit tests",
      prompt: "Generate comprehensive unit tests for this function: ",
      icon: <Terminal className="w-3.5 h-3.5 text-m3-primary/90" />
    }
  ];

  return (
    <div className='w-full flex flex-col gap-2 sm:gap-3'>
      {/* Suggested Quick Commands Row (M3 Assist Chips - Placed above the input) */}
      <div className='w-full flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none px-0.5'>
        {quickCommands.map((cmd, idx) => (
          <Button
            key={idx}
            type='button'
            variant='secondary'
            size='sm'
            onClick={() => handleQuickCommand(cmd.prompt)}
            className='rounded-full gap-1.5 px-3 py-1.5 whitespace-nowrap text-m3-on-surface-variant hover:text-m3-on-surface bg-m3-surface-container border border-m3-outline-variant font-medium tracking-normal text-xs shadow-none hover:border-m3-outline active:scale-95 transition-all shrink-0'
          >
            {cmd.icon}
            <span>{cmd.label}</span>
          </Button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className='w-full'>
        {/* Hidden File Input */}
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className='hidden'
          accept='image/*,text/*,application/json,application/javascript,application/typescript'
        />

        {/* Main box container with Material Design 3 Pill Card */}
        <div className='relative flex flex-col rounded-[24px] sm:rounded-[28px] border border-m3-outline-variant bg-m3-surface-container-high px-3.5 sm:px-5 py-2.5 sm:py-3 transition-all duration-200 shadow-md'>
          
          {/* Selected Attachments Row with smooth enter animation */}
          {attachments.length > 0 && (
            <div className='flex flex-wrap gap-2 mb-2 max-h-28 overflow-y-auto pb-2 border-b border-m3-outline-variant animate-in fade-in slide-in-from-top-1.5 duration-200'>
              {attachments.map((att, idx) => (
                <div 
                  key={idx} 
                  className='flex items-center gap-1.5 px-2.5 py-1 bg-m3-surface-container border border-m3-outline-variant rounded-full text-[11px] text-m3-on-surface group'
                >
                  {att.isImage ? (
                    <img 
                      src={`data:${att.mimeType};base64,${att.data}`} 
                      alt={att.name} 
                      className='w-4.5 h-4.5 rounded-full object-cover shadow-sm' 
                    />
                  ) : (
                    <File className='w-3 h-3 text-m3-primary' />
                  )}
                  <span className='max-w-[100px] truncate font-medium'>{att.name}</span>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => removeAttachment(idx)}
                    className='w-4 h-4 p-0 text-m3-on-surface-variant hover:text-red-400 transition-colors ml-1 font-bold text-xs'
                    title='Remove attachment'
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Input Textarea with smooth auto-growing height */}
          <textarea
            ref={textareaRef}
            id='cmd-input'
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            onKeyDown={handleKeyDown}
            placeholder='Describe a task and let Echo do the rest...'
            disabled={loading}
            style={{ minHeight: "36px", maxHeight: "160px" }}
            className='w-full resize-none border-none bg-transparent py-1 pr-1 font-sans text-[15px] leading-relaxed text-m3-on-surface placeholder:text-m3-on-surface-variant/60 outline-none focus:outline-none focus:ring-0 transition-[height] duration-150 ease-out scrollbar-thin scrollbar-thumb-white/10'
          />

          {/* Bottom Controls Bar (M3 Expressive Actions) */}
          <div className='flex items-center justify-between border-t border-m3-outline-variant pt-2 mt-1.5 shrink-0'>
            
            {/* Left Side: Plus, Voice, Model Dropdown */}
            <div className='flex items-center gap-1.5 sm:gap-2.5'>
              <Button
                className='rounded-full h-9 w-9 p-0 bg-m3-surface-container hover:bg-white/[0.08] active:scale-90 border border-m3-outline-variant/60 flex items-center justify-center transition-all'
                type='button'
                variant='secondary'
                size='sm'
                onClick={handlePlusClick}
                title='Add context or attachment'
                aria-label='Attach files'
              >
                <Plus className='h-4.5 w-4.5 text-m3-on-surface-variant hover:text-m3-on-surface transition-colors' />
              </Button>

              <Button
                className='rounded-full h-9 w-9 p-0 bg-m3-surface-container hover:bg-white/[0.08] active:scale-90 border border-m3-outline-variant/60 flex items-center justify-center transition-all'
                type='button'
                variant='secondary'
                size='sm'
                onClick={onVoiceClick}
                title='Start Live Voice Mode'
                aria-label='Voice input'
              >
                <Mic className='h-4 w-4 text-m3-on-surface-variant hover:text-m3-on-surface transition-colors' />
              </Button>

              <div className='hidden sm:block border-l border-m3-outline-variant h-5 mx-0.5' />

              <Dropdown
                value={activeModel}
                onChange={async (nextValue) => {
                  if (config) {
                    const updated = {
                      ...config,
                      text_model: {
                        ...config.text_model,
                        model_name: nextValue,
                      },
                    };
                    await updateConfig(updated);
                  }
                }}
                options={selectOptions}
                className="w-28 xs:w-36 sm:w-48"
                triggerClassName="h-9 py-1 px-2.5 bg-m3-surface-container hover:bg-white/[0.06] border-m3-outline-variant/60 rounded-full text-[11px] sm:text-xs font-medium"
              />
            </div>

            {/* Right Side: Material You Floating Action Button (FAB) for Send / Stop */}
            {loading ? (
              <Button
                type='button'
                onClick={stopChat}
                variant='secondary'
                size='sm'
                className='rounded-full h-9.5 w-9.5 sm:h-10 sm:w-10 p-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 shadow-none flex items-center justify-center transition-all duration-150 active:scale-90'
                title='Stop generation'
              >
                <Square className='h-4 w-4 fill-current text-amber-300' />
              </Button>
            ) : (
              <Button
                type='submit'
                variant='primary'
                size='sm'
                disabled={!input.trim() && attachments.length === 0}
                className='rounded-full h-9.5 w-9.5 sm:h-10 sm:w-10 p-0 bg-m3-primary hover:brightness-105 text-m3-on-primary border-none shadow-xs flex items-center justify-center transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed'
                title='Send message'
                aria-label='Send'
              >
                <ArrowUp className='h-4.5 w-4.5 text-m3-on-primary' strokeWidth={2.5} />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};