import{c as i,s as o}from"./index-BX5pYezm.js";import{k as m}from"./avatar-Cz4YH8uV.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=i("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);function d(r){return m({queryKey:["tour-dream-teams-by-season",r],queryFn:async()=>{if(!r)return[];const{data:e,error:t}=await o.from("tours").select("id").eq("season_id",r);if(t)throw t;if(!e||e.length===0)return[];const c=e.map(u=>u.id),{data:s,error:a}=await o.from("tour_dream_teams").select("*").in("tour_id",c).eq("team_type","dream");if(a)throw a;return s},enabled:!!r})}export{f as T,d as u};
