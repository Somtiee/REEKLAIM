export const TRANSFER_FEE='50000';
export const REGISTRATION_FEE='100000';
export type Send={recipient:string;amount:string};

export function rewardQuote(value:string){
  if(!/^[1-9][0-9]{0,8}$/.test(value)||BigInt(value)>100000000n)throw new Error('Reward must be between 1 and 100000000 uqor.');
  const reward=BigInt(value);
  const fee=reward*2n/100n;
  return {reward:value,fee:fee.toString(),total:(reward+fee).toString()};
}
export function displayQor(value:string){
  const amount=BigInt(value);
  const decimal=(amount%1000000n).toString().padStart(6,'0').replace(/0+$/,'');
  return (amount/1000000n).toString()+(decimal?'.'+decimal:'');
}
export type PaymentView={
  id:string; purpose:'reward'|'transfer'; payer:string;recipient:string; treasury:string;
  state:string; memo:string|null; sends:Send[]; expires_at:string|null;candidate_hash:string|null;
  approval_started:boolean;created_at:string; receipt_hash:string|null; height:string|null;
  origin:string|null;chainId:'qorechain-diana';canPay:boolean;canAccept:boolean;
};
