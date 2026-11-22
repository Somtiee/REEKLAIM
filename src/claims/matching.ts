export type MatchFields = {
  id:string; title:string; description:string; category:string; country:string; city:string;
  occurred_on:string; brand:string; model:string; colour:string;
};
function normalize(value:string){
  return value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function overlap(a:string,b:string){
  const tokens=(value:string)=>new Set(normalize(value).split(' ').filter(word=>word.length>2));
  const first=tokens(a), second=tokens(b);
  const shared=[...first].filter(word=>second.has(word)).length;
  return shared/Math.max(1,new Set([...first,...second]).size);
}
export function compareReports(lost:MatchFields,found:MatchFields){
  const days=(Date.parse(found.occurred_on)-Date.parse(lost.occurred_on))/86400000;
  if(lost.category!==found.category||lost.country!==found.country||!Number.isFinite(days)||days<0||days>60)return null;
  const same=(a:string,b:string)=>!!normalize(a)&&normalize(a)===normalize(b);
  if(lost.model&&found.model&&!same(lost.model,found.model))return null;
  if(lost.brand&&found.brand&&!same(lost.brand,found.brand))return null;
  const title=overlap(lost.title,found.title), description=overlap(lost.description,found.description);
  const model=same(lost.model,found.model);
  if(!model&&title<0.35&&description<0.35)return null;
  const parts:[number,string][]=[
    [15,'Same category'],[Math.round(title*25),'Similar title'],[Math.round(description*15),'Similar description'],
    [model?15:0,'Same model'],[same(lost.brand,found.brand)?8:0,'Same brand'],
    [same(lost.colour,found.colour)?7:0,'Same colour'],[same(lost.city,found.city)?10:0,'Same city'],
    [Math.max(0,5-Math.floor(days/7)),'Found close to the lost date'],
  ];
  const score=parts.reduce((sum,[value])=>sum+value,0);
  return score>=45?{score,reasons:parts.filter(([value])=>value>0).map(([,reason])=>reason)}:null;
}
