const DB_NAME='language-lab-free-v11-2';
const DB_VERSION=1;
const EVENT_STORE='events';
let dbPromise=null;

function openDb(){
  if(dbPromise)return dbPromise;
  if(typeof indexedDB==='undefined')return Promise.resolve(null);
  dbPromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(EVENT_STORE)){
        const store=db.createObjectStore(EVENT_STORE,{keyPath:'key'});
        store.createIndex('scope','scope',{unique:false});
      }
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('IndexedDB could not open.'));
  }).catch(error=>{
    console.warn('[Language Lab] IndexedDB unavailable',error);
    dbPromise=Promise.resolve(null);
    return null;
  });
  return dbPromise;
}

function requestResult(request){
  return new Promise((resolve,reject)=>{
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction){
  return new Promise((resolve,reject)=>{
    transaction.oncomplete=()=>resolve();
    transaction.onerror=()=>reject(transaction.error||new Error('IndexedDB transaction failed.'));
    transaction.onabort=()=>reject(transaction.error||new Error('IndexedDB transaction aborted.'));
  });
}

export async function loadEvents(scope){
  const db=await openDb();
  if(!db)return[];
  const transaction=db.transaction(EVENT_STORE,'readonly');
  const index=transaction.objectStore(EVENT_STORE).index('scope');
  const rows=await requestResult(index.getAll(scope));
  return(rows||[]).map(row=>row.event).filter(Boolean);
}

export async function putEvents(scope,events){
  const list=(events||[]).filter(event=>event?.id);
  if(!list.length)return;
  const db=await openDb();
  if(!db)return;
  const transaction=db.transaction(EVENT_STORE,'readwrite');
  const store=transaction.objectStore(EVENT_STORE);
  for(const event of list)store.put({key:`${scope}:${event.id}`,scope,event});
  await transactionDone(transaction);
}

export async function deleteEvents(scope,{languageCode=null}={}){
  const db=await openDb();
  if(!db)return;
  const transaction=db.transaction(EVENT_STORE,'readwrite');
  const index=transaction.objectStore(EVENT_STORE).index('scope');
  await new Promise((resolve,reject)=>{
    const request=index.openCursor(IDBKeyRange.only(scope));
    request.onerror=()=>reject(request.error||new Error('IndexedDB cursor failed.'));
    request.onsuccess=()=>{
      const cursor=request.result;
      if(!cursor){resolve();return}
      const event=cursor.value?.event;
      const code=event?.languageCode||event?.language_code;
      if(!languageCode||code===languageCode)cursor.delete();
      cursor.continue();
    };
  });
  await transactionDone(transaction);
}

export async function countEvents(scope){
  const db=await openDb();
  if(!db)return 0;
  const transaction=db.transaction(EVENT_STORE,'readonly');
  const index=transaction.objectStore(EVENT_STORE).index('scope');
  return Number(await requestResult(index.count(scope)))||0;
}
