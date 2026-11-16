const DAYS=["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];
const DEFAULT={"السبت":["فيزياء","إنجليزي","رياضيات"],"الأحد":["تاريخ","رياضيات","مواد شرعية"],"الاثنين":["عربي","فيزياء"],"الثلاثاء":["إنجليزي","رياضيات"],"الأربعاء":["تاريخ","رياضيات","مواد شرعية"],"الخميس":["عربي","فيزياء"],"الجمعة":["مواد شرعية"]};
const KEY="daftarAlhisas_v1";
let data=load(), viewOffset=0, editTarget=null, deferredInstall=null;
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{tasks:{},schedule:DEFAULT}}catch{return {tasks:{},schedule:DEFAULT}}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function localDate(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function startOfWeek(d){let x=localDate(d);let diff=(x.getDay()+1)%7;x.setDate(x.getDate()-diff);return x}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function fromKey(s){let [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function fmt(d,opts={day:"numeric",month:"long"}){return new Intl.DateTimeFormat("ar-EG",opts).format(d)}
function weekKey(start){return dateKey(start)}
function tasksFor(date,subject){let k=dateKey(date);data.tasks[k]??={};data.tasks[k][subject]??=[];return data.tasks[k][subject]}
function allTasks(){let a=[];for(let [date,subjects] of Object.entries(data.tasks))for(let [subject,items] of Object.entries(subjects))for(let t of items)a.push({...t,date,subject});return a}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){
 const now=new Date();document.getElementById("todayText").textContent=new Intl.DateTimeFormat("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(now);
 const all=allTasks();document.getElementById("remaining").textContent=all.filter(t=>!t.done).length;document.getElementById("completed").textContent=all.filter(t=>t.done).length;
 const start=startOfWeek(now);start.setDate(start.getDate()+viewOffset*7);const end=new Date(start);end.setDate(end.getDate()+6);
 document.getElementById("weekLabel").textContent=viewOffset===0?"الأسبوع الحالي":viewOffset<0?`أسبوع سابق (${Math.abs(viewOffset)})`:`أسبوع قادم (${viewOffset})`;
 document.getElementById("weekDates").textContent=`من ${fmt(start)} إلى ${fmt(end)}`;
 const todayKey=dateKey(now);let out="";
 DAYS.forEach((day,i)=>{let d=new Date(start);d.setDate(d.getDate()+i);let subjects=data.schedule[day]||[];let isToday=dateKey(d)===todayKey;
 out+=`<section class="day ${isToday?"today-day":""}"><div class="day-head"><div><div class="day-title">${day}${isToday?' · اليوم':''}</div><div class="day-date">${fmt(d,{day:"numeric",month:"long",year:"numeric"})}</div></div><span class="task-count">${subjects.length} مواد</span></div>`;
 if(!subjects.length)out+='<div class="empty">لا توجد حصص في هذا اليوم.</div>';
 subjects.forEach(sub=>{let arr=tasksFor(d,sub);out+=`<div class="subject"><div class="subject-head"><span class="subject-name">${esc(sub)}</span><span class="task-count">${arr.filter(x=>x.done).length}/${arr.length} مكتمل</span></div>`;
 if(!arr.length)out+='<div class="empty">لا يوجد واجب مسجل.</div>';
 arr.forEach((t,idx)=>{out+=`<div class="task ${t.done?"done":""}"><input type="checkbox" ${t.done?"checked":""} aria-label="مكتمل" onchange="toggleTask('${dateKey(d)}','${esc(sub)}',${idx})"><div class="task-text">${esc(t.text)}</div><div class="task-actions"><button title="تعديل" onclick="editTask('${dateKey(d)}','${esc(sub)}',${idx})">✎</button><button title="حذف" onclick="deleteTask('${dateKey(d)}','${esc(sub)}',${idx})">×</button></div></div>`});
 out+=`<div class="addrow"><input id="add-${dateKey(d)}-${encodeURIComponent(sub)}" placeholder="اكتب الواجب هنا..." onkeydown="if(event.key==='Enter')addTask('${dateKey(d)}','${esc(sub)}')"><button class="btn small" onclick="addTask('${dateKey(d)}','${esc(sub)}')">إضافة</button></div></div>`});
 out+='</section>'});
 document.getElementById("weekView").innerHTML=out;renderScheduleEditor();
}
function addTask(date,subject){let el=document.getElementById(`add-${date}-${encodeURIComponent(subject)}`);let text=el.value.trim();if(!text)return;let d=tasksFor(fromKey(date),subject);d.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),text,done:false,created:Date.now()});save();render()}
function toggleTask(date,subject,index){data.tasks[date][subject][index].done=!data.tasks[date][subject][index].done;save();render()}
function deleteTask(date,subject,index){if(!confirm("هل تريد حذف هذا الواجب؟"))return;data.tasks[date][subject].splice(index,1);save();render()}
function editTask(date,subject,index){editTarget={date,subject,index};document.getElementById("editText").value=data.tasks[date][subject][index].text;document.getElementById("editDialog").showModal()}
document.getElementById("editForm").addEventListener("submit",e=>{if(e.submitter?.value!=="save")return;e.preventDefault();let v=document.getElementById("editText").value.trim();if(v&&editTarget){data.tasks[editTarget.date][editTarget.subject][editTarget.index].text=v;save();document.getElementById("editDialog").close();render()}});
function renderScheduleEditor(){document.getElementById("scheduleEditor").innerHTML=DAYS.map(d=>`<div><label>${d}</label><textarea data-day="${d}">${(data.schedule[d]||[]).join("، ")}</textarea></div>`).join("")}
document.getElementById("saveSchedule").onclick=()=>{let s={};document.querySelectorAll("#scheduleEditor textarea").forEach(el=>s[el.dataset.day]=el.value.split(/[،,]/).map(x=>x.trim()).filter(Boolean));data.schedule=s;save();render();alert("تم حفظ جدول الحصص.")};
document.getElementById("clearDone").onclick=()=>{if(!confirm("تأكيد حذف جميع الواجبات المكتملة من كل الأسابيع؟ لا يمكن التراجع عن ذلك."))return;for(let date of Object.keys(data.tasks))for(let subject of Object.keys(data.tasks[date]))data.tasks[date][subject]=data.tasks[date][subject].filter(t=>!t.done);save();render();alert("تم حذف الواجبات المكتملة.")};
document.getElementById("prevWeek").onclick=()=>{viewOffset--;render()};document.getElementById("nextWeek").onclick=()=>{viewOffset++;render()};document.getElementById("currentWeek").onclick=()=>{viewOffset=0;render()};
function search(){let q=document.getElementById("searchInput").value.trim().toLowerCase(),box=document.getElementById("searchResults");if(!q){box.textContent="اكتب كلمة للبحث في كل الأسابيع المحفوظة.";return}let matches=allTasks().filter(t=>(t.text+" "+t.subject).toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));box.innerHTML=matches.length?matches.map(t=>`<div class="result"><b>${esc(t.subject)}</b> · ${fmt(fromKey(t.date),{day:"numeric",month:"long",year:"numeric"})}<div>${esc(t.text)} ${t.done?"✓ مكتمل":""}</div></div>`).join(""):"لا توجد نتائج مطابقة."}
document.getElementById("searchBtn").onclick=search;document.getElementById("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")search()});
window.addTask=addTask;window.toggleTask=toggleTask;window.editTask=editTask;window.deleteTask=deleteTask;
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;document.getElementById("installBtn").hidden=false});
document.getElementById("installBtn").onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;document.getElementById("installBtn").hidden=true};
render();