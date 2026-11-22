import {describe,expect,it} from 'vitest';
import {compareReports} from '../src/claims/matching.ts';
const lost={id:'lost',title:'Cámera Travel R5',description:'Black travel camera with fabric cover',category:'electronics',country:'NG',city:'Lagos',occurred_on:'2026-01-01',brand:'Canon',model:'R5',colour:'Black'};
const found={...lost,id:'found',title:'Camera travel R5',occurred_on:'2026-01-03'};
describe('explainable report matching',()=>{
  it('normalizes accents and explains the stronger match',()=>{
    const match=compareReports(lost,found);
    expect(match?.score).toBeGreaterThanOrEqual(95);
    expect(match?.reasons).toContain('Same model');
  });
  it('rejects incompatible model, country, dates and generic unrelated descriptions',()=>{
    for(const changes of [{model:'R6'},{country:'GH'},{occurred_on:'2025-12-30'},{occurred_on:'2026-05-01'},{title:'Computer charger',description:'White wall plug',brand:'',model:''}]){
      expect(compareReports(lost,{...found,...changes})).toBeNull();
    }
  });
});
