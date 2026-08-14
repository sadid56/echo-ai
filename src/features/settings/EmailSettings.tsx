import { UseFormRegister } from "react-hook-form";
import { TextField } from "../../components/ui/textField";
import { SectionHeader } from "../../components/ui/SectionHeader";

interface EmailSettingsProps {
  register: UseFormRegister<any>;
}

export function EmailSettings({ register }: EmailSettingsProps) {
  return (
    <div className='space-y-6 animate-fadeIn'>
      <div className='space-y-4'>
        <SectionHeader>Email Configuration</SectionHeader>
        
        <div className='space-y-6'>
          <TextField name='imapServer' label='IMAP Mail Server' placeholder='imap.gmail.com' register={register} />
          
          <div className='grid gap-6 sm:grid-cols-2'>
            <TextField name='emailAddress' label='Email Address' placeholder='example@gmail.com' register={register} />
            <TextField
              name='appPassword'
              label='App Password'
              type='password'
              placeholder='xxxx xxxx xxxx xxxx'
              register={register}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
