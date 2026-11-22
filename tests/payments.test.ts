import {describe,it,expect} from 'vitest';
import {displayQor,rewardQuote,REGISTRATION_FEE,TRANSFER_FEE} from '../src/payments/domain.ts';
import {approvePayment} from '../src/payments/wallet.ts';
import type {PaymentView} from '../src/payments/domain.ts';
describe('Diana fee rules',()=>{
  it('calculates an additional 2% using exact base units',()=>{
    expect(rewardQuote('5000000')).toEqual({reward:'5000000',fee:'100000',total:'5100000'});
    expect(displayQor(REGISTRATION_FEE)).toBe('0.1');
    expect(displayQor(TRANSFER_FEE)).toBe('0.05');
  });
  it('rounds rewards down to the nearest uqor and rejects malformed or oversized requests',()=>{
    expect(rewardQuote('49').fee).toBe('0');
    expect(rewardQuote('99').fee).toBe('1');
    expect(rewardQuote('100000000').total).toBe('102000000');
    for(const bad of ['0','-5','1.5','04','1e5','100000001'])expect(()=>rewardQuote(bad)).toThrow();
  });
  it('refuses checkout without explicit consent before any reservation',async()=>{
    let calls=0;
    await expect(approvePayment({} as PaymentView,false,async()=>{calls++;})).rejects.toThrow(/consent/);
    expect(calls).toBe(0);
  });
});
