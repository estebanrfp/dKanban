import{_ as d}from"./index-99dc92b5.js";import{c as n,u as c,S as f}from"./index-81423d32.js";function u(i){const t=document.querySelector(".spinner");i==="load"?t.classList.add("fadeout"):i==="show"?t.classList.remove("fadeout"):i==="hide"&&t.classList.add("fadeout")}const m=`<div class="wrap">
  <input id="inputData" type="text" placeholder="New Profile / Paste Keys">
  <div class="bg"></div>
</div>

<div class="grid">
	<div class="item"></div>
	<div class="item"></div>
	<div class="item"></div>
	<div class="item"></div>
	<div class="item"></div>
	<div class="item"></div>
	<div class="item"></div>
	<div class="item"></div>
	<div class="item"></div>
	<div class="item"></div>
</div>
`;function b(){document.querySelector(".Layout").innerHTML=m;function i(e){navigator.clipboard.writeText(JSON.stringify(e)).then(()=>{n("","","Keys Copied, keep them in a safe place !","success",!1,!0)},()=>{n("Copy permissions denied ","warning")})}function t(e){u("show"),window.localStorage.setItem("keys",JSON.stringify(e)),c.auth(e),c.is&&c.get("name").once(async a=>{n("","",`Welcome to [${a}] account profile !`,"success",!1,!0),u("hide"),await d(()=>import("./index-532317cc.js"),["assets/index-532317cc.js","assets/index-99dc92b5.js","assets/index-6dccb6c7.css","assets/index-81423d32.js","assets/index-bd81c293.css","assets/index-dc980cc3.css"]).then(s=>s.default())})}async function p(e){const a=e.target.value;n("","",`creating [${a}] account profile ...`,"success",!1,!0),e.target.value="";const s=await f.pair();t(s),i(s),c.get("name").put(a),await d(()=>import("./index-532317cc.js"),["assets/index-532317cc.js","assets/index-99dc92b5.js","assets/index-6dccb6c7.css","assets/index-81423d32.js","assets/index-bd81c293.css","assets/index-dc980cc3.css"]).then(r=>r.default())}const o=document.querySelector("#inputData");o.oncut=o.oncopy=o.onpaste=e=>{const a=e.clipboardData.getData("text/plain");if(/^(?=.*\bpub\b)(?=.*\bpriv\b)(?=.*\bepub\b)(?=.*\bepriv\b).*$/.test(String(a))){const v=JSON.parse(e.clipboardData.getData("text/plain"));t(v),console.log(`${e.type} - ${e.clipboardData.getData("text/plain")}`)}else n("","","Please enter a valid keys !","warning",!1,!0);return!1},o.onchange=e=>p(e);const l=window.localStorage.getItem("keys");l?t(JSON.parse(l)):console.log("no localstorage key found")}export{b as default};
