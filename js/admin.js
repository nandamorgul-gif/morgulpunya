(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const all=Object.values(window.PC_DATA?.components || {}).flat();
  const state={loggedIn:false, overrides:new Map()};
  let toastTimer;
  function notice(msg){$('message').textContent=msg;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('message').textContent='',5500);}
  async function api(path,opts={}){
    const r=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},cache:'no-store',...opts});
    const data=await r.json().catch(()=>({error:'Respons API bukan JSON'}));
    if(!r.ok)throw new Error(data.error||'Gagal: '+r.status);
    return data;
  }
  function screen(on){
    state.loggedIn=on;
    $('signin').hidden=on;
    $('dashboard').hidden=!on;
  }
  async function checkLogin(){
    try{const data=await api('/api/admin/me');screen(data.authenticated);if(data.authenticated){$('loggedAs').textContent='Masuk sebagai '+data.username;await loadProducts();}}
    catch(e){screen(false);notice(e.message);}
  }
  async function loadProducts(){
    const response=await api('/api/admin/products');
    state.overrides=new Map((response.items||[]).map(v=>[v.id,v]));
    $('totalProducts').textContent=all.length;
    $('updatedProducts').textContent=state.overrides.size;
    const newest=[...state.overrides.values()].map(v=>v.updated_at).filter(Boolean).sort().at(-1);
    $('lastUpdated').textContent=newest?new Date(newest).toLocaleDateString('id-ID'):'Belum ada';
    renderProducts();
  }
  function make(tag,className,text){
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  }
  function field(parent,label,type,value){
    const box=make('div','field');const lbl=make('label','',label),inp=make('input');
    inp.type=type;inp.value=value??'';lbl.appendChild(inp);box.appendChild(lbl);parent.appendChild(box);return inp;
  }
  function renderProducts(){
    const query=$('productSearch').value.toLowerCase().trim();
    const list=$('productList');list.replaceChildren();
    const found=all.filter(item=>(item.id+' '+item.name+' '+item.brand).toLowerCase().includes(query));
    for(const item of found){
      const current=state.overrides.get(item.id);
      const row=make('article','item');
      const img=make('img');img.src=current?.image||item.image;img.alt='Foto '+item.name;img.loading='lazy';
      img.addEventListener('error',()=>{img.hidden=true;});
      row.appendChild(img);
      const info=make('div','meta');
      info.appendChild(make('h3','',item.name));
      info.appendChild(make('small','',item.id+' • '+item.brand));
      info.appendChild(make('small','',current?'Harga D1 • '+current.source_label:'Harga estimasi dari katalog'));
      row.appendChild(info);
      const price=field(row,'Harga (Rp)','number',current?.price??item.price);price.min=0;price.step=1;
      const stock=field(row,'Stok','number',current?.stock??'');stock.min=0;stock.step=1;stock.placeholder='Belum ditetapkan';
      const image=field(row,'URL foto (HTTPS)','url',current?.image??item.image);
      const save=make('button','save','Simpan');save.type='button';
      save.addEventListener('click',async()=>{
        const p=Number(price.value),st=stock.value.trim()===''?null:Number(stock.value);
        if(!Number.isSafeInteger(p)||p<0||!Number.isSafeInteger(st??0)||st!==null&&st<0){notice('Harga atau stok tidak valid');return;}
        save.disabled=true;save.textContent='Menyimpan...';
        try{
          await api('/api/admin/products',{method:'PATCH',body:JSON.stringify({id:item.id,price:p,stock:st,image:image.value.trim()||null})});
          notice(item.name+' berhasil disimpan');await loadProducts();
        }catch(e){notice(e.message);}
        finally{save.disabled=false;save.textContent='Simpan';}
      });
      row.appendChild(save);list.appendChild(row);
    }
    if(!found.length)list.appendChild(make('p','', 'Tidak ada produk yang cocok.'));
  }
  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();$('loginBtn').disabled=true;
    try{
      const user=await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:$('username').value.trim(),password:$('password').value})});
      $('password').value='';screen(true);$('loggedAs').textContent='Masuk sebagai '+user.username;await loadProducts();notice('Login berhasil.');
    }catch(err){notice(err.message);}
    finally{$('loginBtn').disabled=false;}
  });
  $('logoutBtn').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST'});screen(false);state.overrides.clear();notice('Berhasil keluar.');}catch(e){notice(e.message);}});
  $('refreshBtn').addEventListener('click',()=>loadProducts().catch(e=>notice(e.message)));
  $('productSearch').addEventListener('input',renderProducts);
  checkLogin();
})();