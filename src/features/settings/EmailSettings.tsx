import React from "react";
import { UseFormRegister } from "react-hook-form";
import { TextField } from "../../components/ui/textField";

interface EmailSettingsProps {
  register: UseFormRegister<any>;
}

export function EmailSettings({ register }: EmailSettingsProps) {
  return (
    <div className='space-y-4 animate-fadeIn'>
      <div className='space-y-3.5'>
        <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
          Email Configuration
        </h3>
        <TextField name='imapServer' label='IMAP Mail Server' placeholder='imap.gmail.com' register={register} />
        <div className='grid gap-4 sm:grid-cols-2'>
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
  );
}
