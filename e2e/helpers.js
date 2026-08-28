export async function blockExternal(page){
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.route('https://ykaluwgryohxcsccdacf.supabase.co/**',route=>route.abort());
}

export async function installMockSupabase(page,{profile={},events=[],positions=[],user={}}={}){
  await page.addInitScript(({profile,events,positions,user})=>{
    const clone=value=>JSON.parse(JSON.stringify(value));
    const mockUser={id:'e2e-user',email:'learner@example.com',user_metadata:{name:'E2E Learner'},...user};
    const backend={
      profile:{
        id:mockUser.id,
        display_name:'E2E Learner',
        avatar_url:null,
        timezone:'UTC',
        primary_language:'ja',
        enabled_languages:['ja'],
        audio_preference:'auto',
        daily_goal_xp:30,
        onboarding_completed:false,
        updated_at:new Date().toISOString(),
        ...clone(profile)
      },
      events:clone(events),
      positions:clone(positions),
      calls:[]
    };
    window.__mockBackend=backend;

    const rowsFor=table=>table==='profiles'?[backend.profile]:table==='learning_events'?backend.events:table==='course_positions'?backend.positions:[];
    const matchFilters=(row,filters)=>Object.entries(filters).every(([key,value])=>row?.[key]===value);

    function builderFor(table){
      let operation='select',payload=null,filters={};
      const execute=()=>{
        backend.calls.push({table,operation,filters:clone(filters),payload:clone(payload)});
        if(operation==='select')return{data:rowsFor(table).filter(row=>matchFilters(row,filters)).map(clone),error:null};
        if(operation==='update'){
          if(table==='profiles'&&matchFilters(backend.profile,filters))backend.profile={...backend.profile,...clone(payload),updated_at:new Date().toISOString()};
          return{data:null,error:null};
        }
        if(operation==='delete'){
          if(table==='learning_events')backend.events=backend.events.filter(row=>!matchFilters(row,filters));
          if(table==='course_positions')backend.positions=backend.positions.filter(row=>!matchFilters(row,filters));
          return{data:null,error:null};
        }
        return{data:null,error:null};
      };
      const builder={
        select(){operation='select';return builder},
        eq(key,value){filters[key]=value;return builder},
        order(){return builder},
        range(){return Promise.resolve(execute())},
        maybeSingle(){const result=execute();return Promise.resolve({data:result.data?.[0]||null,error:result.error})},
        update(value){operation='update';payload=value;return builder},
        delete(){operation='delete';return builder},
        upsert(value){
          backend.calls.push({table,operation:'upsert',payload:clone(value)});
          const list=Array.isArray(value)?value:[value];
          if(table==='profiles')for(const row of list)backend.profile={...backend.profile,...clone(row)};
          if(table==='learning_events')for(const row of list)if(!backend.events.some(existing=>existing.id===row.id))backend.events.push(clone(row));
          if(table==='course_positions')for(const row of list){
            const index=backend.positions.findIndex(existing=>existing.user_id===row.user_id&&existing.language_code===row.language_code);
            if(index>=0)backend.positions[index]={...backend.positions[index],...clone(row),updated_at:new Date().toISOString()};
            else backend.positions.push({...clone(row),updated_at:new Date().toISOString()});
          }
          return Promise.resolve({data:null,error:null});
        },
        then(resolve,reject){return Promise.resolve(execute()).then(resolve,reject)}
      };
      return builder;
    }

    let authListener=null;
    const client={
      auth:{
        getSession:async()=>({data:{session:{user:mockUser}},error:null}),
        onAuthStateChange:listener=>{authListener=listener;return{data:{subscription:{unsubscribe(){}}}}},
        signOut:async()=>({error:null}),
        signInWithOAuth:async()=>({data:{url:'about:blank#mock-oauth'},error:null})
      },
      from:table=>builderFor(table),
      channel:()=>({on(){return this},subscribe(){return this}}),
      removeChannel(){},
      __emitAuth(event,session){authListener?.(event,session)}
    };
    window.supabase={createClient:()=>client};
  },{profile,events,positions,user});
}
