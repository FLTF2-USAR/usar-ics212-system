import{c as $,L as w,D as k,A as E}from"./config-C2UUIcfY.js";import{_ as S}from"./index-CeHT6_uH.js";const b=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],M=$("calendar",b);const A=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],_=$("circle-check-big",A);const P=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],L=$("triangle-alert",P);const F=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],x=$("x",F),u="https://mbfd-github-proxy.pdarleyjr.workers.dev/api";class I{adminPassword=null;constructor(){}setAdminPassword(e){this.adminPassword=e}clearAdminPassword(){this.adminPassword=null}isAdminAuthenticated(){return this.adminPassword!==null}getHeaders(e=!1){const t={"Content-Type":"application/json"};return e&&this.adminPassword&&(t["X-Admin-Password"]=this.adminPassword),t}async checkExistingDefects(e){try{const t=await fetch(`${u}/issues?state=open&labels=${w.DEFECT},${encodeURIComponent(e)}&per_page=100`,{method:"GET",headers:this.getHeaders()});if(!t.ok)return console.warn(`Failed to fetch defects: ${t.statusText}`),new Map;const s=await t.json(),r=Array.isArray(s)?s:[],c=new Map;for(const d of r){const o=d.title.match(k);if(o){const[,,n,a]=o,i=`${n}:${a}`;c.set(i,d)}}return c}catch(t){return console.error("Error fetching existing defects:",t),new Map}}async submitChecklist(e){const{user:t,apparatus:s,date:r,defects:c}=e,d=await this.checkExistingDefects(s);let o=0;const n=[];for(const a of c)try{const i=`${a.compartment}:${a.item}`,h=d.get(i);h?await this.addCommentToDefect(h.number,t.name,t.rank,r,a.notes,a.photoUrl):await this.createDefectIssue(s,a.compartment,a.item,a.status,a.notes,t.name,t.rank,r,a.photoUrl)}catch(i){o++;const h=`${a.compartment}:${a.item}`;n.push(h),console.error(`Failed to process defect ${h}:`,i)}if(o>0)throw new Error(`Failed to submit ${o} defect(s): ${n.join(", ")}. Please try again.`);if(await this.createLogEntry(e),c.length>0)try{await this.createSupplyTasksForDefects(c,s)}catch(a){console.error("Failed to create supply tasks (non-fatal):",a)}}async createDefectIssue(e,t,s,r,c,d,o,n,a){const i=`[${e}] ${t}: ${s} - ${r==="missing"?"Missing":"Damaged"}`;let h=`
## Defect Report

**Apparatus:** ${e}
**Compartment:** ${t}
**Item:** ${s}
**Status:** ${r==="missing"?"❌ Missing":"⚠️ Damaged"}
**Reported By:** ${d} (${o})
**Date:** ${n}

### Notes
${c}
`;a&&(h+=`
### Photo Evidence

![Defect Photo](${a})
`),h+=`
---
*This issue was automatically created by the MBFD Checkout System.*`,h=h.trim();const p=[w.DEFECT,e];r==="damaged"&&p.push(w.DAMAGED);try{const f=await fetch(`${u}/issues`,{method:"POST",headers:this.getHeaders(),body:JSON.stringify({title:i,body:h,labels:p})});if(!f.ok)throw new Error(`Failed to create issue: ${f.statusText}`)}catch(f){throw console.error("Error creating defect issue:",f),f}}async addCommentToDefect(e,t,s,r,c,d){let o=`
### Verification Update

**Verified still present by:** ${t} (${s})
**Date:** ${r}

${c?`**Additional Notes:** ${c}`:""}
`;d&&(o+=`
### Photo Evidence

![Defect Photo](${d})
`),o+=`
---
*This comment was automatically added by the MBFD Checkout System.*`,o=o.trim();try{const n=await fetch(`${u}/issues/${e}/comments`,{method:"POST",headers:this.getHeaders(),body:JSON.stringify({body:o})});if(!n.ok)throw new Error(`Failed to add comment: ${n.statusText}`)}catch(n){throw console.error("Error adding comment to issue:",n),n}}async createLogEntry(e){const{user:t,apparatus:s,date:r,items:c}=e,d=`[${s}] Daily Inspection - ${r}`;let o=null,n="";try{const{buildReceiptPayloadFromInspection:i,createHostedReceipt:h,buildReceiptMarkdown:p}=await S(async()=>{const{buildReceiptPayloadFromInspection:m,createHostedReceipt:T,buildReceiptMarkdown:D}=await import("./receipt-nVCul5S8.js");return{buildReceiptPayloadFromInspection:m,createHostedReceipt:T,buildReceiptMarkdown:D}},[]),f=i(e);try{o=(await h(u,f,this.adminPassword||void 0)).url,console.log(`Created hosted receipt: ${o}`)}catch(m){console.error("Failed to create hosted receipt, using fallback:",m),n=p(f)}}catch(i){console.error("Receipt module import failed:",i)}let a=`
## Daily Inspection Log

**Apparatus:** ${s}
**Conducted By:** ${t.name} (${t.rank})
**Date:** ${r}

### Summary
- **Total Items Checked:** ${c.length}
- **Issues Found:** ${e.defects.length}

${e.defects.length>0?`
### Issues Reported
${e.defects.map(i=>`- ${i.compartment}: ${i.item} - ${i.status==="missing"?"❌ Missing":"⚠️ Damaged"}`).join(`
`)}`:"✅ All items present and working"}
`;o?a+=`

---

📋 **[View Full Printable Receipt](${o})**

_This receipt contains the complete inspection details in a print-friendly format._
`:n&&(a+=`

---

${n}
`),a+=`
---
*This inspection log was automatically created by the MBFD Checkout System.*`,a=a.trim();try{const i=await fetch(`${u}/issues`,{method:"POST",headers:this.getHeaders(),body:JSON.stringify({title:d,body:a,labels:[w.LOG,s]})});if(!i.ok)throw new Error(`Failed to create log: ${i.statusText}`);const h=await i.json(),p=await fetch(`${u}/issues/${h.number}`,{method:"PATCH",headers:this.getHeaders(),body:JSON.stringify({state:"closed"})});if(p.ok)console.log(`Successfully created and closed log issue #${h.number}`);else{const f=await p.text();let m;try{m=JSON.parse(f)}catch{m={message:f}}console.error(`Failed to close log issue #${h.number}:`,{status:p.status,statusText:p.statusText,error:m,message:m.message||"Unknown error"}),console.warn(`Log entry created as issue #${h.number} but could not be closed. It may require manual closure or token permissions review.`)}}catch(i){throw console.error("Error creating log entry:",i),i}}async getAllDefects(){try{const e=await fetch(`${u}/issues?state=open&labels=${w.DEFECT}&per_page=100`,{method:"GET",headers:this.getHeaders(!0)});if(!e.ok)throw e.status===401?new Error("Unauthorized. Please enter the admin password."):new Error(`Failed to fetch defects: ${e.statusText}`);const t=await e.json();return(Array.isArray(t)?t:[]).map(r=>this.parseDefectFromIssue(r))}catch(e){throw console.error("Error fetching all defects:",e),e}}parseDefectFromIssue(e){const t=e.title.match(k);let s="Rescue 1",r="Unknown",c="Unknown",d="missing";t&&(s=t[1],r=t[2],c=t[3],d=t[4].toLowerCase());let o;if(e.body){const n=e.body.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);n&&(o=n[1])}return{issueNumber:e.number,apparatus:s,compartment:r,item:c,status:d,notes:e.body||"",reportedBy:e.user?.login||"Unknown",reportedAt:e.created_at,updatedAt:e.updated_at,resolved:!1,photoUrl:o}}async resolveDefect(e,t,s){try{const r=await fetch(`${u}/issues/${e}`,{method:"GET",headers:this.getHeaders(!0)});if(!r.ok)throw new Error(`Failed to fetch issue details: ${r.statusText}`);const o=(await r.json()).labels.map(i=>i.name).find(i=>E.includes(i)),n=[w.DEFECT,w.RESOLVED];o&&n.push(o),await fetch(`${u}/issues/${e}/comments`,{method:"POST",headers:this.getHeaders(!0),body:JSON.stringify({body:`
## ✅ Defect Resolved

**Resolved By:** ${s}
**Date:** ${new Date().toISOString()}

### Resolution
${t}

---
*This defect was marked as resolved via the MBFD Admin Dashboard.*
`.trim()})});const a=await fetch(`${u}/issues/${e}`,{method:"PATCH",headers:this.getHeaders(!0),body:JSON.stringify({state:"closed",labels:n})});if(!a.ok)throw a.status===401?new Error("Unauthorized. Please enter the admin password."):new Error(`Failed to resolve defect: ${a.statusText}`)}catch(r){throw console.error("Error resolving defect:",r),r}}async getFleetStatus(){const e=await this.getAllDefects();return this.computeFleetStatus(e)}computeFleetStatus(e){const t=new Map;for(const s of E)t.set(s,0);return e.forEach(s=>{const r=t.get(s.apparatus)||0;t.set(s.apparatus,r+1)}),t}async getInspectionLogs(e=7){try{const t=new Date;t.setDate(t.getDate()-e);const s=await fetch(`${u}/issues?state=all&labels=${w.LOG}&per_page=100&since=${t.toISOString()}`,{method:"GET",headers:this.getHeaders(!0)});if(!s.ok)throw s.status===401?new Error("Unauthorized. Please enter the admin password."):new Error(`Failed to fetch logs: ${s.statusText}`);const r=await s.json();return Array.isArray(r)?r:[]}catch(t){throw console.error("Error fetching inspection logs:",t),t}}async getDailySubmissions(){try{const e=await this.getInspectionLogs(1),t=await this.getInspectionLogs(30),s=new Date().toLocaleDateString("en-US"),r=[],c=new Map,d=new Map;return E.forEach(o=>{c.set(o,0)}),t.forEach(o=>{const n=o.title.match(/\[(.+)\]\s+Daily Inspection/);if(n){const a=n[1],i=c.get(a)||0;c.set(a,i+1);const h=new Date(o.created_at).toLocaleDateString("en-US"),p=d.get(a);(!p||new Date(o.created_at)>new Date(p))&&d.set(a,h)}}),e.forEach(o=>{const n=o.title.match(/\[(.+)\]\s+Daily Inspection/);if(n){const a=n[1];new Date(o.created_at).toLocaleDateString("en-US")===s&&!r.includes(a)&&r.push(a)}}),{today:r,totals:c,lastSubmission:d}}catch(e){throw console.error("Error getting daily submissions:",e),e}}async analyzeLowStockItems(){try{const e=new Date;e.setDate(e.getDate()-30);const t=await fetch(`${u}/issues?state=all&labels=${w.DEFECT}&per_page=100&since=${e.toISOString()}`,{method:"GET",headers:this.getHeaders(!0)});if(!t.ok)throw new Error(`Failed to fetch defects for analysis: ${t.statusText}`);const s=await t.json(),r=new Map;return s.forEach(d=>{if(d.title.includes("Missing")){const o=d.title.match(k);if(o){const[,n,a,i]=o,h=`${a}:${i}`;if(r.has(h)){const p=r.get(h);p.apparatus.add(n),p.occurrences++}else r.set(h,{compartment:a,apparatus:new Set([n]),occurrences:1})}}}),Array.from(r.entries()).filter(([,d])=>d.occurrences>=2).map(([d,o])=>({item:d.split(":")[1],compartment:o.compartment,apparatus:Array.from(o.apparatus),occurrences:o.occurrences})).sort((d,o)=>o.occurrences-d.occurrences)}catch(e){throw console.error("Error analyzing low stock items:",e),e}}async sendNotification(e){try{const t=await fetch(`${u}/notify`,{method:"POST",headers:this.getHeaders(),body:JSON.stringify(e)});if(!t.ok)throw new Error("Failed to send notification");return t.json()}catch(t){throw console.error("Error sending notification:",t),t}}async getEmailConfig(e){try{const t=await fetch(`${u}/config/email`,{method:"GET",headers:{"X-Admin-Password":e}});if(!t.ok)throw t.status===401?new Error("Unauthorized"):new Error("Failed to fetch email configuration");return t.json()}catch(t){throw console.error("Error fetching email config:",t),t}}async updateEmailConfig(e,t){try{const s=await fetch(`${u}/config/email`,{method:"PUT",headers:{"Content-Type":"application/json","X-Admin-Password":e},body:JSON.stringify(t)});if(!s.ok)throw s.status===401?new Error("Unauthorized"):new Error("Failed to update email configuration");return s.json()}catch(s){throw console.error("Error updating email config:",s),s}}async sendManualDigest(e){const t=await fetch(`${u}/digest/send`,{method:"POST",headers:{"X-Admin-Password":e}});if(!t.ok)throw t.status===401?new Error("Unauthorized"):new Error("Failed to send digest");return t.json()}async getAIInsights(e,t="week",s){const r=new URLSearchParams({timeframe:t,...s&&{apparatus:s}}),c=await fetch(`${u}/analyze?${r}`,{method:"GET",headers:{"X-Admin-Password":e}});if(!c.ok)throw c.status===401?new Error("Unauthorized"):c.status===503?new Error("AI features not enabled"):new Error("Failed to fetch AI insights");return c.json()}async createSupplyTasksForDefects(e,t){try{const s=await fetch(`${u}/tasks/create`,{method:"POST",headers:this.getHeaders(),body:JSON.stringify({defects:e,apparatus:t})});if(!s.ok)throw new Error(`Failed to create supply tasks: ${s.statusText}`);const r=await s.json();console.log(`Created ${r.tasksCreated||0} supply tasks from ${e.length} defects`)}catch(s){throw console.error("Error creating supply tasks:",s),s}}}const v=new I,y="https://mbfd-github-proxy.pdarleyjr.workers.dev/api";function g(l=!1){const e={"Content-Type":"application/json"};if(l){const t=localStorage.getItem("adminPassword");t&&(e["X-Admin-Password"]=t)}return e}async function O(){const l=await fetch(`${y}/inventory`,{method:"GET",headers:g(!0)});if(!l.ok){const e=await l.json().catch(()=>({error:"Unknown error"}));throw new Error(e.error||`Failed to fetch inventory: ${l.statusText}`)}return await l.json()}async function U(l="pending"){const e=await fetch(`${y}/tasks?status=${l}`,{method:"GET",headers:g(!0)});if(!e.ok){const t=await e.json().catch(()=>({error:"Unknown error"}));throw new Error(t.error||`Failed to fetch tasks: ${e.statusText}`)}return await e.json()}async function R(l){const e=await fetch(`${y}/tasks`,{method:"POST",headers:{"Content-Type":"application/json",...g(!1)},body:JSON.stringify({tasks:l})});if(!e.ok){const t=await e.json().catch(()=>({error:"Unknown error"}));throw new Error(t.error||`Failed to create tasks: ${e.statusText}`)}return await e.json()}async function N(l,e){const t=await fetch(`${y}/tasks/${l}`,{method:"PATCH",headers:{"Content-Type":"application/json",...g(!0)},body:JSON.stringify(e)});if(!t.ok){const s=await t.json().catch(()=>({error:"Unknown error"}));throw new Error(s.error||`Failed to update task: ${t.statusText}`)}return await t.json()}async function H(l){const e=await fetch(`${y}/ai/inventory-insights`,{method:"POST",headers:{"Content-Type":"application/json",...g(!0)},body:JSON.stringify({tasks:l.tasks?.map(t=>({id:t.id,apparatus:t.apparatus,itemName:t.itemName,deficiencyType:t.deficiencyType})),inventory:l.inventory?.map(t=>({id:t.id,equipmentName:t.equipmentName,quantity:t.quantity,minQty:t.minQty}))})});if(!e.ok){if(e.status===501)return{ok:!1,message:"AI integration not configured"};const t=await e.json().catch(()=>({error:"Unknown error"}));throw new Error(t.error||`Failed to generate insights: ${e.statusText}`)}return await e.json()}async function G(){const l=await fetch(`${y}/ai/insights`,{method:"GET",headers:g(!0)});if(!l.ok){const e=await l.json().catch(()=>({error:"Unknown error"}));throw new Error(e.error||`Failed to fetch insights: ${l.statusText}`)}return await l.json()}export{M as C,L as T,x as X,_ as a,O as b,R as c,G as d,H as e,U as f,v as g,N as u};
//# sourceMappingURL=inventory-BFWAlyBo.js.map
