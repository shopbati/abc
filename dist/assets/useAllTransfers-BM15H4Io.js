import{r as a,s as _}from"./index-PA-U-bDe.js";const h=(n,c)=>{const[u,i]=a.useState([]),[m,f]=a.useState(!0),[p,t]=a.useState(null),d=async()=>{try{f(!0),t(null);let r=_.from("transfers").select(`
          *,
          debit_company:companies!transfers_debit_company_id_fkey(id, name, rib),
          credit_company:companies!transfers_credit_company_id_fkey(id, name, rib),
          client:clients!transfers_client_id_fkey(id, name)
        `).order("created_at",{ascending:!1});n&&(r=r.gte("created_at",n)),c&&(r=r.lte("created_at",c+"T23:59:59.999Z"));const{data:o,error:e}=await r;if(e)throw e;i(o||[])}catch(r){t(r instanceof Error?r.message:"An error occurred"),console.error("Error fetching transfers:",r)}finally{f(!1)}},y=async(r,o)=>{try{t(null);const{data:e,error:s}=await _.from("transfers").update({status:o}).eq("id",r).select(`
          *,
          debit_company:companies!transfers_debit_company_id_fkey(id, name, rib),
          credit_company:companies!transfers_credit_company_id_fkey(id, name, rib),
          client:clients!transfers_client_id_fkey(id, name)
        `).single();if(s)throw s;return i(g=>g.map(l=>l.id===r?e:l)),{success:!0,data:e}}catch(e){const s=e instanceof Error?e.message:"Failed to update transfer status";return t(s),console.error("Error updating transfer status:",e),{success:!1,error:s}}};return a.useEffect(()=>{d()},[n,c]),{transfers:u,loading:m,error:p,updateTransferStatus:y,refetch:d}};export{h as u};
