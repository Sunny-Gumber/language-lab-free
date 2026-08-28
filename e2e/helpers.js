export async function blockExternal(page){
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.route('https://ykaluwgryohxcsccdacf.supabase.co/**',route=>route.abort());
}

export async function installMockSupabase(page,{profile={},events=[],positions=[],user={},signedIn=true}={}){
  await page.addInitScript(({profile,events,positions,user,signedIn})=>{
    const clone=value=>JSON.parse(JSON.stringify(value));
    const now=()=>new Date().toISOString();
    const mockUser={id:'e2e-user',email:'learner@example.com',user_metadata:{name:'E2E Learner'},...user};
    const normalizedEvents=clone(events).map(row=>({...row,created_at:row.created_at||row.client_created_at||now()}));
    const normalizedPositions=clone(positions).map(row=>({...row,client_updated_at:row.client_updated_at||row.updated_at||now(),updated_at:row.updated_at||now()}));
    const backend={
      profile:{id:mockUser.id,display_name:'E2E Learner',avatar_url:null,timezone:'UTC',primary_language:'ja',enabled_languages:['ja'],audio_preference:'auto',daily_goal_xp:30,onboarding_completed:false,updated_at:now(),...clone(profile)},
      events:normalizedEvents,
      positions:normalizedPositions,
      calls:[]
    };
    window.__mockBackend=backend;

    const rowsFor=table=>table==='profiles'?[backend.profile]:table==='learning_events'?backend.events:table==='course_positions'?backend.positions:[];
    const matches=(row,filters,ranges)=>Object.entries(filters).every(([key,value])=>row?.[key]===value)&&ranges.every(({op,key,value})=>op==='gte'?String(row?.[key]||'')>=String(value):true);

    function builderFor(table){
      let operation='select',payload=null,filters={},ranges=[];
      const execute=()=>{
        backend.calls.push({table,operation,filters:clone(filters),ranges:clone(ranges),payload:clone(payload)});
        if(operation==='select')return{data:rowsFor(table).filter(row=>matches(row,filters,ranges)).map(clone),error:null};
        if(operation==='update'){
          if(table==='profiles'&&matches(backend.profile,filters,ranges))backend.profile={...backend.profile,...clone(payload),updated_at:now()};
          return{data:null,error:null};
        }
        if(operation==='delete'){
          if(table==='learning_events')backend.events=backend.events.filter(row=>!matches(row,filters,ranges));
          if(table==='course_positions')backend.positions=backend.positions.filter(row=>!matches(row,filters,ranges));
          return{data:null,error:null};
        }
        return{data:null,error:null};
      };
      const builder={
        select(){operation='select';return builder},
        eq(key,value){filters[key]=value;return builder},
        gte(key,value){ranges.push({op:'gte',key,value});return builder},
        order(){return builder},
        range(){return Promise.resolve(execute())},
        maybeSingle(){const result=execute();return Promise.resolve({data:result.data?.[0]||null,error:result.error})},
        update(value){operation='update';payload=value;return builder},
        delete(){operation='delete';return builder},
        upsert(value){
          backend.calls.push({table,operation:'upsert',payload:clone(value)});
          const list=Array.isArray(value)?value:[value];
          if(table==='profiles')for(const row of list)backend.profile={...backend.profile,...clone(row),updated_at:now()};
          if(table==='learning_events')for(const row of list)if(!backend.events.some(existing=>existing.id===row.id))backend.events.push({...clone(row),created_at:row.created_at||now()});
          if(table==='course_positions')for(const row of list){
            const incoming={...clone(row),client_updated_at:row.client_updated_at||now()};
            const index=backend.positions.findIndex(existing=>existing.user_id===row.user_id&&existing.language_code===row.language_code);
            if(index>=0){const existing=backend.positions[index];if(String(incoming.client_updated_at)>=String(existing.client_updated_at||''))backend.positions[index]={...existing,...incoming,updated_at:now()}}
            else backend.positions.push({...incoming,updated_at:now()});
          }
          return Promise.resolve({data:null,error:null});
        },
        then(resolve,reject){return Promise.resolve(execute()).then(resolve,reject)}
      };
      return builder;
    }

    let authListener=null,currentSession=signedIn?{user:mockUser}:null;
    const client={
      auth:{
        getSession:async()=>({data:{session:currentSession},error:null}),
        onAuthStateChange:listener=>{authListener=listener;return{data:{subscription:{unsubscribe(){}}}}},
        signOut:async()=>{currentSession=null;authListener?.('SIGNED_OUT',null);return{error:null}},
        signInWithOAuth:async()=>({data:{url:'about:blank#mock-oauth'},error:null})
      },
      from:table=>builderFor(table),
      channel:()=>({on(){return this},subscribe(){return this}}),
      removeChannel(){},
      __emitAuth(event,nextSession){currentSession=nextSession;authListener?.(event,nextSession)},
      __user:mockUser
    };
    window.__mockSupabaseClient=client;
    window.supabase={createClient:()=>client};
  },{profile,events,positions,user,signedIn});
}
